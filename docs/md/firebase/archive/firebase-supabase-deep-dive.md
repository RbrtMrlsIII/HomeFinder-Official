# Firebase / Supabase Deep-Dive Verification — 2026-08-23

## Scope

This checkpoint traced identity, canonicalRole, KYC, Supabase Edge Functions, Storage buckets, Firebase Firestore rules, listing-image uploads, and operations-console routing.

## Resolved findings

1. **KYC self-escalation**
   - Broker KYC submission no longer writes `canonicalRole: broker`.
   - Broker role is granted by privileged verification approval.
   - Normal user KYC writes are restricted to pending submission state.

2. **Canonical role boundary**
   - Firestore role resolution now falls back through `canonicalRole`, `accountType`, and `role`, with legacy aliases normalized at the boundary.
   - Operations console resolves canonicalRole from the authoritative user record, retaining bootstrap UID fallback.
   - Login redirects prefer canonicalRole for operations routing.

3. **Sensitive KYC access**
   - KYC document access remains administrator-only.
   - Sensitive storage remains private.
   - KYC uploads and signed reads remain Edge Function mediated.

4. **Supabase storage authority**
   - `listing-images` is public-read but browser writes are Edge Function-only.
   - `kyc-documents` is private and has no direct browser object-write/read policy.
   - Repository migration now declares the required buckets and public listing-image read policy.

5. **Configuration reuse**
   - Browser code now derives Supabase Edge Function endpoints from the canonical Supabase base URL rather than repeating the full project URL.

## Additional discrepancy found during remediation

- `upload-kyc-document/index.ts` imported `FIREBASE_PROJECT_ID` and redeclared the same constant locally. The duplicate declaration was removed.
- Supabase Edge Functions duplicated the Supabase project URL and bucket names. A shared `_shared/supabase-config.ts` now owns those runtime constants.
- The previously empty Supabase storage migration is now declarative for the required buckets and public listing-image read policy.

## Verification

- Canonical verification suite: 10/10 PASS
- Modified JavaScript syntax checks: PASS
- Nested ZIP count: 0
- Canonical 3D model hash unchanged
- Live Supabase policy verification remains pending and is intentionally not represented as complete evidence.

## Remaining integration work

The repository now defines the intended authority. The next live-environment verification must compare the Supabase project state (buckets, object policies, Edge Functions, secrets, and deployed versions) against these repository contracts before deployment is considered fully aligned.
