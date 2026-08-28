# HomeFinder Supabase authority

Firebase Auth is the identity authority. Supabase is the critical storage and Edge Function system.

## Storage
- `listing-images`: public-read; browser writes go through `upload-listing-image`.
- `kyc-documents`: private; browser writes go through `upload-kyc-document`; reads go through `get-kyc-signed-url`.
- Supabase service-role credentials are server-side only.

## Edge Functions
All HomeFinder Edge Functions that accept Firebase identity tokens disable Supabase's native JWT gate and verify the Firebase token themselves.

## Configuration
`config.toml` is the repository deployment configuration. `migrations/` defines repository-controlled storage state.

Before deployment, compare live bucket/RLS state with:
`docs/contracts/integrations/storage-authority.json`.
