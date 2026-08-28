import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const functions = read('firebase/functions/index.js');
const payment = read('js/payment-config.js');
const contract = read('docs/integrations/cloudflare/PRODUCTION-PAYPAL-CLOUDFLARE-CONTRACT.md');
const checklist = read('docs/integrations/cloudflare/PRODUCTION-CHECKLIST.md');
const sot = read('docs/core/01-SOURCE-OF-TRUTH.md');
const next = read('docs/patches/PATCH-26-PAYPAL-CLOUDFLARE-HARDENING.md');

assert.match(functions, /PAYPAL_SUBSCRIPTION_CLIENT_SECRET/);
assert.match(functions, /PAYPAL_SUBSCRIPTION_WEBHOOK_ID/);
assert.match(functions, /PayPal subscription identity mismatch/);
assert.match(functions, /paypalPayerId/);
assert.match(functions, /subscriber does not match the signed-in HomeFinder account/);
assert.match(functions, /processingStartedAt/);
assert.match(functions, /10 \* 60 \* 1000/);
assert.match(functions, /Invalid event id/);
assert.match(functions, /verifyPayPalWebhook/);
assert.match(functions, /paypalWebhookEvents/);

assert.doesNotMatch(payment, /PAYPAL_SUBSCRIPTION_CLIENT_SECRET|PAYPAL_SUBSCRIPTION_WEBHOOK_ID/);
assert.match(contract, /Patch 26 hardening rules/);
assert.match(contract, /valid real PayPal provider state/);
assert.match(contract, /explicit Admin smoke-test entitlement/);
assert.match(contract, /No Worker is part of the current HomeFinder architecture/);
assert.match(checklist, /No unapproved Worker route exists/);
assert.match(checklist, /PAYPAL_SUBSCRIPTION_CLIENT_SECRET/);
assert.match(checklist, /PAYPAL_SUBSCRIPTION_WEBHOOK_ID/);
assert.match(sot, /Patch 26 — PayPal \+ Cloudflare hardening freeze/);
assert.match(next, /Patch 26/);

console.log('Patch 26 PayPal + Cloudflare hardening contract: PASS');
