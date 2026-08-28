# HomeFinder — Public Profile Projection

Status: **LIVING / SECURITY HARDENING**

## Boundary
`users/{uid}` is the authoritative private profile document. Public visitor/search surfaces must not read it directly.

Public discovery reads `publicProfiles/{uid}`, a server-maintained projection containing only fields deliberately exposed for discovery:

- firstName
- surname
- accountType
- avatarUrl
- publicEmail (only when the user opts in)
- verifiedBadge
- licensedBadge
- tierIndex
- searchable

No KYC documents, licence payloads, private phone data, payment state, subscription secrets, map state, pins, internal moderation fields, or other private profile fields belong in the projection.

## Authority
`firebase/functions/publicProfileProjection.js` owns the field projection. `syncPublicProfile` mirrors changes from `users/{uid}` in the named Firestore database `homefinder`. `publicProfiles/{uid}` is read-only to clients and written only through the Admin SDK.

## Migration
`js/profile/user-search.js` and `js/profile/visitor-profile.js` consume the projection. Phone uniqueness checks use the `checkPhoneAvailability` callable rather than pre-auth reads of `users`.

A one-time `firebase/functions/backfillPublicProfiles.js` script is provided for the initial projection population.

## Privacy behavior
`privacy.showBasicInfo === false` sets `searchable:false`. `privacy.showEmail === true` permits `publicEmail`; phone numbers are deliberately excluded from the public projection.
