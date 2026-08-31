# HomeFinder — Current HandOver

> Single live handover authority. Update this file after every execution gate.

## CURRENT STATE — POST-T07 / P02 ACCEPTED / P03 ACCEPTED / P04.1 BLOCKED — 2026-08-31

**Execution discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.

**T07:** FROZEN. Do not reopen T07 without an explicit new bounded gate.

**P02:** ACCEPTED. SH3D ↔ GLB correspondence remains the accepted lineage checkpoint.

**P03:** ACCEPTED. Candidate-backed Chromium evidence previously established the H-03/H-07/H-08 selectable-camera contract. The approved candidate SHA-256 remains `f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed`.

**Current track:** P04 Spatial / Visual Validation.

**P04.0 verdict:** BLOCKED by a test-harness/runtime-mount defect. The first focused P04 run targeted `/3d/glb-viewer/index.html`, a route that did not exist in the checked-out repository. After adding the missing viewer entrypoint and target manifest, the P04 runtime scaffold became available on the canonical repository URL space.

**P04.1 latest execution:** The focused P04 browser lane was run against the repository-backed viewer. The accepted native renderer is `native-webgl2` proxy geometry; this phase does not claim that real GLB binaries are already loaded by the renderer. The gate verifies source-backed target/camera/scale contracts and the current spatial-validation scaffold.

### Fresh P04 findings

1. The checked-out branch originally had no `/3d/glb-viewer/index.html`, so the initial P04 tests could never mount the stage. Classification: **test-harness / missing-entrypoint defect**.
2. The repository now contains `active_development/3d/glb-viewer/index.html` and the active source-backed target manifest `active_development/data/cinematic-3d-targets.json`.
3. The GLB-adapter layer consumes the target manifest and passes the active target to the renderer. Source-backed camera metadata is now exposed on the runtime stage for independent verification.
4. The canonical P04 coordinate convention is `source-cm-to-m-xzy` with scale `0.01`. These values are independently checked by the P04 browser suite.
5. The current renderer is a **native WebGL2 proxy scaffold**, not a real GLB binary renderer. This is intentional and explicitly recorded rather than inferred as a completed GLB integration.
6. The previously accepted P02 vertical-frame carry-forward remains: T02/T03 level-local Z=0 versus T05 level elevation of 112 cm. It is still a P04 visual-normalization checkpoint.
7. Vercel confirmed the branch deployment is source-connected and READY for commit `173312f08c6459eb228617a2cca283b2546b3c8f`; the preview URL is protected by Vercel SSO, so browser screenshots from the deployment require an authenticated browser connector that was not available in this execution.

### Current evidence

- Historical P04 focused run `33391752987` / artifact `9757930414`: **6/6 focused tests failed** because `.hf-cinematic-3d-stage` never existed. This is retained as diagnostic evidence, not a spatial-model failure.
- Current branch head: `173312f08c6459eb228617a2cca283b2546b3c8f`.
- Current P04 viewer entrypoint: `active_development/3d/glb-viewer/index.html`.
- Current target manifest: `active_development/data/cinematic-3d-targets.json`.

### Required next gate

1. Execute the newest P04 dedicated workflow on branch head and capture the fresh Chromium report/screenshots.
2. Require the native WebGL2 stage to mount and all camera/target/scale/elevation checks to pass.
3. Separately verify the actual derived GLB binaries once a binary-safe GLB path is available; do not label the proxy scaffold as GLB correspondence proof.
4. Review captured screenshots for target framing and T05 level-1 normalization.
5. Only then decide P04 endorsement.

**Physical authority:** `master/HomeFinder.sh3d` remains protected and is not mutated by P04. GLBs remain derived artifacts. Security/authorization remain outside SH3D.

## Mandatory continuity outputs

- `project-guide/HandOver.md` = latest project state and continuation point.
- `project-guide/Endorsement.md` = chronological execution ledger.
- `project-guide/masterplan.md` = durable architecture/chronology.
- `project-guide/AI_ASSISTANT_READ_ME.md` = assistant orientation.
- Existing `docs/` audits/contracts = detailed evidence.

Do not create another handover file.
