import fs from "node:fs";
import assert from "node:assert/strict";

const css = fs.readFileSync("css/market.css", "utf8");
const js = fs.readFileSync("js/market.js", "utf8");
const sot = fs.readFileSync("docs/core/01-SOURCE-OF-TRUTH.md", "utf8");

assert.match(css, /@media\(min-width:1400px\)/);
assert.match(css, /market-card-rail/);
assert.match(css, /76dvh/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /market-card-expanded/);
assert.match(js, /bindModalAccessibility/);
assert.match(js, /dy > 110/);
assert.match(js, /aria-current/);
assert.match(sot, /Patch 09 implementation alignment/);
assert.match(sot, /No Firebase rules, Functions, quotas, indexes/);

console.log("Market Patch 09 UI/UX assertions passed.");
