import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const rules = fs.readFileSync(`${root}firebase/firestore.rules`, 'utf8');
const authority = fs.readFileSync(`${root}js/authority-contract.js`, 'utf8');
const admin = fs.readFileSync(`${root}admin.html`, 'utf8');
const staff = fs.readFileSync(`${root}staff.html`, 'utf8');

// Decisions are explicit and capability-named.
assert.match(rules, /function canModerateReports\(\) \{\s*return isOps\(\);/);
assert.match(rules, /allow read, update: if canModerateReports\(\);/);
assert.match(rules, /function canInspectKycReferenceIndex\(\) \{\s*return isAdmin\(\);/);
assert.match(rules, /allow read: if canInspectKycReferenceIndex\(\);/);

// Other formerly broad aliases are now named without narrowing effective roles.
for (const fn of [
  'canManageSupportTickets',
  'canReviewBoostOrders',
  'canInspectBoosts',
  'canReadOperationalContracts',
  'canResolveNotifications'
]) assert.match(rules, new RegExp(`function ${fn}\\(\\)\\s*\\{\\s*return isOps\\(\\);`));

for (const cap of [
  'ops.reportModeration',
  'ops.kycReferenceInspection',
  'ops.boostInspection',
  'ops.contractRead',
  'ops.notificationResolution'
]) assert.match(authority, new RegExp(`"${cap}"`));
// UI mirrors the KYC boundary; Reports remains present on the Staff console.
assert.match(admin, /data-tab="kyc-registry" data-ops-admin-only/);
assert.match(admin, /id="admin-panel-kyc-registry" data-ops-admin-only/);
assert.match(staff, /data-tab="reports"/);

console.log('Patch 40 Boundary Decision & Repair: PASS');
