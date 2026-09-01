# HomeFinder Masterplan — Project Handover & Execution Authority

## 0. Current Execution Pointer — 2026-09-01

- **Project discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.
- **Post-T02 rebaseline:** MR0 completed and endorsed. Canonical development lineage is T02 → T03 → T04 → T05 → T06 → T07 (frozen) → post-T07 P01→P06.
- **T07:** FROZEN.
- **P04 Spatial / Visual Validation:** ACTIVE; P04.0–P04.2 accepted, P04.3–P04.6 not endorsed.
- **Current P04 branch:** `p04/glb-runtime-restored-2026-09-01`.
- **Current validation PR:** #6, draft/unmerged.
- **Canonical physical authority:** `master/HomeFinder.sh3d`.
- **Current P04 blocker:** approved GLB binaries are preserved as evidence but are not yet repository-backed at their required runtime paths.
- **Execution-system milestones:** E0–E6 capability layers retained; E7 and E8 held pending CI/execution-system reconciliation.
- **Current execution-system gate:** CI / Execution-System Integration Reconciliation.

This file is the compact project-wide policy/architecture document. Detailed historical execution records remain in Git history and designated evidence/archive locations. Do not reconstruct those records here.

---

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

---

## 2. Canonical Authorities

### 3D

`master/HomeFinder.sh3d` is the sole canonical SH3D authority.

Do not:

- create a competing SH3D authority;
- overwrite canonical geometry with an unvalidated candidate;
- rename the canonical model during 3D execution;
- restore superseded WalkMyPlan architecture to make historical tests green.

### Application

Current application/security/data contracts remain authoritative outside SH3D.

### Historical evidence

Archives, checkpoints, reports, screenshots, traces, and historical snapshots are evidence unless the newest endorsed canonical state promotes them to current authority.

---

## 3. Three-House Semantic Model

- **House 1:** Public / Hero.
- **House 2:** Operations + Broker.
- **House 3:** Seeker + Owner.

House assignment is semantic architecture; source SH3D level IDs are not assumed to be globally house-unique.

House 2 ↔ House 3 direct physical traversal is forbidden. Logical transport remains hub-routed through House 1 unless a later project-owner decision changes that authority.

Never equate page count, DOM count, physical-room count, camera count, or door count one-to-one.

---

## 4. Execution Discipline

Every gate produces four mandatory outputs:

1. human-readable findings;
2. machine-readable registry/manifest where appropriate;
3. validation/test evidence;
4. team handover/checkpoint.

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

---

## 5. Minimal Knowledge Accretion

HomeFinder intentionally separates **evidence volume** from **project knowledge volume**.

Detailed findings may be large. Durable AI memory must stay small.

The canonical lifecycle is:

```text
OBSERVE → RECORD → UNDERSTAND → CLASSIFY → ALIGN → VALIDATE
                           ↓
                 ENDORSE / REJECT / DEFER
                           ↓
              DISTILL DURABLE KNOWLEDGE
                           ↓
                AI_ASSISTANT_READ_ME.md
                           ↓
           ARCHIVE / DELETE REDUNDANT DETAIL
```

The operating procedure is `project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md`.

A finding may enter `AI_ASSISTANT_READ_ME.md` only when it is verified, reusable, actionable, sufficiently stable, and traceable to evidence.

The AI orientation layer stores:

- current state and next gate;
- canonical authority/protected boundaries;
- verified facts that prevent repeated experiments;
- durable decisions and prohibitions;
- proven validation entry points;
- deferred or blocked work;
- pointers to detailed evidence.

It does **not** store raw logs, full reports, large manifests, screenshots, traces, or duplicate contract text.

### Anti-trial-and-error memory

Meaningful investigations should reduce to:

```text
HYPOTHESIS → TEST → RESULT → CORRECT INTERPRETATION → FUTURE ACTION / AVOIDANCE
```

A disproven hypothesis must not be retried without new evidence or a changed contract.

---

## 6. Findings and Deletion Policy

A detailed findings document is a deletion candidate only after:

- unique knowledge has been distilled into its proper canonical layer;
- active references have been reconciled;
- its evidence role has a deliberate retention decision;
- no active gate depends on it;
- historical significance has been classified.

Deletion is the final step of reconciliation, never the first step.

Useful historical evidence remains available through designated archive/evidence locations or Git history.

---

## 7. Current P04 Knowledge

The latest dedicated Chromium execution proved the CI environment, Node/npm setup, external Three.js dependency reachability, browser-test installation, Chromium installation, and evidence upload path.

The import-map/bootstrap correction is no longer the active hypothesis: the runtime stage reports `data-renderer="three-glb"`.

The active failure is `data-glb-loaded="false"` because the repository checkout does not contain the approved GLB binaries at the required target paths.

Git history checks for the canonical T02/T03/T04 GLB paths returned no prior commits, so there is no historical Git copy to restore.

The four exact approved GLBs remain preserved in the handoff evidence package with authoritative SHA-256 values. Repository-backed binary promotion is therefore the next P04 prerequisite.

Do not weaken P04 assertions, substitute placeholder geometry, or reopen already-disproven infrastructure hypotheses without new evidence.

---

## 8. Browser Verification Policy

Approved browser stack:

`Playwright Test → Chromium → reproducible CI`

Start with Chromium only. Expand the browser matrix only when a product requirement or demonstrated defect justifies it.

Browser evidence is an acceptance layer above deterministic tests; it does not replace current MJS/contracts or canonical SH3D authority.

Failure/retry artifacts should be diagnostic and retained deliberately.

Production credentials must never be required for browser verification.

### Proven mechanism rule

The T01/T02 browser-verification path is the project's proven execution baseline. A new milestone does not justify a new browser workflow, runner, or test harness by itself. A materially different execution requirement must be demonstrated before a separate workflow is designed.

---

## 9. 3D / Navigation Guardrails

- Cameras are authored, not invented by UI code.
- Physical traversal requires valid spatial evidence.
- Logical destination requests do not constitute physical-route proof.
- Page-exit confirmation is one logical decision; intermediate doors are traversal mechanics.
- Source cameras in staged SH3D inputs are evidence, not authority, until separately accepted.
- Additional-house merges require deterministic ID/resource reconciliation and physical validation before canonical acceptance.
- Canonical SH3D remains protected until the relevant gate explicitly endorses a merge.

---

## 10. Chronological Strategy

The master chronology remains the source of sequencing; later visual work must not bypass unresolved earlier authority.

```text
T02
 ↓
T03
 ↓
T04
 ↓
T05
 ↓
T06
 ↓
T07 (FROZEN)
 ↓
P01 → P02 → P03 → P04 → P05 → P06
```

The execution-system sequence is an overlay:

```text
E0 → E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8
                 (supports the masterplan; never replaces it)
```

Post-T07 GLB promotion remains a separate controlled track and must continue through its own evidence gates.

---

## 11. Handover Rule

A new session starts from **current state**, not historical assumptions:

1. `AI_ASSISTANT_READ_ME.md`
2. `HandOver.md`
3. `Endorsement.md`
4. this `masterplan.md`
5. current authority contracts/manifests
6. detailed evidence for the active gate

Whole-project `HandOver.md` is mandatory at every gate. It is not an optional addendum.

Do not duplicate history into the orientation layer. Do not delete detailed evidence until knowledge promotion and reconciliation are complete.

---

## 12. Project Success

HomeFinder succeeds when current architecture is provable, not merely visually convincing:

- canonical authority remains protected;
- application/security boundaries remain intact;
- every promoted physical route/camera is evidence-backed;
- browser validation reflects the current architecture;
- historical evidence remains deliberate rather than accidental;
- repeated AI trial-and-error decreases over time;
- repository size stays minimal by deleting redundancy **after** knowledge has been preserved.

---

## 13. Execution-System Equalization

HomeFinder extends the project discipline with the following capability sequence, but the masterplan remains primary:

```text
E0 Project-wide evaluation
      ↓
E1 Governance / skill equalization
      ↓
E2 Execution trace / impact-aware updates
      ↓
E3 Project census / inventory
      ↓
E4 Knowledge / anti-repeat
      ↓
E5 Artifact / build provenance
      ↓
E6 Structural intelligence
      ↓
E7 Automated enforcement
      ↓
E8 Full integration
```

### Program-level integration rule

The E-series must extend existing HomeFinder architecture and proven mechanisms rather than create parallel governance, workflow, or authority systems.

MR0 — Post-T02 Masterplan & Execution-Lineage Rebaseline — is now endorsed. It established the canonical post-T02 lineage as T02→T03→T04→T05→T06→T07(frozen)→P01…P06 and classified E0–E8 as an overlay.

E0–E6 remain individually endorsed capabilities, subject to the corrected lineage and integration boundaries. E7 remains **not endorsed** until CI/execution integration is reconciled. E8 remains held.

The current CI state is intentionally a clean slate: no active `.github/workflows/` automation remains on the current clean P04 validation branch after the workflow-retirement reconciliation. Historical workflow runs are evidence only. A future CI design must first reconcile the proven T01/T02 browser-validation model with current product requirements before introducing any new workflow owner.

The pre-existing privileged `AI_Key.yml` design is also no longer an active workflow on the clean branch and remains a historical/security finding requiring its own explicit review before any privileged automation is reintroduced.

## 14. MR0 — Post-T02 Masterplan & Execution-Lineage Rebaseline

**Status: COMPLETE / VALIDATED / ENDORSED — 2026-09-01**

MR0 was executed as a whole-project foundation gate. It reconstructed the canonical post-T02 development lineage from the masterplan and reconciled the E-series against it.

### Canonical lineage

`T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06`

T02–T06 are frozen sequential development gates. T07 is frozen. P01–P06 is the separate post-T07 GLB track.

### E-series treatment

| E milestone | MR0 disposition |
|---|---|
| E0 | retain / rebaseline |
| E1 | retain |
| E2 | retain / extend |
| E3 | retain / rebaseline |
| E4 | retain / strengthen |
| E5 | retain / rebaseline |
| E6 | retain / hold for dependency check |
| E7 | hold |
| E8 | hold |

### Durable rules

- Masterplan development lineage outranks execution-system convenience.
- T02–T06 are frozen development lineage and must remain visible to future AI sessions.
- T07 is frozen; P01–P06 is a separate post-T07 GLB track.
- E-series capabilities support the masterplan but cannot outrun product authority.
- Proven T01/T02 browser verification is the default browser-execution baseline.
- A later execution-system milestone does not authorize reopening an earlier product gate or changing physical authority.
- A new CI workflow requires evidence of a materially different execution requirement and reconciliation with the proven browser path.

Evidence:
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.md`
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.json`
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01-VALIDATION.md`
- `.agent/sessions/session-2026-09-01-171800-MR0-CLOSURE.json`

MR0 did not mutate product runtime, canonical SH3D, GLB binaries, P04 acceptance criteria, or Git history. `main` remains separated from active MR0 gate artifacts; active rebaseline material lives on the P04 validation branch.
