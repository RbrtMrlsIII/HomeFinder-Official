import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const rules = read('firebase/firestore.rules');
const matrix = json('docs/dictionary/domains/capability-boundaries.dictionary.json');
const index = json('docs/dictionary/INDEX.json');
const authority = json('docs/dictionary/domains/authority.dictionary.json');
const contract = read('js/authority-contract.js');

assert.ok(index.domains.includes('domains/capability-boundaries.dictionary.json'));
assert.equal(matrix.legacyHelper.actualSemantics, 'any Ops identity: admin OR moderator OR staff');
assert.equal(matrix.legacyHelper.status, 'retired-no-active-call-sites');
assert.equal(matrix.legacyHelper.retiredInPatch, 42);
assert.equal(matrix.boundaries.length, 8);

// Every currently executable isStaff() call in the rules is accounted for by the matrix.
const activeCalls = [...rules.matchAll(/\bisStaff\(\)/g)].length;
assert.equal(activeCalls, 0, 'Patch 42 must leave zero legacy isStaff() references in executable Firestore rules');

const ids = new Set(matrix.boundaries.map((x) => x.id));
for (const id of [
  'supportTickets.opsSupport',
  'boostOrders.opsOrderReview',
  'boosts.opsRead',
  'contracts.opsRead',
  'notifications.opsManage',
  'reports.opsModeration',
  'kycReferenceIndex.opsRead',
  'assistanceRequests.opsRead'
]) assert.ok(ids.has(id), `missing matrix boundary ${id}`);

for (const row of matrix.boundaries) {
  assert.deepEqual(row.effectiveRoles.includes('admin'), true, `${row.id} must preserve admin smoke-testing access`);
  assert.ok(row.intendedCapability, `${row.id} missing intended capability`);
  assert.ok(row.status, `${row.id} missing audit status`);
}

const mismatch = matrix.boundaries.find((x) => x.id === 'reports.opsModeration');
assert.equal(mismatch.status, 'resolved-broad-ops');
assert.match(mismatch.reviewNote, /retain Staff \+ Moderator \+ Admin/);

// Existing executable authority vocabulary must remain unchanged by the audit.
assert.deepEqual(authority.opsHierarchy, ['staff', 'moderator', 'admin']);
assert.match(contract, /"ops\.staffTasks": Object\.freeze\(\["staff", "admin"\]\)/);
assert.match(contract, /"ops\.moderatorTasks": Object\.freeze\(\["moderator", "admin"\]\)/);
assert.match(contract, /"ops\.adminTasks": Object\.freeze\(\["admin"\]\)/);

// Patch 42 retires the compatibility helper after all active call sites were migrated.
assert.doesNotMatch(rules, /function isStaff\(\)/);
assert.match(rules, /function isOps\(\)\s*\{\s*return isAdmin\(\) \|\| isModerator\(\) \|\| isStaffRole\(\);/);

console.log('PATCH 39 CAPABILITY BOUNDARY MATRIX: PASS');
