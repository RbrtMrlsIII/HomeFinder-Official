# HomeFinder — AI Assistant Continuity

This is the small, current orientation layer for AI-assisted sessions. It prevents resolved investigations, obsolete experiments, wrong authority assumptions, duplicate automation, and repeated trial-and-error. Detailed evidence remains in its owning documents.

## Current continuity — 2026-09-01

**Product/P-series:** P01–P06 remain a separate development/validation track owned by their designated teams. Current P04.3–P04.6 are not endorsed. The E-series does not authorize, mutate, or accept P-series work.

**E-series:** E0–E8 are complete as an execution-system capability layer. Final E-series branch: `e/execution-system-2026-09-01`.

**Canonical product chronology:** `T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06`.

**Authority rule:** the masterplan/development chronology outranks execution-system convenience. The E-series is an overlay and can never replace, reorder, reopen, or authorize a product-development gate.

**Physical authority:** `master/HomeFinder.sh3d` remains the sole canonical SH3D source. The E-series never changes physical authority.

**GitHub:** PR #6 remains draft/unmerged validation history. No E-series merge or history rewrite was performed.

## Mandatory execution discipline

Every gate follows:

`Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance`

Every gate has a **mandatory whole-project `project-guide/HandOver.md` handover**. Findings, machine-readable state where appropriate, validation evidence, endorsement state, knowledge-distillation assessment, and continuation point accompany that handover.

A finding is not permission to implement or delete. Resolve authority, consumers, impact, and evidence first.

## Proven mechanisms / anti-repeat rule

HomeFinder already has proven execution mechanisms. Reuse them before inventing replacements.

The T01/T02 browser-verification mechanism is the proven browser-execution baseline. A later milestone does not justify another browser workflow merely because the milestone has a different name.

Before adding automation:

`existing mechanism → historical proof → actual limitation → materially different requirement → bounded change`

A failed application/runtime assertion is not by itself evidence of CI infrastructure failure. Separate infrastructure failure from application failure before changing runners or workflows.

Do not rerun T01/T02 merely to recreate confidence that historical evidence already established.

## E-series final architecture

`E0 Evaluation → E1 Governance/Skill → E2 Trace/Impact → E3 Census → E4 Knowledge/Anti-repeat → E5 Provenance → E6 Structural Intelligence → E7 Governance Enforcement → E8 Full Integration`

The E-series uses one canonical `MASTER_SKILL.md`, one whole-project handover authority, derived census/knowledge/structural state where appropriate, and one E-series governance workflow.

The E-series workflow is:

`.github/workflows/homefinder-execution-governance.yml`

It is **governance-only**, path-scoped to the E-series branch, uses `contents: read`, and must not run product/P04/browser validation.

E8's integrated verifier is:

`scripts/execution-system-integration.py`

The definitive E8 GitHub validation is run `33476234720`, job `99755973527`, which passed the E7 governance checks and the full E-series integration check.

## Durable E-series boundaries

- Existing semantic dictionary remains `active_development/data/dictionary.json`.
- Existing authored-model census remains `active_development/3d/docs/model-census.json`.
- E6 structural intelligence is derived navigation state, never authority.
- E5 provenance records exact source commits and keeps deployment evidence separate from runtime success.
- E7/E8 are enforcement/integration capabilities, not product acceptance gates.
- `master/HomeFinder.sh3d` remains protected.
- P01–P06 remain delegated product work.
- Do not create another permanent skill, dictionary, handover, workflow owner, or product-browser runner without new evidence and a bounded gate.

## Final E-series state

E0 ✅
E1 ✅
E2 ✅
E3 ✅
E4 ✅
E5 ✅
E6 ✅
E7 ✅
E8 ✅

The E-series is complete. The next work belongs to the designated product/P-series teams and must start from the whole-project `HandOver.md`, current masterplan, and current product evidence.

## Primary continuity sources

`project-guide/HandOver.md` — whole-project current state and continuation point.

`project-guide/Endorsement.md` — chronological gate ledger.

`project-guide/masterplan.md` — durable chronology and architecture authority.

`project-guide/DOCUMENTATION-MAP.md` — documentation ownership/routing.

`project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` — knowledge promotion/deletion lifecycle.

`MASTER_SKILL.md` — one canonical execution skill.

## E-series evidence

`docs/execution-system/` — E-series findings, machine state, validation, and integration evidence.

`.agent/sessions/` — machine-readable session traces.

`.agent/census/` — census configuration/derived state.

`.agent/knowledge/` — anti-repeat derived state.

`.agent/structural/` — structural-intelligence derived state.

`builds.json` / `build-provenance.py` — E5 provenance.

`scripts/execution-gate.py` — E7 read-only governance gate.

`scripts/execution-system-integration.py` — E8 full integration verifier.

## Session-start rule

Read, in order:

1. `README.md`
2. `project-guide/AI_ASSISTANT_READ_ME.md`
3. `project-guide/HandOver.md`
4. `project-guide/Endorsement.md`
5. `project-guide/masterplan.md`
6. relevant authority contracts and detailed evidence

Before Classify on a non-trivial approach, perform the E4 anti-repeat search.

Before automation changes, inspect proven GitHub/Vercel mechanisms and historical proof.

Before product development, verify the masterplan's permitted next gate.

Do not reconstruct old history from nested ZIPs when current canonical records exist.
Do not repeat disproven hypotheses without new evidence.
Do not delete detailed findings before knowledge/evidence reconciliation.
