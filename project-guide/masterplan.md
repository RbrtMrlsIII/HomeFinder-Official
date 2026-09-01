# HomeFinder Masterplan — Project Handover & Execution Authority

## 0. Current Execution Pointer — 2026-09-01

- **Project discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.
- **Post-T02 rebaseline:** MR0 completed and endorsed. Canonical development lineage is `T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06`.
- **T07:** FROZEN.
- **P-series:** P01–P06 is the designated product-development/validation track and is outside the E-series scope.
- **Current product/P04 state:** P04.0–P04.2 accepted; P04.3–P04.6 not endorsed. The approved GLBs remain evidence until the designated P-series team completes the required promotion/validation work.
- **Canonical physical authority:** `master/HomeFinder.sh3d`.
- **E-series:** E0–E8 complete as an execution-system capability layer on `e/execution-system-2026-09-01`.
- **Final E-series state:** Complete, validated, endorsed, and handed over as an overlay. No further E-series gate is required before designated product-development work resumes.

This file is the compact project-wide policy/architecture document. Detailed historical execution records remain in Git history and designated evidence/archive locations. Do not reconstruct those records here.

## 1. Target Architecture

HomeFinder combines a conventional web application with a physically authored 3D presentation environment.

```text
WEB / APPLICATION
    ↓ logical destination
PRESENTATION IDENTITY
    ↓
PHYSICAL ROOM / ZONE
    ↓ authored camera
PHYSICAL ROUTE / DOOR
    ↓
BROWSER / VISUAL EVIDENCE
```

The application owns DOM, CSS, interaction state, responsive behavior, logical navigation, authentication, authorization, security, data, and integrations.

SH3D/spatial authority owns physical geometry, authored cameras, physical presentation zones, doors/openings, collision/clearance, and validated physical routes.

The 3D layer is never a security boundary.

## 2. Canonical Authorities

### 3D

`master/HomeFinder.sh3d` is the sole canonical SH3D authority.

Do not create a competing SH3D authority, overwrite canonical geometry with an unvalidated candidate, rename the canonical model during 3D execution, or restore superseded WalkMyPlan architecture to make tests green.

### Application

Current application/security/data contracts remain authoritative outside SH3D.

### Historical evidence

Archives, checkpoints, reports, screenshots, traces, and historical snapshots are evidence unless the newest endorsed canonical state promotes them to current authority.

## 3. Three-House Semantic Model

- **House 1:** Public / Hero.
- **House 2:** Operations + Broker.
- **House 3:** Seeker + Owner.

House 2 ↔ House 3 direct physical traversal is forbidden. Logical transport remains hub-routed through House 1 unless a later project-owner decision changes that authority.

Never equate page count, DOM count, physical-room count, camera count, or door count one-to-one.

## 4. Execution Discipline

Every gate produces four mandatory outputs:

1. human-readable findings;
2. machine-readable registry/manifest where appropriate;
3. validation/test evidence;
4. whole-project team handover/checkpoint.

Whole-project `project-guide/HandOver.md` is mandatory at every gate. It is not an optional addendum.

A finding is not permission to implement or delete. Findings are first classified against current authority and consumers.

```text
CURRENT CONTRACT
  → remediate / validate

SUPERSEDED CONTRACT
  → replace, archive, or retire

HISTORICAL EVIDENCE
  → preserve deliberately

UNCERTAIN
  → investigate before mutation
```

No blind cleanup, bulk renaming, mass deletion, or architecture reversal.

## 5. Knowledge / Anti-Repeat

HomeFinder intentionally separates evidence volume from project knowledge volume.

The durable lifecycle is:

`OBSERVE → RECORD → UNDERSTAND → CLASSIFY → ALIGN → VALIDATE → ENDORSE/REJECT/DEFER → DISTILL DURABLE KNOWLEDGE → RETAIN / ARCHIVE / DELETE REDUNDANCY`

Before Classify on a non-trivial approach, search existing durable knowledge for prior experiments, dead ends, guardrails, and relevant decisions.

A disproven hypothesis must not be retried without new evidence or a changed contract.

## 6. Proven Mechanism Rule

The T01/T02 browser-verification mechanism is the proven browser-execution baseline.

A later milestone does not justify a new browser workflow, runner, or harness merely because the milestone has a different name.

Before adding automation:

`existing mechanism → historical proof → actual limitation → materially different requirement → bounded change`

A failed application assertion is not by itself evidence that CI infrastructure is defective. Separate infrastructure failures from application/runtime failures before changing runners.

Retired workflows and their historical runs are evidence/history, not current automation authorities.

## 7. Current P04 Boundary

The designated P-series team owns P04.3–P04.6.

The latest P04 evidence established that the CI/browser environment can reach checkout, Node/npm, external Three.js, Chromium, focused execution, and artifact upload. Current P04 failure evidence remains an application/runtime/GLB availability problem, not permission to create another browser workflow.

Do not weaken P04 assertions, invent geometry, promote base64 workarounds, or reopen disproven module-resolution hypotheses without new evidence.

## 8. E-Series Overlay

The execution-system sequence is:

`E0 → E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8`

It is an overlay on the product lineage, never a replacement chronology.

### E0 — Project-wide evaluation
Retained and rebaselined. Established the gap map between Universal Agent mechanisms and HomeFinder's existing governance.

### E1 — Governance / skill equalization
Retained. `MASTER_SKILL.md` v1.2 is the single canonical execution skill.

### E2 — Execution trace / impact-aware updates
Retained. `.agent/sessions/`, `scripts/session_logger.py`, and the canonical impact-aware update protocol govern session continuity.

### E3 — Census / inventory foundation
Retained. Source-first census precedes transformation; checked-out source state is required for authoritative totals.

### E4 — Knowledge / anti-repeat
Retained. `PRODUCT-KNOWLEDGE.md` remains the durable knowledge authority; `.agent/knowledge/` is derived navigation state.

### E5 — Artifact / build provenance
Retained. `builds.json` records GitHub/Vercel provenance and never equates deployment readiness with runtime success.

### E6 — Structural intelligence
Retained. `.agent/structural/` is derived structural navigation state and does not replace domain-owned sources.

### E7 — Governance enforcement
Retained and endorsed. `.github/workflows/homefinder-execution-governance.yml` is the single E-series governance workflow; it is path-scoped, read-only, and does not execute product/P04 browser validation.

### E8 — Full integration
Retained and endorsed. `scripts/execution-system-integration.py` validates the E0–E7 chain as one coherent system while preserving masterplan authority and P-series delegation.

## 9. MR0 — Post-T02 Masterplan & Execution-Lineage Rebaseline

**Status: COMPLETE / VALIDATED / ENDORSED — 2026-09-01**

MR0 established:

`T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06`

T02–T06 are frozen sequential development lineage. T07 is frozen. P01–P06 is a separate post-T07 GLB track.

The E-series cannot outrun the masterplan. When chronology or authority is uncertain, stop and rebaseline.

Evidence:
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.md`
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.json`
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01-VALIDATION.md`

## 10. Final E-Series State

**E0 ✅ E1 ✅ E2 ✅ E3 ✅ E4 ✅ E5 ✅ E6 ✅ E7 ✅ E8 ✅**

The complete E-series execution system is handed over. It provides:

- canonical execution discipline;
- whole-project handover enforcement;
- anti-repeat memory;
- source-first inventory;
- artifact/build/deployment provenance;
- derived structural intelligence;
- read-only governance enforcement;
- integrated execution-system verification.

It does not own product acceptance, physical authority, or P-series runtime development.

## 11. Final Handover / Development-Team Boundary

The E-series branch is `e/execution-system-2026-09-01`.

The P-series product branch remains `p04/glb-runtime-restored-2026-09-01` and is owned by the designated development/validation teams.

No E-series change should be used as a reason to merge PR #6, reopen P04, mutate SH3D, or rewrite history.

The next product session must start from the whole-project `HandOver.md`, `Endorsement.md`, this masterplan, and the designated P-series evidence.

## 12. Success Criteria

HomeFinder succeeds when current architecture is provable, not merely visually convincing:

- canonical authority remains protected;
- application/security boundaries remain intact;
- promoted physical routes/cameras are evidence-backed;
- browser validation reflects current architecture;
- historical evidence remains deliberate;
- repeated AI trial-and-error decreases;
- redundant repository material is removed only after its knowledge/evidence role is reconciled.

## 13. Continuity Sources

- `project-guide/HandOver.md` — single whole-project handover authority.
- `project-guide/Endorsement.md` — chronological gate ledger.
- `project-guide/masterplan.md` — durable architecture and chronology.
- `project-guide/AI_ASSISTANT_READ_ME.md` — small current AI orientation layer.
- `project-guide/DOCUMENTATION-MAP.md` — documentation ownership/routing.
- `project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` — knowledge promotion/deletion lifecycle.
- `MASTER_SKILL.md` — single canonical execution skill.
- `docs/execution-system/` — E-series findings, machine state, validation, and integration evidence.

## 14. Final E-Series Checkpoint

After E8 closure, the final checkpoint is a whole-project package containing the reconciled project state plus all endorsed E-series execution-system evidence. The checkpoint must not claim completion of P01–P06 merely because the E-series is complete.
