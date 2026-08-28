import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const routeAccess = fs.readFileSync(`${root}js/route-access-contract.js`, "utf8");
const authority = fs.readFileSync(`${root}js/authority-contract.js`, "utf8");
const auth = fs.readFileSync(`${root}js/auth.js`, "utf8");
const session = fs.readFileSync(`${root}js/session.js`, "utf8");
const adminCore = fs.readFileSync(`${root}js/admin/core.js`, "utf8");
const roleMatrix = JSON.parse(fs.readFileSync(`${root}cinematic/WalkMyPlan/data/auth-identity-route-capability-matrix.json`, "utf8"));
const spatial = JSON.parse(fs.readFileSync(`${root}cinematic/WalkMyPlan/data/role-path-matrix.json`, "utf8"));

assert.match(routeAccess, /PUBLIC_ROUTES/);
assert.match(routeAccess, /PRODUCT_ROUTES/);
assert.match(routeAccess, /OPS_ROUTES/);
assert.match(routeAccess, /role===needed/);
assert.match(routeAccess, /role==="broker"\?"broker-hq\.html"/);

assert.match(auth, /opsRoleForUid/);
assert.match(auth, /routeAccess\(next,role\)/);
assert.match(auth, /page==="market\.html"&&role==="broker"/);
assert.match(session, /authReady/);
assert.match(session, /emailVerified/);
assert.match(adminCore, /if \(expected && isOpsPage && path !== expected\)/);
assert.doesNotMatch(adminCore, /adminMayEnterAnyOpsPage/);

assert.deepEqual(roleMatrix.capabilities["ops.staffTasks"], ["staff"]);
assert.deepEqual(roleMatrix.capabilities["ops.moderatorTasks"], ["moderator"]);
assert.deepEqual(roleMatrix.capabilities["ops.adminTasks"], ["admin"]);
assert.deepEqual(roleMatrix.capabilities["broker.hq"], ["broker"]);

assert.deepEqual(roleMatrix.routes["broker-hq.html"], ["broker"]);
assert.deepEqual(roleMatrix.routes["moderator.html"], ["moderator"]);
assert.deepEqual(roleMatrix.routes["staff.html"], ["staff"]);
assert.deepEqual(roleMatrix.routes["admin.html"], ["admin"]);

assert.equal(roleMatrix.admin_cross_console_smoke_access, false);
assert.equal(roleMatrix.admin_broker_hq_access, false);
assert.deepEqual(spatial.roles.admin.allowed_rooms.includes("OPERATIONS[A-01]"), true);
assert.deepEqual(spatial.roles.broker.blocked_rooms.includes("OPERATIONS"), true);

console.log("Deep Dive 04 Auth/Roles/Permissions reconciliation: PASS");
