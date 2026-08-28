import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const contract = read('js/market-data-contract.js');
const market = read('js/market.js');
const map = read('js/market-map.js');
const discovery = read('js/market-discovery-contract.js');
const collections = read('js/collections.js');
const patch = read('docs/patches/PATCH-27-MARKET-DATA-WIRING-FREEZE.md');
const manifest = read('docs/patches/PATCH-27-MANIFEST.json');
const sot = read('docs/core/01-SOURCE-OF-TRUTH.md');
const next = read('docs/patches/PATCH-27-MARKET-DATA-WIRING-FREEZE.md');
const projectMap = read('docs/core/03-PROJECT-MAP.md');

assert.match(contract, /MARKET_READ_MODEL_VERSION = "27\.0"/);
assert.match(contract, /PROPERTY_LISTINGS/);
assert.match(contract, /WANTED_LISTINGS/);
assert.match(contract, /listingStats/);
assert.match(contract, /listingActivity/);
assert.match(contract, /seeker: "property"/);
assert.match(contract, /owner: "wanted"/);
assert.match(contract, /broker: "broker-hq"/);
assert.match(contract, /readMarketInventory/);
assert.match(contract, /normalizeMarketRecords/);
assert.match(contract, /marketCoordinates/);

assert.match(market, /readMarketInventory/);
assert.match(market, /marketCoordinates/);
assert.doesNotMatch(market, /collection\(db,\s*["']propertyListings["']\)/);
assert.doesNotMatch(market, /collection\(db,\s*["']wantedListings["']\)/);

assert.match(map, /marketCoordinates/);
assert.doesNotMatch(map, /d\.lat \?\? d\.latitude/);

assert.match(discovery, /propertyListings \/ wantedListings/);
assert.match(collections, /PROPERTY_LISTINGS = "propertyListings"/);
assert.match(collections, /WANTED_LISTINGS = "wantedListings"/);
assert.match(patch, /Patch 28/);
assert.match(patch, /listingStats\/\{propertyId\}/);
assert.match(manifest, /"patch": "27"/);
assert.match(sot, /Patch 27 — Market data wiring freeze/);
assert.match(next, /PATCH 27/);
assert.match(projectMap, /js\/market-data-contract\.js/);

console.log('Patch 27 Market data wiring contract: PASS');
