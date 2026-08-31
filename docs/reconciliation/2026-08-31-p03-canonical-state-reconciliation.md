# P03 Canonical-State Reconciliation — 2026-08-31

## Status
**OBSERVED / RECORDED / UNDERSTOOD / CLASSIFIED — NOT ENDORSED**

## Purpose
Reconcile the supplied HomeFinder package against the GitHub repository before any P03 browser endorsement or project-gate advancement.

## Authority and method
The project-wide `Project-Execution-Discipline` requires the sequence `Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance`, four mandatory outputs, and a stop on unexplained snapshot drift. The `Project-Execution-Skills` requires authority → consumers → impact → bounded change → validation → machine state → documentation → checkpoint/handover.

The supplied package was inspected directly. GitHub `main` was inspected through repository files/tree and the existing PR was inspected separately.

## Findings

### 1. Project package contains a coherent P03 track
The supplied package contains:
- `project-guide/post-t07/P02-CHECKPOINT.md`
- `project-guide/post-t07/P02-HANDOVER.md`
- `project-guide/post-t07/P03-FINDINGS.md`
- `project-guide/post-t07/P03-CHECKPOINT.md`
- `project-guide/post-t07/P03-HANDOVER.md`
- `project-guide/post-t07/P03-GLB-VIEWER-RUNTIME.md`
- `active_development/data/post-t07/P03-GLB-VIEWER-RUNTIME.json`
- `active_development/3d/glb-viewer/index.html`

The P03 checkpoint says `COMPLETE / READY FOR BROWSER ENDORSEMENT`; its browser execution is explicitly pending Linux/Chromium CI.

### 2. P03 evidence does not support browser endorsement yet
The P03 machine record says `browserPlaywright: PENDING CI EXECUTION` and `productionPromotion: NOT_PROMOTED`. P03 explicitly does not claim visual parity, collision, walkability, physical traversal, or production replacement.

Therefore P03 must not be marked browser-endorsed merely because its local structural checks pass.

### 3. Package-level status metadata is internally inconsistent
`project-guide/PROJECT-CURRENT-CANONICAL-STATUS.md` still says P01 is endorsed for P02 and P02 is ready, while `project-guide/post-t07-current-status.md` contains a later current pointer stating P03 is complete/endorsed for P04. `PROJECT-EXECUTION-DISCIPLINE.json` also reports the post-T07 track as P03 complete/endorsed.

The more specific P03 checkpoint and machine record contradict full endorsement by explicitly requiring browser execution first. This is classified as **UNRESOLVED canonical metadata drift**, not as evidence that browser endorsement occurred.

### 4. GitHub `main` is on an earlier governance/runtime state
GitHub `main` at `498115dadb526999bae21918dd4e2903776555a5` contains the earlier 5.5G.6L browser-verification architecture and the 5.5G.6I physical-route continuation state. Its `CURRENT_CHECKPOINT_STATE.json` says the next allowed operation is the committed Playwright + Chromium suite in the intended CI environment. GitHub `main` does not expose the package's post-T07 P03 files under `project-guide/post-t07/` or `active_development/data/post-t07/`.

Therefore the supplied package must not be treated as a byte-for-byte current GitHub snapshot.

### 5. Canonical physical authority remains protected
The package and GitHub both identify `master/HomeFinder.sh3d` as the physical authority. The package records canonical SHA-256 `2463bbf41a92012bbd81b66ea957c993075f5a2bf6db8a43e676b0c832b0e58c`. No reconciliation action in this record modifies that file.

## Classification
- P03 implementation: **OBSERVED / DERIVED / locally validated**
- P03 browser endorsement: **PENDING**
- P03 production promotion: **NOT AUTHORIZED**
- Package-vs-GitHub state: **UNRESOLVED DRIFT**
- `master/HomeFinder.sh3d`: **PROTECTED / FROZEN**
- PR #2: **SEPARATE CHANGESET; NOT PROOF OF P03 ENDORSEMENT**

## Bounded reconciliation decision
Do **not** rewrite project-wide canonical status to P03 based on the package alone. Do **not** merge PR #2 as a substitute for the missing P03 evidence. Do **not** import the entire ZIP into `main`.

This record is the human-readable finding. The authoritative P03 checkpoint/machine records remain evidence from the supplied package until their state is reconciled against the repository and the required browser gate is executed.

## Required next gate
1. Reconcile which post-T07 package records are intended to be promoted into GitHub.
2. Preserve historical records and distinguish them from current authority.
3. Run the required Linux/Chromium Playwright CI against the exact P03 source when that source is present in the repository/branch under test.
4. Record browser evidence and verdict using the project's vocabulary.
5. Only then update canonical status/manifest/checkpoint and endorse/advance.

## Protected boundaries
- No SH3D mutation.
- No physical inter-house route promotion.
- No production GLB promotion.
- No replacement of the frozen SH3D production viewer based on rendering alone.
- No deletion of historical evidence.
