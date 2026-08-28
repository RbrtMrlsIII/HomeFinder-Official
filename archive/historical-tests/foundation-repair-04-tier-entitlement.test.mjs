import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const require = createRequire(import.meta.url);
const serverTiers = require(path.join(root, 'firebase/functions/tiers.js'));
const browserTiers = fs.readFileSync(path.join(root, 'js/tiers.js'), 'utf8');
const cloudTiers = fs.readFileSync(path.join(root, 'firebase/functions/tiers.js'), 'utf8');
const sot = fs.readFileSync(path.join(root, 'docs/core/01-SOURCE-OF-TRUTH.md'), 'utf8');

// Server and browser catalogs must remain synchronized for the shared package law.
for (const name of ['Wider reach','Area Scout','Match Alert','Save and Scout','Full Horizon','Extra Slots','Demand View','Showcase','Spotlight','Full Listing Desk']) {
  assert.ok(browserTiers.includes(name), `browser tier missing ${name}`);
  assert.ok(cloudTiers.includes(name), `server tier missing ${name}`);
}
for (const id of [3,4,5]) {
  assert.equal(serverTiers.seekerBoostPackage(id).pinBonus, 1, `seeker P${id} pin bonus`);
  assert.equal(serverTiers.ownerBoostPackage(id).pinBonus, 1, `owner P${id} pin bonus`);
}

// Critical repaired boundary: expired boosts must not remain entitled server-side.
const past = { active: true, package: 5, expiresAt: { seconds: Math.floor((Date.now() - 86_400_000) / 1000) } };
const future = { active: true, package: 5, expiresAt: { seconds: Math.floor((Date.now() + 86_400_000) / 1000) } };
assert.equal(serverTiers.resolveBoostPackageId(past), 0);
assert.equal(serverTiers.resolveBoostPackageId(future), 5);

// Pin capacity must combine tier + independently active P3/P4/P5 package pins.
assert.equal(serverTiers.maxPinsForAccount({ role: 'seeker', tierIndex: 3, seekerActivePackageIds: [3,4,5] }), 5);
assert.equal(serverTiers.maxPinsForAccount({ role: 'broker', tierIndex: 3, seekerActivePackageIds: [3,4,5], ownerActivePackageIds: [3,4,5] }), 9);

// SoT must explicitly record the synchronized/expiry-aware server boundary.
assert.ok(sot.includes('tier engine') || sot.includes('tier/entitlement'));
assert.ok(sot.includes('expired `expiresAt`') || sot.includes('expired Boost'));

console.log('Foundation Repair 04 tier/entitlement authority: PASS');
