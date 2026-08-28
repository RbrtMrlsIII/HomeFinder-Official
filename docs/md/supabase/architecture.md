# Supabase Authority Contract

Supabase is a first-class backend system in HomeFinder.

- Firebase Auth remains the canonical identity provider.
- Supabase Storage owns private KYC object storage.
- Supabase Edge Functions may perform trusted operations using server-side secrets.
- Supabase must consume the same canonical authorization decisions defined in `docs/json/firebase/canonical-roles.json` and `docs/json/firebase/kyc-authorization.json`.
- Client code must never receive Supabase service-role credentials.

## KYC Edge Function requirement

`get-kyc-signed-url` verifies the Firebase ID token and then uses a server-side `FIREBASE_SERVICE_ACCOUNT_JSON` secret to read the private `users/{uid}` document through Firestore REST. This avoids relying on Firestore public-read rules. The service account secret must never be exposed to browser code. The function also uses the server-side Supabase storage service key for signing private KYC objects.
