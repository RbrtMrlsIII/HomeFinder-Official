import fs from "node:fs";
import assert from "node:assert/strict";

const rules = fs.readFileSync("active_development/firebase/firestore.rules", "utf8");
const form = fs.readFileSync("active_development/js/profile/kyc-form.js", "utf8");
const review = fs.readFileSync("active_development/js/admin/verifications.js", "utf8");
const contract = JSON.parse(fs.readFileSync("docs/json/contracts/broker-application.json", "utf8"));

assert.equal(contract.review.automaticRolePromotion, false);
assert.match(form, /brokerApplication:\s*\{\s*status:\s*"pending"/);
assert.doesNotMatch(review, /updatePayload\.canonicalRole\s*=\s*"broker"/);
assert.match(review, /brokerApplication\s*=\s*\{/);
assert.match(rules, /canonicalRoleValue\(request\.resource\.data\.get\('canonicalRole'/);
assert.match(rules, /'brokerApplication'/);

console.log("broker-application-authority: PASS");
