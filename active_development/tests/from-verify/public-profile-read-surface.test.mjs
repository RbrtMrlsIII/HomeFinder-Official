import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const rules = fs.readFileSync(`${root}/firebase/firestore.rules`, 'utf8');
const userSearch = fs.readFileSync(`${root}/js/profile/user-search.js`, 'utf8');
const projection = fs.readFileSync(`${root}/firebase/functions/publicProfileProjection.js`, 'utf8');
const backfill = fs.readFileSync(`${root}/firebase/functions/backfillPublicProfiles.js`, 'utf8');
const index = fs.readFileSync(`${root}/firebase/functions/index.js`, 'utf8');

assert.match(rules, /match \/publicProfiles\/\{uid\} \{[\s\S]*?allow read: if true;[\s\S]*?allow write: if false;/);
assert.match(rules, /match \/users\/\{uid\} \{\s*allow read: if isAdmin\(\) \|\| isOwnerOf\(uid\);/);
assert.match(rules, /match \/config\/\{docId\} \{[\s\S]*?allow read: if docId == "govDisclaimers";/);
assert.match(rules, /match \/config\/\{docId\} \{[\s\S]*?docId == "govDisclaimers";/);
assert.match(userSearch, /data\.searchable !== false/);
assert.match(userSearch, /\.filter\(\(u\) => u\.searchable\)/);
assert.match(projection, /publicEmail/);
assert.match(projection, /publicPhone/);
assert.match(projection, /publicCity/);
assert.match(index, /onDocumentWritten\(\{ document: "users\/\{uid\}", database: "homefinder" \}/);
assert.match(backfill, /--dry-run/);
assert.match(backfill, /--prune-orphans/);
console.log('public-profile-read-surface: PASS');
