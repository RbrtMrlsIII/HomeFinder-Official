import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => fs.readFileSync(`${root}/${p}`, 'utf8');

const rules = read('firebase/firestore.rules');
const functions = read('firebase/functions/index.js');
const tiers = read('firebase/functions/tiers.js');
const gate = read('js/listing-create-gate.js');
const hq = read('js/broker-hq.js');
assert.match(rules, /match \/propertyListings\/\{propertyId\}/);
assert.match(rules, /match \/wantedListings\/\{wantedId\}/);
assert.match(rules, /match \/assistanceRequests\/\{requestId\}/);
assert.match(functions, /exports\.createListing/);
assert.match(functions, /exports\.createWantedListing\s*=\s*onCall/);
assert.match(gate, /httpsCallable\(functions, "createWantedListing"\)/);
assert.match(functions, /totalListingCap\(packageId, boostDoc\.extraListings, tierIndex(?:, subscriptionEntitlement)?\)/);
assert.match(tiers, /function totalListingCap\(ownerPackageId = 0, extraListings = null, tierIndex = 0(?:, subscriptionEntitlement = null)?\)/);
assert.match(hq, /assistanceRequests/);
assert.match(hq, /SERVICE_FIELD = "mapStateOwner"/);
console.log('Patch 11A backend audit assertions passed.');
