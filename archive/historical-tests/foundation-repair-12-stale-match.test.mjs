import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const fn = read('firebase/functions/index.js');
const client = read('js/profile/notifications.js');
const sot = read('docs/core/01-SOURCE-OF-TRUTH.md');

assert.match(fn, /exports\.syncListingMatchNotificationState = onDocumentWritten/);
assert.match(fn, /collectionGroup\("items"\)/);
assert.match(fn, /where\("type", "==", "listing_match"\)/);
assert.match(fn, /where\("propertyId", "==", listingId\)/);
assert.match(fn, /status: "stale"/);
assert.match(fn, /actionable: false/);
assert.match(fn, /staleReason: reason \|\| "listing_inactive"/);
assert.match(fn, /beforeActive/);
assert.match(fn, /afterActive/);
assert.match(fn, /database: "homefinder"/);

assert.match(client, /isStaleListingMatch/);
assert.match(client, /no longer available for discovery/);
assert.match(sot, /`listing_match` notifications are discovery history.*status: "stale".*actionable: false/s);
assert.match(sot, /reopening them must never reveal, reactivate, mutate, or recreate discovery/s);

console.log('Foundation Repair 12 stale-match notification assertions passed.');
