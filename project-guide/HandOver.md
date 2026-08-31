# HomeFinder — Current HandOver

> Single live handover authority. Update this file after every execution gate.

## CURRENT STATE — POST-T07 / P02 ACCEPTED / P03 ACCEPTED / P04.1–P04.2 ACCEPTED / P04.3 BLOCKED — 2026-09-01

**Execution discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.

**T07:** FROZEN. Do not reopen T07 without an explicit new bounded gate.

**P02:** ACCEPTED. SH3D ↔ GLB correspondence remains the accepted lineage checkpoint. Historical T01–T02 execution evidence is already part of accepted lineage; do not rerun old ZIP evidence as if it were a new gate.

**P03:** ACCEPTED. Candidate-backed Chromium evidence previously established the H-03/H-07/H-08 selectable-camera contract. The approved candidate SHA-256 remains `f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed`.

**Current track:** P04 Spatial / Visual Validation.

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
13. GitHub-hosted P04 run `33450763010` completed with all infrastructure setup steps successful, including Three.js CDN preflight, npm installation, and Chromium installation. All 6 focused P04 tests failed at the common renderer-mount assertion because `.hf-cinematic-3d-stage` never acquired `data-renderer="three-glb"`. Screenshots/traces were uploaded as artifact evidence.
14. The first repair hypothesis identified a bare ESM `three` import boundary and an import-map correction was applied on the P04 validation viewer. A fresh run `33451823171` was triggered from that repair commit.
15. The current investigation must treat the renderer-mount failure as a P04 implementation/runtime defect. Do not infer GLB corruption or Chromium installation failure from the result.
16. Documentation continuity was reconciled: `README.md` is now the repository doorway; `DOCUMENTATION-MAP.md` defines document ownership; `AI_ASSISTANT_READ_ME.md` is continuity-only; `HandOver.md` is the live checkpoint; `Endorsement.md` remains the chronological ledger; skills, coding guidance, and product knowledge remain in their dedicated files.

### Current evidence

- Approved GLB integrity: **verified 4/4**.
- P04 binary promotion through the available high-level connector: **not completed**; no binary transformation or workaround promotion was endorsed.
- P04.3: **unchecked / blocked**.
- Current isolation branch: `p04/glb-runtime-restored-2026-09-01`.
- Controlled PR: `#6` (draft, unmerged).
- Main SH3D viewer: unchanged.
- Current P04 viewer entrypoint: `active_development/3d/glb-viewer/index.html`.
- Current target manifest: `active_development/data/cinematic-3d-targets.json`.
- Current documentation routing: `project-guide/DOCUMENTATION-MAP.md`.

### Required next gate

1. Continue P04 renderer-mount reconciliation from the fresh GitHub evidence. Inspect the actual module/bootstrap path and browser error context before making another runtime change.
2. Keep the P04 acceptance assertions unchanged.
3. Keep `master/HomeFinder.sh3d` and the main SH3D viewer untouched.
4. Do not rerun historical T01–T02 ZIP evidence as a substitute for current execution; use the accepted GitHub lineage and current repository state.
5. Only after a fresh Chromium run reaches `data-renderer="three-glb"` and `data-glb-loaded="true"` should the camera/scale/coordinate assertions be evaluated as the next gate.
6. Only after the resulting evidence passes may P04.3/P04.4/P04.5 be marked complete and a new endorsement decision recorded.

**Physical authority:** `master/HomeFinder.sh3d` remains protected and is not mutated by P04. GLBs remain derived artifacts. Security/authorization remain outside SH3D.

## Mandatory continuity outputs

- `project-guide/HandOver.md` = latest project state and continuation point.
- `project-guide/Endorsement.md` = chronological execution ledger.
- `project-guide/masterplan.md` = durable architecture/chronology.
- `project-guide/AI_ASSISTANT_READ_ME.md` = current continuity only.
- `project-guide/DOCUMENTATION-MAP.md` = documentation ownership and routing.
- Existing `docs/` audits/contracts = detailed evidence.

Do not create another handover file.
