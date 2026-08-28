# Public Read-Surface Hardening

Status: LIVING / HARDENED BASELINE

## Public reads retained

- `publicProfiles/{uid}` is intentionally public and is the only broad public identity projection.
- `config/govDisclaimers` is public because it contains published government disclaimer copy.
- `govHousingPosts` and public marketplace content remain public according to their content contracts.
- `userRatings` remains public by current product design; the raw rating document still includes `fromUid` and should be treated as a future privacy-hardening candidate.

## Private reads

- `users/{uid}` is owner/admin-readable by rule.
- KYC, payment, subscription, map-state, and other authoritative fields remain in private authoritative documents.
- Conversation peer data is retrieved through an authorization-checked callable rather than direct cross-user `users/{uid}` reads.

## Hardening changes

- `config/{docId}` is allowlisted to `govDisclaimers` for public reads and writes.
- Public profile search filters out `searchable:false` projections.
- Backfill tooling can prune orphaned projections during an operational cleanup.

## Residual review

The next privacy review should decide whether `userRatings` needs a public projection so `fromUid` never crosses the client boundary.
