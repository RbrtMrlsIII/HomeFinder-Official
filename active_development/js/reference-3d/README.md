# reference-3d (M1 production boundary)

**Classification:** DEVELOPMENT / REFERENCE only.

Modules here are **not** loaded by production HTML:

- cinematic-3d-adapter.js
- cinematic-3d-asset-loader.js (Three r179 + GLTFLoader)
- cinematic-3d-renderer.js (native WebGL2)

Production pages use `cinematic-ui.js` only (2D progressive enhancement). Optional `window.hfCinematic3D?.mount` is a no-op without these scripts.

SH3D viewer remains under `3d/viewer/` (also reference, not product hosting entry).

Do not re-add `<script src="js/reference-3d/...">` to product HTML without a new SPEC decision.
