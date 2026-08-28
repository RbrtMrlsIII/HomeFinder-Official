# Patch 26 — PayPal + Cloudflare Hardening

**Status:** Implemented in the Patch 26 package.

## Objective

Harden the payment/edge boundary before the next major UI/UX phase. This patch does not introduce a Cloudflare Worker and does not move application authority away from Firebase.

## PayPal hardening

- PayPal subscription client IDs and plan IDs remain public browser configuration.
- PayPal client secret and webhook ID remain Firebase Secret Manager values only.
- Server-side subscription lookup now validates the returned PayPal subscription identity.
- Browser approval cannot attach a PayPal subscription to a different Firebase account when both provider and Firebase expose subscriber email; mismatches are rejected.
- PayPal payer ID is persisted only as provider metadata for trusted server reconciliation.
- Webhook event IDs are validated before being used as Firestore document IDs.
- Webhook idempotency now distinguishes `processed`, active `processing`, and stale `processing` records. A stale processing record (>10 minutes) can be safely retried instead of becoming permanently stuck.
- Webhook signature verification remains mandatory before event processing.
- Entitlement authority remains server-side; browser callbacks never directly grant subscription benefits.

## Cloudflare hardening

- Cloudflare remains DNS/edge only.
- Firebase Hosting remains the application host.
- No Worker is introduced.
- No Cloudflare configuration is guessed or committed without the actual production Firebase custom-domain records.
- Production DNS/TLS verification remains a deployment gate.

## Verification

The package includes contract tests covering:

1. PayPal secret separation.
2. Webhook verification and idempotency.
3. stale webhook retry recovery.
4. subscription identity/account binding.
5. Cloudflare's no-Worker boundary.
6. Firebase-only entitlement authority.

## Explicit non-goals

- No live PayPal credentials are added.
- No webhook secret is added to source control.
- No Cloudflare Worker is deployed.
- No production DNS record is invented.
- No automatic Boost payment entitlement is introduced.
