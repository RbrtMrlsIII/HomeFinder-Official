import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const contract = read('js/broker-data-contract.js');
const hq = read('js/broker-hq.js');
const fn = read('firebase/functions/index.js');
const projection = read('firebase/functions/brokerHQDiscoveryProjection.js');
const patch = read('docs/patches/PATCH-28-BROKER-HQ-DATA-WIRING-FREEZE.md');
const manifest = read('docs/patches/PATCH-28-MANIFEST.json');
const next = read('docs/patches/PATCH-28-BROKER-HQ-DATA-WIRING-FREEZE.md');
const rules = read('firebase/firestore.rules');

assert.match(contract, /BROKER_HQ_READ_MODEL_VERSION = "28\.0"/);
assert.match(contract, /propertyListings/);
assert.match(contract, /wantedListings/);
assert.match(contract, /assistanceRequests/);
assert.match(contract, /listingStats/);
assert.match(contract, /brokerHQWorkspace/);

assert.match(hq, /normalizeBrokerWorkspace/);
assert.match(hq, /httpsCallable\(functions, "brokerHQWorkspace"\)/);
assert.match(hq, /await loadBrokerWorkspace\(\)/);

assert.match(fn, /exports\.brokerHQWorkspace = onCall/);
assert.match(fn, /brokerHQWorkspace.*broker-only|Broker HQ workspace is broker-only/s);
assert.match(fn, /collection\("propertyListings"\)/);
assert.match(fn, /own\("wantedListings", \["seekerId"/);
assert.match(fn, /collection\("assistanceRequests"\)/);
assert.match(fn, /where\("brokerId", "==", uid\)/);
assert.match(fn, /collection\("listingStats"\)/);
assert.match(fn, /version: "28\.0"/);

assert.match(projection, /coords,/);
assert.match(patch, /No new Firestore collection/);
assert.match(manifest, /"patch": "28"/);
assert.match(manifest, /"newCollections": \[\]/);
assert.match(next, /Patch 28/);

// Rules remain server-only for listingStats; this patch must not weaken that boundary.
assert.match(rules, /match \/listingStats\/\{listingId\}/);
assert.match(rules, /allow create, update, delete: if false;/);

console.log('Patch 28 Broker HQ data wiring contract: PASS');
