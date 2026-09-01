# HomeFinder — AI Assistant Continuity

This is the **small, current orientation layer for AI-assisted sessions**. Its purpose is to prevent already-resolved investigations, wrong architectural assumptions, obsolete experiments, and duplicate automation from being repeated.

It is not a report archive, skill library, contract replacement, or historical diary. Detailed evidence stays in its owning document. See `project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` for the promotion/deletion lifecycle.

## Current continuity — 2026-09-01

**Active track:** P04 Spatial / Visual Validation plus execution-system and project-lineage reconciliation.

**Accepted:** P04.0, P04.1, P04.2; E0, E1, E2, E3, E4, E5, E6 execution-system milestones; MR0 Post-T02 Masterplan & Execution-Lineage Rebaseline.

**Current foundation status:** MR0 EXECUTED / VALIDATED / ENDORSED.

**Current execution-system gate:** CI / Execution-System Integration Reconciliation.

**Canonical post-T02 lineage:** T02 → T03 → T04 → T05 → T06 → T07 (frozen) → post-T07 GLB track P01 → P02 → P03 → P04 → P05 → P06.

**E-series relationship:** E0–E6 are retained execution-system capabilities, but they are an overlay on the development chronology. They must not reorder, reopen, replace, or authorize product-development gates by themselves. E7 and E8 are held until CI/automation integration is reconciled.

**Not endorsed:** P04.3, P04.4, P04.5, P04.6; E7; E8; any new product-development gate beyond the current permitted masterplan pointer.

**Physical authority:** `master/HomeFinder.sh3d` remains the sole canonical SH3D source. The main application-facing viewer remains the Sweet Home 3D JS Viewer. The P04 GLB viewer is a separate validation surface and does not replace SH3D authority.

**Current branch:** `p04/glb-runtime-restored-2026-09-01`.

**Controlled validation PR:** PR #6 remains draft and unmerged.

## Execution discipline

Use the project sequence for every change:

`Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance`

Do not jump from a finding directly to implementation or deletion.

Startup and handover are always **whole-project**, even when the active gate is narrow. `project-guide/HandOver.md` is mandatory at every gate and is the single whole-project handover authority.

Every gate must carry, as applicable and without exception to the whole-project handover requirement: findings, machine-readable state, validation evidence, endorsement state, knowledge-distillation assessment, and the current continuation point.

## Masterplan lineage rule

The **master development chronology outranks execution-system convenience**.

The frozen post-T02 development lineage is:

```text
T02 → T03 → T04 → T05 → T06 → T07 (FROZEN)
                                      ↓
                     P01 → P02 → P03 → P04 → P05 → P06
```

The E-series is an execution-system overlay:

```text
E0 → E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8
```

An E-series milestone may provide a capability, trace, census, memory, provenance, structure, or enforcement mechanism, but it does **not** become a competing product chronology and does not authorize reopening or reordering T02–T07 or P01–P06.

When the lineage is uncertain, stop and rebaseline before introducing further automation or product transformations.

## Proven mechanisms and anti-repeat rule

**HomeFinder already has proven execution mechanisms. Reuse them before inventing new ones.**

The HomeFinder browser-verification path used for the established T01/T02 lineage is the proven browser-execution baseline. A later milestone does **not** by itself justify a new browser workflow, test harness, runner, or validation path.

Before creating or changing automation:

`existing mechanism → historical proof → actual limitation → evidence of materially different requirement → bounded change`

Do not create milestone-specific workflow clones merely because a gate has a different name. A new workflow requires evidence that the established mechanism cannot satisfy the new execution requirement.

A failed application assertion is not evidence that the runner or workflow infrastructure is defective. First separate infrastructure failure from application/runtime failure. Do not repeat a healthy runner through another workflow just because the application assertion failed.

Historical T01/T02 browser evidence is an anti-repeat reference. Do not rerun old successful workflows merely to recreate confidence already established. Reuse the proven mechanism for current validation when current evidence is actually required.

## Current P04 memory — do not repeat old experiments

- The dedicated GitHub Chromium environment is healthy: checkout, Node/npm, Three.js CDN reachability, browser dependencies, Chromium installation, and evidence upload all passed in the established P04 run.
- The Three.js import-map/bootstrap repair has been effective enough for the stage to report `data-renderer="three-glb"`; do **not** reopen the old module-resolution hypothesis without new evidence.
- The established P04 evidence still has `data-glb-loaded="false"` because the repository checkout does not contain the approved GLB binaries at the manifest target paths.
- Git history was checked for the canonical T02/T03/T04 GLB paths and returned no historical commits for those paths. There is therefore no Git-history restore to perform.
- The four approved binaries remain preserved in the handoff evidence package with their recorded SHA-256 values. Binary repository promotion is the remaining P04 runtime prerequisite.
- Do not weaken the P04 assertions, substitute placeholder geometry, or restore superseded WalkMyPlan architecture merely to make the browser suite green.

The final in-flight P04 workflow run created during workflow retirement (`33471269425`) completed with infrastructure setup, Chromium installation, P04 execution, and evidence upload successful except for the focused application/runtime assertions. Treat its failure as historical evidence of the P04 runtime state, not as justification to resurrect another browser workflow.

## Execution-system memory

- E0 established the need for an execution-system layer, but the program reconciliation adds an important constraint: **existing repository automation is part of the baseline architecture**.
- E1 established `MASTER_SKILL.md` v1.2 as the single canonical skill with equalized procedures for all major disciplines and whole-project handover.
- E2 established `.agent/sessions/`, `scripts/session_logger.py`, and `project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md`.
- E3 established `scripts/census.py`, `.agent/census/census.config.json`, and `project-guide/repository-governance/CENSUS-AND-INVENTORY.md`.
- E3 must not invent full-project numeric counts from truncated remote API responses. Use the census from a checked-out repository for authoritative structural totals.
- Existing semantic dictionary ownership remains `active_development/data/dictionary.json`; existing authored-model census remains `active_development/3d/docs/model-census.json`.
- E4 established `.agent/knowledge/ANTI-REPEAT-INDEX.json`, `scripts/knowledge-search.py`, and `project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md`.
- E4 requires an anti-pattern/known-dead-end search before Classify for non-trivial approaches. A match must be inspected against current evidence before proceeding.
- E4 keeps `PRODUCT-KNOWLEDGE.md` as the durable-knowledge authority; the anti-repeat index is a derived machine index and must not become a competing knowledge source.
- E5 established canonical artifact/build provenance across HomeFinder, GitHub Actions, and Vercel. `builds.json` records exact source commits, artifact identity, deployment identity, and evidence states without conflating deployment with runtime success.
- E6 established a derived structural-intelligence index for cross-domain discovery and lineage. Existing domain-owned sources remain authorities; the index is navigation state only.
- **MR0 established that T02–T06 are frozen product-development lineage and must remain ahead of the execution-system overlay in authority and sequencing.**
- **MR0 established that T07 is frozen and P01–P06 is a separate post-T07 GLB track.**
- The E-series cannot outrun masterplan lineage. If development chronology or authority is uncertain, stop, record findings, and rebaseline before advancing enforcement or structural automation.

## CI state after cleanup/rebaseline

The active clean P04 validation branch currently has **no `.github/workflows/` automation** after the workflow-retirement reconciliation. This is intentional. The retired YAML definitions are historical evidence, not current automation authorities.

The T01/T02 browser-verification path remains the proven conceptual baseline for future browser execution. A future CI implementation must first reconcile that proven path with current repository needs rather than creating a milestone-specific clone.

The old workflow runs remain visible in GitHub history. Runs `33451823171` and `33471269425` both reached healthy runner setup, Chromium, focused P04 execution, and evidence upload; their failures occurred at the application/runtime assertion layer. These runs are evidence of runtime state, not permission to resurrect retired workflow definitions.

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
- Existing or historically proven GitHub/Vercel mechanisms must be inspected before new execution automation is added.
- **T01/T02 proven browser verification is the default browser-execution baseline.** Do not create a second workflow for a new milestone without evidence of a materially different requirement.
- **Do not let an E-series milestone become a replacement for the masterplan sequence.**
- **Do not advance E7/E8 while the CI/automation integration boundary remains unresolved.**

## Primary continuity sources

`project-guide/HandOver.md` — latest whole-project state and exact continuation point.

`project-guide/Endorsement.md` — chronological gate status.

`project-guide/masterplan.md` — durable architecture, chronology, and project-wide policy.

`project-guide/DOCUMENTATION-MAP.md` — document ownership and routing.

`project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` — knowledge promotion and safe deletion lifecycle.

## Current rebaseline sources

`docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.md` — human-readable post-T02 lineage findings and E-series rebaseline dispositions.

`docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.json` — machine-readable lineage registry and protected boundaries.

`docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01-VALIDATION.md` — MR0 validation evidence.

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

## Existing automation status

All previously active workflow YAMLs have been retired from the clean P04 branch during CI reconciliation. Historical runs remain available in GitHub and are evidence/history only.

Do not resurrect `homefinder-browser.yml`, `homefinder-p04.yml`, `AI_Key.yml`, or any prior E7 workflow from stale documentation or checkpoint archives.

Before any future workflow is created, inspect the proven T01/T02 browser execution lineage and produce evidence that reuse or extension is insufficient.

## Session-start rule

Start from current repository state. Read this file, then `HandOver.md`, `Endorsement.md`, the relevant masterplan section, the applicable skill section, and the detailed evidence for the active gate.

Before Classify on a non-trivial approach, search durable knowledge for related anti-patterns and known dead ends. A match must be inspected against current evidence before proceeding.

Before adding automation, inspect existing GitHub/Vercel automation ownership, triggers, and historical proof. **Do not create a duplicate workflow owner.**

Before creating a new browser runner/workflow, explicitly check the proven T01/T02 browser-verification lineage and document why reuse or extension is insufficient.

Before advancing an E milestone, verify that the corresponding masterplan development lineage is known, current, and not being bypassed by the execution-system layer.

Do not reconstruct old history from nested ZIPs when a current canonical record exists.
Do not repeat a disproven hypothesis without new evidence.
Do not delete a detailed finding before its durable knowledge has been promoted or its evidence role intentionally retired.
