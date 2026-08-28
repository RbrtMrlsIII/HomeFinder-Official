import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const hq = read('js/broker-hq.js');
const contracts = read('js/profile/contracts-tab.js');
const workspace = read('js/broker-data-contract.js');
const fn = read('firebase/functions/index.js');
const rules = read('firebase/firestore.rules');
const patch = read('docs/patches/PATCH-29-BROKER-HQ-INTERACTION-SMOKE-FREEZE.md');
const manifest = read('docs/patches/PATCH-29-MANIFEST.json');
const next = read('docs/patches/PATCH-29-BROKER-HQ-INTERACTION-SMOKE-FREEZE.md');

// Pin: server callable + canonical mapStateOwner readback.
assert.match(hq, /attemptRelocate\(/);
assert.match(hq, /getMapState\(currentUser\.uid, tierIndex, 0, SERVICE_FIELD\)/);
assert.match(hq, /Service pin write did not pass server readback archive/checkpoints/);

// Claim: transaction + same-document readback.
assert.match(hq, /runTransaction\(db, async \(tx\)/);
assert.match(hq, /String\(data\.status \|\| ""\) !== "open"/);
assert.match(hq, /saved\.status !== "claimed" \|\| saved\.claimedBy !== currentUser\.uid/);

// Contract handoff: trusted callable followed by contract + assistance readback.
assert.match(contracts, /createContract\(\{ \.\.\.payload, contractId: cid \}\)/);
assert.match(contracts, /contractSaved\.brokerId !== user\.uid/);
assert.match(contracts, /requestSaved\.status !== "in_progress"/);
assert.match(contracts, /requestSaved\.contractId !== cid/);

// Read model remains frozen.
assert.match(workspace, /brokerHQWorkspace/);
assert.match(hq, /httpsCallable\(functions, "brokerHQWorkspace"\)/);
assert.match(fn, /exports\.brokerHQWorkspace = onCall/);
assert.match(fn, /Broker HQ workspace is broker-only/);

// Existing security boundary: normal clients still cannot write contracts.
assert.match(rules, /match \/contracts\/\{contractId\}/);
assert.match(rules, /allow create, update: if isAdmin\(\);/);

assert.match(patch, /write → readback archive/checkpoints/);
assert.match(manifest, /"patch": "29"/);
assert.match(manifest, /"no new Firestore collection is introduced"/);
assert.match(next, /Patch 29/);

console.log('Patch 29 Broker HQ interaction/data smoke-test contract: PASS');
