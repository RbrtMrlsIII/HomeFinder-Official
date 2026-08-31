# P03 Camera Contract Finding — 2026-08-31

Status: **BLOCKED / NOT ENDORSED**

## Evidence

Fresh GitHub Actions Chromium execution on PR #2 head `272f3c975b63cee5883bf457e4982b5f4d2c1fbd` completed the browser-health and inter-house navigation suites successfully, but the T07-E canonical-camera binding test failed on both the initial attempt and retry.

Result: **18 passed, 1 failed**.

The failing assertion requires these existing canonical camera options:

- `HF H-03 — property-display`
- `HF H-07 — guide`
- `HF H-08 — safety`

The runtime option list instead contained the legacy stored cameras (`Living room`, `Exterior`, `Corridor`, `Bedroom #1`, `Kitchen`) and levels.

## Source reconciliation

The supplied `master/HomeFinder.sh3d` is byte-identical to the GitHub `main` blob by Git blob SHA:

`25d7889d4118ea686b51db90ce0aec0e71a1b62f`

The supplied model's `Home.xml` contains nine H-series `<observerCamera>` entries, including H-03, H-07 and H-08, but they are ordinary observer cameras rather than `attribute="storedCamera"` entries. The model contains five legacy stored cameras.

Therefore the browser failure is **not** evidence that the canonical model is missing the H-series camera definitions. It is evidence of a contract mismatch between the viewer's `selectableCameras` mechanism and the current SH3D camera classification.

## Guardrail

Do **not** weaken or delete the Playwright assertion. Do **not** silently mutate `master/HomeFinder.sh3d`. The physical model is a protected authority and any change to its camera classification requires an explicit spatial/camera contract decision and a surrendered checkpoint.

## Candidate resolution to evaluate

Evaluate whether the nine H-series presentation cameras are contractually required to be stored cameras for viewer presentation selection. If yes, make that a bounded canonical-model change with:

1. camera-contract update,
2. SH3D candidate checkpoint,
3. model hash record,
4. canonical-camera binding test,
5. fresh Chromium CI,
6. visual/spatial validation,
7. endorsement/handover.

If the contract instead requires them to remain ordinary observer cameras, implement a viewer-side presentation binding that uses the existing observer-camera data without changing the physical model and add a regression test for that binding.

## Current gate

P03 remains **BLOCKED pending camera-contract decision**. Browser infrastructure is healthy. Navigation acceptance is passing. T07-E camera binding is the only currently observed failing browser contract.

## Evidence references

- Workflow run: `33376845040`
- Browser job: `99440147227`
- Playwright artifact: `9752247583`
- PR #2 head: `272f3c975b63cee5883bf457e4982b5f4d2c1fbd`
- T07-E browser test: `active_development/tests/browser/specs/t07-e-controlled-presentation.spec.mjs`
