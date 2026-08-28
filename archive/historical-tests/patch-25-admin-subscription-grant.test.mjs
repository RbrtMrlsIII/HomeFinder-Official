import assert from 'node:assert/strict';
import fs from 'node:fs';

const users = fs.readFileSync('js/admin/users.js','utf8');
const core = fs.readFileSync('js/admin/core.js','utf8');
const functions = fs.readFileSync('firebase/functions/index.js','utf8');
const rules = fs.readFileSync('firebase/firestore.rules','utf8');
const next = fs.readFileSync('docs/patches/PATCH-25-ADMIN-SUBSCRIPTION-GRANT.md','utf8');

assert.match(users, /grantAdminSubscription/);
assert.match(users, /revokeAdminSubscription/);
assert.match(users, /subscriptionAdminGrants/);
assert.match(users, /subscriptionEntitlements/);
assert.match(users, /Firestore verified/);
assert.match(core, /functions/);
assert.match(functions, /exports\.grantAdminSubscription/);
assert.match(functions, /exports\.revokeAdminSubscription/);
assert.match(functions, /admin_smoke_test/);
assert.match(functions, /adminSubscriptionAudit/);
assert.match(functions, /PAYPAL_SUBSCRIPTION_PLAN_ID/);
assert.match(rules, /match \/subscriptionAdminGrants\/{uid}/);
assert.match(rules, /match \/subscriptionEntitlements\/{uid}/);
assert.match(rules, /match \/adminSubscriptionAudit\/{auditId}/);
assert.match(rules, /allow write: if false;/);
assert.match(next, /Patch 25/);

console.log('Patch 25 Admin subscription grant lab contract: PASS');
