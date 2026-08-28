# HomeFinder — Payments, Firebase, Cloudflare & External Integrations

## Firebase

Firebase/Cloud Functions are authoritative for trusted server mutations, permissions, event ledgers, and protected projections. Client UI must not impersonate server authority.

## PayPal

The project preserves the hardened payment boundary:

1. valid real PayPal provider state;
2. explicit Admin smoke-test entitlement only when the feature is in smoke-test mode;
3. otherwise no premium entitlement.

Admin smoke-test state must never overwrite or impersonate real provider state.

Webhook handling is retry-safe: events move through processing/processed/failed states and are protected against duplicate concurrent side effects.

A browser approval callback may identify a provider subscription but does not itself grant entitlement authority. Provider/account identity must be bound to the signed-in HomeFinder account.

## Cloudflare

The current project does not treat an invented Cloudflare Worker as authoritative. Documentation may describe a recovery gate, but an executable Worker source is required before production routing is changed.

No DNS/TLS/Worker value may be guessed or invented.

## Maps and external UI libraries

MapLibre and icon libraries remain presentation/integration dependencies. They do not become business-data authorities.

## Payment change protocol

A change to PayPal, Cloudflare, subscription, Boost payment verification, DNS, TLS, or edge routing must update the canonical contract, verification tests, implementation record, and packaged project together.

## Production boundary

Live secrets, webhook registration, deployment, DNS, TLS, and end-to-end provider tests remain production gates and must not be faked in documentation.
