# Backend integration contracts

`backend-authority.json` is the machine-readable Firebase/Supabase integration spine.
`storage-authority.json` defines the intended storage boundary.

Firebase Auth is the identity authority. Firebase Firestore uses the named `homefinder` database.
Supabase Edge Functions may verify Firebase ID tokens, but they must resolve `canonicalRole` using the same canonical role vocabulary and KYC authorization contract.

Live Supabase dashboard state is not treated as repository authority. Before a storage policy is changed or deployed, it must be compared with `storage-authority.json`.
