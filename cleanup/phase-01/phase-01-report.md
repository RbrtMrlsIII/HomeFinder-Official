# HomeFinder Phase 01 — Repository Baseline Report

## Status

**Phase:** 01 — Repository Baseline  
**Operation status:** Completed  
**Physical migration status:** Not started  
**Renames:** None  
**Moves:** None  
**Deletions:** None  
**Source archive modified:** No

## Source baseline

The uploaded source archive was inspected read-only before any repository changes.

- Source archive: `HomeFinder.zip`
- Source archive SHA-256: `c48c5b4166dd21932222be6bc9df122223a7d52a19ecc87a2739962de8701d8e`
- Files in source repository: **787**
- Historical extension counts from the endorsement were revalidated against this upload.

### Extension counts

- `.json`: 173
- `.md`: 153
- `.mjs`: 149
- `.js`: 147
- `.csv`: 67
- `.css`: 35
- `.txt`: 15
- `.html`: 15
- `.webp`: 14
- `.ts`: 7
- `.png`: 4
- `.pdf`: 3
- `.puml`: 1
- `.sh3d`: 1
- `.rules`: 1
- `.toml`: 1
- `.sql`: 1

## Top-level physical areas

- `active_development`: 368 files
- `docs`: 358 files
- `verification`: 39 files
- `verify`: 16 files
- `README.md`: 1 files
- `HandOver.md`: 1 files
- `AI_ASSISTANT_READ_ME.md`: 1 files
- `masterplan.md`: 1 files
- `Endorsement.md`: 1 files
- `master`: 1 files

## Important observations

1. The repository is materially consistent with the previously described 787-file baseline, but this report is based on the current uploaded archive rather than historical counts.
2. `active_development/` contains application code, Firebase, Supabase, 3D assets/viewer code, UI assets, tests, tools, manifests, and verification-related material. This supports preserving dependency-coherent backend folders during later classification.
3. `verify/` already contains an MJS verification ecosystem spanning 3D, contracts, data, integrations, routes, and security. A parallel Python test framework should not be introduced merely to fill categories.
4. `active_development/tests/` contains a substantial MJS test corpus, including canonical-looking tests, `from-verify` tests, and historically named `patch`, `DD`, and `foundation-repair` artifacts. These require content/role analysis before any rename.
5. `verification/` contains dated and execution-oriented result records. These are evidence/history candidates, not automatically current canonical verification implementations.
6. `docs/archive/` explicitly contains historical/dead-or-superseded material. Archive lineage should be preserved rather than flattened into current canonical structures.
7. Backend structures are already physically grouped under `active_development/firebase/` and `active_development/supabase/`. This supports the rule that dependency architecture, not extension alone, determines physical ownership.
8. `active_development/3d/` and `master/HomeFinder.sh3d` are distinct 3D/spatial authority candidates requiring deeper inspection before any relocation.
9. The current repository contains execution-history vocabulary such as `patch`, `DD`, `phase`, `checkpoint`, `repair`, and `final`. These are not being treated as canonical identity during Phase 01.
10. An initial exact-content hash scan found **12 exact duplicate groups**. This is a finding only; no duplicate was deleted, moved, or declared superseded in Phase 01.

## Exact duplicate groups

See `duplicate-groups-phase-01.csv` for the complete list. Exact-content equality does not imply that files have the same role; each group requires classification before action.

## Safety boundary

Phase 01 deliberately did not rename, move, delete, rewrite, or reclassify source files. The `cleanup/phase-01/` directory is newly added evidence for this cleanup process and is not part of the baseline manifest.

## Next phase

**Phase 02 — Test & Verification Reconnaissance.**

The next step should inspect existing MJS tests/verifiers, distinguish executable verification from historical outputs/documentation/fixtures, map coverage, and identify duplicate or canonical candidates. No migration should occur during that reconnaissance unless separately authorized.

## Source-of-truth rule

Where repository evidence conflicts with assumptions in the endorsement or later cleanup proposals, stop and request the repository owner's decision. The repository owner remains the source of truth.
