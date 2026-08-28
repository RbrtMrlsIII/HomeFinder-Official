import fs from "node:fs";
import assert from "node:assert/strict";

const c = JSON.parse(fs.readFileSync("docs/json/firebase/route-authority.json", "utf8"));
const runtime = await import("../../active_development/js/route-access-contract.js");
assert.equal(c.routes["market.html"].class, "product");
assert.ok(c.routes["market.html"].roles.includes("guest"));
assert.equal(c.routes["admin.html"].class, "operations");
assert.equal(c.routes["verify/index.html"].class, "verification");
assert.equal(c.classes.vendor.authentication, "none");
assert.equal(runtime.routeAccess("market.html", "guest").allowed, true);
assert.equal(runtime.routeAccess("verify/index.html", "guest").allowed, false);
assert.equal(runtime.routeAccess("verify/index.html", "admin").allowed, true);
assert.equal(runtime.routeAccess("index.html", "guest").allowed, true);
console.log("route authority: PASS");
