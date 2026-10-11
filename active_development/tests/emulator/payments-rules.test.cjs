'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

const HOST = process.env.FIRESTORE_EMULATOR_HOST || '';
if (!/^(127\.0\.0\.1|localhost):\d+$/.test(HOST)) throw new Error('Refusing to run: local Firestore emulator required.');
for (const name of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_SERVICE_ACCOUNT_JSON']) {
  if (process.env[name]) throw new Error(`Refusing to run: ${name} is set.`);
}
const [host, port] = HOST.split(':');
const rules = fs.readFileSync(path.join(__dirname, '..', '..', 'firebase', 'firestore.rules'), 'utf8');
const ADMIN_UID = rules.match(/request\.auth\.uid == '([A-Za-z0-9]+)' \|\|\s*canonicalRoleFor\(request\.auth\.uid\) == 'admin'/)[1];

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-homefinder-rules', firestore: { rules, host, port: Number(port) } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/alice'), { canonicalRole: 'seeker', firstName: 'Alice' });
    await setDoc(doc(db, 'users/roleadmin'), { canonicalRole: 'admin' });
    for (const col of ['subscriptionEntitlements', 'subscriptionAdminGrants']) {
      await setDoc(doc(db, `${col}/alice`), { active: true, source: 'paypal' });
      await setDoc(doc(db, `${col}/bob`), { active: true, source: 'paypal' });
    }
    await setDoc(doc(db, 'adminSubscriptionAudit/a1'), { action: 'grant' });
    await setDoc(doc(db, 'paypalSubscriptions/I-ONE'), { uid: 'alice' });
    await setDoc(doc(db, 'paypalWebhookEvents/WH-ONE'), { status: 'processed' });
  });
});
after(() => env.cleanup());

const PAYMENT = ['subscriptionEntitlements/alice', 'subscriptionAdminGrants/alice', 'adminSubscriptionAudit/a1', 'paypalSubscriptions/I-ONE', 'paypalWebhookEvents/WH-ONE'];

test('signed-out clients can neither read nor write any payment collection', async () => {
  const db = env.unauthenticatedContext().firestore();
  for (const p of PAYMENT) {
    await assertFails(getDoc(doc(db, p)));
    await assertFails(setDoc(doc(db, p), { x: 1 }));
  }
});

test('an owner reads only their own entitlement and grant, and writes none of the payment collections', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(db, 'subscriptionEntitlements/alice')));
  await assertSucceeds(getDoc(doc(db, 'subscriptionAdminGrants/alice')));
  await assertFails(getDoc(doc(db, 'subscriptionEntitlements/bob')));
  await assertFails(getDoc(doc(db, 'subscriptionAdminGrants/bob')));
  for (const p of ['adminSubscriptionAudit/a1', 'paypalSubscriptions/I-ONE', 'paypalWebhookEvents/WH-ONE']) {
    await assertFails(getDoc(doc(db, p)));
  }
  for (const p of PAYMENT) await assertFails(setDoc(doc(db, p), { active: true, source: 'paypal' }));
  await assertFails(updateDoc(doc(db, 'subscriptionEntitlements/alice'), { active: false }));
});

test('admins (bootstrap uid and role document) read entitlements, grants and audit but write nothing', async () => {
  for (const uid of [ADMIN_UID, 'roleadmin']) {
    const db = env.authenticatedContext(uid).firestore();
    await assertSucceeds(getDoc(doc(db, 'subscriptionEntitlements/bob')));
    await assertSucceeds(getDoc(doc(db, 'subscriptionAdminGrants/bob')));
    await assertSucceeds(getDoc(doc(db, 'adminSubscriptionAudit/a1')));
    await assertFails(getDoc(doc(db, 'paypalSubscriptions/I-ONE')));
    await assertFails(getDoc(doc(db, 'paypalWebhookEvents/WH-ONE')));
    for (const p of PAYMENT) await assertFails(setDoc(doc(db, p), { x: 1 }));
  }
});

const NEW_PROFILE = { firstName: 'M', surname: 'X', email: 'm@example.test', createdAt: new Date() };

test('positive control: an owner may edit an allowed profile field', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(updateDoc(doc(db, 'users/alice'), { firstName: 'Alicia' }));
});

test('an owner cannot write a subscription state or an admin role onto their own profile', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(updateDoc(doc(db, 'users/alice'), { subscription: { status: 'active' } }));
  await assertFails(updateDoc(doc(db, 'users/alice'), { canonicalRole: 'admin' }));
});

test('GAP: a new account can create its own profile (registration)',
  { todo: '#29: the users/{uid} create rule reads resource.data, which is null on create, so every self-create is denied' },
  async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertSucceeds(setDoc(doc(db, 'users/newbie'), { ...NEW_PROFILE, canonicalRole: 'seeker', accountType: 'seeker' }));
  });

test('a new account cannot self-create as admin (holds today only because every self-create is denied)', async () => {
  const db = env.authenticatedContext('mallory').firestore();
  await assertFails(setDoc(doc(db, 'users/mallory'), { ...NEW_PROFILE, canonicalRole: 'admin', accountType: 'admin' }));
});
