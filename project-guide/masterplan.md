# HomeFinder Masterplan — Project Handover & Execution Authority

## 0. Current Execution Pointer — 2026-09-01

- **Project discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.
- **T07:** FROZEN.
- **P04 Spatial / Visual Validation:** ACTIVE; P04.0–P04.2 accepted, P04.3–P04.6 not endorsed.
- **Current P04 branch:** `p04/glb-runtime-restored-2026-09-01`.
- **Current validation PR:** #6, draft/unmerged.
- **Canonical physical authority:** `master/HomeFinder.sh3d`.
- **Current P04 blocker:** approved GLB binaries are preserved as evidence but are not yet repository-backed at their required runtime paths.
- **Execution-system milestones:** E0, E1, E2, E3, E4, E5, and E6 implemented/validated/endorsed on the current P04 line.
- **Current execution-system gate:** E7 — Automated Enforcement.

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
Repository / test authority
        ↓
Historical-path reconciliation
        ↓
UI / DOM / CSS / JS census
        ↓
Three-house semantic allocation
        ↓
SH3D reconciliation
        ↓
Camera / route certification
        ↓
Browser verification
        ↓
Production integration / polish
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

HomeFinder now extends the project discipline with an execution-system sequence:

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

### E0–E6 adopted principles

- One canonical `MASTER_SKILL.md`; no parallel skill architecture.
- Handover scope is always the complete HomeFinder project state.
- Sessions are traceable from start through close.
- File-update requirements are impact-aware: LOCAL, BOUNDED, SYSTEMIC.
- Inventory is source-first and precedes transformation.
- Existing semantic dictionaries and detailed 3D census records keep ownership of the meanings they already define.
- Census output is derived state and never overrides project authority.
- Remote/incomplete API views are not promoted as full structural counts when a checked-out source census is required.
- E5 provenance records exact source commits for GitHub artifacts and Vercel deployments and never equates deployment READY with runtime success.
- E6 structural intelligence is a derived cross-reference layer; it does not replace domain-owned structural sources or canonical project authorities.

### E0–E6 implementation owners

E3:
- `scripts/census.py`
- `.agent/census/census.config.json`
- `project-guide/repository-governance/CENSUS-AND-INVENTORY.md`
- `docs/census/`

E4:
- `.agent/knowledge/ANTI-REPEAT-INDEX.json`
- `scripts/knowledge-search.py`
- `project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md`

E5:
- `E5-CANONICAL-BUILD-PROVENANCE.md`
- `builds.json`
- `build-provenance.py`
- `docs/provenance/`

E6:
- `.agent/structural/structural-index.config.json`
- `.agent/structural/STRUCTURAL-INDEX.json`
- `scripts/structural-index.py`
- `project-guide/repository-governance/STRUCTURAL-INTELLIGENCE.md`
- `docs/architecture/E6-STRUCTURAL-INTELLIGENCE-FINDINGS-2026-09-01.md`
- `docs/architecture/E6-VALIDATION-2026-09-01.md`

E6 outcome:

HomeFinder already contains substantial domain-owned structural intelligence. The demonstrated missing capability was reliable cross-domain discovery and lineage. Therefore E6 adopts a derived structural navigation index and metadata-only procedure selection, while deferring autonomous orchestration, architecture-map replacement, structural-source consolidation, and any new semantic dictionary.

The next execution-system gate is **E7 — Automated Enforcement**.

E7 must enforce already-understood rules. It must not invent new governance or silently widen the scope of E6.
