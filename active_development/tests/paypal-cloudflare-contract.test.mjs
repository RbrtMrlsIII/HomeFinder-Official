import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const functions = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');
const payment = fs.readFileSync(path.join(root, 'js/payment-config.js'), 'utf8');
assert.match(functions, /paypalSubscriptionWebhook/);
assert.match(functions, /verifyPayPalWebhook/);
assert.match(functions, /paypalWebhookEvents/);
assert.match(payment, /PAYPAL_SUBSCRIPTION_PLAN_ID/);

// Secrets must only be named server-side; the client config may not contain them.
assert.doesNotMatch(payment, /PAYPAL_SUBSCRIPTION_CLIENT_SECRET|PAYPAL_SUBSCRIPTION_WEBHOOK_ID/);

console.log('paypal-cloudflare-contract: PASS');
