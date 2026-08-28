# HomeFinder Phase 10 — Public Profile Projection + Responsive Matrix

Status: LIVING / REPAIR-AS-BUILD
Date: 2026-08-23

## Public profile migration
Visitor/search surfaces now read `publicProfiles/{uid}` instead of the full `users/{uid}` document. The projection is server-maintained from the named Firestore database `homefinder`; client writes are denied.

Public projection fields are deliberately minimized to: `firstName`, `surname`, `accountType`, `avatarUrl`, optional `publicEmail`, `verifiedBadge`, `licensedBadge`, `tierIndex`, `searchable`, and `updatedAt`. KYC payloads, license payloads, phone numbers, map/pin state, payment/subscription state, and internal moderation fields are excluded.

`users/{uid}` reads are now limited to owner/admin. `phoneIndex` reads are owner-only, and pre-auth phone uniqueness uses the `checkPhoneAvailability` callable instead of a public `users` scan.

A one-time `firebase/functions/backfillPublicProfiles.js` script exists for initial projection population. Deployment is still required before runtime parity can be claimed.

## Responsive matrix
The matrix contains 72 source-level cases: 12 routes × 6 states (mobile portrait, mobile landscape, tablet, desktop, wide desktop, reduced motion). All 12 routes have viewport metadata and linked responsive media-query coverage; reduced-motion support is present in the active CSS theme/cinematic root.

A Chromium runtime attempt was made, but Firebase/remote SDK initialization kept local pages alive beyond the bounded headless window. Runtime browser passes are therefore **NOT CLAIMED**. The recorded matrix is source-verified and ready for a real connected browser/device harness.

## Security / secret hygiene
Static credential-shaped scan: zero embedded private-key/JWT/service-role/PayPal-secret values. Identifier-only references to `service_role` remain in comments/config names and are not secrets.

The remaining known security concern is public readability of `config/{docId}`, which must stay allowlisted and non-sensitive.

## Theme state
The active source contains no `dark/light` UI-mode traces (`data-theme`, `hf_theme`, `prefers-color-scheme`, light/dark theme assets). Historical source-review material is retained only as sealed forensic evidence.

## Tests
Public-profile projection test PASS. Restored authority tests PASS: Foundation Repair 01, Patch 22, Auth/Roles/Permissions, role subscription path, Patch 25, Patch 53, PayPal/Cloudflare, UI response mapping, physical UI mapping, and theme lighting/performance budget.

## Next gate
Deploy/verify the projection trigger + backfill, then run the responsive matrix in a browser/device harness with Firebase and 3D dependencies available. Camera tuning continues only against the living matrix and security boundary.
