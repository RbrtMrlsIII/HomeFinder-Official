import fs from "node:fs";
import assert from "node:assert/strict";
const root = new URL("..", import.meta.url).pathname;
const read = p => fs.readFileSync(`${root}/${p}`, "utf8");
const ct = read("js/tiers.js"), st = read("firebase/functions/tiers.js"), pins = read("js/pins-model.js");
const pay = read("js/payment-config.js"), notif = read("js/profile/notifications.js");
const fn = read("firebase/functions/index.js");

for (const text of [ct, st]) {
  for (const id of [3,4,5]) assert.ok(new RegExp(`${id}:\\s*\\{[^\\n]*pinBonus:\\s*1`).test(text), `P${id} pinBonus`);
}
assert.ok(!ct.includes("Math.min(3, Math.max(1, n))"));
assert.ok(pins.includes("`${line}-${id}`"));
assert.ok(fn.includes("exports.relocateUserPin = onCall"));
assert.ok(fn.includes("exports.getPinEntitlement = onCall"));
assert.ok(fn.includes("exports.recordSubscriptionApproval = onCall"));
assert.ok(fn.includes("exports.paypalSubscriptionWebhook = onRequest"));
assert.ok(fn.includes("verifyPayPalWebhook"));
assert.ok(pay.includes("P-4NX50080BD8317322NKDAODA"));
assert.ok(notif.includes("subscription_activated"));
console.log("Patch 11C-R7 static checks passed.");
