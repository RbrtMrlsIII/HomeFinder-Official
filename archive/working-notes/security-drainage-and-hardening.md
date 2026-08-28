# HomeFinder — Security Drainage & Hardening Queue

Status: **LIVING / ADJUSTABLE**

## Source-level secret hygiene
The active source contains no private-key PEM material, JWT literals, GitHub-style personal tokens, Supabase service-role values, PayPal subscription client-secret values, or webhook-secret values. Firebase browser configuration contains a Firebase `apiKey`, which is client configuration by design; it is not a service-role credential.

Server-side secrets remain referenced through Firebase Secret Manager / environment configuration. The active browser code does not contain the service-role credential itself.

## High-priority privacy finding
Firestore currently grants `users/{uid}` public read access. The client contains `js/profile/user-search.js`, which reads up to 400 user documents and extracts `email`, `idVerification`, `brokerLicense`, `accountType`, `avatarUrl`, and tier-related fields. This is broader than a normal public-profile surface and should be treated as a **high-priority privacy hardening gap**.

### Preferred repair
Create a dedicated `publicProfiles/{uid}` projection containing only fields intentionally public, migrate visitor/search UI to that projection, then reduce `users/{uid}` reads to owner/admin or other explicitly authorized roles. Do not simply change the rule to signed-in-only without reconciling visitor-profile behavior.

## Medium-priority configuration finding
`config/{docId}` is publicly readable. That may be correct for public disclaimers/reference configuration, but it should be split or allowlisted if the collection later contains operational settings. Public configuration must never become a secret store.

## Authority checks
The restored security boundary remains structurally sound: operations roles are separated, KYC authority is server-side, payment entitlement writes are server-authoritative, and camera/3D presentation remains non-authoritative.

## Runtime verification still required
Source-level cleanliness does not prove deployed Firestore rules, Cloud Functions, Supabase Edge Functions, PayPal webhook registration, Cloudflare configuration, or production secret storage. These remain deployment gates.
