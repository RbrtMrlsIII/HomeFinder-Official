/* PayPal subscription integration. Entitlement is server/webhook authoritative. */
import { app } from "./firebase.js";
import { authReady } from "./session.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import {
  PAYPAL_SUBSCRIPTION_CLIENT_ID, PAYPAL_SUBSCRIPTION_PLAN_ID,
  PAYPAL_SUBSCRIPTION_SETUP_FEE_PHP, PAYPAL_SUBSCRIPTION_FREE_MONTHS,
  PAYPAL_SUBSCRIPTION_ANNUAL_PHP
} from "./payment-config.js";

const functions = getFunctions(app);
const recordSubscriptionApproval = httpsCallable(functions, "recordSubscriptionApproval");

export const SUBSCRIPTION_COMMERCIAL_LAW = Object.freeze({
  setupFeePhp: PAYPAL_SUBSCRIPTION_SETUP_FEE_PHP,
  freeMonthsAfterSetup: PAYPAL_SUBSCRIPTION_FREE_MONTHS,
  annualPhp: PAYPAL_SUBSCRIPTION_ANNUAL_PHP,
  planId: PAYPAL_SUBSCRIPTION_PLAN_ID
});

export async function mountSubscriptionButton(containerSelector) {
  const user = await authReady.catch(() => null);
  if (!user?.uid) throw new Error("Sign in before subscribing.");
  const mount = document.querySelector(containerSelector);
  if (!mount) throw new Error(`Subscription mount not found: ${containerSelector}`);

  if (!window.paypal?.Buttons) {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_SUBSCRIPTION_CLIENT_ID)}&vault=true&intent=subscription`;
    script.dataset.homefinderSubscriptionSdk = "1";
    await new Promise((resolve, reject) => {
      script.onload = resolve; script.onerror = () => reject(new Error("PayPal subscription SDK failed"));
      document.head.appendChild(script);
    });
  }

  mount.innerHTML = "";
  return window.paypal.Buttons({
    style: { shape:"rect", color:"gold", layout:"vertical", label:"subscribe" },
    createSubscription(data, actions) {
      return actions.subscription.create({ plan_id: PAYPAL_SUBSCRIPTION_PLAN_ID });
    },
    async onApprove(data) {
      const result = await recordSubscriptionApproval({
        subscriptionId: data.subscriptionID,
        planId: PAYPAL_SUBSCRIPTION_PLAN_ID
      });
      mount.dispatchEvent(new CustomEvent("homefinder:subscription-status", {
        bubbles:true, detail:{status:result?.data?.status || "pending_verification", subscriptionId:data.subscriptionID}
      }));
    },
    onCancel() {
      mount.dispatchEvent(new CustomEvent("homefinder:subscription-status", {bubbles:true, detail:{status:"cancelled"}}));
    },
    onError(err) {
      console.error("PayPal subscription error", err);
      mount.dispatchEvent(new CustomEvent("homefinder:subscription-status", {bubbles:true, detail:{status:"error"}}));
    }
  }).render(containerSelector);
}
