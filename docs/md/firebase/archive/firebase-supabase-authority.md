# Firebase ↔ Supabase authority alignment

## Current target

- Firebase Auth is the identity authority.
- `canonicalRole` is the application role authority.
- Firebase Firestore uses the named `homefinder` database.
- `propertyListings` and `wantedListings` are the canonical listing collections.
- `properties` is retired.
- Supabase Storage is a critical backend boundary.
- KYC authorization is defined by `docs/json/firebase/kyc-authorization.json`.

## Applied in this checkpoint

1. Added a machine-readable backend integration authority.
2. Added a machine-readable storage authority.
3. Added shared Supabase Firebase-token verification and Firestore service-account readers.
4. Aligned Firebase and Supabase KYC signed-URL authorization to `canonicalRole` plus the explicit bootstrap admin authority.
5. Added KYC submission role enforcement.
6. Made `brokerLicense` canonical for broker KYC writes; `license` is no longer dual-written.
7. Routed listing-image writes through a trusted Supabase Edge Function instead of direct browser storage writes with the anon key.
8. Added Supabase configuration and repository-controlled bucket state.
9. Added canonical integration verification.
10. Updated Firebase callable role decisions to normalize through the canonical role vocabulary.
11. Updated the primary frontend marketplace/profile role consumers to resolve `canonicalRole` first.
12. Removed stale `(default)` Firestore wording.

## Deliberate remaining boundary

Live Supabase bucket/RLS policy state has not been represented as "verified" merely because repository files exist. It must be compared against `storage-authority.json` using the connected Supabase environment before the storage migration is considered deployed-complete.

The bootstrap admin UID is intentionally retained as an emergency/bootstrap authority. It is explicit in the KYC contract and shared by both implementations; it is not treated as the normal role source.

## Verification

The canonical `verify/` integration tests must pass before this checkpoint is considered structurally valid.
