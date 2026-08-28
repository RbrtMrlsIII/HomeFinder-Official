import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const route = fs.readFileSync(`${root}js/route-access-contract.js`, "utf8");
const authority = fs.readFileSync(`${root}js/authority-contract.js`, "utf8");
const roles = JSON.parse(fs.readFileSync(`${root}../docs/json/roles-contract.json`, "utf8"));
const routes = JSON.parse(fs.readFileSync(`${root}../docs/json/routes-contract.json`, "utf8"));

assert.deepEqual(roles.canonicalRole, ["owner", "seeker", "broker", "staff", "moderator", "admin"]);
assert.equal(routes.filenameIsRouteAuthority, false);

assert.match(route, /MARKET_ROLES=Object\.freeze\(\["guest","owner","seeker"\]\)/);
assert.doesNotMatch(route, /role==="admin"\|\|role===needed/);
assert.match(authority, /"broker\.hq": Object\.freeze\(\["broker"\]\)/);
assert.doesNotMatch(authority, /staff:\["staff\.html","profile\.html"/);
assert.doesNotMatch(authority, /moderator:\["moderator\.html","profile\.html"/);
assert.doesNotMatch(authority, /admin:\["admin\.html","moderator\.html","staff\.html","profile\.html"/);

assert.match(authority, /return role === consoleRole;/);
assert.doesNotMatch(authority, /if \(role === "admin"\) return OPS_ROLES/);

console.log("DD04 final authority freeze current-authority reconciliation: PASS");
