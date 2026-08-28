import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const rules = read('firebase/firestore.rules');
const authority = read('js/authority-contract.js');
const matrix = json('docs/dictionary/domains/capability-boundaries.dictionary.json');
const capabilities = json('docs/dictionary/domains/capabilities.dictionary.json');

// Positive-path evidence: each migrated capability exists and grants all Ops roles.
for (const [cap, roles] of [
  ['ops.supportTicketManagement', ['staff','moderator','admin']],
  ['ops.boostOrderReview', ['staff','moderator','admin']],
  ['ops.assistanceRequestRead', ['staff','moderator','admin']]
]) {
  assert.match(authority, new RegExp(`"${cap}"`));
  const row = matrix.boundaries.find(x => x.intendedCapability === cap);
  assert.ok(row, `missing matrix row for ${cap}`);
  if (cap === 'ops.assistanceRequestRead') {
    assert.deepEqual(row.effectiveRoles, ['staff','moderator','admin','request-party','broker']);
  } else {
    assert.deepEqual(row.effectiveRoles, roles);
  }
  assert.equal(row.status, 'migrated-explicit-capability');
  assert.ok(capabilities.capabilities.some(x => x.id === cap), `missing capability dictionary entry ${cap}`);
}

// Executable wiring: active guards use explicit names, not legacy isStaff().
assert.match(rules, /allow read: if canManageSupportTickets\(\)/);
assert.match(rules, /allow update: if canManageSupportTickets\(\)/);
assert.match(rules, /allow read: if isSignedIn\(\) && \(\s*resource\.data\.uid == request\.auth\.uid \|\| canReviewBoostOrders\(\)/);
assert.match(rules, /allow update: if canReviewBoostOrders\(\)/);
assert.match(rules, /function canReadAssistanceRequests\(\)\s*\{\s*return isOps\(\);\s*\}/);
assert.match(rules, /canReadAssistanceRequests\(\)\s*\n\s*\|\| resource\.data\.posterId == request\.auth\.uid/);

// Negative-path evidence: these capability grants do NOT include customer or broker roles.
for (const cap of ['ops.supportTicketManagement','ops.boostOrderReview']) {
  const row = matrix.boundaries.find(x => x.intendedCapability === cap);
  for (const denied of ['owner','seeker','broker']) {
    assert.equal(row.effectiveRoles.includes(denied), false, `${denied} must not receive ${cap}`);
  }
}

// Assistance requests intentionally retain separate broker/request-party branches;
// only the Ops capability itself excludes customers.
const assistance = matrix.boundaries.find(x => x.intendedCapability === 'ops.assistanceRequestRead');
assert.deepEqual(assistance.effectiveRoles, ['staff','moderator','admin','request-party','broker']);
assert.equal(assistance.effectiveRoles.includes('owner'), false);
assert.equal(assistance.effectiveRoles.includes('seeker'), false);

// Patch 42 retires the legacy helper entirely after the migration gate closes.
assert.equal((rules.match(/\bisStaff\(\)/g) || []).length, 0, 'legacy isStaff() reference remains after Patch 42 retirement');

console.log('PATCH 41 CAPABILITY MIGRATION & NEGATIVE TESTS: PASS');
