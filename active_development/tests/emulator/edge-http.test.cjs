'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const h = require('./helpers.cjs');

after(() => h.assertNoUnmockedNetwork(assert));

const ALLOWED = 'https://rbrtmrlsiii.github.io';
const bearer = (uid, email = 'buyer@example.test') => ({ authorization: `Bearer smoke|${uid}|${email}` });
const approval = (over) => h.fakeRequest({ method: 'POST', headers: { 'content-type': 'application/json' }, body: { subscriptionId: 'I-ABC123' }, ...over });
const errorOf = async (res) => (await res.json()).error;

test('an allowed browser origin receives CORS headers on the preflight', async () => {
  const edge = await h.loadEdge();
  const res = await edge.handleApprovalRequest(approval({ method: 'OPTIONS', headers: { origin: ALLOWED }, body: undefined }), edge.deps);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), ALLOWED);
  assert.equal(res.headers.get('vary'), 'Origin');
});

test('a foreign origin is refused and gets no CORS header, even with a valid token', async () => {
  const edge = await h.loadEdge();
  const uid = h.newUid();
  await h.seedUser(uid);
  const res = await edge.handleApprovalRequest(approval({ headers: { origin: 'https://evil.example', ...bearer(uid) } }), edge.deps);
  assert.equal(res.status, 403);
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('a request with no Origin (server to server) proceeds to authentication', async () => {
  const edge = await h.loadEdge();
  const res = await edge.handleApprovalRequest(approval(), edge.deps);
  assert.equal(res.status, 401);
  assert.equal((await errorOf(res)).code, 'unauthenticated');
});

test('GET is refused with 405', async () => {
  const edge = await h.loadEdge();
  const res = await edge.handleApprovalRequest(h.fakeRequest({ method: 'GET' }), edge.deps);
  assert.equal(res.status, 405);
});

test('an invalid token is refused with 401', async () => {
  const edge = await h.loadEdge();
  const res = await edge.handleApprovalRequest(approval({ headers: { authorization: 'Bearer not-a-real-token' } }), edge.deps);
  assert.equal(res.status, 401);
});

test('a body that is not JSON is refused with 400', async () => {
  const edge = await h.loadEdge();
  const uid = h.newUid();
  await h.seedUser(uid);
  const res = await edge.handleApprovalRequest(approval({ headers: bearer(uid), body: 'this is not json' }), edge.deps);
  assert.equal(res.status, 400);
  assert.equal((await errorOf(res)).code, 'invalid-argument');
});

test('a suspended account is refused with 403 before any PayPal call', async () => {
  const edge = await h.loadEdge();
  const uid = h.newUid();
  await h.seedUser(uid, { suspended: true });
  const before = h.mock.calls.length;
  const res = await edge.handleApprovalRequest(approval({ headers: bearer(uid) }), edge.deps);
  assert.equal(res.status, 403);
  assert.equal(h.mock.calls.length, before);
});

test('an internal failure returns a generic message and leaks no detail', async () => {
  const edge = await h.loadEdge();
  const deps = { ...edge.deps, fs: { ...edge.deps.fs, get: async () => { throw new Error('SECRET internal detail'); } } };
  const res = await edge.handleApprovalRequest(approval({ headers: bearer(h.newUid()) }), deps);
  assert.equal(res.status, 500);
  const text = await res.text();
  assert.ok(!text.includes('SECRET'), text);
  assert.match(text, /Unexpected error/);
});

test('the webhook endpoint refuses GET with 405', async () => {
  const edge = await h.loadEdge();
  const res = await edge.handleWebhookRequest(h.fakeRequest({ method: 'GET' }), edge.deps);
  assert.equal(res.status, 405);
});

test('a failed signature verification reveals nothing', async () => {
  const edge = await h.loadEdge();
  h.mock.verify = 'FAILURE';
  const res = await edge.handleWebhookRequest(h.fakeRequest({ method: 'POST', headers: { 'paypal-transmission-id': 'tx-1' }, body: { id: 'WH-X', event_type: 'BILLING.SUBSCRIPTION.ACTIVATED' } }), edge.deps);
  h.mock.verify = 'SUCCESS';
  assert.equal(res.status, 400);
  assert.equal(await res.text(), 'invalid webhook');
});

test('the Edge plan id matches the Cloud Function and the frontend', async () => {
  const edge = await h.loadEdge();
  const config = await import(pathToFileURL(path.join(__dirname, '..', '..', 'js', 'payment-config.js')).href);
  assert.equal(edge.HOMEFINDER_PLAN_ID, h.PLAN_ID);
  assert.equal(edge.HOMEFINDER_PLAN_ID, config.PAYPAL_SUBSCRIPTION_PLAN_ID);
});

test('the PayPal client defaults to the sandbox host and never to the live one', async () => {
  const edge = await h.loadEdge();
  assert.notEqual(edge.paypal.SANDBOX_API, edge.paypal.LIVE_API);
  const urls = [];
  const capture = async (url) => {
    urls.push(String(url));
    const ok = (body) => ({ ok: true, status: 200, json: async () => body });
    return String(url).includes('/oauth2/token') ? ok({ access_token: 't' }) : ok({ id: 'I-ABC123' });
  };
  const client = edge.paypal.createPayPal({ clientId: 'a', clientSecret: 'b', fetchImpl: capture });
  await client.getSubscription('I-ABC123');
  assert.ok(urls.length > 0 && urls.every((u) => u.startsWith('https://api-m.sandbox.paypal.com/')), urls.join(', '));
});
