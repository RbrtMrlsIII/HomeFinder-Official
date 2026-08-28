import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const fn = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');
const rules = fs.readFileSync(path.join(root, 'firebase/firestore.rules'), 'utf8');
const market = fs.readFileSync(path.join(root, 'js/market.js'), 'utf8');
const sot = fs.readFileSync(path.join(root, 'docs/core/01-SOURCE-OF-TRUTH.md'), 'utf8');

assert.match(fn, /exports\.recordListingActivity\s*=\s*onCall/);
assert.match(fn, /collection\("propertyListings"\)\.doc\(listingId\)/);
assert.match(fn, /const dedupeKey = eventType === "listing_impression" \? sessionId : requestId/);
assert.match(fn, /const eventKey = `\$\{eventType\}:\$\{listingId\}:\$\{actorUid\}:\$\{dedupeKey\}`/);
assert.match(fn, /listingActivityEventId\(eventKey\)/);
assert.match(fn, /transaction\.create\(eventRef/);
assert.match(fn, /transaction\.set\(statsRef/);
assert.match(fn, /ownerId === actorUid/);
assert.match(fn, /activeBoostSnapshot/);
assert.match(fn, /ownerTierSnapshot/);
assert.match(fn, /"market_card_open"/);
assert.match(fn, /listing_view: "views"/);

assert.match(rules, /match \/listingActivity\/\{eventId\}/);
assert.match(rules, /match \/listingStats\/\{listingId\}/);
assert.match(rules, /allow create, update, delete: if false;/);
assert.match(market, /httpsCallable\(functions, "recordListingActivity"\)/);
assert.match(market, /eventType: "listing_view"/);
assert.match(market, /recordMarketListingView\(item, kind\)/);
assert.match(sot, /## PATCH 14 — Listing Activity \+ Stats Contract/);
assert.match(sot, /Listing statistics do not award tier\/points by themselves/);

console.log('patch-14-listing-activity: PASS');
