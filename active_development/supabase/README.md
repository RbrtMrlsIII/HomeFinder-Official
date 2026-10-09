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

## PayPal bridge (#15) — in tree, not deployed

`paypal-record-approval` (browser, Firebase ID token) and `paypal-webhook` (PayPal, signature) are the only
trusted path between Firebase and PayPal. Shared code lives in `functions/_shared/paypal-bridge/` (plain
ES modules, so Deno and Node run the same code). Both functions use `verify_jwt = false`: the first checks the
Firebase token itself, the second checks the PayPal signature.

Secrets (set in the dashboard or with `supabase secrets set`; never in git, Issues or chat):
`FIREBASE_SERVICE_ACCOUNT_JSON`, `PAYPAL_SUBSCRIPTION_CLIENT_ID`, `PAYPAL_SUBSCRIPTION_CLIENT_SECRET`,
`PAYPAL_SUBSCRIPTION_WEBHOOK_ID`.
Settings: `PAYPAL_API_BASE` (defaults to the **sandbox**; set `https://api-m.paypal.com` only for production),
`PAYPAL_PLAN_ID` (set the sandbox plan id when testing in the sandbox), `ALLOWED_ORIGINS` (defaults to the
GitHub Pages origin).

Order of work: choose the project of record (#21), then deploy and prove everything in PayPal **Sandbox**
(register the webhook URL `https://<project>.supabase.co/functions/v1/paypal-webhook` there first), and only
then repeat on the live account. Tests run with no credentials: see `active_development/tests/emulator/README.md`.

