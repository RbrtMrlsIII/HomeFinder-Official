import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const users = fs.readFileSync(`${root}js/admin/users.js`, "utf8");
const core = fs.readFileSync(`${root}js/admin/core.js`, "utf8");
const admin = fs.readFileSync(`${root}admin.html`, "utf8");
const rules = fs.readFileSync(`${root}firebase/firestore.rules`, "utf8");

// Manage is explicitly an Admin capability.
assert.match(users, /const manageLabel = staffRole === "super" \? "Manage" : "View"/);
assert.match(users, /if \(staffRole !== "super"\)/);
assert.match(users, /wireSaveProfile\(uid\)/);
assert.match(users, /id="admin-save-profile"/);

// Admin must be able to manage their own users/{uid} document through the
// existing authoritative Firestore isAdmin() path.
assert.match(core, /if \(opsRole === "admin"\)/);
assert.match(rules, /function isAdmin\(\)/);
assert.match(rules, /match \/users\/\{uid\}/);
assert.match(rules, /allow (create|update|write): if[^;]*isAdmin\(\)/);

// Role filter uses the canonical broker value.
assert.match(admin, /<option value="broker">Property Broker<\/option>/);

console.log("Patch 23 Admin User Manage restoration contract: PASS");
