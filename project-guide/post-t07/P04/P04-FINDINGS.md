# Post-T07 P04 — Spatial / Visual Validation — Fresh Findings

## Status
IN PROGRESS — runtime camera-binding defect isolated and minimally corrected; browser verification pending.

## Authority
- Physical authority: `master/HomeFinder.sh3d`
- GLB assets remain derived artifacts.
- T07 remains frozen.
- P02 correspondence is accepted and carried forward.

## Findings and classification
1. The active `active_development/data/cinematic-3d-targets.json` already contains the source-bound H-03 camera definition for `t02-main-hall`. The earlier finding that the active target manifest lacked H-03 was stale and is superseded by this inspection.
2. The actual defect was in `cinematic-3d-adapter.js`: initial GLB renderer mounting did not load/pass the active target definition, so the renderer's generic fallback camera could remain active even though the target manifest was correct.
3. The bounded correction passes the active target definition into the renderer during mount/registration. This does not alter SH3D, GLB binaries, route/role logic, collision behavior, or T07 contracts.
4. The GLB renderer already enforces the established spatial convention: source centimetres are scaled by `0.01` and rotated from source X/Y/Z into Three.js X/Z/Y (Y-up). P04 will now verify this behavior in Chromium rather than infer it from source alone.
5. T05's absolute level-1 Z=112 cm versus T02/T03 local-Z=0 remains an explicit normalization checkpoint. No normalization is being invented during this gate.

## Bounded implementation
- Updated `active_development/js/reference-3d/cinematic-3d-adapter.js` to pass the active target definition into `mountWorld`.
- Added a P04 Chromium regression test covering target-camera propagation and the runtime scale/axis contract.

## Required browser evidence
- GLB viewer mounts without console/page errors.
- Default T02 mount uses the H-03 camera values from the active target manifest.
- T03 H-07 and H-08 switch to their source-derived camera values.
- T04 retains its presentation-only camera definition and vertical target semantics.
- Runtime stage reports the expected `0.01` model scale and Y-up conversion convention.
- Existing GLB target switching remains green.

## Decision
P04 remains open until the fresh Chromium execution passes and the results are reconciled into the project handover and endorsement ledger.
