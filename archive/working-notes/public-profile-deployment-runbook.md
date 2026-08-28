# Public Profile Projection Deployment Runbook

## Scope
Deploy the `publicProfiles/{uid}` projection and backfill the existing `users/{uid}` population in the named Firestore database `homefinder`.

## Preconditions
- Firebase CLI installed and authenticated with the HomeFinder project deployment identity.
- Firebase project configuration resolves to `homefinder-official`.
- `firebase/functions` dependencies installed with the Node 20 runtime required by `package.json`.
- Firestore rules contain `publicProfiles/{uid}` public-read / client-write-denied policy.
- Do not expose the private `users/{uid}` document to visitor/search UI.

## Deployment order
1. Deploy Firestore rules and Functions together:
   `firebase deploy --only firestore:rules,functions --project homefinder-official`
2. Wait for the `syncPublicProfile` trigger to become active.
3. Run the backfill in dry-run mode first:
   `node firebase/functions/backfillPublicProfiles.js --dry-run`
4. Review the count and projection fields.
5. Run the actual backfill:
   `node firebase/functions/backfillPublicProfiles.js`
6. Verify a sample of `publicProfiles/{uid}` documents contains only the projection contract fields.
7. Verify visitor/profile search no longer requests `users/{uid}` and conversation peer lookups use the participant-authorized callable.

## Rollback
- Revert client reads only after confirming `users/{uid}` access is restored for the required owner/admin surfaces.
- Keep `publicProfiles` documents until the client rollback is verified.
- Do not delete source `users/{uid}` documents as part of this migration.

## Current execution status
**READY_BUT_NOT_DEPLOYED**. This workspace has no Firebase CLI installation or deployment credentials, so production deployment/backfill was not executed here.
