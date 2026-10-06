/* The PayPal subscription request. Free of browser imports so Node tests can load it. */
import { PAYPAL_SUBSCRIPTION_PLAN_ID } from "./payment-config.js";

/**
 * custom_id ties the PayPal subscription to the signed-in HomeFinder account at creation.
 * PayPal returns it unchanged and recordSubscriptionApproval accepts it as proof of account
 * ownership, so the PayPal email no longer has to match the HomeFinder email.
 * PayPal allows at most 127 characters.
 */
export function buildSubscriptionRequest(uid) {
  const id = String(uid || "").trim();
  if (!id || id.length > 127) throw new Error("A signed-in account is required to subscribe.");
  return { plan_id: PAYPAL_SUBSCRIPTION_PLAN_ID, custom_id: id };
}
