import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { planJourney } from "../../active_development/js/inter-house-navigation.js";

const htmlPath = "active_development/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html";
const html = fs.readFileSync(htmlPath, "utf8");

test("viewer exposes all three house transition controls", () => {
  for (const house of ["house-1", "house-2", "house-3"]) {
    assert.match(html, new RegExp(`data-house=["']${house}["']`));
  }
});

test("viewer imports the canonical inter-house navigation module", () => {
  assert.match(html, /inter-house-navigation\.js/);
  assert.match(html, /planJourney/);
});

test("House 2 to House 3 remains hub-routed for broker", () => {
  const plan = planJourney("house-2", "house-3", "broker");
  assert.equal(plan.allowed, true);
  assert.equal(plan.mode, "hub-routed");
  assert.deepEqual(plan.legs.map((leg) => [leg.fromHouse, leg.toHouse]), [
    ["house-2", "house-1"],
    ["house-1", "house-3"]
  ]);
});

test("viewer exposes the hub-routed transition behavior", () => {
  assert.match(html, /plan\.mode === "hub-routed"/);
  assert.match(html, /setCurrent\("house-1"\)/);
  assert.match(html, /continue to \${label\(destination\)}/);
});

test("viewer never encodes a direct House 2 to House 3 link", () => {
  assert.doesNotMatch(html, /house-2[^\n]{0,120}house-3[^\n]{0,120}(href|location\.href)/i);
});
