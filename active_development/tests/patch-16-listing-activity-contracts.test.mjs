import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const market = read('js/market.js');
const messages = read('js/profile/messages.js');
const matchNotify = read('js/profile/match-notify.js');
const functions = read('firebase/functions/index.js');
const firebaseJson = read('firebase.json');
assert.match(messages, /kind:\s*"p2p"/);
assert.match(messages, /conversationIdFor\(user\.uid, otherUid, ""\)/);
assert.doesNotMatch(matchNotify, /listingStats/);
assert.doesNotMatch(matchNotify, /listingActivity/);
assert.match(market, /eventType:\s*"listing_view"/);
assert.match(market, /recordMarketListingView/);
assert.match(functions, /exports\.recordListingActivity\s*=\s*onCall/);
assert.match(functions, /exports\.toggleListingSave\s*=\s*onCall/);
assert.match(firebaseJson, /firebase\/firestore\.rules/);
assert.match(firebaseJson, /firebase\/functions/);

console.log('Patch 16 listing activity contract assertions passed.');
