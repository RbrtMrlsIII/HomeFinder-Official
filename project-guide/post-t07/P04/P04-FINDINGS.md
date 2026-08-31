# Post-T07 P04 — Spatial / Visual Validation — Fresh Findings

## Status
BLOCKED — P04.1 runtime-mount remediation completed; fresh Chromium evidence is still required before endorsement.

## Authority
- Physical authority: `master/HomeFinder.sh3d`.
- GLB assets remain derived artifacts.
- T07 remains frozen.
- P02 correspondence is accepted and carried forward.

## P04.0 evidence and classification
1. Focused run `33391752987` executed six P04 tests and all six failed before spatial assertions because `.hf-cinematic-3d-stage` did not exist.
2. Inspection proved the test path `/3d/glb-viewer/index.html` did not exist in the checked-out repository. Classification: **missing viewer entrypoint / test-harness integration defect**, not a geometry or camera failure.
3. The same run preserved screenshots and traces in artifact `9757930414`, SHA-256 `2d6776ccb9925ce8a6cc84f60a9a2a1067547d261de8cf5ec5a9f61ce24c46ef`.

## P04.1 bounded remediation
1. Added `active_development/3d/glb-viewer/index.html` as the repository-backed spatial-validation entrypoint.
2. Added active `active_development/data/cinematic-3d-targets.json` with source-backed P04 target contracts.
3. Corrected the test viewer URL to `/active_development/3d/glb-viewer/index.html`, matching the repository/Vercel URL space.
4. Updated the test server to resolve both synthetic `/3d/...` paths and repository-root `/active_development/...` paths without changing SH3D authority.
5. Updated the native renderer to expose target ID, camera position/target/FOV, model scale, and coordinate convention on the runtime stage.
6. Aligned the P04 gate with the actual current renderer: `native-webgl2` proxy scaffold. The repository does **not** yet claim that real GLB binaries are loaded by this renderer.

## Source-backed target contracts
- T02 / H-03: position `[3.5,1.5,-5.6]` m, target `[4.8,0.85,-4.6]` m, FOV `52.70715°`.
- T03 / H-07: position `[3.5,1.7,-1.45]` m, target `[2.1,1.3,-1.1]` m, FOV `58.441964°`.
- T03 / H-08: position `[7.35,1.75,-5]` m, target `[8.5,1.3,-4.7]` m, FOV `56.150515°`.
- T04 presentation camera: position `[-1.7,1.78,-2.8]` m, target `[1,2.2,-6]` m, FOV `48°`.
- Spatial convention: source centimetres → metres at `0.01`, then source X/Y/Z → runtime X/Z/Y.
- T05 level elevation: `112 cm`; Bedroom #2 has no invented camera binding.

## Independent hosting observation
Vercel produced a READY preview for branch head `173312f08c6459eb228617a2cca283b2546b3c8f`. The deployment is source-connected, but its protected preview requires authenticated browser access for full screenshot verification; the available browser connector was not connected during this execution.

## Required next gate
1. Run the newest dedicated P04 workflow from the current branch head.
2. Require stage mount plus all camera/scale/coordinate/elevation checks to pass.
3. Review fresh screenshots for framing and T05 vertical normalization.
4. Separately verify actual derived GLB binary loading when a binary-safe GLB path is available.
5. Update `HandOver.md` and `Endorsement.md` with the fresh result.

## Decision
P04 is **not endorsed yet**. The bounded remediation is accepted as an implementation checkpoint; the browser gate remains the deciding evidence.
