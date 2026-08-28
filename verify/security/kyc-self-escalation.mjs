import assert from "node:assert/strict";
import fs from "node:fs";

const rules = fs.readFileSync("active_development/firebase/firestore.rules", "utf8");
const kyc = fs.readFileSync("active_development/js/profile/kyc-form.js", "utf8");
const projection = fs.readFileSync("active_development/firebase/functions/publicProfileProjection.js", "utf8");
const peer = fs.readFileSync("active_development/firebase/functions/index.js", "utf8");

assert.match(rules, /function ownerSelfServiceRoleChangeAllowed\(\)/);
assert.match(rules, /oldRole in \['owner', 'seeker'\] && newRole in \['owner', 'seeker'\]/);
assert.match(rules, /function selfSubmittedKycStateIsPending\(\)/);
assert.match(rules, /request\.resource\.data\.idVerification\.get\('status', 'pending'\) == 'pending'/);
assert.match(rules, /request\.resource\.data\.brokerLicense\.get\('status', 'pending'\) == 'pending'/);

assert.doesNotMatch(kyc, /brokerLicense:\s*brokerFields,\s*canonicalRole:\s*"broker"/s);
assert.match(kyc, /brokerLicense:\s*brokerFields/);

assert.match(peer, /canonicalRole:\s*normalizeCanonicalRole\(data\.canonicalRole \|\| data\.accountType \|\| data\.role\)/);
assert.doesNotMatch(peer, /accountType:\s*String\(data\.accountType \|\| data\.role/);

console.log("KYC self-escalation boundary: PASS");
