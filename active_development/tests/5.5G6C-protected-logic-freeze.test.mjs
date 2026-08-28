import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import path from "node:path";

const projectRoot = path.resolve(new URL("../../", import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(projectRoot, p), "utf8");
const freeze = JSON.parse(read("docs/contracts/5.5G6C-protected-logic-freeze.json"));

test("5.5G6C protected contract is frozen", () => {
  assert.equal(freeze.status, "FROZEN");
  assert.ok(freeze.protected_rules.includes("Broker top-level access is Broker HQ only."));
  assert.ok(freeze.protected_rules.includes("House 2↔House 3 has no direct physical route."));
});

test("Broker cannot use top-level profile or public market route", async () => {
  const mod = await import("../../active_development/js/route-access-contract.js");
  const profile = mod.routeAccess("profile.html", "broker");
  const market = mod.routeAccess("market.html", "broker");
  assert.equal(profile.allowed, false);
  assert.equal(profile.redirect, "broker-hq.html");
  assert.equal(market.allowed, false);
  assert.equal(market.redirect, "broker-hq.html");
});

test("Government housing is visible to seeker, owner and broker", () => {
  const html = read("active_development/profile.html");
  assert.match(html, /data-tab="gov-housing" data-roles="seeker,owner,broker"/);
  assert.match(html, /id="panel-gov-housing"[^>]*data-roles="seeker,owner,broker"/);
});

test("Logout clears the role cache", () => {
  const logout = read("active_development/js/profile/logout.js");
  assert.match(logout, /sessionStorage\.removeItem\(["']hf_account_role["']\)/);
});

test("3D canonical authority is explicit", () => {
  const contract = JSON.parse(read("docs/json/3d-contract.json"));
  assert.equal(contract.canonicalPath, "master/HomeFinder.sh3d");
  assert.equal(contract.authorityPolicy.canonical, "master/HomeFinder.sh3d");
  assert.ok(contract.authorityPolicy.evidenceOnly.includes("3d/staging/*.sh3d"));
});
