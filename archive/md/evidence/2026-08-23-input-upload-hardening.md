# HomeFinder — Input and Upload Hardening Checkpoint

## Implemented

### Profile/mobile input
- Client mobile field capped at 24 formatting characters.
- Client mobile validation requires 10–15 digits.
- Firestore `users/{uid}` profile writes now enforce bounded string lengths/types for common identity fields.
- `phoneIndex` identifiers are restricted to exactly 10–15 ASCII digits.
- Client registration no longer seeds `previousAccountType`; historical role provenance is not client-controlled.

### Supabase listing/KYC images
- Canonical storage paths remain `.jpg`.
- Browser listing uploads continue through `upload-listing-image`; there is no direct browser Storage write.
- Listing uploads are capped at 12 MB and now require JPEG magic bytes at the Edge Function boundary.
- KYC uploads are capped at 12 MB and now require JPEG magic bytes at the Edge Function boundary.
- The client image pipeline may accept PNG/WebP as a source because it decodes and re-encodes them to JPEG before upload. The storage boundary remains JPEG-only.
- KYC documents remain in the private bucket and are never made public by this upload path.

## Important distinction

The repository's Supabase migration intentionally provides **no direct authenticated/anon insert policy** for the storage buckets; Edge Functions use the service role after Firebase identity/role authorization. Therefore the executable JPEG type gate is currently the Edge Function, not a client Storage policy.

The connected live Supabase project should still be compared against `docs/contracts/integrations/storage-authority.json` before deployment is considered reconciled.

## Not falsely claimed as solved

This checkpoint does not claim full malware/antivirus scanning. JPEG signature validation prevents obvious non-JPEG masquerading, while listing images are client re-encoded before upload. KYC evidence is private and remains raw JPEG bytes; a dedicated malware/image-content scanning service would be a separate control if the threat model requires it.

Registration abuse based on IP/device velocity is also not declared solved here. Firebase Spark constraints mean an authoritative server-side IP reputation/rate-limit service needs a backend capability that is not equivalent to browser-side counters.

## Verification

`verify/integrations/supabase-security-boundary.mjs` passes after the JPEG boundary assertions were added.

Changed files:
- `active_development/js/auth.js`
- `active_development/profile.html`
- `active_development/js/profile/profile-data.js`
- `active_development/js/supabase.js`
- `active_development/supabase/functions/_shared/jpeg.ts`
- `active_development/supabase/functions/upload-listing-image/index.ts`
- `active_development/supabase/functions/upload-kyc-document/index.ts`
- `active_development/firebase/firestore.rules`
- `verify/integrations/supabase-security-boundary.mjs`


## 2026-08-23 follow-up: Philippine phone boundary

- Canonical phone storage is exactly 12 ASCII digits in `639XXXXXXXXX` form.
- Local `09XXXXXXXXX` input is normalized to the canonical 12-digit form before persistence.
- Firestore `users/{uid}` and `phoneIndex/{digits}` rules independently enforce the 12-digit boundary.
- `phoneIndex` uniqueness remains distinct from phone possession; SMS/Phone Auth verification is required before treating a number as verified identity.
- Registration IP limits are not represented as a fake client-side security boundary. Firebase Auth's built-in abuse protections remain the baseline on Spark; a true per-IP account cap requires a server/edge gate capable of observing the source IP.
