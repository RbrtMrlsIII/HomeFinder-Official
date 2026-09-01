# HomeFinder — Current HandOver

> Single live whole-project handover authority.

## Current state — E-series complete / P-series continuation — 2026-09-01

**Product chronology:** T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06.

**Execution-system:** E0–E8 complete, validated, and endorsed as the execution-system overlay. No further E-series gate is required.

**Active product gate:** P04.3 → P04.4 → P04.5 → P04.6.

**Accepted:** P01, P02, P03, P04.0, P04.1, P04.2.

**Unendorsed/blocked:** P04.3, P04.4, P04.5.

**Held:** P04.6 pending the fresh acceptance evidence and endorsement decision; P05/P06 held because no authoritative acceptance specification was found and no requirements are to be invented.

## P04 evidence boundary

The final whole-project evidence package contains the four approved GLBs. Static SHA-256 and GLB v2 structural checks pass 4/4.

The live P-series branch does not yet contain those approved binary objects at the canonical runtime paths. The real Chromium validation therefore fails closed at binary availability rather than substituting placeholders, mocks, or invented geometry.

The next P04 unlock remains:

**binary-safe promotion of the exact four approved GLBs into the canonical repository paths → fresh real Chromium validation → screenshot review → P04.3/P04.4/P04.5 evidence review → P04.6 endorsement decision.**

P04.1 is already accepted. It is not an outstanding gate.

## Protected authority

`master/HomeFinder.sh3d` remains the sole canonical SH3D authority.

P-series GLBs remain derived artifacts and never replace SH3D authority.

The main application-facing viewer remains the Sweet Home 3D JS viewer. The P04 GLB viewer is a separate validation surface.

`main` remains protected from active P-series mutation without an explicit integration disposition.

## E-series handover

E0–E8 are complete and endorsed. E7/E8 are governance/integration capabilities only and do not endorse P04 runtime behavior or later product work.

The canonical execution skill is `MASTER_SKILL.md` v1.3. The skill now requires checkpoint packages to contain one project baseline, forbids recursive checkpoint embedding, and requires explicit historical-evidence retention indexing.

## Checkpoint packaging reconciliation

The 2026-09-01 uploaded checkpoint grew to more than 30 MB compressed because its project baseline was recursively duplicated under nested `_base` paths and major binaries were repeated. This is a packaging defect, not additional project completeness.

A clean checkpoint must retain one current project baseline, omit nested whole-project archives and duplicated baseline trees, keep historical evidence traceable by an evidence/retention index, and record the final package hash after assembly.

No historical evidence is being silently deleted from its original source package; redundant physical copies are removed only from the new checkpoint.

## Required next action

Continue with P04.3 using the current product evidence. Do not reopen E0–E8. Do not invent P05/P06 requirements. Do not weaken P04 assertions. Do not mutate `master/HomeFinder.sh3d` to make a derivative or browser check pass.

Before any non-trivial implementation, perform the E4 anti-repeat search. Before binary promotion, verify exact SHA-256 correspondence. Before packaging, run the source-first census and duplicate-baseline check.

## Continuity sources

- `project-guide/HandOver.md` — current whole-project state.
- `project-guide/Endorsement.md` — chronological gate status.
- `project-guide/masterplan.md` — durable chronology and architecture.
- `project-guide/AI_ASSISTANT_READ_ME.md` — current assistant orientation.
- `MASTER_SKILL.md` — canonical project execution skill v1.3.
- `CODING-INSTRUCTIONS.md` — project-specific coding guidance, subordinate to the canonical skill and current authority.
- `project-guide/skills/CHECKPOINT-PACKAGING-AND-CONTINUITY.md` — packaging/continuity operating procedure.
