import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../../", import.meta.url).pathname;
const uid = fs.readFileSync(`${root}js/admin-uid.js`, "utf8");
const rules = fs.readFileSync(`${root}firebase/firestore.rules`, "utf8");
const core = fs.readFileSync(`${root}js/admin/core.js`, "utf8");

assert.doesNotMatch(uid, /export function isStaffUid\s*\(/);
assert.match(uid, /export function isStaffRoleUid\s*\(/);
assert.match(uid, /export function isOpsUid\s*\(/);
assert.doesNotMatch(rules, /function isStaff\s*\(/);
assert.match(rules, /function isOps\s*\(/);
assert.match(core, /isOpsUid\(u\.uid\)/);
assert.match(core, /opsRoleForUid\(u\.uid\)/);

console.log("PATCH 54 ambiguous Staff alias retirement: PASS");
