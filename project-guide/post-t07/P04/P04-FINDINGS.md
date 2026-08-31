# Post-T07 P04 — Spatial / Visual Validation — Fresh Findings

## Status
IN PROGRESS — T02 camera-binding remediation identified; no GLB or SH3D binary mutation performed.

## Authority
- Physical authority: `master/HomeFinder.sh3d`
- GLB assets remain derived artifacts.
- T07 remains frozen.
- P02 correspondence is accepted and carried forward.

## Fresh findings
1. T02 Main Hall GLB geometry is source-correspondent, but its target registry currently uses `cameraMode: shared-house-camera` with no source-bound H-03 camera values.
2. Canonical H-03 is already source-bound to Living room and has established source coordinates: position `[350,560,150]` cm; target `[480,460,85]` cm; fieldOfView `0.920000` rad.
3. Applying the project coordinate convention produces runtime camera position `[3.5,1.5,-5.6]` m and target `[4.8,0.85,-4.6]` m.
4. The current GLB renderer fallback camera is `[0,1.68,4.4]` with target `[0,1.55,-1.4]`, which is not source-bound to H-03.
5. This is a presentation-target mismatch, not a geometry-lineage defect.
6. T05's absolute Z=112 cm frame and T02/T03 level-local Z=0 remain the cross-target normalization finding already accepted from P02 and must be visually validated before P04 completion.

## Bounded remediation candidate
Update only the T02 target-definition record to bind `t02-main-hall` to the existing H-03 source camera using the established `0.01` cm→m conversion and X/Y/Z→X/Z/Y mapping. Do not alter `master/HomeFinder.sh3d`, any GLB binary, route/role logic, collision behavior, or T07 contracts.

## Required browser evidence
- GLB viewer mounts without console/page errors.
- T02 default arrival uses the H-03-derived camera and visually frames the Living room/public-arrival target.
- T03 H-07 and H-08 retain their source-derived camera positions.
- T04 remains presentation-only and visually represents the staircase interface.
- T05 shows the level-1 network without a vertical-frame discontinuity attributable to the viewer.

## Decision
P04 remains open until browser evidence is captured. The remediation candidate is intentionally isolated from the physical model.
