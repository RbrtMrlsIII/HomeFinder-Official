# HomeFinder Checkpoint Policy

## Current authority

- `PROJECT_AUTHORITY.json` — machine-readable authority index
- `docs/md/` — current truth
- `docs/json/` — machine-checkable boundaries
- `docs/reconciliation/` — active fixes and migrations
- `docs/evidence/` — verification evidence
- `archive/` — historical/superseded material
- `verify/` — canonical verification

## Product authorities

- Firebase Auth — identity
- `canonicalRole` — canonical role vocabulary
- Firestore database `homefinder` — canonical Firebase database
- `propertyListings` / `wantedListings` — canonical listing collections
- `master/HomeFinder.sh3d` — canonical architectural 3D model

## Archive policy

`HomeFinder.zip` is the only project archive. Do not nest ZIP files.

Historical patch/DD/phase documents remain useful for provenance but cannot redefine current authority.


## Structure (2026-08-24)
See STRUCTURE.md and docs/DEAD_FILES_AND_STRUCTURE.md. Folders no longer use numeric prefixes.
