# Phase 11 — Deploy / Backfill / Browser Gate

## Completed locally
- `publicProfiles/{uid}` projection contract and trigger target the named `homefinder` Firestore database.
- Visitor profile and user search use `publicProfiles`.
- Conversation peer reads use an authenticated `getConversationPeerProfile` callable and no longer read another user's authoritative `users/{uid}` document from the browser.
- `backfillPublicProfiles.js` supports `--dry-run` and commits in batches of 400.
- 226 active JS/MJS files pass `node --check`.
- Active source contains no legacy `hf_theme`, `data-theme`, dark/light toggle, or light/dark logo references.
- Public-profile projection static tests pass.

## Not executed
Production Firebase deployment/backfill was **not** performed because this workspace has no Firebase CLI installation or production deployment credentials.

The exact production order is in `docs/28-PUBLIC-PROFILE-DEPLOYMENT-RUNBOOK.md`.

## Browser gate
All 72 responsive cases were attempted through the available Chromium path, but the sandbox blocks local `http://` and `file://` URLs with `ERR_BLOCKED_BY_ADMINISTRATOR`. No blocked case is marked PASS.

Run the same 72-case matrix in an unrestricted browser/device harness before visual sign-off.
