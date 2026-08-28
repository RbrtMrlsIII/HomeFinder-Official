import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const authority = json('docs/dictionary/domains/authority.dictionary.json');
const contract = read('js/authority-contract.js');
const settings = read('js/profile/settings-dropdown.js');
const core = read('js/admin/core.js');
const uid = read('js/admin-uid.js');
const rules = read('firebase/firestore.rules');

assert.deepEqual(authority.opsHierarchy, ['staff','moderator','admin']);
assert.deepEqual(authority.capabilities['admin.manageUser'].grantTo, ['admin']);
assert.deepEqual(authority.capabilities['admin.grantBoost'].grantTo, ['admin']);
assert.deepEqual(authority.capabilities['admin.grantSubscription'].grantTo, ['admin']);
assert.deepEqual(authority.routes['staff-console'].allowed, ['staff']);
assert.deepEqual(authority.routes['moderator-console'].allowed, ['moderator']);
assert.deepEqual(authority.routes['admin-console'].allowed, ['admin']);

assert.match(contract, /export const OPS_ROLES = Object\.freeze\(\["staff", "moderator", "admin"\]\)/);
assert.match(contract, /"admin\.manageUser": Object\.freeze\(\["admin"\]\)/);
assert.match(contract, /"admin\.grantBoost": Object\.freeze\(\["admin"\]\)/);
assert.match(contract, /"admin\.grantSubscription": Object\.freeze\(\["admin"\]\)/);

assert.match(core, /if \(expected && isOpsPage && path !== expected\)/);
assert.doesNotMatch(core, /adminMayEnterAnyOpsPage/);
assert.match(uid, /if \(isAdminUid\(uid\)\) return "admin"/);
assert.match(uid, /if \(isModeratorUid\(uid\)\) return "moderator"/);
assert.match(uid, /if \(isStaffRoleUid\(uid\)\) return "staff"/);

// DD04 final freeze: Profile exposes no Ops console navigation.
assert.doesNotMatch(settings, /data-action="ops-(staff|mod|admin)"/);
assert.doesNotMatch(settings, /opsRoleForUid|isOpsUid|staffRoleForUid/);

// Backend authority remains present; Patch 37 must not weaken rules.
assert.match(rules, /function isAdmin\(\)/);
assert.match(rules, /isAdmin\(\)/);

console.log('PATCH 37 AUTHORITY VOCABULARY TESTS PASSED');
