# HomeFinder Production Payment + Edge Contract

**Revision:** 2026-08-21 — Patch 26 hardening freeze
**Status:** Canonical deployment contract
**Authority:** `docs/core/01-SOURCE-OF-TRUTH.md`

This document freezes the PayPal and Cloudflare integration boundaries so later UI/features cannot silently replace payment truth, expose secrets, or invent edge configuration.

## 1. PayPal — authoritative boundaries

### 1.1 Client-side values

The browser may contain **PayPal client IDs**, hosted-button IDs, currency, and the public subscription plan ID needed by the PayPal JS SDK.

The browser MUST NOT contain:

- PayPal client secrets
- webhook IDs treated as secrets
- OAuth access tokens
- payment approval authority
- boost/subscription entitlement authority

### 1.2 Subscription

Canonical configuration currently implemented in the R7 build:

- setup fee: PHP 499.99
- free period after setup: 3 months
- annual billing: PHP 4,999.99
- PayPal plan: `P-4NX50080BD8317322NKDAODA`
- client-side approval: `recordSubscriptionApproval`
- server-side provider lookup: PayPal Billing Subscriptions API
- webhook: `paypalSubscriptionWebhook`
- webhook signature verification: required before event processing
- event idempotency: `paypalWebhookEvents/{eventId}`

The following values are intentionally deployment secrets and MUST be supplied through Firebase Secret Manager:

```text
PAYPAL_SUBSCRIPTION_CLIENT_SECRET
PAYPAL_SUBSCRIPTION_WEBHOOK_ID
```

The repository must never contain either secret value.

### 1.3 Subscription lifecycle

The server is the source of truth for subscription state. Client `onApprove` only starts server verification.

The webhook is the lifecycle truth for provider events. Duplicate event IDs must be ignored safely.

Supported lifecycle states/events in the current implementation include:

- activated
- payment completed/received
- payment failed
- cancelled
- suspended
- expired

Grace period, refund, chargeback, and cancellation-effective-date rules remain product decisions and must not be fabricated in code until explicitly approved in the SoT.

### 1.4 Boost hosted buttons

Listing/Seeking Boost purchases currently use PayPal Hosted Buttons and create a local `boostOrders` record before checkout.

**Important:** hosted-button payment confirmation is NOT considered an entitlement grant. The current flow deliberately leaves the order pending until trusted archive/checkpoints/staff processing is available.

A future automatic Boost webhook may be added only after the PayPal merchant event-to-package mapping is specified and tested. It must not infer package ownership from UI state.

### 1.5 Entitlement rule

No PayPal browser callback may directly write:

- `boosts/{uid}` entitlement state
- tier state
- listing capacity overrides
- pin capacity
- subscription authority

Those values must be produced by trusted server logic.

---

## 2. Cloudflare — authoritative boundaries

Cloudflare is the **DNS/edge layer** for the custom domain. Firebase Hosting remains the application hosting layer unless the SoT is explicitly changed.

Canonical path:

```text
User
  ↓
Cloudflare DNS / edge
  ↓
Firebase Hosting
  ↓
Firebase Auth / Firestore / Functions
```

Cloudflare MUST NOT become a second application data authority.

### 2.1 DNS

The exact domain and Firebase Hosting target are environment-specific and must be filled in during deployment. Do not commit guessed records.

Required production checklist:

1. Add the custom domain in Firebase Hosting.
2. Record the exact DNS records Firebase provides.
3. Create those records in Cloudflare DNS.
4. Keep the Firebase-provided archive/checkpoints/ownership record exactly as issued.
5. Confirm HTTPS certificate issuance in Firebase Hosting.
6. Confirm the public domain resolves to Firebase Hosting.
7. Test Auth, Firestore, Functions, PayPal return/checkout pages, and map assets from the custom domain.

### 2.2 Proxy/SSL rule

Do not enable a Cloudflare proxy mode or SSL mode by guesswork.

The production choice must be recorded after the Firebase custom-domain setup is known. Any Cloudflare change that alters TLS termination or origin routing must be tested against Firebase Hosting before release.

### 2.3 Cloudflare Workers

No Worker is part of the current HomeFinder architecture.

Do not introduce a Worker merely to proxy Firebase Functions or PayPal unless a concrete requirement is approved in the SoT. A Worker would otherwise create an unnecessary second edge/API layer.

### 2.4 Turnstile

Turnstile is optional anti-abuse infrastructure, not part of payment authority.

If enabled later, its secret must be server-side and its verification must happen in trusted backend code. It must never be used as a replacement for Firestore rules, Firebase Auth, PayPal verification, or entitlement checks.

---

## 3. Production gates

The following are **external deployment gates**, not missing code:

### PayPal

- [ ] Live PayPal application confirmed
- [ ] Live client ID confirmed against `js/payment-config.js`
- [ ] Live client secret stored in Firebase Secret Manager
- [ ] Live webhook registered
- [ ] Live webhook ID stored as `PAYPAL_SUBSCRIPTION_WEBHOOK_ID`
- [ ] PayPal sends to the deployed `paypalSubscriptionWebhook` endpoint
- [ ] Sandbox end-to-end test passed
- [ ] Duplicate webhook test passed
- [ ] failed/cancelled/suspended/expired lifecycle tests passed

### Cloudflare

- [ ] Production domain selected
- [ ] Firebase Hosting custom domain added
- [ ] Firebase DNS records copied exactly
- [ ] Cloudflare DNS records created
- [ ] HTTPS certificate active
- [ ] DNS propagation verified
- [ ] no unintended Worker/proxy introduced
- [ ] Auth + Firestore + Functions + PayPal checkout tested on final domain

Until these boxes are complete, the application is **staging-ready, not production-ready**.

---

## 4. Patch 26 hardening rules

### 4.1 PayPal/provider vs Admin smoke-test precedence

The two states remain intentionally separate:

- `users/{uid}.subscription` + `paypalSubscriptions/{subscriptionId}` represent real provider state verified by trusted backend code.
- `subscriptionAdminGrants/{uid}` + `subscriptionEntitlements/{uid}` represent an explicit Admin smoke-test entitlement only.

Until a later patch introduces a single effective-entitlement reader, no feature may assume that either document is a universal replacement for the other. When an effective reader is introduced, the precedence must be:

1. valid real PayPal provider state;
2. explicit Admin smoke-test entitlement only when the feature is running in smoke-test mode;
3. otherwise no premium entitlement.

An Admin grant must never overwrite, impersonate, or relabel real PayPal state.

### 4.2 Webhook retry safety

A webhook event may be retried when its ledger record is stale in `processing` state. A recent `processing` event is treated as in-flight; a `processed` event is permanently idempotent.

### 4.3 Account binding

A browser approval callback may identify the provider subscription, but it does not receive entitlement authority. Where PayPal and Firebase both expose subscriber email, the trusted callback requires a case-insensitive match before associating the provider subscription with the signed-in account.

## 4. Change-control rule

Future patches MUST preserve this contract.

If a future patch changes PayPal, Cloudflare, subscription, Boost payment verification, DNS, TLS, or edge routing, it must:

1. update `docs/core/01-SOURCE-OF-TRUTH.md` first;
2. update this contract;
3. add/adjust verification tests;
4. update the patch implementation notes;
5. package the full project again.

A UI-only patch must not rewrite payment authority or deployment configuration.
