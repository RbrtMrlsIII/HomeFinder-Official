# HomeFinder — AI Assistant Continuity

This is the **small, current orientation layer for AI-assisted sessions**. Its purpose is to prevent already-resolved investigations, wrong architectural assumptions, and obsolete experiments from being repeated.

It is not a report archive, skill library, contract replacement, or historical diary. Detailed evidence stays in its owning document. See `project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` for the promotion/deletion lifecycle.

## Current continuity — 2026-09-01

**Active track:** P04 Spatial / Visual Validation plus execution-system reconciliation.

**Accepted:** P04.0, P04.1, P04.2; E0, E1, E2, E3, E4, E5, E6 execution-system milestones.

**Current execution-system gate:** CI / Execution-System Integration Reconciliation.

**E-series reconciliation status:** PROGRAM RECONCILIATION REQUIRED. E0–E6 capabilities remain retained, but the program must integrate with existing HomeFinder automation rather than creating a competing workflow universe. E7 is not endorsed. E8 is held.

**E6 status:** EXECUTED / VALIDATED / ENDORSED. The adopted capability is a derived Structural Intelligence Index for cross-domain discovery/lineage. Existing semantic, spatial, contract, and execution authorities remain unchanged.

**Not endorsed:** P04.3, P04.4, P04.5, P04.6; E7; E8.

**Physical authority:** `master/HomeFinder.sh3d` remains the sole canonical SH3D source. The main application-facing viewer remains the Sweet Home 3D JS Viewer. The P04 GLB viewer is a separate validation surface and does not replace SH3D authority.

**Current branch:** `p04/glb-runtime-restored-2026-09-01`.

**Controlled validation PR:** PR #6 remains draft and unmerged.

## Execution discipline

Use the project sequence for every change:

`Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance`

Do not jump from a finding directly to implementation or deletion.

Startup and handover are always **whole-project**, even when the active gate is narrow. `project-guide/HandOver.md` is mandatory at every gate.

## Current P04 memory — do not repeat old experiments

- The dedicated GitHub Chromium environment is healthy: checkout, Node/npm, Three.js CDN reachability, browser dependencies, Chromium installation, and evidence upload all passed in the established P04 run.
- The Three.js import-map/bootstrap repair has been effective enough for the stage to report `data-renderer="three-glb"`; do **not** reopen the old module-resolution hypothesis without new evidence.
- The established P04 evidence still has `data-glb-loaded="false"` because the repository checkout does not contain the approved GLB binaries at the manifest target paths.
- Git history was checked for the canonical T02/T03/T04 GLB paths and returned no historical commits for those paths. There is therefore no Git-history restore to perform.
- The four approved binaries remain preserved in the handoff evidence package with their recorded SHA-256 values. Binary repository promotion is the remaining P04 runtime prerequisite.
- Do not weaken the P04 assertions, substitute placeholder geometry, or restore superseded WalkMyPlan architecture merely to make the browser suite green.

## Execution-system memory

- E0 established the need for an execution-system layer, but the current reconciliation adds an important constraint: **existing repository automation is part of the baseline architecture**.
- E1 established `MASTER_SKILL.md` v1.2 as the single canonical skill with equalized procedures for all major disciplines and whole-project handover.
- E2 established `.agent/sessions/`, `scripts/session_logger.py`, and `project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md`.
- E3 established `scripts/census.py`, `.agent/census/census.config.json`, and `project-guide/repository-governance/CENSUS-AND-INVENTORY.md`.
- E3 must not invent full-project numeric counts from truncated remote API responses. Use the census from a checked-out repository for authoritative structural totals.
- Existing semantic dictionary ownership remains `active_development/data/dictionary.json`; existing authored-model census remains `active_development/3d/docs/model-census.json`.
- E4 established `.agent/knowledge/ANTI-REPEAT-INDEX.json`, `scripts/knowledge-search.py`, and `project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md`.
- E4 requires an anti-pattern/known-dead-end search before Classify for non-trivial approaches. A strong match is a stop-and-inspect signal, not automatic authority to reject a new approach.
- E4 keeps `PRODUCT-KNOWLEDGE.md` as the durable-knowledge authority; the anti-repeat index is a derived machine index and must not become a competing knowledge source.
- E5 established canonical artifact/build provenance across HomeFinder, GitHub Actions, and Vercel. `builds.json` records exact source commits, artifact identity, deployment identity, and evidence states without conflating deployment with runtime success.
- E6 established a derived structural-intelligence index for cross-domain discovery and lineage. Existing domain-owned sources remain authorities; the index is navigation state only.
- E-series reconciliation found that `.github/workflows/homefinder-browser.yml` already owns broad browser verification, `.github/workflows/homefinder-p04.yml` owns P04 validation, and `.github/workflows/AI_Key.yml` is a separate privileged scheduled/manual workflow with write authority. Do not absorb the latter into E7.
- The E7 workflow introduced during the first enforcement attempt was removed because it duplicated CI orchestration. Retained E7 work is the reusable read-only enforcement capability and procedure, awaiting integration into existing automation ownership.

## Minimal-knowledge rule

Convert useful findings into the smallest durable memory statement:

`FINDING → VERIFIED MEANING → FUTURE ACTION / AVOIDANCE → SOURCE`

Only verified, reusable, actionable, traceable knowledge belongs here. Transient observations, raw logs, screenshots, traces, large manifests, and detailed audits remain in their owning locations.

When a finding changes project-wide strategy or chronology, update `masterplan.md`. When it only clarifies current execution, keep the memory here and retain the detailed evidence elsewhere.

A detailed findings document becomes a deletion candidate only after its unique knowledge has been promoted, references have been reconciled, evidence has a deliberate retention decision, and no active gate depends on it.

## Canonical project guardrails

- `master/HomeFinder.sh3d` is the physical source of truth.
- Backend/security/data contracts remain outside SH3D.
- Application code requests logical destinations; it does not invent physical camera coordinates.
- Physical traversal requires valid spatial evidence.
- House 2 ↔ House 3 direct physical traversal is forbidden; hub routing through House 1 remains controlling.
- Historical artifacts are evidence until current status revalidates them.
- Cleanup is an evidence-preserving engineering activity; no blind bulk deletion, renaming, or restructuring.
- E6 structural indexes are derived navigation state, never authority.
- Existing GitHub Actions and Vercel automation must be mapped before new execution automation is added.

## Primary continuity sources

`project-guide/HandOver.md` — latest whole-project state and exact continuation point.

`project-guide/Endorsement.md` — chronological gate status.

`project-guide/masterplan.md` — durable architecture, chronology, and project-wide policy.

`project-guide/DOCUMENTATION-MAP.md` — document ownership and routing.

`project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` — knowledge promotion and safe deletion lifecycle.

## Execution-system sources

`MASTER_SKILL.md` — single canonical execution skill.

`project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md` — E2 trace/update protocol.

`scripts/session_logger.py` — local session trace helper.

`project-guide/repository-governance/CENSUS-AND-INVENTORY.md` — E3 census protocol.

`scripts/census.py` — source-first project census tool.

`.agent/census/census.config.json` — census configuration.

`project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md` — E4 knowledge and anti-repeat protocol.

`scripts/knowledge-search.py` — deterministic durable-knowledge search and anti-pattern gate helper.

`.agent/knowledge/ANTI-REPEAT-INDEX.json` — derived anti-pattern trigger index.

`E5-CANONICAL-BUILD-PROVENANCE.md` — E5 provenance protocol.

`builds.json` — E5 machine-readable build/deployment provenance registry.

`build-provenance.py` — E5 provenance helper.

`docs/provenance/` — E5 findings/validation evidence.

`project-guide/repository-governance/STRUCTURAL-INTELLIGENCE.md` — E6 structural-intelligence protocol.

`scripts/structural-index.py` — E6 derived structural-intelligence generator.

`.agent/structural/structural-index.config.json` — E6 source configuration.

`.agent/structural/STRUCTURAL-INDEX.json` — E6 derived structural index.

`docs/architecture/E6-STRUCTURAL-INTELLIGENCE-FINDINGS-2026-09-01.md` — E6 findings.

`docs/architecture/E6-STRUCTURAL-INTELLIGENCE-FINDINGS-2026-09-01.json` — E6 machine-readable findings.

`docs/architecture/E6-VALIDATION-2026-09-01.md` — E6 validation evidence.

`docs/execution-system/E-SERIES-RECONCILIATION-2026-09-01.md` — whole E-series reconciliation findings.

`docs/execution-system/E-SERIES-RECONCILIATION-2026-09-01.json` — whole E-series reconciliation machine state.

`docs/execution-system/E-SERIES-RECONCILIATION-VALIDATION-2026-09-01.md` — whole E-series reconciliation validation evidence.

## Existing automation owners

`.github/workflows/homefinder-browser.yml` — repository-wide browser verification.

`.github/workflows/homefinder-p04.yml` — dedicated P04 spatial/visual workflow.

`.github/workflows/AI_Key.yml` — pre-existing privileged scheduled/manual workflow; outside E-series authority and subject to separate security/governance review.

## Session-start rule

Start from current repository state. Read this file, then `HandOver.md`, `Endorsement.md`, the relevant masterplan section, the applicable skill section, and the detailed evidence for the active gate.

Before Classify on a non-trivial approach, search durable knowledge for related anti-patterns and known dead ends. A match must be inspected against current evidence before proceeding.

Before adding automation, inspect existing GitHub/Vercel automation ownership and triggers. Do not create a duplicate workflow owner.

Do not reconstruct old history from nested ZIPs when a current canonical record exists.
Do not repeat a disproven hypothesis without new evidence.
Do not delete a detailed finding before its durable knowledge has been promoted or its evidence role intentionally retired.
