# HomeFinder — AI Assistant Continuity

This file is the **current continuity index for AI-assisted sessions**. It should stay small and current.

It records only:
- what the project is doing now;
- which checkpoint is current;
- what was most recently verified;
- what remains unresolved;
- which documents contain the detailed context.

Do not place agent skills, coding conventions, product rules, security guidance, or long historical narratives here. Those belong in their designated source files.

## Current continuity — 2026-09-01

**Active track:** P04 Spatial / Visual Validation.

**Accepted:** P04.0, P04.1, P04.2.

**Not endorsed:** P04.3, P04.4, P04.5, P04.6.

**Physical authority:** `master/HomeFinder.sh3d` remains the sole canonical SH3D source. The main application-facing viewer remains the Sweet Home 3D JS Viewer. The P04 GLB viewer is a separate validation surface and does not replace SH3D authority.

**Current branch:** `p04/glb-runtime-restored-2026-09-01`.

**Controlled validation PR:** PR #6 remains draft and unmerged.

## Latest verified P04 execution

GitHub-hosted P04 run `33451823171` executed the dedicated Chromium suite from the clean branch.

Infrastructure stages passed:
- container startup;
- checkout;
- Node 22 setup;
- external Three.js dependency reachability;
- browser-test dependency installation;
- Chromium installation.

The focused P04 browser suite then failed all 6 tests at the common renderer-mount assertion because `.hf-cinematic-3d-stage` never acquired `data-renderer="three-glb"`.

This is a current implementation/runtime finding. It is not evidence that the approved GLBs are corrupt, and it is not a reason to weaken the acceptance assertions.

The run produced Playwright screenshots/traces as evidence. Detailed runtime findings belong in `docs/reconciliation/`; the live continuation point belongs in `HandOver.md`.

## Current next step

Reconcile the P04 renderer mount path against the actual runtime scripts and current repository architecture. Do not change the canonical SH3D model, do not promote the inherited base64 GLB workarounds, and do not mark P04.3 complete until fresh Chromium evidence satisfies the existing contract.

## Primary continuity sources

`project-guide/HandOver.md` — latest project state and exact continuation point.

`project-guide/Endorsement.md` — chronological gate status.

`project-guide/masterplan.md` — durable architecture and institutional history.

`project-guide/DOCUMENTATION-MAP.md` — document ownership and routing.

`docs/` — detailed contracts, audits, manifests, reconciliation records, and validation evidence.

## Browser verification entry points

`.github/workflows/homefinder-browser.yml` — repository-wide browser verification workflow.

`.github/workflows/homefinder-p04.yml` — dedicated P04 spatial/visual workflow.

`active_development/tests/browser/package.json` — browser-test package definition.

`active_development/tests/browser/playwright.config.mjs` — Chromium project and browser harness configuration.

`active_development/tests/browser/server.mjs` — local test server.

`active_development/tests/browser/specs/` — browser acceptance tests.

## Session handoff rule

Start from the current repository state, then read `HandOver.md`, `Endorsement.md`, and the relevant detailed evidence. Do not reconstruct old execution history from nested ZIPs or duplicate it into this file.
