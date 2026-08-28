# HomeFinder Canonical Authority Model

This document defines the meaning of the repository authority layers.

## Documentation layers

- `docs/md/` defines what is true now.
- `docs/json/` defines machine-checkable boundaries.
- `docs/reconciliation/` records what is being fixed, migrated, compared, or deliberately resolved.
- `docs/evidence/` proves something was checked.
- `archive/` preserves history without participating in current authority.

## Core authority

Firebase Auth → `canonicalRole` → route authority → data authority.

Canonical roles are `owner`, `seeker`, `broker`, `staff`, `moderator`, and `admin`.

Canonical listings are `propertyListings` and `wantedListings`.

The canonical Firebase database is `homefinder`.

The canonical architectural 3D model is `master/HomeFinder.sh3d`.

See `PROJECT_AUTHORITY.json` for the machine-readable authority index.
