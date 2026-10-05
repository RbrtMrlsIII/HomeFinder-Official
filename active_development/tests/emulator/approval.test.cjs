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

test('GAP: when PayPal exposes no subscriber email, an ACTIVE subscription must stay pending',
  h.gap('#28', 'code comment says "keep pending" but the code activates; only a subscription id is proven'),
  async () => {
    const uid = await user();
    const subId = h.newSubId();
    h.mock.subscriptions.set(subId, h.sub(subId, { subscriber: { payer_id: 'PAYERX' } }));
    const out = await approve(uid, subId, 'buyer@example.test');
    assert.equal(out.status, 'pending_verification');
    assert.equal(await h.get('subscriptionEntitlements', uid), null);
  });

test('GAP: an account with no email must not claim an ACTIVE subscription by id alone',
  h.gap('#28', 'identity check is skipped when the Firebase account has no email (phone-only accounts)'),
  async () => {
    const uid = await user();
    const subId = h.newSubId();
    h.mock.subscriptions.set(subId, h.sub(subId));
    const out = await approve(uid, subId, undefined).catch((e) => ({ status: `rejected:${e.code}` }));
    assert.notEqual(out.status, 'active');
    assert.equal(await h.get('subscriptionEntitlements', uid), null);
  });

test('GAP: a subscription already bound to one account cannot be re-bound by another',
  h.gap('#28', 'paypalSubscriptions/{id} is overwritten with merge:true, so the mapping can be hijacked'),
  async () => {
    const owner = await user();
    const thief = await user();
    const subId = h.newSubId();
    h.mock.subscriptions.set(subId, h.sub(subId));
    await approve(owner, subId, 'buyer@example.test');
    await approve(thief, subId, undefined).catch(() => {});
    assert.equal((await h.get('paypalSubscriptions', subId)).uid, owner);
  });
