'use strict';
/*
 * Secretless emulator harness for HomeFinder payment-path smoke tests.
 *
 * Safety rails (they throw at load time):
 *  - Firestore must be a LOCAL emulator and the project must be demo-*.
 *  - No credential environment variables may be present.
 *  - Every PayPal HTTP call is answered by an in-process mock; any other
 *    network call is recorded and fails the run.
 */
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-homefinder-smoke';
if (!/^demo-/.test(PROJECT)) throw new Error(`Refusing to run: project "${PROJECT}" is not a demo- project.`);
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '';
if (!/^(127\.0\.0\.1|localhost):\d+$/.test(EMULATOR_HOST)) {
  throw new Error('Refusing to run: FIRESTORE_EMULATOR_HOST must be a local emulator. Run through `firebase emulators:exec`.');
}
for (const name of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'GOOGLE_CLOUD_CREDENTIALS']) {
  if (process.env[name]) throw new Error(`Refusing to run: ${name} is set. These tests never use credentials.`);
}
process.env.GCLOUD_PROJECT = PROJECT;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT;
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT });
process.env.NO_GCE_CHECK = 'true';
process.env.PAYPAL_SUBSCRIPTION_CLIENT_SECRET = 'smoke-not-a-real-secret';
process.env.PAYPAL_SUBSCRIPTION_WEBHOOK_ID = 'WH-SMOKE-NOT-REAL';

const FN_INDEX = path.join(__dirname, '..', '..', 'firebase', 'functions', 'index.js');
const source = fs.readFileSync(FN_INDEX, 'utf8');
const pick = (re, label) => {
  const m = source.match(re);
  if (!m) throw new Error(`Could not read ${label} from functions/index.js`);
  return m[1];
};
const PLAN_ID = pick(/const PAYPAL_SUBSCRIPTION_PLAN_ID = "([^"]+)"/, 'plan id');
const ADMIN_UID = pick(/const HOMEFINDER_ADMIN_UID = "([^"]+)"/, 'admin uid');

/* ---- PayPal network mock (the only network the code under test may use) ---- */
const realFetch = global.fetch; // the Edge bridge's Firestore REST calls (local emulator only) use this, never the mock
const mock = { verify: 'SUCCESS', failLookup: false, subscriptions: new Map(), calls: [], unmocked: [] };
global.fetch = async (url, init = {}) => {
  const u = String(url);
  mock.calls.push(`${init.method || 'GET'} ${u}`);
  const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  if (u === 'https://api-m.paypal.com/v1/oauth2/token') return reply(200, { access_token: 'smoke-token' });
  if (u === 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature') {
    return reply(200, { verification_status: mock.verify });
  }
  const m = u.match(/^https:\/\/api-m\.paypal\.com\/v1\/billing\/subscriptions\/([^/?]+)$/);
  if (m) {
    if (mock.failLookup) return reply(500, {});
    const s = mock.subscriptions.get(decodeURIComponent(m[1]));
    return s ? reply(200, s) : reply(404, {});
  }
  mock.unmocked.push(u);
  throw new Error(`UNMOCKED NETWORK CALL: ${u}`);
};

/* ---- the real code under test, on the local emulator ---- */
const fnReq = createRequire(FN_INDEX);
const admin = fnReq('firebase-admin');
const { getFirestore, Timestamp } = fnReq('firebase-admin/firestore');
const fns = require(FN_INDEX);
const db = getFirestore(admin.app(), 'homefinder');

/* ---- builders ---- */
const rid = () => crypto.randomBytes(5).toString('hex').toUpperCase();
const newUid = () => `smoke_u_${rid()}`;
const newSubId = () => `I-SMOKE${rid()}`;
const sub = (id, over = {}) => ({
  id,
  plan_id: PLAN_ID,
  status: 'ACTIVE',
  subscriber: { email_address: 'buyer@example.test', payer_id: `PAYER${rid()}` },
  billing_info: { next_billing_time: '2030-01-01T00:00:00Z' },
  ...over
});
const event = (type, subId, extra = {}) => ({ id: `WH-${rid()}`, event_type: type, resource: { id: subId, ...extra } });
const saleEvent = (subId) => ({
  id: `WH-${rid()}`,
  event_type: 'PAYMENT.SALE.COMPLETED',
  resource: { id: `SALE-${rid()}`, billing_agreement_id: subId }
});

/* ---- request / response doubles ---- */
function makeReq(evt, { method = 'POST', rawBody } = {}) {
  const raw = rawBody !== undefined ? rawBody : JSON.stringify(evt);
  const headers = {
    'paypal-auth-algo': 'SHA256withRSA',
    'paypal-cert-url': 'https://api.paypal.com/smoke-cert.pem',
    'paypal-transmission-id': `tx-${rid()}`,
    'paypal-transmission-sig': 'smoke-sig',
    'paypal-transmission-time': new Date().toISOString()
  };
  return { method, rawBody: Buffer.from(raw), body: evt, headers, get: (n) => headers[String(n).toLowerCase()] };
}
function makeRes() {
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  const res = {
    statusCode: 200, body: undefined, done,
    status(c) { res.statusCode = c; return res; },
    send(b) { res.body = b; resolve(res); return res; },
    end(b) { res.body = b; resolve(res); return res; },
    set() { return res; }, setHeader() { return res; }, getHeader() { return undefined; },
    on() { return res; }, once() { return res; }, emit() { return false; }, removeListener() { return res; }
  };
  return res;
}
/* ---- implementation under test: the Cloud Functions (default) or the Supabase Edge bridge ---- */
const IMPL = (process.env.HF_IMPL || 'cloudfn').toLowerCase();
if (!['cloudfn', 'edge'].includes(IMPL)) throw new Error(`HF_IMPL must be "cloudfn" or "edge", got "${IMPL}"`);

let edgePromise = null;
function loadEdge() {
  edgePromise ||= (async () => {
    const dir = path.join(__dirname, '..', '..', 'supabase', 'functions', '_shared', 'paypal-bridge');
    const load = (file) => import(pathToFileURL(path.join(dir, file)).href);
    const [firestore, paypal, core, http] = await Promise.all([load('firestore.mjs'), load('paypal.mjs'), load('core.mjs'), load('http.mjs')]);
    const deps = {
      // Firestore REST goes to the local emulator only; PayPal goes to the in-process mock.
      fs: firestore.createFirestore({ projectId: PROJECT, databaseId: 'homefinder', baseUrl: `http://${EMULATOR_HOST}`, getToken: async () => 'owner', fetchImpl: realFetch }),
      paypal: paypal.createPayPal({ apiBase: 'https://api-m.paypal.com', clientId: 'smoke-client-id', clientSecret: 'smoke-not-a-real-secret', webhookId: 'WH-SMOKE-NOT-REAL', fetchImpl: (...args) => global.fetch(...args) }),
      planId: core.HOMEFINDER_PLAN_ID,
      now: () => new Date(),
      allowedOrigins: ['https://rbrtmrlsiii.github.io'],
      verifyIdToken: async (token) => {
        const [prefix, uid, email] = String(token).split('|');
        if (prefix !== 'smoke' || !uid) throw new Error('bad token');
        return { uid, email: email || '' };
      }
    };
    return { deps, firestore, paypal, core, http, handleApprovalRequest: http.handleApprovalRequest, handleWebhookRequest: http.handleWebhookRequest, HOMEFINDER_PLAN_ID: core.HOMEFINDER_PLAN_ID };
  })();
  return edgePromise;
}

/** Request double: undici would drop the forbidden Origin header from a real Request. */
const fakeRequest = ({ method = 'POST', headers = {}, body } = {}) => {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return { method, headers: new Headers(headers), async json() { return JSON.parse(text); }, async text() { return text; } };
};
const webhookHeaders = () => ({
  'paypal-auth-algo': 'SHA256withRSA',
  'paypal-cert-url': 'https://api.paypal.com/smoke-cert.pem',
  'paypal-transmission-id': `tx-${rid()}`,
  'paypal-transmission-sig': 'smoke-sig',
  'paypal-transmission-time': new Date().toISOString()
});

async function deliver(evt, opts = {}) {
  mock.verify = opts.verify || 'SUCCESS';
  if (IMPL === 'edge') {
    const edge = await loadEdge();
    const method = opts.method || 'POST';
    const raw = opts.rawBody !== undefined ? opts.rawBody : JSON.stringify(evt);
    const response = await edge.handleWebhookRequest(fakeRequest({ method, headers: webhookHeaders(), body: method === 'GET' ? undefined : raw }), edge.deps);
    return { statusCode: response.status, body: await response.text() };
  }
  const res = makeRes();
  await Promise.all([Promise.resolve(fns.paypalSubscriptionWebhook(makeReq(evt, opts), res)), res.done]);
  return res;
}
const callable = (fn, uid, data, token = {}) => fn.run({ auth: uid ? { uid, token } : undefined, data });

/** recordSubscriptionApproval as the signed-in user uid (null = signed out) whose token carries email. */
async function approve(uid, subscriptionId, email) {
  if (IMPL === 'cloudfn') return callable(fns.recordSubscriptionApproval, uid, { subscriptionId }, email ? { email } : {});
  const edge = await loadEdge();
  const headers = { 'content-type': 'application/json' };
  if (uid) headers.authorization = `Bearer smoke|${uid}|${email || ''}`;
  const response = await edge.handleApprovalRequest(fakeRequest({ method: 'POST', headers, body: { subscriptionId } }), edge.deps);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'request failed');
    error.code = body?.error?.code;
    throw error;
  }
  return body;
}

/* ---- Firestore helpers (Admin SDK against the emulator) ---- */
const get = async (col, id) => { const s = await db.collection(col).doc(id).get(); return s.exists ? s.data() : null; };
const notifications = async (uid) => (await db.collection('notifications').doc(uid).collection('items').get()).docs.map((d) => d.data());
const seedUser = (uid, extra = {}) => db.collection('users').doc(uid).set({ canonicalRole: 'seeker', ...extra });
const seedMapping = (subId, uid) => db.collection('paypalSubscriptions').doc(subId)
  .set({ uid, planId: PLAN_ID, status: 'APPROVAL_PENDING', provider: 'paypal' });
const seedPayPalEntitlement = (uid, subscriptionId) => db.collection('subscriptionEntitlements').doc(uid).set({
  active: true, source: 'paypal', provider: 'paypal', planId: PLAN_ID, subscriptionId,
  endsAt: Timestamp.fromDate(new Date('2030-01-01T00:00:00Z'))
});
const assertNoUnmockedNetwork = (assert) => assert.deepEqual(mock.unmocked, [], 'code under test made an unmocked network call');
const gap = (issue, why) => ({ todo: `${issue}: ${why}` });

module.exports = {
  PLAN_ID, ADMIN_UID, mock, fns, db, Timestamp, newUid, newSubId, sub, event, saleEvent,
  deliver, callable, approve, loadEdge, fakeRequest, IMPL, get, notifications, seedUser, seedMapping, seedPayPalEntitlement,
  assertNoUnmockedNetwork, gap, EMULATOR_HOST
};
