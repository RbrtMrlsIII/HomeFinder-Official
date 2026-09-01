# HomeFinder — AI Assistant Continuity

This is the small, current orientation layer for AI-assisted sessions. It prevents resolved investigations, obsolete experiments, wrong authority assumptions, duplicate automation, repeated trial-and-error, and recursive checkpoint packaging. Detailed evidence remains in its owning documents.

## Current continuity — 2026-09-01

**Product/P-series:** P01–P03 and P04.0–P04.3 are accepted. **P04.4–P04.5 remain unendorsed/open; P04.6 is held for final P04 endorsement.** P05/P06 are held until authoritative acceptance specifications exist. The E-series does not authorize, mutate, or accept P-series work.

**E-series:** E0–E8 are complete, validated, and endorsed as the execution-system capability layer. Final E-series branch: `e/execution-system-2026-09-01`.

**Canonical product chronology:** `T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06`.

**Authority rule:** the masterplan/development chronology outranks execution-system convenience. The E-series is an overlay and can never replace, reorder, reopen, or authorize a product-development gate.

**Physical authority:** `master/HomeFinder.sh3d` remains the sole canonical SH3D source. The E-series never changes physical authority.

**GitHub:** `main` remains protected from active product/E-series mutation without an explicit integration gate. Historical PRs and red workflow results remain evidence and are not to be rewritten merely to improve status appearance.

## Mandatory execution discipline

Every gate follows:

`Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance`

Every gate has a mandatory whole-project `project-guide/HandOver.md` handover. Findings, machine-readable state where appropriate, validation evidence, endorsement state, knowledge-distillation assessment, and continuation point accompany that handover.

A finding is not permission to implement or delete. Resolve authority, consumers, impact, and evidence first.

## GitHub binary-upload rule

When a gate requires a binary artifact to be uploaded to GitHub, the AI assistant MUST tell the user explicitly that a manual GitHub upload is required whenever the available GitHub integration cannot safely upload the binary itself. The assistant MUST provide a step-by-step, branch-specific upload guide before asking the user to act.

The guide MUST identify:

1. the exact repository;
2. the exact target branch;
3. the exact destination directory/path for each binary;
4. the exact filename(s) expected;
5. the commit destination, with explicit warning not to commit to `main` when the work is isolated;
6. any files that must not be renamed, deleted, or replaced;
7. the precise point where the user must stop and report completion so the AI can verify the uploaded object before further work.

Never instruct a user to invent a directory structure or upload into an unverified branch/path. First inspect the live repository tree and give directions from the actual current state. Never use placeholder Base64 such as `AAAA...`, fabricated binary content, or weakened checks as a substitute for a real binary upload. Binary integrity and expected hashes MUST be verified after upload before the artifact is treated as promoted.

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

E7/E8 are governance/integration capabilities only; they do not become P-series product acceptance gates.

## Checkpoint packaging rule

A whole-project checkpoint is a single current project baseline plus the minimum evidence needed for continuity. Never recursively embed a previous whole-project ZIP, a prior checkpoint directory, or multiple identical project baselines.

Historical evidence must remain traceable, but traceability does not require repeated physical copies in every checkpoint. Use a concise evidence/retention index containing filename, size/hash where available, and retention reason. The original evidence archive remains the source for immutable historical payloads.

Before packaging, perform a source-first census and duplicate-path check. After packaging, verify entry count, source baseline singularity, major binary uniqueness, and final checkpoint hash.

## Durable P/E boundaries

- Existing semantic dictionary remains `active_development/data/dictionary.json`.
- Existing authored-model census remains `active_development/3d/docs/model-census.json`.
- E6 structural intelligence is derived navigation state, never authority.
- E5 provenance records exact source commits and keeps deployment evidence separate from runtime success.
- E7/E8 are execution-system capabilities, not product acceptance gates.
- `master/HomeFinder.sh3d` remains protected.
- P01–P06 remain delegated product work.
- Do not create another permanent skill, dictionary, handover, workflow owner, or product-browser runner without new evidence and a bounded gate.
- Do not treat stale E0–E6 continuity text on a product branch as stronger than the endorsed E0–E8 state; reconcile branch-local documentation before advancing.
- A successful P04.3 browser gate does not pre-accept P04.4, P04.5, or P04.6.

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

## P04.3 validated state

P04.3 ✅ accepted by fresh GitHub Actions Chromium validation run `33503413059` / job `99841751786`. Exact approved repository-backed GLBs passed SHA-256 verification and the existing P04 browser assertions passed.

Next gate: **P04.4 fresh screenshot/visual review**.

## Primary continuity sources

`project-guide/HandOver.md` — whole-project current state and continuation point.

`project-guide/Endorsement.md` — chronological gate ledger.

`project-guide/masterplan.md` — durable chronology and architecture authority.

`project-guide/DOCUMENTATION-MAP.md` — documentation ownership/routing.

`project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md` — knowledge promotion/deletion lifecycle.

`MASTER_SKILL.md` — one canonical execution skill (v1.3).

`CODING-INSTRUCTIONS.md` — project-specific coding guidance; it must not override the canonical skill or current authority.

## Session-start rule

Read, in order:

1. `README.md`
2. `project-guide/AI_ASSISTANT_READ_ME.md`
3. `project-guide/HandOver.md`
4. `project-guide/Endorsement.md`
5. `project-guide/masterplan.md`
6. `MASTER_SKILL.md` and `CODING-INSTRUCTIONS.md`
7. relevant authority contracts and detailed evidence

Before Classify on a non-trivial approach, perform the E4 anti-repeat search.

Before automation changes, inspect proven GitHub/Vercel mechanisms and historical proof.

Before product development, verify the masterplan's permitted next gate.

Before checkpoint creation, verify single-baseline packaging and preserve historical evidence by reference rather than recursive duplication.

Do not reconstruct old history from nested ZIPs when current canonical records exist.
Do not repeat disproven hypotheses without new evidence.
Do not delete detailed findings before knowledge/evidence reconciliation.
