import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const patch = read('docs/patches/PATCH-16-LISTING-ACTIVITY-CONTRACTS.md');
const nextPatch = read('docs/patches/PATCH-17-AUTHORITATIVE-CONTRACT-ACTIVATION.md');
const sot = read('docs/core/01-SOURCE-OF-TRUTH.md');
const map = read('docs/core/03-PROJECT-MAP.md');
const market = read('js/market.js');
const messages = read('js/profile/messages.js');
const matchNotify = read('js/profile/match-notify.js');
const functions = read('firebase/functions/index.js');
const firebaseJson = read('firebase.json');

assert.match(patch, /pure P2P/);
assert.match(patch, /No canonical listing-inquiry event exists yet/);
assert.match(patch, /discovery notification/);
assert.match(patch, /not an impression/);
assert.match(patch, /historical.*50 km|50 km.*historical|superseded/i);
assert.match(nextPatch, /# Patch 17/);

assert.match(messages, /kind:\s*"p2p"/);
assert.match(messages, /conversationIdFor\(user\.uid, otherUid, ""\)/);
assert.doesNotMatch(matchNotify, /listingStats/);
assert.doesNotMatch(matchNotify, /listingActivity/);
assert.match(market, /eventType:\s*"listing_view"/);
assert.match(market, /recordMarketListingView/);
assert.match(functions, /exports\.recordListingActivity\s*=\s*onCall/);
assert.match(functions, /exports\.toggleListingSave\s*=\s*onCall/);

assert.match(sot, /50 km.*hard.*maximum|hard.*maximum.*50 km/i);
assert.match(map, /docs\/patches\//);
assert.match(map, /firebase\/functions\/index\.js/);
assert.match(firebaseJson, /firebase\/firestore\.rules/);
assert.match(firebaseJson, /firebase\/functions/);

console.log('Patch 16 listing activity contract assertions passed.');
