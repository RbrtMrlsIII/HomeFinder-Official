import fs from "node:fs";
import assert from "node:assert/strict";

const market = fs.readFileSync("js/market.js", "utf8");
const map = fs.readFileSync("js/market-map.js", "utf8");
const sot = fs.readFileSync("docs/core/01-SOURCE-OF-TRUTH.md", "utf8");
const manifest = fs.readFileSync("docs/patches/PATCH-08-MANIFEST.json", "utf8");

assert.equal(market.includes("function isPublic(data)"), false, "obsolete isPublic helper remains");
assert.equal(market.includes("function firstListingImage"), true, "image boundary missing");
assert.equal(market.includes("f.amenities.every(a => have.has(a))"), true, "property amenity matching is not structured-set based");
assert.equal(market.includes("f.wantedAmenities.every(a => have.has(a))"), true, "wanted amenity matching is not structured-set based");
assert.equal(market.includes('document.addEventListener("hf:market-pin",'), true, "pin invalidation listener missing");
assert.equal(map.includes("positionMarketStatsPanel"), false, "stale stats positioning path remains");
assert.equal(map.includes('shell?.classList.add("is-map-fullscreen")'), true, "native fullscreen class sync missing");
assert.equal(sot.includes("Brokers do **not** use `market.html` for property or wanted discovery."), true, "SoT broker rule is not aligned");
assert.equal(manifest.includes('"patch": "08"'), true, "Patch 08 manifest missing");
console.log("Patch 08 assertions: PASS");
