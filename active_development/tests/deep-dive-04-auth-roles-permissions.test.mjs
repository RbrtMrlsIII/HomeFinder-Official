import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const routeAccess = fs.readFileSync(`${root}js/route-access-contract.js`, "utf8");
const authority = fs.readFileSync(`${root}js/authority-contract.js`, "utf8");
const auth = fs.readFileSync(`${root}js/auth.js`, "utf8");
const session = fs.readFileSync(`${root}js/session.js`, "utf8");
const adminCore = fs.readFileSync(`${root}js/admin/core.js`, "utf8");
const roles = JSON.parse(fs.readFileSync(`${root}../docs/json/roles-contract.json`, "utf8"));
const routes = JSON.parse(fs.readFileSync(`${root}../docs/json/routes-contract.json`, "utf8"));

assert.deepEqual(roles.canonicalRole, ["owner", "seeker", "broker", "staff", "moderator", "admin"]);
assert.equal(roles.legacyVocabularyIsAuthorization, false);
assert.deepEqual(routes.classes, ["public", "product", "operations", "verification", "development", "vendor"]);
assert.equal(routes.filenameIsRouteAuthority, false);

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

assert.match(authority, /"broker\.hq": Object\.freeze\(\["broker"\]\)/);
assert.match(authority, /return role === consoleRole;/);
assert.doesNotMatch(authority, /if \(role === "admin"\) return OPS_ROLES/);

console.log("Deep Dive 04 Auth/Roles/Permissions current-authority reconciliation: PASS");
