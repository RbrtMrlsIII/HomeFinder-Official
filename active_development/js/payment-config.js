/* ================================ */
/*  PAYMENT CONFIG — PayPal only    */
/* ================================ */
/*
 * Hosted Buttons (client-side). Payment is collected by PayPal.
 *
 * ACTIVATION (source_of_truth):
 *   Boost runs 30 days from confirmed payment.
 *   TODAY: record boostOrders/{id} status "pending_payment" when user opens checkout.
 *   BOOSTS: Hosted Button payment is intentionally NOT an entitlement grant.
 *   The order remains pending until trusted payment archive/checkpoints/staff approval.
 *   Subscription uses the separate server-verified PayPal flow in js/subscription.js.
 *
 * Do NOT grant boosts from the browser alone in production.
 */

/** PayPal JS SDK client id (hosted-buttons). Safe in frontend. */
export const PAYPAL_CLIENT_ID =
    "BAAF6C95lNkTlz9ueeOGYR9OhW5v3WZ3QLSppRKHsaefc0nUXNS41yMWPXVBAFZminarzwm3QR7CaJNeKI";

export const PAYPAL_CURRENCY = "PHP";

export const PAYPAL_SUBSCRIPTION_CLIENT_ID =
    "BAA6Y8Yb5zT6fLFzVn9rppFPodYyjfzqbekfstZaii2zz4B6jb0EKlHp56JMkq52k4JAGzI2hZRyQQWRx4";
export const PAYPAL_SUBSCRIPTION_PLAN_ID = "P-4NX50080BD8317322NKDAODA";
export const PAYPAL_SUBSCRIPTION_SETUP_FEE_PHP = 499.99;
export const PAYPAL_SUBSCRIPTION_FREE_MONTHS = 3;
export const PAYPAL_SUBSCRIPTION_ANNUAL_PHP = 4999.99;
export const PAYPAL_SDK_URL =
    `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=${PAYPAL_CURRENCY}`;

export const BOOST_DURATION_DAYS = 30;

/** Single SDK load promise */
let _paypalSdkPromise = null;
export function loadPayPalSdk() {
    if (typeof window !== "undefined" && window.paypal?.HostedButtons) {
        return Promise.resolve(window.paypal);
    }
    if (_paypalSdkPromise) return _paypalSdkPromise;
    _paypalSdkPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector("script[data-paypal-sdk]");
        if (existing) {
            existing.addEventListener("load", () => resolve(window.paypal));
            existing.addEventListener("error", reject);
            return;
        }
        const s = document.createElement("script");
        s.src = PAYPAL_SDK_URL;
        s.async = true;
        s.dataset.paypalSdk = "1";
        s.onload = () => resolve(window.paypal);
        s.onerror = () => reject(new Error("PayPal SDK failed to load"));
        document.head.appendChild(s);
    });
    return _paypalSdkPromise;
}

/**
 * PayPal Hosted Button map — labels match merchant dashboard.
 * kind: seeker | owner  · packageId: 1–5
 */
export const PAYPAL_HOSTED_BUTTONS = {
    seeker: {
        1: { hostedButtonId: "SJTLGMQXJGWL8", label: "Wider reach", pricePhp: 49.99 },
        2: { hostedButtonId: "JDZJJ37HXXMK6", label: "Area Scout", pricePhp: 99.99 },
        3: { hostedButtonId: "QGSLU44XQ73SQ", label: "Match Alert", pricePhp: 149.99 },
        4: { hostedButtonId: "UCWDG7FCTYF32", label: "Save and Scout", pricePhp: 199.99 },
        5: { hostedButtonId: "B52F86UHCYV3U", label: "Full Horizon", pricePhp: 249.99 }
    },
    owner: {
        1: { hostedButtonId: "W8MEMV224E8EG", label: "Extra Slots", pricePhp: 49.99 },
        2: { hostedButtonId: "HD3JP2D5FTLEJ", label: "Demand View", pricePhp: 99.99 },
        3: { hostedButtonId: "WM38F4893FGA2", label: "Showcase", pricePhp: 149.99 },
        4: { hostedButtonId: "Q6Z7QKSH388Q6", label: "Spotlight", pricePhp: 199.99 },
        5: { hostedButtonId: "H7AD7TTMXLT2C", label: "Full Listing Desk", pricePhp: 249.99 }
    }
};

/** Listing help (Need Help?) — ₱99.99 fixed SoT §27 */
export const LISTING_HELP_BUTTON = {
    hostedButtonId: "Y3NZNSJYJ2Y24",
    label: "Ask For Help",
    pricePhp: 99.99,
    productName: "Need Help?"
};

export function paypalButtonFor(kind, packageId) {
    const row = PAYPAL_HOSTED_BUTTONS[kind]?.[Number(packageId)];
    return row || null;
}

export function formatPhp(n) {
    return "₱" + Number(n).toFixed(2);
}

/** @deprecated BPI removed — PayPal only */
export const PAYMENT_METHODS = [{ id: "paypal", label: "PayPal" }];
