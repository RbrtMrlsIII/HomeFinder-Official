import fs from 'node:fs';
import assert from 'node:assert/strict';

const functions = fs.readFileSync('firebase/functions/index.js', 'utf8');
const rules = fs.readFileSync('firebase/firestore.rules', 'utf8');
const saved = fs.readFileSync('js/profile/saved-properties.js', 'utf8');
const patch = fs.readFileSync('docs/patches/PATCH-15-LISTING-ACTIVITY-EXPANSION.md', 'utf8');
const nextPatch = fs.readFileSync('docs/patches/PATCH-16-LISTING-ACTIVITY-CONTRACTS.md', 'utf8');

assert.match(functions, /exports\.toggleListingSave\s*=\s*onCall/);
assert.match(functions, /users"\)\.doc\(actorUid\)\.collection\("favourites"\)/);
assert.match(functions, /eventType:\s*`listing_\$\{action\}`/);
assert.match(functions, /saves:\s*shouldBeSaved \? currentSaves \+ 1/);
assert.match(functions, /saveActions/);
assert.match(functions, /unsaveActions/);
assert.match(functions, /activeBoostSnapshot/);
assert.match(functions, /ownerTierSnapshot/);

const favBlock = rules.match(/match \/users\/{uid}\/favourites\/{propertyId} \{[\s\S]*?\n    \}/);
assert.ok(favBlock, 'favourites rules block must exist');
assert.match(favBlock[0], /allow read: if isOwnerOf\(uid\);/);
assert.match(favBlock[0], /allow create, update, delete: if false;/);

assert.match(saved, /httpsCallable\(functions, "toggleListingSave"\)/);
assert.match(saved, /action: "unsave"/);

assert.match(patch, /canonical Save\/Unsave mutation path/);
assert.match(patch, /does \*\*not\*\* invent an `inquiries` collection/);
assert.match(patch, /does \*\*not\*\* increment listing match statistics/);
assert.match(nextPatch, /# Patch 16/);

console.log('Patch 15 listing activity assertions passed.');
