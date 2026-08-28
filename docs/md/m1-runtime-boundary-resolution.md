# M1 exception resolution — production WebGL/Three boundary

**Date:** 2026-08-24  
**Scope:** Targeted reopen of unresolved M1 only (no SH3D edit, no M2–M5 redo)

## Classification

| Artifact | Class | Notes |
|----------|-------|--------|
| `js/reference-3d/cinematic-3d-adapter.js` | DEVELOPMENT/REFERENCE | Moved off production path |
| `js/reference-3d/cinematic-3d-asset-loader.js` | DEVELOPMENT/REFERENCE | Three@0.179.1 + GLTFLoader CDN (not loaded by product HTML) |
| `js/reference-3d/cinematic-3d-renderer.js` | DEVELOPMENT/REFERENCE | native WebGL2 renderer (not loaded by product HTML) |
| `js/cinematic-ui.js` | PRODUCTION | 2D cinematic chrome; optional `hfCinematic3D?.mount` no-op |
| `data/cinematic-assets.json` | PRODUCTION contract / inert | GLB `source: null`; no loader without triad scripts |
| `3d/viewer/SweetHome3DJSViewer-*` | DEVELOPMENT/REFERENCE | SH3D browser viewer; not product hosting entry |
| `3d/app/homefinder-viewer.js` | DEVELOPMENT/REFERENCE | Viewer wiring to master SH3D |
| Product `*.html` triad `<script>` tags | OBSOLETE (removed) | Were active production path |
| `tests/m1-runtime-boundary.test.mjs` | TEST | Guards regression |

## Production entry trace (before)

12+ product HTML files loaded adapter (broken path `js/reference-3d/` when dir missing) **and** asset-loader + renderer from `js/` → **active production WebGL/Three path**.

## Changes

1. Moved triad modules to `js/reference-3d/`.
2. Removed all product HTML `<script>` tags for the triad (12 pages + verify if present).
3. Added `js/reference-3d/README.md`.
4. Added/ran `tests/m1-runtime-boundary.test.mjs`.

## Tests

```
node --test tests/m1-runtime-boundary.test.mjs tests/cinematic-3d-adapter.test.mjs
→ 8 pass, 0 fail
```

## M1 status

**PASS** (script-load boundary enforced on this package).

MapLibre on market remains allowed (2D map, not the Three/GLTF triad).
