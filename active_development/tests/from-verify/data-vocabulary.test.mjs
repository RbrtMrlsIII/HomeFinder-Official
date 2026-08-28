import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const dataDict = JSON.parse(read('docs/dictionary/domains/data.dictionary.json'));
const idx = new Set();
for (const domain of dataDict.domains || []) {
  for (const entity of domain.entities || []) idx.add(entity.id);
}

const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

assert(idx.has('propertyListings'), 'propertyListings must be canonical');
assert(idx.has('wantedListings'), 'wantedListings must be canonical');
assert(idx.has('properties'), 'legacy properties must be explicitly classified');
assert(idx.has('properties/{propertyId}/reviews'), 'legacy review namespace must be explicit');
assert(idx.has('listings') && idx.has('wanted'), 'quarantined names must be explicit');

const functions = read('firebase/functions/index.js');
assert(!functions.includes('db.collection("listings")'), 'stale listings collection reference remains in backend');
assert(!functions.includes('db.collection("wanted")'), 'stale wanted collection reference remains in backend');
assert(functions.includes('db.collection("propertyListings")'), 'canonical propertyListings backend reference missing');
assert(functions.includes('db.collection("wantedListings")'), 'canonical wantedListings backend reference missing');

const market = read('js/market-discovery-contract.js');
assert(market.includes('marketKind: "property"') && market.includes('marketKind: "wanted"'), 'Market normalization kinds missing');
assert(market.includes('normalizeAmenityList'), 'Market must use canonical amenity normalization');

const gate = read('js/listing-create-gate.js');
assert(gate.includes('collection(db, "propertyListings")'), 'listing creation fallback must target canonical propertyListings');
assert(gate.includes('collection(db, "wantedListings")'), 'wanted creation fallback must target canonical wantedListings');

console.log('Patch 36 data vocabulary reconciliation checks passed.');
