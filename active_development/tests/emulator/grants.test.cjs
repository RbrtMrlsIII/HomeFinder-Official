'use strict';
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers.cjs');

after(() => h.assertNoUnmockedNetwork(assert));
before(() => h.seedUser(h.ADMIN_UID, { canonicalRole: 'admin' }));

const grant = (uid, data) => h.callable(h.fns.grantAdminSubscription, uid, data);
const revoke = (uid, data) => h.callable(h.fns.revokeAdminSubscription, uid, data);
const code = (c) => (e) => e && e.code === c;
async function target(extra = {}) {
  const uid = h.newUid();
  await h.seedUser(uid, extra);
  return uid;
}
const auditFor = async (uid) => (await h.db.collection('adminSubscriptionAudit').where('targetUid', '==', uid).get()).docs.map((d) => d.data());

test('a non-admin cannot grant or revoke', async () => {
  const caller = await target();
  const t = await target();
  await assert.rejects(grant(caller, { uid: t, reason: 'x', days: 5 }), code('permission-denied'));
  await assert.rejects(revoke(caller, { uid: t, reason: 'x' }), code('permission-denied'));
  assert.equal(await h.get('subscriptionEntitlements', t), null);
});

test('characterization: a role-document admin is NOT accepted by the grant functions (Firestore rules accept one)', async () => {
  const roleAdmin = await target({ canonicalRole: 'admin' });
  const t = await target();
  await assert.rejects(grant(roleAdmin, { uid: t, reason: 'x', days: 5 }), code('permission-denied'));
});

test('grant validation: reason, duration and target are enforced', async () => {
  const t = await target();
  await assert.rejects(grant(h.ADMIN_UID, { uid: t, days: 5 }), code('invalid-argument'));
  await assert.rejects(grant(h.ADMIN_UID, { uid: t, reason: 'x', days: 0 }), code('invalid-argument'));
  await assert.rejects(grant(h.ADMIN_UID, { uid: t, reason: 'x', days: 3651 }), code('invalid-argument'));
  await assert.rejects(grant(h.ADMIN_UID, { uid: 'smoke_nobody', reason: 'x', days: 5 }), code('not-found'));
  assert.equal(await h.get('subscriptionEntitlements', t), null);
});

test('admin grant writes the grant, the entitlement, an audit entry and a notification', async () => {
  const t = await target();
  const out = await grant(h.ADMIN_UID, { uid: t, reason: 'smoke test', days: 7 });
  assert.equal(out.status, 'granted');
  const g = await h.get('subscriptionAdminGrants', t);
  assert.equal(g.active, true);
  assert.equal(g.source, 'admin_smoke_test');
  assert.equal(g.grantedBy, h.ADMIN_UID);
  const ent = await h.get('subscriptionEntitlements', t);
  assert.equal(ent.active, true);
  assert.equal(ent.source, 'admin_smoke_test');
  assert.equal(ent.planId, h.PLAN_ID);
  const days = (ent.endsAt.toMillis() - ent.startsAt.toMillis()) / 86400000;
  assert.equal(Math.round(days), 7);
  const audit = await auditFor(t);
  assert.equal(audit.length, 1);
  assert.equal(audit[0].action, 'grant');
  assert.ok((await h.notifications(t)).some((n) => n.type === 'subscription_admin_grant'));
});

test('admin revoke deactivates the grant and entitlement and audits it', async () => {
  const t = await target();
  await grant(h.ADMIN_UID, { uid: t, reason: 'smoke test', days: 7 });
  await assert.rejects(revoke(h.ADMIN_UID, { uid: t }), code('invalid-argument'));
  const out = await revoke(h.ADMIN_UID, { uid: t, reason: 'done' });
  assert.equal(out.status, 'revoked');
  assert.equal((await h.get('subscriptionAdminGrants', t)).active, false);
  assert.equal((await h.get('subscriptionEntitlements', t)).active, false);
  assert.deepEqual((await auditFor(t)).map((a) => a.action).sort(), ['grant', 'revoke']);
  assert.ok((await h.notifications(t)).some((n) => n.type === 'subscription_admin_revoke'));
});

test('GAP: an admin smoke-test grant must not overwrite a live PayPal entitlement',
  h.gap('#28', 'grant merges source:"admin_smoke_test" over the PayPal entitlement (provider state is overwritten)'),
  async () => {
    const t = await target();
    await h.seedPayPalEntitlement(t, h.newSubId());
    await grant(h.ADMIN_UID, { uid: t, reason: 'smoke test', days: 7 });
    const ent = await h.get('subscriptionEntitlements', t);
    assert.equal(ent.source, 'paypal');
  });

test('GAP: an admin smoke-test revoke must not deactivate a live PayPal entitlement',
  h.gap('#28', 'revoke sets active:false on subscriptionEntitlements even when PayPal still bills the user'),
  async () => {
    const t = await target();
    await h.seedPayPalEntitlement(t, h.newSubId());
    await revoke(h.ADMIN_UID, { uid: t, reason: 'cleanup' });
    const ent = await h.get('subscriptionEntitlements', t);
    assert.equal(ent.active, true);
  });
