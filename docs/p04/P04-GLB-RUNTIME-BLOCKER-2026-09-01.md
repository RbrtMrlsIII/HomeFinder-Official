# P04 GLB Runtime Blocker — 2026-09-01

Status: **BLOCKED — GLB binaries not present in repository build**

## Observe
The P04 viewer entrypoint now loads the Three.js asset loader and the real GLB renderer. The P04 browser contract was tightened to require `data-renderer="three-glb"` and `data-glb-loaded="true"` before camera/scale assertions are accepted.

## Record
The current GitHub branch `p04/glb-runtime-2026-09-01` contains:
- P04 viewer entrypoint
- source-backed target manifest
- Three.js asset loader
- Three.js GLB renderer
- P04 browser specification requiring real GLB load, camera propagation, scale and axis contract

The branch does **not** contain the four approved GLB binaries required by the target manifest:
- `house1-mainhall-public-arrival.glb` SHA-256 `d3e1851fdf737dc59c4d4939b9aed6d6036c33d500a0bc2be0390130a91fc22d`
- `house1-kitchen-bedroom1-network.glb` SHA-256 `83d1eadf8ac940c213618e5afdd5f7d96b71e7f17aa61a7582d3516f6271020c`
- `house1-basement-firstfloor-vertical-interface.glb` SHA-256 `330b4afc1068554abab84ac985e30f5cd39ec16887ee2f036a42424f7ddd57a0`
- `house1-corridor-living-bedroom2-network.glb` SHA-256 `b71bc456b3fc1aaf4659926b2626da0d4bc61c47a8f495ff64043473d661f1e6`

These binaries are preserved in the cumulative HomeFinder handoff ZIP and in the local evidence package, but their absence from the GitHub branch prevents a repository-backed CI proof of `GLB loads`.

## Understand
The current target manifest binds each P04 target to an explicit GLB URL under `/active_development/assets/t02` through `/t05`. The GLB renderer applies the declared `0.01` model scale and `-90°` X rotation after loading the source asset. The P04 test also verifies the source-backed H-03/H-07/H-08 camera values.

Therefore a passing result requires the actual approved binaries to be present in the repository/deployment test surface. Generated proxy geometry is not acceptable evidence for this gate.

## Classify
Classification: **repository asset completeness blocker**, not a camera-coordinate defect and not a reason to change the canonical SH3D or approved GLBs.

## Next authorized action
Restore the exact four approved GLB binaries to the repository/deployment surface, preserving their SHA-256 values. Then rerun the focused P04 browser gate and capture the resulting Chromium screenshots/traces.

No P04 endorsement is granted by this checkpoint. T07 and P03 remain frozen/accepted as previously endorsed.

## Browser evidence note
The connected Opera browser session is currently unavailable. No manual live-browser screenshot is claimed from that connector. Existing Chromium artifacts remain historical evidence only unless tied to the actual GLB-backed run.
