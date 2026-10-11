'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers.cjs');

after(() => h.assertNoUnmockedNetwork(assert));

/** Seed a user, a subscription binding, and a PayPal-side subscription. */
async function bound(over = {}) {
  const uid = h.newUid();
  const subId = h.newSubId();
  await h.seedUser(uid);
  await h.seedMapping(subId, uid);
  h.mock.subscriptions.set(subId, h.sub(subId, over));
  return { uid, subId };
}
async function activate({ uid, subId }) {
  const res = await h.deliver(h.event('BILLING.SUBSCRIPTION.ACTIVATED', subId));
  assert.equal(res.statusCode, 200);
  assert.equal((await h.get('subscriptionEntitlements', uid)).active, true);
}

test('non-POST is rejected with 405', async () => {
  const res = await h.deliver(h.event('BILLING.SUBSCRIPTION.ACTIVATED', 'I-NONE'), { method: 'GET' });
  assert.equal(res.statusCode, 405);
});

test('failed signature verification -> 400, no ledger entry, no entitlement', async () => {
  const b = await bound();
  const evt = h.event('BILLING.SUBSCRIPTION.ACTIVATED', b.subId);
  const res = await h.deliver(evt, { verify: 'FAILURE' });
  assert.equal(res.statusCode, 400);
  assert.equal(await h.get('paypalWebhookEvents', evt.id), null);
  assert.equal(await h.get('subscriptionEntitlements', b.uid), null);
});

test('invalid event id -> 400, nothing written', async () => {
  const b = await bound();
  const evt = { ...h.event('BILLING.SUBSCRIPTION.ACTIVATED', b.subId), id: 'bad id!' };
  const res = await h.deliver(evt);
  assert.equal(res.statusCode, 400);
  assert.equal(await h.get('subscriptionEntitlements', b.uid), null);
});

test('ACTIVATED (bound, correct plan) activates the entitlement, notifies, and ledgers the event', async () => {
  const b = await bound();
  const evt = h.event('BILLING.SUBSCRIPTION.ACTIVATED', b.subId);
  const res = await h.deliver(evt);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, 'ok');
  const ent = await h.get('subscriptionEntitlements', b.uid);
  assert.equal(ent.active, true);
  assert.equal(ent.source, 'paypal');
  assert.equal(ent.provider, 'paypal');
  assert.equal(ent.planId, h.PLAN_ID);
  assert.equal(ent.subscriptionId, b.subId);
  assert.equal(ent.endsAt.toDate().toISOString(), '2030-01-01T00:00:00.000Z');
  const user = await h.get('users', b.uid);
  assert.equal(user.subscription.status, 'active');
  assert.equal(user.subscription.freeMonths, 3);
  assert.equal(user.subscription.initialSetupFeePhp, 499.99);
  assert.equal((await h.get('paypalWebhookEvents', evt.id)).status, 'processed');
  assert.ok((await h.notifications(b.uid)).some((n) => n.type === 'subscription_activated'));
});

test('ACTIVATED for a different plan is acknowledged but grants nothing', async () => {
  const b = await bound({ plan_id: 'P-SOMEONE-ELSES-PLAN' });
  const evt = h.event('BILLING.SUBSCRIPTION.ACTIVATED', b.subId);
  const res = await h.deliver(evt);
  assert.equal(res.statusCode, 200);
  assert.equal(await h.get('subscriptionEntitlements', b.uid), null);
});

test('a duplicate delivery of a processed event has no second side effect', async () => {
  const b = await bound();
  const evt = h.event('BILLING.SUBSCRIPTION.ACTIVATED', b.subId);
  assert.equal((await h.deliver(evt)).body, 'ok');
  const again = await h.deliver(evt);
  assert.equal(again.statusCode, 200);
  assert.equal(again.body, 'duplicate');
  const sent = (await h.notifications(b.uid)).filter((n) => n.type === 'subscription_activated');
  assert.equal(sent.length, 1);
});

for (const [type, status, notice] of [
  ['BILLING.SUBSCRIPTION.CANCELLED', 'cancelled', 'subscription_cancelled'],
  ['BILLING.SUBSCRIPTION.SUSPENDED', 'suspended', 'subscription_suspended'],
  ['BILLING.SUBSCRIPTION.EXPIRED', 'expired', 'subscription_expired']
]) {
  test(`${type} deactivates the entitlement and marks the user ${status}`, async () => {
    const b = await bound();
    await activate(b);
    const res = await h.deliver(h.event(type, b.subId));
    assert.equal(res.statusCode, 200);
    const ent = await h.get('subscriptionEntitlements', b.uid);
    assert.equal(ent.active, false);
    assert.equal(ent.lastProviderEvent, type);
    assert.equal((await h.get('users', b.uid)).subscription.status, status);
    assert.ok((await h.notifications(b.uid)).some((n) => n.type === notice));
  });
}

test('PAYMENT.FAILED flags the user payment_failed but leaves the entitlement active (grace policy TBD)', async () => {
  const b = await bound();
  await activate(b);
  const res = await h.deliver(h.event('BILLING.SUBSCRIPTION.PAYMENT.FAILED', b.subId));
  assert.equal(res.statusCode, 200);
  assert.equal((await h.get('users', b.uid)).subscription.status, 'payment_failed');
  assert.equal((await h.get('subscriptionEntitlements', b.uid)).active, true);
});

test('PAYMENT.SALE.COMPLETED is acknowledged and never grants an entitlement', async () => {
  const b = await bound();
  const res = await h.deliver(h.saleEvent(b.subId));
  assert.equal(res.statusCode, 200);
  assert.equal(await h.get('subscriptionEntitlements', b.uid), null);
});

test('GAP: PAYMENT.SALE.COMPLETED must resolve the subscription from billing_agreement_id, not the sale id',
  h.gap('#28', 'resource.id is the SALE id on sale events; the code prefers it, finds no binding, and never notifies'),
  async () => {
    const b = await bound();
    await h.deliver(h.saleEvent(b.subId));
    assert.ok((await h.notifications(b.uid)).some((n) => n.type === 'subscription_payment_received'));
  });

test('PayPal lookup failure -> ledger failed + 400; a retry succeeds with attemptCount 2', async () => {
  const b = await bound();
  const evt = h.event('BILLING.SUBSCRIPTION.ACTIVATED', b.subId);
  h.mock.failLookup = true;
  const first = await h.deliver(evt);
  h.mock.failLookup = false;
  assert.equal(first.statusCode, 400);
  const failed = await h.get('paypalWebhookEvents', evt.id);
  assert.equal(failed.status, 'failed');
  assert.match(failed.lastError, /lookup failed/);
  const retry = await h.deliver(evt);
  assert.equal(retry.statusCode, 200);
  const ledger = await h.get('paypalWebhookEvents', evt.id);
  assert.equal(ledger.status, 'processed');
  assert.equal(ledger.attemptCount, 2);
  assert.equal((await h.get('subscriptionEntitlements', b.uid)).active, true);
});

test('characterization: an event for an unbound subscription is acknowledged with no effect', async () => {
  const subId = h.newSubId();
  h.mock.subscriptions.set(subId, h.sub(subId));
  const evt = h.event('BILLING.SUBSCRIPTION.ACTIVATED', subId);
  const res = await h.deliver(evt);
  assert.equal(res.statusCode, 200);
  assert.equal((await h.get('paypalWebhookEvents', evt.id)).status, 'processed');
});

test('GAP: an event that arrives before its subscription is bound must not be acknowledged as processed',
  h.gap('#28', 'ACTIVATED can beat recordSubscriptionApproval; a 200 + "processed" ledger loses it for good'),
  async () => {
    const subId = h.newSubId();
    h.mock.subscriptions.set(subId, h.sub(subId));
    const evt = h.event('BILLING.SUBSCRIPTION.ACTIVATED', subId);
    const res = await h.deliver(evt);
    const ledger = await h.get('paypalWebhookEvents', evt.id);
    assert.ok(res.statusCode >= 400 || ledger.status !== 'processed',
      `unbound event was acknowledged: HTTP ${res.statusCode}, ledger ${ledger.status}`);
  });

test('GAP: a duplicate that arrives while the first delivery is still "processing" must not be processed twice',
  h.gap('#28', 'first-delivery ledger entry has no processingStartedAt, so every concurrent duplicate looks stale'),
  async () => {
    const b = await bound();
    const evt = h.event('BILLING.SUBSCRIPTION.ACTIVATED', b.subId);
    // Exactly what the webhook's first transaction writes before processing starts:
    await h.db.collection('paypalWebhookEvents').doc(evt.id).set({
      eventType: evt.event_type, status: 'processing', attemptCount: 1, receivedAt: h.Timestamp.now()
    });
    const res = await h.deliver(evt);
    assert.equal(res.body, 'duplicate');
    assert.equal(await h.get('subscriptionEntitlements', b.uid), null);
  });
