import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const require = createRequire(import.meta.url);
const serverTiers = require(path.join(root, 'firebase/functions/tiers.js'));
const browser = fs.readFileSync(path.join(root, 'js/tiers.js'), 'utf8');
const functions = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');
const listingForm = fs.readFileSync(path.join(root, 'js/profile/listing-form.js'), 'utf8');
const perks = fs.readFileSync(path.join(root, 'js/profile/perks.js'), 'utf8');
const active = { active: true, startsAt: { seconds: Math.floor((Date.now() - 3600_000) / 1000) }, endsAt: { seconds: Math.floor((Date.now() + 3600_000) / 1000) } };
const expired = { active: true, endsAt: { seconds: Math.floor((Date.now() - 3600_000) / 1000) } };
const future = { active: true, startsAt: { seconds: Math.floor((Date.now() + 3600_000) / 1000) }, endsAt: { seconds: Math.floor((Date.now() + 7200_000) / 1000) } };

assert.equal(serverTiers.isSubscriptionEntitlementActive(active), true);
assert.equal(serverTiers.isSubscriptionEntitlementActive(expired), false);
assert.equal(serverTiers.isSubscriptionEntitlementActive(future), false);
assert.equal(serverTiers.totalListingCap(0, null, 0, active), Infinity);
assert.equal(Number.isFinite(serverTiers.totalListingCap(0, null, 0, expired)), true);
assert.match(browser, /isSubscriptionEntitlementActive/);
assert.match(functions, /subscriptionEntitlements/);
assert.match(functions, /totalListingCap\(packageId, boostDoc\.extraListings, tierIndex, subscriptionEntitlement\)/);
assert.match(functions, /deactivateSubscriptionEntitlement/);
assert.match(listingForm, /subscriptionEntitlements/);
assert.match(perks, /subscriptionEntitlements/);
console.log('Foundation Repair 05 subscription entitlement/capacity authority: PASS');
