# P04 CI / Execution-System Reconciliation — 2026-09-03

## Status

**OPEN / VALIDATION IN PROGRESS**

Branch: `p04/glb-runtime-restored-2026-09-01`

This record reconciles the restored P04 runtime artifacts with the repository's execution discipline and current browser-verification evidence. No `main` mutation was performed.

## Observed state

1. The exact browser workflow already existed on sibling branch `p04/glb-runtime-2026-09-01` at `.github/workflows/homefinder-browser.yml` with blob SHA `95e335093cf4ae8aaffbe0a627d73889a8416490`.
2. The restored branch initially lacked that workflow. The workflow was copied without semantic modification as a restoration of an existing proven mechanism, not as a new milestone-specific workflow design.
3. The four approved GLB binaries were uploaded by the user to `active_development/3d/glb-viewer/`. Review of the authoritative current target manifest showed that this was not the runtime location. The manifest requires `/active_development/assets/t02`, `/t03`, `/t04`, and `/t05` paths.
4. The exact existing GLB Git objects were therefore re-used, without re-encoding, at the manifest-required runtime paths:
   - `active_development/assets/t02/house1-mainhall-public-arrival.glb`
   - `active_development/assets/t03/house1-kitchen-bedroom1-network.glb`
   - `active_development/assets/t04/house1-basement-firstfloor-vertical-interface.glb`
   - `active_development/assets/t05/house1-corridor-living-bedroom2-network.glb`
5. The target manifest remains source-backed and points to those four exact runtime URLs. Canonical SH3D authority remains `master/HomeFinder.sh3d`; no SH3D mutation was made.

## Discipline / authority reconciliation

The current `MASTER_SKILL.md` v1.2 remains the sole canonical project-wide execution skill. Its required lifecycle is:

`Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance`

The existing `HandOver.md`, `AI_ASSISTANT_READ_ME.md`, and `masterplan.md` still contain language from the 2026-09-01 CI-retirement state saying that no `.github/workflows/` automation is active. That statement is now stale relative to this explicitly bounded restoration. The workflow restoration must remain **unendorsed until current validation evidence is complete** and the canonical documents must then be reconciled in the same gate.

The restored workflow itself is not evidence of successful application behavior. Browser/CI evidence remains a separate acceptance layer.

## Skill review

The handoff ZIP contains `project-guide/skills/Project-Execution-Skills.md` and `project-guide/PROJECT-EXECUTION-DISCIPLINE.md`. Their execution rules are consistent with the canonical `MASTER_SKILL.md`: authority-first startup, smallest bounded mutation, validation before endorsement, machine-readable trace, and whole-project handover.

No repository file or handoff-package file named `ORUCAVEA` (or containing that exact term) was found during this reconciliation. No substitute skill is being invented or promoted under that name. The existing canonical `MASTER_SKILL.md` remains authoritative until an explicit source for ORUCAVEA is identified and reconciled.

## Current validation

GitHub Actions run `33728622738` was started by the workflow restoration/session commits and is currently executing the Chromium suite. The runner, checkout, Node/npm dependency setup, Chromium installation, and model-hash verification have completed successfully; the browser test step is the active validation stage.

A low-level tree commit was used to place the existing GLB objects at the manifest-required paths. That low-level commit is not itself treated as CI evidence. A follow-up repository contents commit (this record) is used to trigger the workflow against the corrected tree state.

## Next safe actions

1. Observe the current Chromium run after this commit.
2. Classify any failure as infrastructure, repository-path/artifact, renderer, target, camera, or application assertion failure.
3. Do not weaken assertions or mutate `master/HomeFinder.sh3d`.
4. If the current browser gate passes, update `HandOver.md`, `Endorsement.md`, `AI_ASSISTANT_READ_ME.md`, and `CURRENT_CHECKPOINT_STATE.json` to reconcile the workflow restoration and repository-backed GLB paths, while keeping P04.3–P04.6 unendorsed until their explicit acceptance evidence is complete.
5. Remove only the now-unreferenced duplicate GLB copies from `active_development/3d/glb-viewer/` after reference scanning and evidence retention are complete.

## Disposition

**P04.3 remains unchecked pending fresh browser evidence.**

**E7 remains held pending CI/execution-system integration reconciliation and explicit endorsement.**
