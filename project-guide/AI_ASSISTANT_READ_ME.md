# HomeFinder — AI Assistant Continuity

This is the **small, current orientation layer for AI-assisted sessions**. Its purpose is to prevent already-resolved investigations, wrong architectural assumptions, and obsolete experiments from being repeated.

It is not a report archive, skill library, contract replacement, or historical diary. Detailed evidence stays in its owning document. See `project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` for the promotion/deletion lifecycle.

## Current continuity — 2026-09-01

**Active track:** P04 Spatial / Visual Validation.

**Accepted:** P04.0, P04.1, P04.2.

**Not endorsed:** P04.3, P04.4, P04.5, P04.6.

**Physical authority:** `master/HomeFinder.sh3d` remains the sole canonical SH3D source. The main application-facing viewer remains the Sweet Home 3D JS Viewer. The P04 GLB viewer is a separate validation surface and does not replace SH3D authority.

**Current branch:** `p04/glb-runtime-restored-2026-09-01`.

**Controlled validation PR:** PR #6 remains draft and unmerged.

## Execution discipline

Use the project sequence for every change:

`Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance`

Do not jump from a finding directly to implementation or deletion.

## Current P04 memory — do not repeat old experiments

- The dedicated GitHub Chromium environment is healthy: checkout, Node/npm, Three.js CDN reachability, browser dependencies, Chromium installation, and evidence upload all passed in the latest run.
- The Three.js import-map/bootstrap repair has been effective enough for the stage to report `data-renderer="three-glb"`; do **not** reopen the old module-resolution hypothesis without new evidence.
- The latest P04 run still reports `data-glb-loaded="false"` because the repository checkout does not contain the approved GLB binaries at the manifest target paths.
- Git history was checked for the canonical T02/T03/T04 GLB paths and returned no historical commits for those paths. There is therefore no Git-history restore to perform.
- The four approved binaries remain preserved in the handoff evidence package with their recorded SHA-256 values. Binary repository promotion is the remaining P04 runtime prerequisite.
- Do not weaken the P04 assertions, substitute placeholder geometry, or restore superseded WalkMyPlan architecture merely to make the browser suite green.

**Detailed P04 evidence:** `project-guide/HandOver.md`, `project-guide/Endorsement.md`, `docs/reconciliation/`, and the latest CI artifact/run records.

## Minimal-knowledge rule

Convert useful findings into the smallest durable memory statement:

`FINDING → VERIFIED MEANING → FUTURE ACTION / AVOIDANCE → SOURCE`

Only verified, reusable, actionable, traceable knowledge belongs here. Transient observations, raw logs, screenshots, traces, large manifests, and detailed audits remain in their owning locations.

When a finding changes project-wide strategy or chronology, update `masterplan.md`. When it only clarifies current execution, keep the memory here and retain the detailed evidence elsewhere.

A detailed findings document becomes a deletion candidate only after its unique knowledge has been distilled, references have been reconciled, evidence has a deliberate retention decision, and no active gate depends on the document.

## Canonical project guardrails

- `master/HomeFinder.sh3d` is the physical source of truth.
- Backend/security/data contracts remain outside SH3D.
- Application code requests logical destinations; it does not invent physical camera coordinates.
- Physical traversal requires valid spatial evidence.
- House 2 ↔ House 3 direct physical traversal is forbidden; hub routing through House 1 remains controlling.
- Historical artifacts are evidence until current status revalidates them.
- Cleanup is an evidence-preserving engineering activity; no blind bulk deletion, renaming, or restructuring.

## Primary continuity sources

`project-guide/HandOver.md` — latest project state and exact continuation point.

`project-guide/Endorsement.md` — chronological gate status.

`project-guide/masterplan.md` — durable architecture, chronology, and project-wide policy.

`project-guide/DOCUMENTATION-MAP.md` — document ownership and routing.

`project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` — knowledge promotion and safe deletion lifecycle.

`project-guide/PROJECT-CURRENT-CANONICAL-MANIFEST.json` and `project-guide/PROJECT-CURRENT-CANONICAL-STATUS.md` — current canonical state.

## Browser verification entry points

`.github/workflows/homefinder-browser.yml` — repository-wide browser verification.

`.github/workflows/homefinder-p04.yml` — dedicated P04 spatial/visual workflow.

`active_development/tests/browser/package.json` — browser-test package.

`active_development/tests/browser/playwright.config.mjs` — Chromium project/configuration.

`active_development/tests/browser/server.mjs` — local test server.

`active_development/tests/browser/specs/` — browser acceptance tests.

## Session-start rule

Start from current repository state. Read this file, then `HandOver.md`, `Endorsement.md`, the relevant masterplan section, and the detailed evidence for the active gate.

Do not reconstruct old history from nested ZIPs when a current canonical record exists.
Do not repeat a disproven hypothesis without new evidence.
Do not delete a detailed finding before its durable knowledge has been promoted or its evidence role intentionally retired.
