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

test('positive control: an owner may edit an allowed profile field', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(updateDoc(doc(db, 'users/alice'), { firstName: 'Alicia' }));
});

test('an owner cannot write a subscription state or an admin role onto their own profile', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(updateDoc(doc(db, 'users/alice'), { subscription: { status: 'active' } }));
  await assertFails(updateDoc(doc(db, 'users/alice'), { canonicalRole: 'admin' }));
});

// The exact shape js/auth.js writes on registration (register page -> saveUserProfile).
const REGISTRATION = () => ({
  email: 'new@example.test', accountType: 'seeker', canonicalRole: 'seeker',
  idVerification: { status: 'none' }, status: 'active', profileComplete: false,
  createdAt: new Date().toISOString(), phoneDigits: '', displayName: ''
});
const asUser = (uid) => env.authenticatedContext(uid).firestore();
const createProfile = (uid, data, options) => setDoc(doc(asUser(uid), `users/${uid}`), data, options);

test('registration: a new account can create its own seeker profile (the exact payload js/auth.js writes)', async () => {
  await assertSucceeds(createProfile('reg_seeker', REGISTRATION()));
});

test('registration: merge:true, the real write mode, also works for a first save', async () => {
  await assertSucceeds(createProfile('reg_merge', REGISTRATION(), { merge: true }));
});

test('registration: an owner profile can be created', async () => {
  await assertSucceeds(createProfile('reg_owner', { ...REGISTRATION(), accountType: 'owner', canonicalRole: 'owner' }));
});

test('registration: cannot create a profile for another uid', async () => {
  await assertFails(setDoc(doc(asUser('mallory'), 'users/victim'), REGISTRATION()));
});

for (const role of ['admin', 'broker', 'moderator', 'staff']) {
  test(`registration: ${role} cannot be self-assigned at creation`, async () => {
    await assertFails(createProfile(`reg_${role}`, { ...REGISTRATION(), accountType: role, canonicalRole: role }));
  });
}

test('registration: accountType cannot carry a privileged role even when canonicalRole says seeker', async () => {
  await assertFails(createProfile('reg_mixed', { ...REGISTRATION(), accountType: 'admin' }));
});

for (const [name, extra] of Object.entries({
  verified: { verified: true },
  prcVerified: { prcVerified: true },
  subscription: { subscription: { status: 'active' } },
  suspended: { suspended: true },
  'unknown field': { tier: 'platinum' },
  'non-active status': { status: 'banned' }
})) {
  test(`registration: a server-owned or unknown field is refused at creation (${name})`, async () => {
    await assertFails(createProfile(`reg_x_${name.replace(/\W/g, '')}`, { ...REGISTRATION(), ...extra }));
  });
}

for (const status of ['pending', 'approved', 'verified']) {
  test(`registration: KYC state cannot be pre-set to ${status}`, async () => {
    await assertFails(createProfile(`reg_kyc_${status}`, { ...REGISTRATION(), idVerification: { status } }));
  });
}

test('registration: idVerification cannot carry extra keys', async () => {
  await assertFails(createProfile('reg_kyc_extra', { ...REGISTRATION(), idVerification: { status: 'none', verifiedAt: 'x' } }));
});
