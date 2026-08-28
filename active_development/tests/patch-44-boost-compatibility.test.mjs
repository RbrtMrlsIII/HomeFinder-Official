import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { listingCapForBoostPackage, SEEKER_BOOST_PACKAGES, OWNER_BOOST_PACKAGES } from '../js/tiers.js';

const root = process.cwd();
const browserTiers = fs.readFileSync(path.join(root, 'js/tiers.js'), 'utf8');
const cloudTiers = fs.readFileSync(path.join(root, 'firebase/functions/tiers.js'), 'utf8');
for (const source of [browserTiers, cloudTiers]) {
  assert.equal(source.includes('SEEKER_BOOST_RADIUS_BONUS_KM'), false);
  assert.equal(source.includes('OWNER_BOOST_LISTING_CAPS'), false);
  assert.equal(source.includes('normalizeBoostPackageValue'), false);
  assert.equal(source.includes('roleBoost.level'), false);
}

assert.equal(SEEKER_BOOST_PACKAGES[3].radiusBonusKm, 12);
assert.equal(OWNER_BOOST_PACKAGES[1].listingBonus, 2);

// Patch 50 supersedes Patch 44 compatibility parsing: only canonical numeric values are executable.
assert.equal(listingCapForBoostPackage(1), listingCapForBoostPackage(1));
assert.equal(listingCapForBoostPackage('I'), 1);
assert.equal(listingCapForBoostPackage('II'), 1);
assert.equal(listingCapForBoostPackage(undefined), 1);
console.log('Patch 44 historical regression + Patch 50 retirement compatibility PASS.');
