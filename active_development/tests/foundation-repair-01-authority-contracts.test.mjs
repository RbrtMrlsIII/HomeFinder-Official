import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(p, 'utf8');
const functions = read('firebase/functions/index.js');
const gate = read('js/listing-create-gate.js');
const kyc = read('js/profile/kyc-form.js');
const rules = read('firebase/firestore.rules');
const ref = read('js/kyc-reference.js');

assert.match(functions, /exports\.createWantedListing\s*=\s*onCall/);
assert.match(functions, /wantedCapForSeekerBoost/);
assert.match(functions, /tiers\.hasVerifiedId\(profile\)/);
assert.match(functions, /seekerId: callerUid/);
assert.match(gate, /httpsCallable\(functions, "createWantedListing"\)/);
assert.match(kyc, /kycReferenceIndexId\(idType, idNumber\)/);
assert.match(kyc, /linkedUid: user\.uid/);
assert.match(kyc, /referenceNumber: normalizedReference/);
assert.match(kyc, /kycReferenceIndexId\("prc_license", lic\)/);
assert.match(rules, /request\.resource\.data\.linkedUid == request\.auth\.uid/);
assert.match(rules, /request\.resource\.data\.referenceNumber is string/);
assert.match(ref, /function kycReferenceIndexId\(idType, referenceNumber\)/);

console.log('Foundation Repair 01 authority contracts: PASS');
