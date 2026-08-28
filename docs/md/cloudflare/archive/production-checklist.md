# HomeFinder Production Edge Checklist

This is the deployment checklist for the PayPal + Cloudflare boundary. It is intentionally operational: it does not invent domain names, DNS targets, proxy modes, or Worker code.

## Firebase Hosting

- [ ] Production custom domain is added in Firebase Hosting.
- [ ] Firebase provides the exact DNS/verification records.
- [ ] Those exact records are copied to Cloudflare DNS.
- [ ] Firebase HTTPS certificate is active.
- [ ] Final-domain Auth, Firestore, Functions and PayPal checkout paths are tested.

## Cloudflare

- [ ] DNS records match Firebase's issued records exactly.
- [ ] No unapproved Worker route exists.
- [ ] No Worker is required by the current architecture.
- [ ] Proxy/TLS settings are recorded only after Firebase custom-domain verification.
- [ ] No Cloudflare rule rewrites or blocks Firebase Functions/PayPal endpoints unexpectedly.
- [ ] DNS propagation is verified from multiple networks before production sign-off.

## PayPal

- [ ] Live PayPal client ID matches the deployed public configuration.
- [ ] `PAYPAL_SUBSCRIPTION_CLIENT_SECRET` exists only in Firebase Secret Manager.
- [ ] `PAYPAL_SUBSCRIPTION_WEBHOOK_ID` exists only in Firebase Secret Manager.
- [ ] Live webhook targets the deployed `paypalSubscriptionWebhook` function.
- [ ] Webhook signature verification succeeds.
- [ ] Duplicate event delivery is idempotent.
- [ ] Failed/cancelled/suspended/expired lifecycle events are observed and handled.
- [ ] Sandbox end-to-end test has passed before live-money testing.

## Authority rule

Cloudflare never becomes the data authority. PayPal never becomes the direct client-side entitlement authority. Firebase trusted backend + Firestore remain the application authority.
