'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers.cjs');

after(() => h.assertNoUnmockedNetwork(assert));

const approve = (uid, subscriptionId, email) =>
  h.callable(h.fns.recordSubscriptionApproval, uid, { subscriptionId }, email ? { email } : {});
const code = (c) => (e) => e && e.code === c;

async function user(extra = {}) {
  const uid = h.newUid();
  await h.seedUser(uid, extra);
  return uid;
}

test('unauthenticated callers are rejected', async () => {
  await assert.rejects(approve(null, 'I-ABC123', 'a@example.test'), code('unauthenticated'));
});

test('a suspended account is rejected', async () => {
  const uid = await user({ suspended: true });
  await assert.rejects(approve(uid, h.newSubId(), 'a@example.test'), code('permission-denied'));
});

test('a malformed subscription id is rejected', async () => {
  const uid = await user();
  await assert.rejects(approve(uid, 'not-a-sub', 'a@example.test'), code('invalid-argument'));
});

test('a subscription on another plan is rejected', async () => {
  const uid = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId, { plan_id: 'P-OTHER' }));
  await assert.rejects(approve(uid, subId, 'buyer@example.test'), code('failed-precondition'));
  assert.equal(await h.get('paypalSubscriptions', subId), null);
});

test('a PayPal subscriber whose email differs from the account email is rejected and nothing is bound', async () => {
  const uid = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId));
  await assert.rejects(approve(uid, subId, 'someone-else@example.test'), code('permission-denied'));
  assert.equal(await h.get('paypalSubscriptions', subId), null);
  assert.equal(await h.get('subscriptionEntitlements', uid), null);
});

test('ACTIVE subscription with matching emails binds and activates', async () => {
  const uid = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId));
  const out = await approve(uid, subId, 'Buyer@Example.test');
  assert.equal(out.status, 'active');
  assert.equal((await h.get('paypalSubscriptions', subId)).uid, uid);
  const ent = await h.get('subscriptionEntitlements', uid);
  assert.equal(ent.active, true);
  assert.equal(ent.source, 'paypal');
});

test('a not-yet-ACTIVE subscription binds and stays pending (no entitlement)', async () => {
  const uid = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId, { status: 'APPROVED' }));
  const out = await approve(uid, subId, 'buyer@example.test');
  assert.equal(out.status, 'pending_verification');
  assert.equal((await h.get('paypalSubscriptions', subId)).uid, uid);
  assert.equal(await h.get('subscriptionEntitlements', uid), null);
  assert.ok((await h.notifications(uid)).some((n) => n.type === 'subscription_pending'));
});

test('when PayPal exposes no subscriber email, an ACTIVE subscription stays pending and is not bound', async () => {
  const uid = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId, { subscriber: { payer_id: 'PAYERX' } }));
  const out = await approve(uid, subId, 'buyer@example.test');
  assert.equal(out.status, 'pending_verification');
  assert.equal(await h.get('subscriptionEntitlements', uid), null);
  assert.equal(await h.get('paypalSubscriptions', subId), null);
  assert.ok((await h.notifications(uid)).some((n) => n.type === 'subscription_pending'));
});

test('an account with no email cannot claim an ACTIVE subscription by id alone', async () => {
  const uid = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId));
  const out = await approve(uid, subId, undefined);
  assert.equal(out.status, 'pending_verification');
  assert.equal(await h.get('subscriptionEntitlements', uid), null);
  assert.equal(await h.get('paypalSubscriptions', subId), null);
});

test('custom_id equal to the caller proves the account even when the emails differ', async () => {
  const uid = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId, { custom_id: uid }));
  const out = await approve(uid, subId, 'a-different-address@example.test');
  assert.equal(out.status, 'active');
  assert.equal((await h.get('paypalSubscriptions', subId)).uid, uid);
});

test('custom_id naming another account is rejected and nothing is bound', async () => {
  const uid = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId, { custom_id: 'smoke_u_SOMEONEELSE' }));
  await assert.rejects(approve(uid, subId, 'buyer@example.test'), code('permission-denied'));
  assert.equal(await h.get('paypalSubscriptions', subId), null);
  assert.equal(await h.get('subscriptionEntitlements', uid), null);
});

test('a subscription already bound to one account cannot be re-bound, even by a caller whose email matches', async () => {
  const owner = await user();
  const thief = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId));
  await approve(owner, subId, 'buyer@example.test');
  await assert.rejects(approve(thief, subId, 'buyer@example.test'), code('already-exists'));
  assert.equal((await h.get('paypalSubscriptions', subId)).uid, owner);
  assert.equal(await h.get('subscriptionEntitlements', thief), null);
});

test('the owner can repeat their own approval (idempotent)', async () => {
  const owner = await user();
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId));
  assert.equal((await approve(owner, subId, 'buyer@example.test')).status, 'active');
  assert.equal((await approve(owner, subId, 'buyer@example.test')).status, 'active');
});
