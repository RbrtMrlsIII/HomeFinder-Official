import fs from 'node:fs';
import assert from 'node:assert/strict';

const market = fs.readFileSync('js/market.js', 'utf8');
const map = fs.readFileSync('js/market-map.js', 'utf8');
const contract = fs.readFileSync('js/market-discovery-contract.js', 'utf8');
const html = fs.readFileSync('market.html', 'utf8');
const css = fs.readFileSync('css/market.css', 'utf8');

// Integration boundary: role -> canonical inventory.
assert.match(market, /readCollection\("propertyListings"\)/);
assert.match(market, /normalizeMarketRecords\(await readCollection\("propertyListings"\), "property"\)/);
assert.match(market, /readCollection\("wantedListings"\)/);
assert.match(market, /normalizeMarketRecords\(await readCollection\("wantedListings"\), "wanted"\)/);
assert.match(market, /marketRole === "seeker"/);
assert.match(market, /marketRole === "owner"/);
assert.match(market, /location\.replace\("broker-hq\.html"/);

// Integration boundary: radius is evaluated before role-specific filters and
// the same filtered set feeds both cards and markers.
assert.match(market, /const scoped = pinScoped\(currentPool\(\)\)/);
assert.match(market, /filtered = currentKind\(\) === "property" \? filterProperty\(scoped\.inRadius, filterState\) : filterWanted\(scoped\.inRadius, filterState\)/);
assert.match(market, /window\.renderMarketResultMarkers\?\.\(filtered\)/);

// Owner/Seeker Market must use discovery pins, never profile supply pins.
assert.match(map, /if \(accountRole === "owner" \|\| accountRole === "seeker"\) activePinKind = "discovery";/);
assert.match(map, /Market discovery is always discovery-kind/);

// Center Pin remains navigation-only and never relocates the pin.
assert.match(map, /market-locate-btn/);
assert.match(html, />Center Pin<|aria-label="Center Pin"/);
assert.doesNotMatch(map, /market-locate-btn.*commitPinForUser/s);

// Structured amenity matching remains canonical.
assert.match(market, /normalizeAmenityList\(marketDataOf\(item\)\.amenities/);
assert.match(market, /f\.amenities\.every\(a => have\.has\(a\)\)/);
assert.match(contract, /normalizeAmenityList/);

// Expanded card + fullscreen workspace remain part of the same Market shell.
assert.match(html, /market-card-modal/);
assert.match(html, /market-map-fullscreen-menu/);
assert.match(css, /\.market-map-shell:fullscreen/);
assert.match(css, /76dvh/);
assert.match(css, /width:min\(70vw/);

console.log('Market Patch 10 integration assertions passed.');
