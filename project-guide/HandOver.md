# HomeFinder — Current HandOver

> Single live whole-project handover authority.

## Current state — E-series complete / P-series continuation — 2026-09-01

**Product chronology:** T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06.

**Execution-system:** E0–E8 complete, validated, and endorsed as the execution-system overlay. No further E-series gate is required.

**Active product gate:** P04.4 → P04.5 → P04.6.

**Accepted:** P01, P02, P03, P04.0, P04.1, P04.2, **P04.3**.

**Unendorsed/blocked:** P04.4, P04.5.

**Held:** P04.6 pending fresh acceptance evidence and endorsement decision; P05/P06 held because no authoritative acceptance specification was found and no requirements are to be invented.

## P04.3 acceptance evidence

P04.3 was validated on the isolated branch `p04.3/binary-promotion-2026-09-01` by GitHub Actions run **33503413059** / job **99841751786**.

The workflow passed every step:

- repository checkout;
- Node setup;
- browser-test dependency installation;
- Chromium installation;
- exact SHA-256 verification of all four approved repository-backed GLBs;
- the existing `specs/p04-spatial-visual.spec.mjs` Chromium validation;
- browser report upload.

The P04 test covers renderer mounting, default target loading, `data-glb-loaded=true`, source-backed camera/scale/elevation propagation for T04, and successful switching/loading across all declared P04 targets. The generated browser report artifact is `homefinder-p04-spatial-report`, artifact ID `9798642846`, with SHA-256 digest `453dae772a323ef014022148546ea4af99121ccf34d54c09179825259fe10654`.

**P04.3 disposition: ACCEPTED.** This acceptance is limited to the validated P04.3 renderer/target/camera/scale/elevation and real repository-backed GLB loading evidence. It does not pre-accept P04.4, P04.5, or P04.6.

## P04.4 / P04.5 boundary

P04.4 remains open for fresh screenshot/visual review.

P04.5 remains open for explicit GLB binary browser-loading/correspondence review beyond the P04.3 gate evidence where required by the acceptance ledger.

The next permitted gate is therefore:

**P04.4 fresh screenshot/visual review → P04.5 GLB correspondence review → P04.6 fresh P04 endorsement decision.**

## Protected authority

`master/HomeFinder.sh3d` remains the sole canonical SH3D authority.

P-series GLBs remain derived artifacts and never replace SH3D authority.

The main application-facing viewer remains the Sweet Home 3D JS viewer. The P04 GLB viewer is a separate validation surface.

`main` remains protected from active P-series mutation without an explicit integration disposition.

## E-series handover

E0–E8 are complete and endorsed. E7/E8 are governance/integration capabilities only and do not endorse P04 runtime behavior or later product work.

The canonical execution skill is `MASTER_SKILL.md` v1.3. The skill now requires checkpoint packages to contain one project baseline, forbids recursive checkpoint embedding, requires explicit historical-evidence retention indexing, and requires guided user instructions for manual binary uploads when the available GitHub integration cannot safely upload them.

## Checkpoint packaging reconciliation

The 2026-09-01 uploaded checkpoint grew to more than 30 MB compressed because its project baseline was recursively duplicated under nested `_base` paths and major binaries were repeated. This is a packaging defect, not additional project completeness.

A clean checkpoint must retain one current project baseline, omit nested whole-project archives and duplicated baseline trees, keep historical evidence traceable by an evidence/retention index, and record the final package hash after assembly.

The clean local checkpoint produced by this reconciliation is `HomeFinder_E8_PSeries_Clean_2026-09-01.zip` (10,498,000 bytes compressed; SHA-256 `944690768e96cf9078497eb7adb57def7dd4abb6b286ca51e5f6a08fb2265956`).

No historical evidence is being silently deleted from its original source package; redundant physical copies are removed only from the new checkpoint.

## Required next action

Continue with P04.4 using the accepted P04.3 evidence as its predecessor. Do not reopen E0–E8. Do not invent P05/P06 requirements. Do not weaken P04 assertions. Do not mutate `master/HomeFinder.sh3d` to make a derivative or browser check pass.

Before packaging, run the source-first census and duplicate-baseline check.

## Continuity sources

- `project-guide/HandOver.md` — current whole-project state.
- `project-guide/Endorsement.md` — chronological gate status.
- `project-guide/masterplan.md` — durable chronology and architecture.
- `project-guide/AI_ASSISTANT_READ_ME.md` — current assistant orientation.
- `MASTER_SKILL.md` — canonical project execution skill v1.3.
- `CODING-INSTRUCTIONS.md` — project-specific coding guidance, subordinate to the canonical skill and current authority.
- `project-guide/skills/CHECKPOINT-PACKAGING-AND-CONTINUITY.md` — packaging/continuity operating procedure.
- `project-guide/P04-3-ACCEPTANCE-EVIDENCE-2026-09-01.json` — machine-readable P04.3 validation evidence.
