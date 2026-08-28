import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sot = fs.readFileSync(path.join(root, 'docs/01-SOURCE-OF-TRUTH.md'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'docs/integrations/cloudflare/PRODUCTION-PAYPAL-CLOUDFLARE-CONTRACT.md'), 'utf8');
const functions = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');
const payment = fs.readFileSync(path.join(root, 'js/payment-config.js'), 'utf8');

assert.match(sot, /Production payment|PayPal|Cloudflare|integrations/i);
assert.match(contract, /PAYPAL_SUBSCRIPTION_CLIENT_SECRET/);
assert.match(contract, /PAYPAL_SUBSCRIPTION_WEBHOOK_ID/);
assert.match(contract, /Cloudflare is the \*\*DNS\/edge layer\*\*/);
assert.match(functions, /paypalSubscriptionWebhook/);
assert.match(functions, /verifyPayPalWebhook/);
assert.match(functions, /paypalWebhookEvents/);
assert.match(payment, /PAYPAL_SUBSCRIPTION_PLAN_ID/);

// Secrets must only be named server-side; the client config may not contain them.
assert.doesNotMatch(payment, /PAYPAL_SUBSCRIPTION_CLIENT_SECRET|PAYPAL_SUBSCRIPTION_WEBHOOK_ID/);

console.log('paypal-cloudflare-contract: PASS');
