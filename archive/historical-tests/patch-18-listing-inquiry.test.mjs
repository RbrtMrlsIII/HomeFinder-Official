import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const functions = read('firebase/functions/index.js');
const market = read('js/market.js');
const marketHtml = read('market.html');
const css = read('css/market.css');
const messages = read('js/profile/messages.js');
const contracts = read('js/profile/contracts-tab.js');
const rules = read('firebase/firestore.rules');
const patch = read('docs/patches/PATCH-18-LISTING-INQUIRY-CONTRACT.md');
const nextPatch = read('docs/patches/PATCH-19-DISCOVERY-IMPRESSION-CONTRACT.md');
const sot = read('docs/core/01-SOURCE-OF-TRUTH.md');
const map = read('docs/core/03-PROJECT-MAP.md');

assert.match(functions, /LISTING_ACTIVITY_TYPES = new Set\(\["listing_view", "listing_inquiry", "listing_impression"\]\)/);
assert.match(functions, /listing_inquiry: "inquiries"/);
assert.match(functions, /eventType === "listing_inquiry"/);
assert.match(functions, /source !== "market_contact"/);
assert.match(functions, /const dedupeKey = eventType === "listing_impression" \? sessionId : requestId/);
assert.match(functions, /const eventKey = `\$\{eventType\}:\$\{listingId\}:\$\{actorUid\}:\$\{dedupeKey\}`/);
assert.match(functions, /eventType === "listing_inquiry"/);
assert.match(functions, /"market_contact"/);
assert.match(functions, /listingStats/);
assert.match(functions, /listingActivity/);

assert.match(market, /eventType: "listing_inquiry"/);
assert.match(market, /source: "market_contact"/);
assert.match(market, /hf_pending_contact/);
assert.match(market, /profile\.html#contracts/);
assert.match(marketHtml, /id="market-card-contact-btn"/);
assert.match(marketHtml, /listing inquiry/);
assert.match(css, /market-card-expanded-actions/);

assert.match(messages, /kind:\s*"p2p"/);
assert.match(messages, /conversationIdFor\(user\.uid, otherUid, ""\)/);
assert.match(contracts, /startContractFromListing/);
assert.match(contracts, /httpsCallable\(functions, "createContract"\)/);

assert.match(rules, /match \/listingActivity\/\{eventId\}/);
assert.match(rules, /allow create, update, delete: if false;/);
assert.match(rules, /match \/listingStats\/\{listingId\}/);

assert.match(patch, /explicit \*\*Market Contact\*\*/);
assert.match(patch, /No `inquiries` collection/);
assert.match(patch, /P2P Messages remains a separate product path/);
assert.match(patch, /Patch 18/);
assert.match(nextPatch, /Patch 19/);
assert.match(sot, /listingStats\.inquiries/);
assert.match(sot, /Market Contact/);
assert.match(map, /PATCH-18-LISTING-INQUIRY-CONTRACT/);

console.log('Patch 18 listing inquiry contract assertions passed.');
