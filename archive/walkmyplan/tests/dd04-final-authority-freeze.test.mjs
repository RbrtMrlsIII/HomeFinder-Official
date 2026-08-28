import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const route = fs.readFileSync(`${root}js/route-access-contract.js`, "utf8");
const authority = fs.readFileSync(`${root}js/authority-contract.js`, "utf8");
const roleMatrix = JSON.parse(fs.readFileSync(`${root}cinematic/WalkMyPlan/data/auth-identity-route-capability-matrix.json`, "utf8"));
const paths = JSON.parse(fs.readFileSync(`${root}cinematic/WalkMyPlan/data/role-path-matrix.json`, "utf8"));
const doors = JSON.parse(fs.readFileSync(`${root}cinematic/WalkMyPlan/data/door-registry.json`, "utf8"));

assert.match(route, /MARKET_ROLES=Object\.freeze\(\["guest","owner","seeker"\]\)/);
assert.doesNotMatch(route, /role==="admin"\|\|role===needed/);
assert.match(authority, /"broker\.hq": Object\.freeze\(\["broker"\]\)/);
assert.doesNotMatch(authority, /staff:\["staff\.html","profile\.html"/);
assert.doesNotMatch(authority, /moderator:\["moderator\.html","profile\.html"/);
assert.doesNotMatch(authority, /admin:\["admin\.html","moderator\.html","staff\.html","profile\.html"/);

assert.equal(roleMatrix.admin_cross_console_smoke_access, false);
assert.deepEqual(roleMatrix.routes["admin.html"], ["admin"]);
assert.deepEqual(roleMatrix.routes["moderator.html"], ["moderator"]);
assert.deepEqual(roleMatrix.routes["staff.html"], ["staff"]);
assert.deepEqual(roleMatrix.routes["profile.html"], ["owner", "seeker", "broker"]);
assert.deepEqual(roleMatrix.routes["market.html"], ["guest", "owner", "seeker"]);
assert.deepEqual(roleMatrix.capabilities["broker.hq"], ["broker"]);

for (const role of ["admin", "moderator", "staff"]) {
  assert.ok(paths.roles[role].blocked_rooms.includes("PROFILE SUITE"));
  assert.ok(paths.roles[role].blocked_rooms.includes("MARKET"));
}
assert.ok(paths.roles.admin.blocked_rooms.includes("BROKER HQ"));

assert.deepEqual(doors.find(d => d.id === "admin-door").role, ["admin"]);
assert.deepEqual(doors.find(d => d.id === "moderator-door").role, ["moderator"]);
assert.deepEqual(doors.find(d => d.id === "staff-door").role, ["staff"]);
assert.ok(!doors.find(d => d.id === "admin-to-moderator-door"));
assert.ok(!doors.find(d => d.id === "admin-to-staff-door"));
assert.deepEqual(doors.find(d => d.id === "broker-hq-door").role, ["broker"]);
assert.match(authority, /return role === consoleRole;/);
assert.doesNotMatch(authority, /if \(role === "admin"\) return OPS_ROLES/);

console.log("DD04 final authority freeze: PASS");
