# HomeFinder — Current HandOver

> Single live handover authority. Update this file after every execution gate.

## CURRENT STATE — POST-T07 / P02 ACCEPTED / P03 ACCEPTED / P04.1–P04.2 ACCEPTED / P04.3 BLOCKED — 2026-09-01

**Execution discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.

**T07:** FROZEN. Do not reopen T07 without an explicit new bounded gate.

**P02:** ACCEPTED. SH3D ↔ GLB correspondence remains the accepted lineage checkpoint.

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
6. A local browser-test server `/healthz` check returned HTTP 200. Local Playwright dependency installation timed out because this execution environment is offline; no fresh Playwright Chromium pass is claimed.
7. Direct headless Chromium also failed to complete the P04 DOM probe locally. The P04 asset loader currently fetches Three.js/GLTFLoader from jsDelivr, establishing an external runtime dependency that this environment cannot resolve.
8. The P04 workflow was updated to run on the clean isolation branch and to preflight the external Three.js dependency before running Chromium. The workflow change is evidence-only infrastructure alignment; it does not alter the P04 acceptance assertions.
9. Vercel project `home-finder-official` is linked to `RbrtMrlsIII/HomeFinder-Official`; the latest clean-branch deployment is READY and Vercel reports no grouped runtime errors in the selected window. Deployment READY is not treated as browser/GLB proof.
10. The main application-facing viewer remains the Sweet Home 3D JS Viewer and continues to use `master/HomeFinder.sh3d` as physical authority. The P04 GLB viewer is a separate validation surface.
11. Temporary placeholder `.glb` files created during an attempted high-level GitHub contents upload were removed immediately. No corrupted binary remains in the clean branch; the failed attempt is preserved in Git history for auditability.
12. Detailed reconciliation is recorded in `docs/reconciliation/2026-09-01-p04-execution-reconciliation.md`.

### Current evidence

- P04.B binary promotion: **not completed** through the available high-level connector; no binary transformation or workaround promotion was endorsed.
- P04.3 remains **unchecked / not endorsed** because fresh repository-backed Chromium execution has not completed.
- Current isolation branch: `p04/glb-runtime-restored-2026-09-01`.
- Latest handover commit: `36049d2d0301f842f9c043f9122c162d6910d104`.
- Current P04 viewer entrypoint: `active_development/3d/glb-viewer/index.html`.
- Current target manifest: `active_development/data/cinematic-3d-targets.json`.

### Required next gate

1. Use a binary-capable repository transfer method to promote the four exact approved GLBs to their manifest paths without transforming them.
2. Confirm the updated P04 workflow executes on the clean isolation branch and inspect its Three.js dependency preflight.
3. Run the unchanged P04 Chromium Playwright project against the repository state containing the exact binaries.
4. Require `data-renderer="three-glb"`, `data-glb-loaded="true"`, source-backed camera values, scale `0.01`, and coordinate contract `source-cm-to-m-xzy`.
5. Capture fresh Playwright screenshots/traces and review the target framing, including T05 level-1 normalization.
6. Only after those results pass may P04.3/P04.4/P04.5 be marked complete and a fresh endorsement decision recorded.

**Physical authority:** `master/HomeFinder.sh3d` remains protected and is not mutated by P04. GLBs remain derived artifacts. Security/authorization remain outside SH3D.

## Mandatory continuity outputs

- `project-guide/HandOver.md` = latest project state and continuation point.
- `project-guide/Endorsement.md` = chronological execution ledger.
- `project-guide/masterplan.md` = durable architecture/chronology.
- `project-guide/AI_ASSISTANT_READ_ME.md` = assistant orientation.
- Existing `docs/` audits/contracts = detailed evidence.

Do not create another handover file.
