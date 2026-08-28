import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const functions = read('firebase/functions/index.js');
const rules = read('firebase/firestore.rules');
const chat = read('js/profile/contract-chat.js');
const tab = read('js/profile/contracts-tab.js');
const patch = read('docs/patches/PATCH-17-AUTHORITATIVE-CONTRACT-ACTIVATION.md');
const nextPatch = read('docs/patches/PATCH-17-AUTHORITATIVE-CONTRACT-ACTIVATION.md');

assert.match(functions, /exports\.createContract\s*=\s*onCall/);
assert.match(functions, /exports\.agreeContract\s*=\s*onCall/);
assert.match(functions, /exports\.declineContract\s*=\s*onCall/);
assert.match(functions, /exports\.renewContract\s*=\s*onCall/);
assert.match(functions, /eventType:\s*"listing_match"/);
assert.match(functions, /matches:\s*Number\(current\.matches \|\| 0\) \+ 1/);
assert.match(functions, /contractRequiresListingMatch/);
assert.match(functions, /broker_assist/);
assert.match(functions, /contract_active_\$\{contractId\}_\$\{uid\}/);

assert.match(rules, /Patch 17: contract lifecycle is Cloud-Function-only/);
assert.match(rules, /allow create, update: if isAdmin\(\);/);

assert.match(chat, /httpsCallable/);
assert.match(chat, /"createContract"/);
assert.match(chat, /"agreeContract"/);
assert.match(chat, /"declineContract"/);
assert.doesNotMatch(chat, /setDoc\(doc\(db, "contracts"/);

assert.match(tab, /"agreeContract"/);
assert.match(tab, /"declineContract"/);
assert.match(tab, /"renewContract"/);
assert.doesNotMatch(tab, /awardContractMade/);

assert.match(patch, /`listing_match`/);
assert.match(patch, /idempotency guard/);
assert.match(patch, /broker-assist/);
assert.match(nextPatch, /Authoritative Contract Activation/);

console.log('Patch 17 contract authority assertions passed.');
