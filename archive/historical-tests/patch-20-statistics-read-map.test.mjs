import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const docs = fs.readFileSync(path.join(root, 'docs/patches/PATCH-20-MARKET-BROKER-HQ-STATISTICS-READ-MAP.md'), 'utf8');
const rules = fs.readFileSync(path.join(root, 'firebase/firestore.rules'), 'utf8');
const fn = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');

for (const field of ['views', 'inquiries', 'impressions', 'matches']) {
  assert.match(docs, new RegExp(`\\b${field}\\b`), `Patch 20 must document ${field}`);
}
assert.match(docs, /listingStats\/\{propertyId\}/);
assert.match(docs, /listingActivity/);
assert.match(rules, /match \/listingStats\/\{listingId\}/);
assert.match(rules, /allow create, update, delete: if false/);
assert.match(fn, /const LISTING_STAT_FIELDS/);
assert.match(fn, /listing_impression/);
assert.match(fn, /listing_inquiry/);
assert.match(fn, /listing_match/);

console.log('Patch 20 statistics read-map contract: PASS');
