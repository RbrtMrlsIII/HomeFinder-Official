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
console.log('Patch 27 Market data wiring contract: PASS');
