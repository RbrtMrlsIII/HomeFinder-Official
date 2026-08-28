import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const html = fs.readFileSync(path.join(root, "profile.html"), "utf8");
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const route = fs.readFileSync(path.join(root, "js/route-access-contract.js"), "utf8");
const subscription = fs.readFileSync(path.join(root, "js/profile/subscription-boot.js"), "utf8");
const contracts = fs.readFileSync(path.join(root, "js/profile/ongoing-contracts.js"), "utf8");
const roles = JSON.parse(fs.readFileSync(path.join(root, "../docs/json/roles-contract.json"), "utf8"));
const routes = JSON.parse(fs.readFileSync(path.join(root, "../docs/json/routes-contract.json"), "utf8"));

assert.match(html, /paypal-subscription-mount/);
assert.match(html, /js\/profile\/subscription-boot\.js/);
assert.match(html, /ongoing-contracts-list/);
assert.match(html, /js\/profile\/ongoing-contracts\.js/);
assert.match(auth, /routeAccess/);
assert.match(route, /broker-hq\.html/);
assert.deepEqual(roles.canonicalRole, ["owner", "seeker", "broker", "staff", "moderator", "admin"]);
assert.deepEqual(routes.classes, ["public", "product", "operations", "verification", "development", "vendor"]);

assert.match(subscription, /getRole/);
assert.match(subscription, /\["owner","seeker","broker"\]\.includes\(role\)/);
assert.match(contracts, /collection\(db, "contracts"\)/);
assert.match(contracts, /ownerId/);
assert.match(contracts, /brokerId/);
assert.match(contracts, /seekerId/);

console.log("PASS role-contract-subscription-path current-authority reconciliation");
