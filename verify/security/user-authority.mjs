import assert from "node:assert/strict";
import fs from "node:fs";

const rules = fs.readFileSync("active_development/firebase/firestore.rules", "utf8");
const auth = fs.readFileSync("active_development/js/auth.js", "utf8");
const profile = fs.readFileSync("active_development/js/profile/profile-data.js", "utf8");
const contract = JSON.parse(fs.readFileSync("docs/json/firebase/user-authority.json", "utf8"));

assert.match(rules, /match \/users\/\{uid\}/);
assert.match(rules, /request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\[/);
assert.match(rules, /canonicalRoleValue\(request\.resource\.data\.get\("canonicalRole"/);
assert.match(rules, /in \['owner', 'seeker'\]/);
assert.match(rules, /!request\.resource\.data\.get\('verified', false\)/);
assert.match(rules, /!request\.resource\.data\.get\('prcVerified', false\)/);
assert.match(rules, /indexId == request\.resource\.data\.idType \+ '_' \+ request\.resource\.data\.referenceNumber/);
assert.match(rules, /referenceNumber\.matches\('\^\[A-Z0-9\]\+\$'\)/);

assert.doesNotMatch(auth, /payload\.license\s*=/);
assert.doesNotMatch(auth, /license:\s*\{\s*status:\s*["']none/);
assert.match(auth, /data\.suspended === true/);
assert.match(auth, /suspendedUntil/);
assert.match(profile, /canonicalRoleFromData\(data\)/);

assert.deepEqual(contract.canonicalRole.selfService, ["owner","seeker"]);
assert.ok(contract.serverOwnedFields.includes("verified"));
assert.equal(contract.legacyFields.license, "retired; not written by active auth/profile flows");

console.log("User authority contract + Firestore boundary: PASS");
