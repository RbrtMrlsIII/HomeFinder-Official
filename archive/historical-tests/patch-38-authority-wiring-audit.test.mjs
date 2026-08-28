import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const authority = fs.readFileSync(`${root}js/authority-contract.js`, 'utf8');
const settings = fs.readFileSync(`${root}js/profile/settings-dropdown.js`, 'utf8');
const profile = fs.readFileSync(`${root}profile.html`, 'utf8');
const auth = fs.readFileSync(`${root}js/auth.js`, 'utf8');
const core = fs.readFileSync(`${root}js/admin/core.js`, 'utf8');
const uid = fs.readFileSync(`${root}js/admin-uid.js`, 'utf8');
const rules = fs.readFileSync(`${root}firebase/firestore.rules`, 'utf8');
const users = fs.readFileSync(`${root}js/admin/users.js`, 'utf8');
const broker = fs.readFileSync(`${root}js/broker-hq.js`, 'utf8');
const dictionary = fs.readFileSync(`${root}docs/dictionary/domains/authority-wiring-audit.dictionary.json`, 'utf8');

// 1. Vocabulary and deterministic routes.
assert.match(authority, /PRODUCT_ROLES = Object\.freeze\(\["owner", "seeker", "broker"\]\)/);
assert.match(authority, /OPS_ROLES = Object\.freeze\(\["staff", "moderator", "admin"\]\)/);
assert.match(authority, /staff: "staff\.html"/);
assert.match(authority, /moderator: "moderator\.html"/);
assert.match(authority, /admin: "admin\.html"/);
assert.match(authority, /"admin\.manageUser": Object\.freeze\(\["admin"\]\)/);
assert.match(authority, /"admin\.grantBoost": Object\.freeze\(\["admin"\]\)/);
assert.match(authority, /"admin\.grantSubscription": Object\.freeze\(\["admin"\]\)/);

// 2. Profile Settings exact-role wiring and repaired import.
assert.doesNotMatch(settings, /staffRoleForUid|isOpsUid|opsRoleForUid/);
assert.doesNotMatch(profile, /data-action="ops-(staff|mod|admin)"/);

// 3. Login and console routing use the same UID vocabulary.
for (const fn of ['isAdminUid', 'isModeratorUid', 'isStaffRoleUid', 'opsRoleForUid']) {
  assert.match(uid, new RegExp(`export function ${fn}`));
}
assert.match(auth, /if \(isAdminUid\(uid\)\) return "admin\.html"/);
assert.match(auth, /if \(isModeratorUid\(uid\)\) return "moderator\.html"/);
assert.match(auth, /if \(isStaffRoleUid\(uid\)\) return "staff\.html"/);
assert.match(core, /if \(expected && isOpsPage && path !== expected\)/);
assert.doesNotMatch(core, /adminMayEnterAnyOpsPage/);

// 4. Backend boundaries are present for privileged admin actions.
assert.match(rules, /function isAdmin\(\)/);
assert.match(rules, /allow write: if isAdmin\(\);/);
assert.match(users, /setDoc\(doc\(db, "boosts", uid\)/);
assert.match(users, /grantAdminSubscription/);
assert.match(users, /revokeAdminSubscription/);

// 5. Broker HQ has its own gate and is not an Ops console.
assert.match(broker, /broker/);
assert.match(broker, /broker-hq\.html/);

// 6. Machine-readable audit vocabulary is valid JSON and contains all chain stages.
const d = JSON.parse(dictionary);
for (const key of ['identity','capability','route','ui','backend','persistence','negativeTest']) {
  assert.ok(d.required.includes(key), `dictionary missing ${key}`);
}

console.log('Patch 38 Authority Wiring Audit: PASS');
