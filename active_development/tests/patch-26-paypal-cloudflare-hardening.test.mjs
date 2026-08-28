import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const functions = read('firebase/functions/index.js');
const payment = read('js/payment-config.js');
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
console.log('Patch 26 PayPal + Cloudflare hardening contract: PASS');
