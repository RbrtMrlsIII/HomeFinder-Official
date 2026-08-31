# P04 Vercel Runtime Finding — 2026-09-01

## Observe
The connected Vercel project is `home-finder-official`, linked to `RbrtMrlsIII/HomeFinder-Official`.

The latest READY deployment is tied to branch `p04/glb-runtime-restored-2026-09-01` at commit `d3b60f4b6c5e25f8e1908c75f87b80ee6e0dbfef`.

## Record
- Vercel project: `prj_RAMdD7obaecLEPjD7cK12eFXYV3Q`
- Team: `HomeFinder` / `team_Zl3X3UBp2P0aDZN9OGjHXuWv`
- Latest deployment: READY
- Project runtime configuration reports Node 24.x.
- Vercel grouped runtime-error query reports no runtime errors in the selected window.
- The deployed P04 GLB URL remains behind Vercel SSO/access protection; no successful binary retrieval was claimed from the protected URL.

## Understand
The main application-facing 3D viewer remains the Sweet Home 3D JS Viewer and continues to use `master/HomeFinder.sh3d` as physical authority. The P04 GLB viewer is a separate validation surface and must not replace or redefine the SH3D viewer.

## Classify
Classification: deployment/runtime-access evidence, not a spatial-model defect.

The remaining P04 blocker is still repository-backed binary promotion and fresh Chromium execution against the actual `.glb` paths. Vercel READY status must not be treated as browser-pass evidence.

## Align
- Do not alter the SH3D viewer to make P04 pass.
- Do not promote base64 workaround files as canonical GLB runtime sources.
- Keep `P04.3`, `P04.4`, and `P04.5` unchecked until fresh repository-backed Chromium/GLB evidence exists.

## Next gate
Use a binary-safe repository promotion path for the four exact approved GLBs, then execute the unchanged P04 Chromium suite and capture fresh screenshots/traces.
