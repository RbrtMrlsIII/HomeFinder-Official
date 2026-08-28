# Registration and Suspension Hardening — 2026-08-23

## Phone boundary

HomeFinder now uses exactly 12 ASCII digits for Philippine mobile identities in canonical `639XXXXXXXXX` form. Local `09XXXXXXXXX` input is normalized to that form before persistence. Firestore independently enforces the same boundary for `users/{uid}` and `phoneIndex/{digits}`.

Phone-index uniqueness is **not** treated as proof of possession. A future/active Phone Auth linking flow must establish possession before a phone is labeled verified.

## Registration anti-abuse

A strict two-accounts-per-IP rule is **not falsely implemented in client code**. Direct Firebase Authentication account creation cannot be reliably constrained by a Firestore rule because the Auth endpoint is outside Firestore's rule engine.

Spark-safe baseline:
- Firebase Authentication built-in abuse controls and quotas remain active.
- UI re-entrancy is blocked.
- All persisted identity fields have server-side bounds.
- Phone uniqueness is enforced independently.
- The recommended hard IP velocity layer is an edge/server gate (e.g. a CAPTCHA/risk-aware proxy) if a true per-IP registration cap becomes a product requirement.

## Suspension

Admin suspension is now modeled as:
`users/{uid}.suspended` → trusted `syncUserSuspension` → Firebase Auth `disabled`.

Sensitive callable operations use `requireActiveUser` as defense in depth so an already-issued token cannot continue through those operations after the Firestore suspension state becomes active.

## Important deployment note

The Auth synchronization and callable guard are backend code. They only become runtime controls after the Firebase Functions deployment is active. The repository must not describe them as live merely because the source exists.

## Phone possession boundary

Client profile edits no longer create or overwrite `phoneIndex`. The index is now reserved by the trusted `claimVerifiedPhone` callable only when the Firebase Auth ID token contains a verified Philippine phone number. This separates **phone uniqueness** from **phone possession** and prevents arbitrary-number reservation by a direct Firestore client.
