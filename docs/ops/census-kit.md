# Census kit — real-data reference (owner-run, read-only)

**Why.** The repository holds no real data, and the connectors cannot see the live Firebase (the Composio
toolkit is bound to another project) or Supabase (the HomeFinder project is paused). These two scripts let
the owner bring *aggregate* facts back into the repo as evidence, without sharing any key.

## 1. Firestore census (counts and dates only)

```sh
cd scripts/census && npm install
node firestore-census.mjs --project homefinder-official --database homefinder
```

- Reads: `count()` aggregations (users by role, suspension, ID-verification and subscription state; public
  profiles; listings; wanted posts; contracts by status; entitlements by source; PayPal bindings; webhook
  events and failures; boost orders) and the **date** of the oldest and newest `createdAt` for users and listings.
- Never: writes, or prints a name, email, phone, id or any other field value.
- Credentials are yours: `gcloud auth application-default login`, or a read-only role such as
  `roles/datastore.viewer`. Do **not** create a service-account key for this, and never paste a key anywhere.
- Output: `census-YYYY-MM-DD.json`. It contains no personal data; share the file or paste the JSON.
- `--emulator 127.0.0.1:8080` runs it against the local emulator.

What the numbers settle: whether anyone is registered and when registration last worked, how many listings
exist, whether any entitlement is real, and whether webhook events have been failing.

## 2. Deployed-rules drift (is registration broken live?)

```sh
cd scripts/census && npm install
node rules-drift.mjs --project homefinder-official --database homefinder --save deployed.rules
```

Needs `roles/firebaserules.viewer` (your own login is enough). It downloads the deployed Firestore rules,
compares them with `active_development/firebase/firestore.rules`, and reports whether they are identical, both
SHA-256 values, and whether the `users/{uid}` create rule still reads `resource.data` (null on create), which
is the registration defect from #29. Exit code 0 only when the rules are identical. Nothing is changed.

## Other read-only checks to run yourself

- `firebase functions:list --project homefinder-official` — compare with the 37 exports in `functions/index.js`.
- `firebase firestore:indexes --project homefinder-official` (add `--database homefinder` if your CLI supports it).
- Supabase dashboard — the HomeFinder project is paused (#21); restoring it is an owner decision.
- PayPal dashboard — the connector listed zero subscriptions on 2026-10-12.

## How it was verified

An emulator test seeds an isolated named database and checks exact counts and dates, that no seeded field value
appears in the output, and that the census source contains no write call. The rules-drift logic is tested against
a fake API, including that a token never appears in an error. **Neither script has been run against the live
project yet.**
