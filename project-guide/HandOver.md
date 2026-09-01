# HomeFinder — Current HandOver

> Single live handover authority. Update this file after every execution gate.

## CURRENT STATE — POST-T07 / P02 ACCEPTED / P03 ACCEPTED / P04.1–P04.2 ACCEPTED / E0–E6 EXECUTION-SYSTEM FOUNDATION / MR0 POST-T02 REBASELINE — 2026-09-01

**Execution discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.

**T07:** FROZEN. Do not reopen T07 without an explicit new bounded gate.

**P02:** ACCEPTED. SH3D ↔ GLB correspondence remains the accepted lineage checkpoint. Historical T01–T02 execution evidence is already part of accepted lineage; do not rerun old ZIP evidence as if it were a new gate.

**P03:** ACCEPTED. Candidate-backed Chromium evidence previously established the H-03/H-07/H-08 selectable-camera contract. The approved candidate SHA-256 remains `f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed`.

**Current track:** P04 Spatial / Visual Validation plus execution-system and project-lineage reconciliation.

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
5. A clean isolation branch `p04/glb-runtime-restored-2026-09-01` was created from the P04 GLB runtime line. `main` was not modified for product runtime work.
6. The local browser-test server `/healthz` check returned HTTP 200. Local Playwright dependency installation timed out in the execution environment; no local pass was claimed.
7. Direct headless Chromium also failed to complete the local P04 DOM probe. The P04 runtime uses external Three.js/GLTFLoader modules, but later GitHub-hosted preflight proved the external CDN was reachable from CI.
8. The P04 acceptance assertions were not weakened during reconciliation.
9. Vercel project `home-finder-official` is linked to `RbrtMrlsIII/HomeFinder-Official`; E5 established that Vercel READY is deployment evidence, not browser/GLB proof.
10. The main application-facing viewer remains the Sweet Home 3D JS Viewer and continues to use `master/HomeFinder.sh3d` as physical authority. The P04 GLB viewer is a separate validation surface.
11. Temporary placeholder `.glb` files created during an attempted high-level GitHub contents upload were removed immediately. No corrupted binary remains in the clean branch; the failed attempt is preserved in Git history for auditability.
12. A controlled draft PR #6 remains unmerged and is treated as a validation/evidence vehicle, not canonical integration.
13. GitHub-hosted P04 run `33450763010` completed with infrastructure setup successful and focused P04 assertions failed at the renderer-mount boundary; evidence artifacts were uploaded.
14. The repair run `33451823171` likewise reached the focused runtime assertion layer and failed there; its artifact remains provenance evidence.
15. The final in-flight workflow run created during workflow retirement, `33471269425`, also completed runner setup, Chromium installation, P04 execution, and evidence upload successfully except for focused application/runtime assertions. Its result is historical evidence, not a reason to resurrect another workflow.
16. No old T01/T02 browser execution was rerun merely to recreate already-established confidence.

### MR0 — Post-T02 Masterplan & Execution-Lineage Rebaseline — 2026-09-01

17. **MR0:** EXECUTED / VALIDATED / ENDORSED as a whole-project foundation reconciliation.
18. The canonical product-development chronology is: **T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06**.
19. T02–T06 are frozen sequential development gates. Each gate remains bounded by its own execution structure and next-permitted-gate boundary. T07 is frozen.
20. P01–P06 is a separate post-T07 GLB track. It does not retroactively replace T02–T06 or T07 authority.
21. The E-series is an execution-system overlay: **E0 → E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8**. It supports, records, validates, and eventually enforces the product chronology; it never becomes a competing product-development chronology.
22. E0 is retained/rebaselined; E1 retained; E2 retained/extended; E3 retained/rebaselined; E4 retained/strengthened; E5 retained/rebaselined; E6 retained with dependency hold; E7 held; E8 held.
23. Durable rules promoted by MR0 include: masterplan lineage outranks execution-system convenience; T02–T06 remain visible frozen lineage; T07 remains frozen; P01–P06 remains separate; E-series cannot outrun product authority; and T01/T02 browser verification remains the default proven browser-execution baseline.
24. No product runtime, canonical SH3D, GLB binary, P04 acceptance criterion, PR merge, or Git history rewrite was performed by MR0.
25. MR0 evidence is recorded in `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.md`, `.json`, and `-VALIDATION.md`; the closure session is `.agent/sessions/session-2026-09-01-171800-MR0-CLOSURE.json`.

### Execution-system equalization — E0 / E1 / E2 / E3 / E4 / E5 / E6

26. **E0:** Project-wide execution-system evaluation completed and validated. Universal Agent mechanisms were mapped against existing HomeFinder governance; duplicate governance architectures were rejected.
27. **E1:** The single canonical `MASTER_SKILL.md` was promoted to v1.2. It covers equalized procedures for Product/Requirements, Architecture, Frontend/UI, Backend/API, Data/Storage, 3D/Spatial, GLB/Web Graphics, Browser/Runtime, Testing/QA, Security, CI/CD, Deployment/Hosting, Documentation/Knowledge, and Operations/Whole-Project Handover.
28. **E2:** Execution tracing and impact-aware file-update protocol implemented. A session trace is created before substantive mutation; changes are classified LOCAL, BOUNDED, or SYSTEMIC; canonical document updates are selected by impact rather than blanket duplication.
29. **E2 session logger:** `scripts/session_logger.py` is the canonical local helper for session start/action/close/verify operations.
30. **E2 protocol:** `project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md` defines the update chains and acceptance rules.
31. **E3:** Project-wide source-first census foundation implemented. `scripts/census.py` inventories repository files, UI/HTML surfaces, 3D assets, textures, tests, CI workflows, sessions, documentation, findings, and existing dictionary entries.
32. **E3 configuration:** `.agent/census/census.config.json` owns exclusions, semantic dictionary location, and configured forbidden-file patterns.
33. **E3 protocol:** `project-guide/repository-governance/CENSUS-AND-INVENTORY.md` defines inventory-before-transformation and the authority boundary for census outputs.
34. **E3 baseline:** `docs/census/E3-BASELINE-2026-09-01.md` and `.json` preserve only verified authored-model counts from the existing canonical 3D census; incomplete GitHub API tree views are not promoted as full project totals.
35. **E4:** Machine-readable anti-repeat index, deterministic knowledge search, and explicit pre-Classify knowledge check are implemented. `PRODUCT-KNOWLEDGE.md` remains the durable knowledge authority; the anti-repeat index is derived navigation state only.
36. **E4 anti-pattern coverage:** the index records 11 high-value HomeFinder dead ends/guardrails, including P04 module-resolution history, GLB availability, WalkMyPlan, SH3D authority, assertion weakening, invented spatial geometry, blanket documentation updates, incomplete census counts, duplicate dictionaries, and ungoverned history rewrites.
37. **E5:** Canonical artifact/build provenance is implemented and validated across HomeFinder, GitHub Actions, and Vercel. `E5-CANONICAL-BUILD-PROVENANCE.md` defines strict state transitions; `builds.json` contains concrete GitHub CI and Vercel provenance records; `build-provenance.py` records tooling and endorsement state; and E5 findings/validation documents preserve the evidence and dispositions.
38. **E6:** Structural Intelligence Reconciliation completed and endorsed. The evidence established that HomeFinder already has substantial domain-owned structural records, and the genuine execution gap was cross-domain discoverability/lineage rather than missing semantic or architectural authority.
39. **E6 adopted capability:** `.agent/structural/structural-index.config.json` + `.agent/structural/STRUCTURAL-INDEX.json` + `scripts/structural-index.py` provide a derived navigation index over existing structural sources. `project-guide/repository-governance/STRUCTURAL-INTELLIGENCE.md` defines its boundaries. The index does not replace the semantic dictionary, authored-model census, contracts, SH3D, `MASTER_SKILL.md`, `HandOver.md`, or `Endorsement.md`.
40. **E6 findings/validation:** `docs/architecture/E6-STRUCTURAL-INTELLIGENCE-FINDINGS-2026-09-01.md` and `.json` record eight classified findings and dispositions; `docs/architecture/E6-VALIDATION-2026-09-01.md` records source discovery, authority separation, relationship integrity, procedure-selection safety, and negative controls.

### CI / execution-system reconciliation

41. The repository's GitHub Actions surface has been intentionally cleared on the active P04 validation branch during CI reconciliation. Historical workflow runs remain evidence in GitHub; they are not current automation authorities.
42. Retired workflow names include `homefinder-browser.yml`, `homefinder-p04.yml`, `AI_Key.yml`, and the temporary E7 workflow. They must not be resurrected from old archives without a new evidence-backed CI gate.
43. The proven T01/T02 browser-verification mechanism remains the conceptual browser baseline. Any future CI implementation must first demonstrate why reuse/extension is insufficient and must have bounded trigger/ownership semantics.
44. The last in-flight P04 run `33471269425` is classified as historical evidence: checkout, Node/npm, external Three.js reachability, Chromium installation, focused P04 execution, and artifact upload all reached their expected infrastructure stages; the application/runtime assertions failed. This confirms the runner failure and application failure are distinct evidence dimensions.
45. No new browser workflow is currently authorized merely to make P04 green.

### Current evidence / protected state

- Approved GLB integrity: **verified 4/4**.
- P04 binary promotion: **not completed**; no workaround promotion endorsed.
- P04.3: **unchecked / blocked**.
- Current isolation branch: `p04/glb-runtime-restored-2026-09-01`.
- Current branch/PR ref state is maintained live in GitHub; this handover intentionally does not freeze transient commit counts.
- `main` is protected from active P04/product mutation and was restored from the accidental MR0 continuity write.
- Controlled PR #6: draft/unmerged; validation vehicle only.
- Main SH3D viewer: unchanged.
- Canonical physical authority: `master/HomeFinder.sh3d`.
- Current P04 viewer entrypoint: `active_development/3d/glb-viewer/index.html`.
- Current target manifest: `active_development/data/cinematic-3d-targets.json`.
- Canonical execution skill: `MASTER_SKILL.md` v1.2.
- E5 provenance specification: `E5-CANONICAL-BUILD-PROVENANCE.md`.
- E5 machine registry: `builds.json`.
- E5 helper: `build-provenance.py`.
- E6 structural protocol: `project-guide/repository-governance/STRUCTURAL-INTELLIGENCE.md`.
- E6 structural configuration: `.agent/structural/structural-index.config.json`.
- E6 structural index: `.agent/structural/STRUCTURAL-INDEX.json`.
- MR0 findings: `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.md`.
- MR0 machine state: `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.json`.
- MR0 validation: `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01-VALIDATION.md`.
- MR0 closure session: `.agent/sessions/session-2026-09-01-171800-MR0-CLOSURE.json`.

### Required next gate

1. Execute **CI / Execution-System Integration Reconciliation** as the next bounded gate.
2. Do not advance to E8.
3. Do not create a replacement browser workflow before reconciling the proven T01/T02 browser path against current needs.
4. Do not reinterpret historical workflow failures as evidence against the proven runner without new evidence.
5. Keep `master/HomeFinder.sh3d` and the main SH3D viewer untouched.
6. Keep P04 renderer/GLB acceptance separate; do not weaken its assertions.
7. Treat any future privileged automation as a separate security/governance gate.
8. Whole-project `HandOver.md` remains mandatory at every gate.
9. Before Classify on any non-trivial approach, perform the E4 anti-repeat search.
10. Before any new product-development room/gate, verify that the masterplan pointer is the permitted next step from the current frozen lineage.

**Physical authority:** `master/HomeFinder.sh3d` remains protected and is not mutated by P04. GLBs remain derived artifacts. Security/authorization remain outside SH3D.

## Mandatory continuity outputs

- `project-guide/HandOver.md` = latest whole-project state and continuation point.
- `project-guide/Endorsement.md` = chronological gate ledger.
- `project-guide/masterplan.md` = durable architecture/chronology.
- `project-guide/AI_ASSISTANT_READ_ME.md` = current continuity only.
- `project-guide/DOCUMENTATION-MAP.md` = documentation ownership and routing.
- Existing `docs/` audits/contracts = detailed evidence.
- `MASTER_SKILL.md` = single canonical execution skill.
- `.agent/sessions/` = machine-readable execution-session traces.
- `.agent/census/` = machine-readable census configuration/output.
- `.agent/knowledge/` = derived anti-repeat index.
- `.agent/structural/` = derived structural intelligence index/configuration; never an authority replacement.
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.md` = MR0 human-readable findings.
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01.json` = MR0 machine-readable state.
- `docs/execution-system/MR0-POST-T02-LINEAGE-REBASELINE-2026-09-01-VALIDATION.md` = MR0 validation evidence.
- `scripts/knowledge-search.py` = deterministic knowledge/anti-repeat search.
- `project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md` = E2 trace/update protocol.
- `project-guide/repository-governance/CENSUS-AND-INVENTORY.md` = E3 census protocol.
- `project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md` = E4 knowledge protocol.
- `E5-CANONICAL-BUILD-PROVENANCE.md` = E5 provenance protocol.
- `builds.json` = E5 machine-readable provenance registry.
- `build-provenance.py` = E5 reproducible provenance helper.
- `docs/provenance/E5-FINDINGS-2026-09-01.md` = E5 findings.
- `docs/provenance/E5-VALIDATION-2026-09-01.md` = E5 validation evidence.
- `project-guide/repository-governance/STRUCTURAL-INTELLIGENCE.md` = E6 structural-intelligence protocol.
- `scripts/structural-index.py` = E6 derived structural-intelligence generator.
- `docs/architecture/E6-STRUCTURAL-INTELLIGENCE-FINDINGS-2026-09-01.md` = E6 findings.
- `docs/architecture/E6-VALIDATION-2026-09-01.md` = E6 validation evidence.
- `docs/execution-system/E-SERIES-RECONCILIATION-2026-09-01.md` = whole E-series reconciliation findings.
- `docs/execution-system/E-SERIES-RECONCILIATION-2026-09-01.json` = whole E-series reconciliation machine state.
- `docs/execution-system/E-SERIES-RECONCILIATION-VALIDATION-2026-09-01.md` = whole E-series reconciliation validation evidence.

Do not create another handover file.
