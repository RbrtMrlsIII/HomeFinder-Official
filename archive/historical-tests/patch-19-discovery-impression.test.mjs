import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const functions = fs.readFileSync(path.join(root, "firebase/functions/index.js"), "utf8");
const market = fs.readFileSync(path.join(root, "js/market.js"), "utf8");
const rules = fs.readFileSync(path.join(root, "firebase/firestore.rules"), "utf8");
const sot = fs.readFileSync(path.join(root, "docs/core/01-SOURCE-OF-TRUTH.md"), "utf8");

assert.match(functions, /listing_impression/);
assert.match(functions, /listing_impression: "impressions"/);
assert.match(functions, /eventType === "listing_impression" && !sessionId/);
assert.match(functions, /const dedupeKey = eventType === "listing_impression" \? sessionId : requestId/);
assert.match(functions, /source !== "market_card_impression"/);
assert.match(functions, /discoverySessionId: sessionId/);
assert.match(market, /function marketDiscoverySessionId\(\)/);
assert.match(market, /sessionStorage\.getItem\(key\)/);
assert.match(market, /eventType: "listing_impression"/);
assert.match(market, /source: "market_card_impression"/);
assert.match(market, /intersectionRatio >= 0\.5/);
assert.match(market, /setTimeout\(\(\) => \{/);
assert.match(market, /}, 500\);/);
assert.match(market, /data-kind="property"/);
assert.match(market, /recordMarketListingView/);
assert.doesNotMatch(market, /eventType: "listing_impression"[\s\S]{0,300}kind === "wanted"/);
assert.match(rules, /match \/listingActivity\/\{eventId\}/);
assert.match(rules, /allow create, update, delete: if false/);
assert.match(sot, /Patch 19/);
assert.match(sot, /discovery-impression semantics/);

console.log("Patch 19 discovery impression contract: PASS");
