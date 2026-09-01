# HomeFinder — Current HandOver

> Single live handover authority. Update this file after every execution gate.

## CURRENT STATE — POST-T07 / P02 ACCEPTED / P03 ACCEPTED / P04.1–P04.2 ACCEPTED / E0–E5 EXECUTION-SYSTEM FOUNDATION — 2026-09-01

**Execution discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.

**T07:** FROZEN. Do not reopen T07 without an explicit new bounded gate.

**P02:** ACCEPTED. SH3D ↔ GLB correspondence remains the accepted lineage checkpoint. Historical T01–T02 execution evidence is already part of accepted lineage; do not rerun old ZIP evidence as if it were a new gate.

**P03:** ACCEPTED. Candidate-backed Chromium evidence previously established the H-03/H-07/H-08 selectable-camera contract. The approved candidate SHA-256 remains `f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed`.

**Current track:** P04 Spatial / Visual Validation plus execution-system equalization.

**P04.0 verdict:** BLOCKED by a test-harness/runtime-mount defect. The first focused P04 run targeted a GLB viewer route that did not exist in the checked-out repository. The missing viewer entrypoint and target manifest were subsequently added on the P04 line.

**P04.1:** ACCEPTED as the bounded missing-entrypoint/test-harness correction.

**P04.2:** ACCEPTED as the source-backed target manifest and runtime metadata contract.

### Fresh P04 execution reconciliation — 2026-09-01

1. The inherited handoff package contains the four approved P04 GLB binaries. Local SHA-256 and GLB-container structure checks passed for all four files.
2. The approved hashes are:
   - T02 `d3e1851fdf737dc59c4d4939b9aed6d6036c33d500a0bc2be0390130a91fc22d`
   - T03 `83d1eadf8ac940c213618e5afdd5f7d96b71e7f17aa61a7582d3516f6271020c`
   - T04 `330b4afc1068554abab84ac985e30f5cd39ec16887ee2f036a42424f7ddd57a0`
   - T05 `b71bc456b3fc1aaf4659926b2626da0d4bc61c47a8f495ff64043473d661f1e6`
3. The clean handoff also contains those four exact binaries at the manifest paths under `active_development/assets/t02` through `t05`; local checks confirmed the copies are byte-identical to the approved handoff copies.
4. The current P04 branch contains inherited base64 payload workaround artifacts instead of the canonical `.glb` files at those manifest paths. These workarounds remain historical/inherited evidence and are not being promoted as the runtime source.
5. A clean isolation branch `p04/glb-runtime-restored-2026-09-01` was created from the P04 GLB runtime line. `main` was not modified.
6. The local browser-test server `/healthz` check returned HTTP 200. Local Playwright dependency installation timed out in the execution environment; no local pass was claimed.
7. Direct headless Chromium also failed to complete the local P04 DOM probe. The P04 runtime uses external Three.js/GLTFLoader modules, but later GitHub-hosted preflight proved the external CDN was reachable from CI.
8. The P04 workflow was updated to run on the clean isolation branch and to preflight the external Three.js dependency before Chromium. The P04 acceptance assertions were not weakened.
9. Vercel project `home-finder-official` is linked to `RbrtMrlsIII/HomeFinder-Official`; the clean-branch deployment was READY during reconciliation. Deployment READY is not treated as browser/GLB proof.
10. The main application-facing viewer remains the Sweet Home 3D JS Viewer and continues to use `master/HomeFinder.sh3d` as physical authority. The P04 GLB viewer is a separate validation surface.
11. Temporary placeholder `.glb` files created during an attempted high-level GitHub contents upload were removed immediately. No corrupted binary remains in the clean branch; the failed attempt is preserved in Git history for auditability.
12. A controlled draft PR #6 was opened from the clean P04 branch to `main` solely to exercise GitHub-hosted validation. The PR remains unmerged.
13. GitHub-hosted P04 run `33450763010` completed with all infrastructure setup successful, including Three.js CDN preflight, npm installation, and Chromium installation. All 6 focused P04 tests failed at the common renderer-mount assertion; screenshots/traces were uploaded.
14. The first repair hypothesis identified a bare ESM `three` import boundary and an import-map correction was applied on the P04 validation viewer. A fresh run `33451823171` was triggered from that repair commit.
15. The current investigation must treat the renderer-mount failure as a P04 implementation/runtime defect. Do not infer GLB corruption or Chromium installation failure from the result.
16. Documentation continuity remains routed through `README.md`, `project-guide/DOCUMENTATION-MAP.md`, `project-guide/AI_ASSISTANT_READ_ME.md`, `project-guide/HandOver.md`, `project-guide/Endorsement.md`, `MASTER_SKILL.md`, `CODING-INSTRUCTIONS.md`, `PRODUCT-KNOWLEDGE.md`, and detailed `docs/` evidence.

### Execution-system equalization — E0 / E1 / E2 / E3 / E4 / E5

17. **E0:** Project-wide execution-system evaluation completed and validated. Universal Agent mechanisms were mapped against existing HomeFinder governance; duplicate governance architectures were rejected.
18. **E1:** The single canonical `MASTER_SKILL.md` was promoted to v1.2. It covers equalized procedures for Product/Requirements, Architecture, Frontend/UI, Backend/API, Data/Storage, 3D/Spatial, GLB/Web Graphics, Browser/Runtime, Testing/QA, Security, CI/CD, Deployment/Hosting, Documentation/Knowledge, and Operations/Whole-Project Handover.
19. **E2:** Execution tracing and impact-aware file-update protocol implemented. A session trace is created before substantive mutation; changes are classified LOCAL, BOUNDED, or SYSTEMIC; canonical document updates are selected by impact rather than blanket duplication.
20. **E2 session logger:** `scripts/session_logger.py` is the canonical local helper for session start/action/close/verify operations.
21. **E2 protocol:** `project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md` defines the update chains and acceptance rules.
22. **E3:** Project-wide source-first census foundation implemented. `scripts/census.py` inventories repository files, UI/HTML surfaces, 3D assets, textures, tests, CI workflows, sessions, documentation, findings, and existing dictionary entries.
23. **E3 configuration:** `.agent/census/census.config.json` owns exclusions, semantic dictionary location, and configured forbidden-file patterns.
24. **E3 protocol:** `project-guide/repository-governance/CENSUS-AND-INVENTORY.md` defines inventory-before-transformation and the authority boundary for census outputs.
25. **E3 baseline:** `docs/census/E3-BASELINE-2026-09-01.md` and `.json` preserve only verified authored-model counts from the existing canonical 3D census; incomplete GitHub API tree views are not promoted as full project totals.
26. **E4:** Machine-readable anti-repeat index, deterministic knowledge search, and explicit pre-Classify knowledge check are implemented. `PRODUCT-KNOWLEDGE.md` remains the durable knowledge authority; the anti-repeat index is derived navigation state only.
27. **E4 anti-pattern coverage:** the index records 11 high-value HomeFinder dead ends/guardrails, including P04 module-resolution history, GLB availability, WalkMyPlan, SH3D authority, assertion weakening, invented spatial geometry, blanket documentation updates, incomplete census counts, duplicate dictionaries, and ungoverned history rewrites.
28. **E5:** Canonical artifact/build provenance is implemented and validated across HomeFinder, GitHub Actions, and Vercel. `E5-CANONICAL-BUILD-PROVENANCE.md` defines strict state transitions; `builds.json` contains concrete GitHub CI and Vercel provenance records; `build-provenance.py` records tooling and endorsement state; and `E5-BASELINE-2026-09-01.json` records the final cross-platform evidence.
29. **E5 GitHub provenance:** workflow run `33451823171` on source commit `5c9903113010d88c6a91677dc3709552bc297ed0` failed focused P04 runtime validation but successfully uploaded artifact `9780126370` (`homefinder-p04-playwright-report`) with SHA-256 `d4e59131592c7af694b222726c603c3fa5683cf392cd1e876953632402cdec67`. This is evidence provenance, not P04 success.
30. **E5 Vercel provenance:** deployment `dpl_5Fi2KT76WLu7zUFH1wcu3yPPU6Nj` reached `READY` for source commit `d2149c79d8197d6ee7879f9ad677bd959808db7f` on the same P04 branch. READY is deployment evidence only, not runtime/GLB acceptance.
31. **E5 findings/validation:** `docs/provenance/E5-FINDINGS-2026-09-01.md` records observations, classifications, dispositions, and the explicit knowledge-distillation assessment; `docs/provenance/E5-VALIDATION-2026-09-01.md` records GitHub and Vercel validation evidence and protected boundaries.
32. **E5 session:** `.agent/sessions/session-2026-09-01-114800-E5-PROMOTION.json` was created before substantive mutation, records the full execution lifecycle, and is closed as `COMPLETED_VALIDATED_ENDORSED`.
33. No second skill, handover, dictionary, or parallel governance authority was created. The prepared E5 handover addendum was treated as source material only and was not promoted as a second handover file.

### Current evidence

- Approved GLB integrity: **verified 4/4**.
- P04 binary promotion: **not completed**; no workaround promotion endorsed.
- P04.3: **unchecked / blocked**.
- Current isolation branch: `p04/glb-runtime-restored-2026-09-01`.
- Current branch/PR ref state is maintained live in GitHub; this handover intentionally does not freeze a transient commit-count/HEAD snapshot.
- `main` was not modified by E5.
- Controlled PR: `#6` (draft, unmerged). The branch remains a validation vehicle and must not be merged or history-rewritten without an explicit GitHub branch-ownership/reconciliation gate.
- Main SH3D viewer: unchanged.
- Current P04 viewer entrypoint: `active_development/3d/glb-viewer/index.html`.
- Current target manifest: `active_development/data/cinematic-3d-targets.json`.
- Current documentation routing: `project-guide/DOCUMENTATION-MAP.md`.
- Canonical execution skill: `MASTER_SKILL.md` v1.2.
- E2 session trace: `.agent/sessions/session-2026-09-01-024100.json`.
- E3 session trace: `.agent/sessions/session-2026-09-01-025600-E3.json`.
- E3 census tool: `scripts/census.py`.
- E3 census configuration: `.agent/census/census.config.json`.
- E4 knowledge index: `.agent/knowledge/ANTI-REPEAT-INDEX.json`.
- E4 search tool: `scripts/knowledge-search.py`.
- E4 protocol: `project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md`.
- E4 evidence: `docs/knowledge/E4-BASELINE-2026-09-01.md`.
- E5 provenance specification: `E5-CANONICAL-BUILD-PROVENANCE.md`.
- E5 machine registry: `builds.json`.
- E5 helper: `build-provenance.py`.
- E5 findings: `docs/provenance/E5-FINDINGS-2026-09-01.md`.
- E5 validation: `docs/provenance/E5-VALIDATION-2026-09-01.md`.
- E5 baseline: `E5-BASELINE-2026-09-01.json`.
- E5 promotion session: `.agent/sessions/session-2026-09-01-114800-E5-PROMOTION.json`.

### Required next gate

1. Continue P04 renderer/GLB reconciliation only from fresh evidence; keep assertions unchanged.
2. Keep `master/HomeFinder.sh3d` and the main SH3D viewer untouched.
3. Do not rerun historical T01–T02 ZIP evidence as a substitute for current execution.
4. Only after fresh Chromium reaches `data-renderer="three-glb"` and `data-glb-loaded="true"` should the remaining P04 assertions advance.
5. The next execution-system gate after E5 is **E6 — Structural Intelligence**.
6. For every substantive session, create the session trace before mutation and classify each change by impact.
7. Run the project-wide census from a checked-out repository when a real structural baseline is required; do not use a truncated remote API response as a substitute.
8. Do not merge PR #6 or force-rewrite its history until the branch's intended ownership is explicitly reconciled.
9. Before Classify on a non-trivial approach, run the E4 knowledge search and inspect any strong anti-pattern match against current evidence.

**Physical authority:** `master/HomeFinder.sh3d` remains protected and is not mutated by P04. GLBs remain derived artifacts. Security/authorization remain outside SH3D.

## Mandatory continuity outputs

- `project-guide/HandOver.md` = latest whole-project state and continuation point.
- `project-guide/Endorsement.md` = chronological execution ledger.
- `project-guide/masterplan.md` = durable architecture/chronology.
- `project-guide/AI_ASSISTANT_READ_ME.md` = current continuity only.
- `project-guide/DOCUMENTATION-MAP.md` = documentation ownership and routing.
- Existing `docs/` audits/contracts = detailed evidence.
- `MASTER_SKILL.md` = single canonical execution skill.
- `.agent/sessions/` = machine-readable session traces.
- `.agent/census/` = machine-readable census configuration/output.
- `.agent/knowledge/` = derived anti-repeat index.
- `scripts/knowledge-search.py` = deterministic knowledge/anti-repeat search.
- `project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md` = E2 trace/update protocol.
- `project-guide/repository-governance/CENSUS-AND-INVENTORY.md` = E3 census protocol.
- `project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md` = E4 knowledge protocol.
- `E5-CANONICAL-BUILD-PROVENANCE.md` = E5 provenance protocol.
- `builds.json` = E5 machine-readable provenance registry.
- `build-provenance.py` = E5 reproducible provenance helper.
- `docs/provenance/E5-FINDINGS-2026-09-01.md` = E5 human-readable findings.
- `docs/provenance/E5-VALIDATION-2026-09-01.md` = E5 validation evidence.

Do not create another handover file.
