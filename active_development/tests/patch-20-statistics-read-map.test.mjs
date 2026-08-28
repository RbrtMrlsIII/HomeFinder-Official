import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const rules = fs.readFileSync(path.join(root, 'firebase/firestore.rules'), 'utf8');
const fn = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');

for (const field of ['views', 'inquiries', 'impressions', 'matches']) {
}
assert.match(rules, /match \/listingStats\/\{listingId\}/);
assert.match(rules, /allow create, update, delete: if false/);
assert.match(fn, /const LISTING_STAT_FIELDS/);
assert.match(fn, /listing_impression/);
assert.match(fn, /listing_inquiry/);
assert.match(fn, /listing_match/);

console.log('Patch 20 statistics read-map contract: PASS');
