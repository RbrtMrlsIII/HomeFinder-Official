import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSubscriptionRequest } from '../js/subscription-request.js';
import { PAYPAL_SUBSCRIPTION_PLAN_ID } from '../js/payment-config.js';

test('the subscription request carries the plan and binds the signed-in uid as custom_id', () => {
  assert.deepEqual(buildSubscriptionRequest('uid_123'), { plan_id: PAYPAL_SUBSCRIPTION_PLAN_ID, custom_id: 'uid_123' });
});

test('a missing, blank or over-long uid is refused (PayPal allows 127 characters)', () => {
  for (const bad of [undefined, null, '', '   ', 'x'.repeat(128)]) {
    assert.throws(() => buildSubscriptionRequest(bad), /signed-in account/);
  }
  assert.equal(buildSubscriptionRequest('x'.repeat(127)).custom_id.length, 127);
});

test('js/subscription.js creates the subscription through the helper with the signed-in uid', () => {
  const src = readFileSync(new URL('../js/subscription.js', import.meta.url), 'utf8');
  assert.match(src, /import \{ buildSubscriptionRequest \} from "\.\/subscription-request\.js";/);
  assert.match(src, /actions\.subscription\.create\(buildSubscriptionRequest\(user\.uid\)\)/);
  assert.doesNotMatch(src, /actions\.subscription\.create\(\{\s*plan_id/, 'the plan-only request would drop custom_id');
});
