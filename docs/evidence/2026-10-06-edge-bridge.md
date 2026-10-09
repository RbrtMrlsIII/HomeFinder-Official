# Evidence — Supabase Edge bridge, emulator-proven (2026-10-06)

**Grade:** emulator-proven (the real bridge code, the local Firestore emulator, PayPal mocked, no
credentials). **Not deployed**, and not exercised against PayPal Sandbox or the Supabase runtime.

## Result

- The shared webhook and approval suite (35 tests) passes against the Edge bridge (`HF_IMPL=edge`): **35/35**.
- The Cloud Function run: **80/80** (the earlier 68 plus 12 new Edge HTTP tests).
- Mutation check: breaking the Edge bridge makes exactly the expected tests fail in the Edge run and leaves the
  Cloud Function run green, so the Edge path is the one being exercised.
- Both Edge wrappers type-check under Deno.
- Existing package suite and `verify/**`: see the pull request for the before/after counts.

## What the bridge does

- `paypal-record-approval`: Firebase ID token, origin allowlist (CORS), the same suspension rule as the Cloud
  Functions, proof by `custom_id` = uid or an exact email match, bind-once, activation (profile summary and
  entitlement in one atomic commit), generic error messages.
- `paypal-webhook`: PayPal signature verification, an idempotent ledger (atomic create, then a takeover guarded by
  the document's update time), unbound HomeFinder events fail so PayPal retries, other plans are ignored.
- Configuration: PayPal API base defaults to the sandbox; the plan id is configurable; secrets are read in one place.

## Differences from the Cloud Function path (by design)

HTTP with `{error: {code, message}}` instead of a callable; a CORS allowlist; generic 500 messages; sandbox by
default; the Firestore writes go through the REST API with a service account held only as an Edge secret.

## Not proven

PayPal Sandbox end to end; the deployed Supabase runtime (the HomeFinder project is paused, #21); the service
account's real scope and token flow; Firebase ID token verification against live Firebase (existing code,
unchanged); rate limiting (not implemented); the frontend still calls the Firebase callable, not this endpoint.
