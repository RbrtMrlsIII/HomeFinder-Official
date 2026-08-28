import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const core = fs.readFileSync(`${root}js/admin/core.js`, "utf8");
const uid = fs.readFileSync(`${root}js/admin-uid.js`, "utf8");
const settings = fs.readFileSync(`${root}profile.html`, "utf8");
const rules = fs.readFileSync(`${root}firebase/firestore.rules`, "utf8");
const admin = fs.readFileSync(`${root}admin.html`, "utf8");
const moderator = fs.readFileSync(`${root}moderator.html`, "utf8");
const staff = fs.readFileSync(`${root}staff.html`, "utf8");
const patch21 = fs.readFileSync(`${root}tests/patch-21-role-need-help.test.mjs`, "utf8");

assert.match(core, /const opsPages = new Set\(\["admin\.html", "moderator\.html", "staff\.html"\]\)/);
assert.match(core, /if \(expected && isOpsPage && path !== expected\)/);
assert.doesNotMatch(core, /adminMayEnterAnyOpsPage/);

assert.match(uid, /export function isAdminUid/);
assert.match(uid, /export function isModeratorUid/);
assert.match(uid, /export function isStaffRoleUid/);

for (const page of [admin, moderator, staff]) {
  assert.doesNotMatch(page, /ops-console-switcher/);
}

assert.doesNotMatch(settings, /data-action="ops-(staff|mod|admin)"/);
assert.doesNotMatch(settings, /data-roles="[^"]*(staff|moderator|admin)[^"]*"/);

// Admin is already the top-level authority in the existing Firestore rules.
assert.match(rules, /function isAdmin\(\)/);
assert.match(rules, /allow write: if isAdmin\(\);/);

// Patch 21 remains part of the regression baseline.
assert.match(patch21, /Patch 21 role\/Need Help contract: PASS/);

console.log("Patch 22 Admin/Ops authority matrix contract: PASS");
