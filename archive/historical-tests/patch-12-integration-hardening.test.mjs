import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const fn = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');
const tiers = fs.readFileSync(path.join(root, 'firebase/functions/tiers.js'), 'utf8');
const clientTiers = fs.readFileSync(path.join(root, 'js/tiers.js'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'docs/integrations/cloudflare/PRODUCTION-PAYPAL-CLOUDFLARE-CONTRACT.md'), 'utf8');
const sot = fs.readFileSync(path.join(root, 'docs/core/01-SOURCE-OF-TRUTH.md'), 'utf8');

// Listing capacity must use the user's organic tier and must not double-charge
// an active contract against the same canonical listing.
assert.match(fn, /collection\("tier"\)\.doc\(profile\.accountType\)/);
assert.match(fn, /totalListingCap\(packageId, boostDoc\.extraListings, tierIndex(?:, subscriptionEntitlement)?\)/);
assert.match(fn, /const slotsUsed = existingListingCount;/);
assert.doesNotMatch(fn, /const slotsUsed = existingListingCount \+ contractCountSnap\.data\(\)\.count;/);

// Server tier package catalog must remain aligned with the browser catalog.
for (const name of ['Wider reach','Area Scout','Match Alert','Save and Scout','Full Horizon','Extra Slots','Demand View','Showcase','Spotlight','Full Listing Desk']) {
  assert.ok(tiers.includes(name), `server tiers missing ${name}`);
  assert.ok(clientTiers.includes(name), `client tiers missing ${name}`);
}
assert.match(tiers, /pricePhp: 249\.99, listingBonus: 12/);
assert.match(clientTiers, /pricePhp: 249\.99, listingBonus: 12/);
assert.doesNotMatch(tiers, /pricePhp: 299\.99/);

// PayPal event ledger is claimed transactionally before side effects and only
// becomes processed after lifecycle work succeeds. Failed deliveries remain
// retryable instead of being permanently swallowed by a duplicate marker.
assert.match(fn, /db\.runTransaction\(async transaction =>/);
assert.match(fn, /transaction\.create\(eventRef/);
assert.match(fn, /status:"processing"/);
assert.match(fn, /status:"processed"/);
assert.match(fn, /status:"failed"/);

// Cloudflare remains DNS/edge only; no Worker is part of the contract.
assert.ok(contract.includes('Cloudflare is the **DNS/edge layer** for the custom domain.')); 
assert.ok(contract.includes('No Worker is part of the current HomeFinder architecture.')); 
assert.match(sot, /PATCH 11C-R8 — Production Payment \+ Edge Integration Freeze/);

console.log('patch-12-integration-hardening: PASS');
