'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const h = require('./helpers.cjs');

after(() => h.assertNoUnmockedNetwork(assert));

const LIB = path.join(__dirname, '..', '..', '..', 'scripts', 'census', 'lib.mjs');
const PII = 'PII-SENTINEL';

test('the census reports exact counts and dates, and no personal data', async () => {
  const { runCensus } = await import(pathToFileURL(LIB).href);
  const db = h.dbFor('census-smoke'); // an isolated named database, so counts are exact
  const put = (col, id, data) => db.collection(col).doc(id).set(data);
  await put('users', 'u1', { canonicalRole: 'seeker', email: `${PII}@example.test`, firstName: PII, createdAt: '2026-08-01T00:00:00.000Z', idVerification: { status: 'none' } });
  await put('users', 'u2', { canonicalRole: 'owner', email: `${PII}2@example.test`, createdAt: '2026-09-15T00:00:00.000Z', idVerification: { status: 'pending' }, subscription: { status: 'active' } });
  await put('users', 'u3', { canonicalRole: 'broker', suspended: true, createdAt: h.Timestamp.fromDate(new Date('2026-10-01T00:00:00Z')), idVerification: { status: 'approved' } });
  await put('publicProfiles', 'u1', { displayName: PII });
  await put('propertyListings', 'p1', { title: PII, createdAt: '2026-09-20T00:00:00.000Z' });
  await put('propertyListings', 'p2', { title: PII, createdAt: '2026-09-25T00:00:00.000Z' });
  await put('wantedListings', 'w1', { note: PII });
  await put('contracts', 'c1', { status: 'active' });
  await put('contracts', 'c2', { status: 'pending_confirmation' });
  await put('subscriptionEntitlements', 'e1', { active: true, source: 'paypal' });
  await put('subscriptionEntitlements', 'e2', { active: true, source: 'admin_smoke_test' });
  await put('subscriptionEntitlements', 'e3', { active: false, source: 'paypal' });
  await put('paypalWebhookEvents', 'WH-1', { status: 'processed' });
  await put('paypalWebhookEvents', 'WH-2', { status: 'failed' });
  await put('boostOrders', 'b1', { status: 'pending_payment', payer: PII });

  const result = await runCensus(db, { project: 'demo-census', database: 'census-smoke', now: new Date('2026-10-12T00:00:00Z') });
  assert.deepEqual(result.notes, [], result.notes.join(' | '));
  assert.equal(result.users.total, 3);
  assert.equal(result.users.byRole.seeker, 1);
  assert.equal(result.users.byRole.owner, 1);
  assert.equal(result.users.byRole.broker, 1);
  assert.equal(result.users.suspended, 1);
  assert.equal(result.users.idVerification.pending, 1);
  assert.equal(result.users.subscription.active, 1);
  assert.equal(result.publicProfiles.total, 1);
  assert.equal(result.propertyListings.total, 2);
  assert.equal(result.propertyListings.oldestCreatedAt, '2026-09-20');
  assert.equal(result.propertyListings.newestCreatedAt, '2026-09-25');
  assert.equal(result.wantedListings.total, 1);
  assert.equal(result.contracts.total, 2);
  assert.equal(result.contracts.byStatus.active, 1);
  assert.equal(result.subscriptions.entitlements.total, 3);
  assert.equal(result.subscriptions.entitlements.active, 2);
  assert.equal(result.subscriptions.entitlements.activeFromPayPal, 1);
  assert.equal(result.subscriptions.entitlements.activeFromAdminSmokeTest, 1);
  assert.equal(result.subscriptions.webhookEvents.total, 2);
  assert.equal(result.subscriptions.webhookEvents.failed, 1);
  assert.equal(result.boostOrders.pendingPayment, 1);
  assert.equal(result.census.generatedAt, '2026-10-12T00:00:00.000Z');
  assert.ok(!JSON.stringify(result).includes(PII), 'the census output leaked a document field value');
});

test('the census code can only read: it contains no write calls', () => {
  const source = fs.readFileSync(LIB, 'utf8');
  for (const forbidden of ['.set(', '.update(', '.add(', '.delete(', '.create(', 'batch(', 'runTransaction(', 'bulkWriter']) {
    assert.ok(!source.includes(forbidden), `lib.mjs must not call ${forbidden}`);
  }
});
