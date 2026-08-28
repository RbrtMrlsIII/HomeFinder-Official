# Public Profile Read-Surface Gate

Status: READY_FOR_DEPLOYMENT / NOT_DEPLOYED_IN_THIS_WORKSPACE

## Canonical read path

Public discovery and visitor-facing identity reads use `publicProfiles/{uid}`.
The authoritative `users/{uid}` document remains owner/admin/private by Firestore rules.

## Projection

The public projection contains only explicitly public fields:
`firstName`, `surname`, `accountType`, `avatarUrl`, `publicEmail`, `publicPhone`, `publicCity`,
`verifiedBadge`, `licensedBadge`, `tierIndex`, `searchable`, `updatedAt`.

When a profile opts out of basic discovery, the projection is reduced to `uid`, `searchable:false`, and `updatedAt`.

## Server plumbing

`syncPublicProfile` is a Firestore `users/{uid}` document trigger bound to the named `homefinder` database.
`backfillPublicProfiles.js` supports `--dry-run` and optional `--prune-orphans`.

## Remaining deployment gate

The live Firebase project configuration, credentials, and deployment authority are not present in this workspace.
Therefore production deployment/backfill is prepared but not executed here.
