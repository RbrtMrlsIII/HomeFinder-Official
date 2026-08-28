import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const rules = fs.readFileSync(`${root}firebase/firestore.rules`, "utf8");
const authority = fs.readFileSync(`${root}js/authority-contract.js`, "utf8");
const users = fs.readFileSync(`${root}js/admin/users.js`, "utf8");
const sot = fs.readFileSync(`${root}docs/core/01-SOURCE-OF-TRUTH.md`, "utf8");

assert.match(authority, /"admin\.manageUser": Object\.freeze\(\["admin"\]\)/);
assert.match(users, /listingCapOverride/);
assert.match(users, /wantedCapOverride/);
assert.match(rules, /listingCapOverride/);
assert.match(rules, /wantedCapOverride/);
assert.doesNotMatch(rules, /allow update: if isAdmin\(\)\s*\n\s*\|\| \(isModerator\(\)/);
assert.match(sot, /Repair 07 — Admin capacity override authority/);
assert.match(sot, /Moderator access remains limited to the current permitted operations surfaces/);
assert.match(sot, /capacity-override authority/);

console.log("Foundation Repair 07 Admin Capacity Override Authority: PASS");
