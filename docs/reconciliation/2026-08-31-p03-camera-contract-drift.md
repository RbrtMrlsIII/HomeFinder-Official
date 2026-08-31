# P03 Camera Contract Drift Reconciliation — 2026-08-31

Status: BLOCKED FOR ENDORSEMENT

## Evidence
- GitHub PR #2 head `272f3c975b63cee5883bf457e4982b5f4d2c1fbd` corrected the viewer module root paths.
- Fresh Chromium CI run `33376845040` executed in Playwright `v1.62.0-noble` on Ubuntu 24.04.
- Browser health passed.
- All inter-house navigation acceptance tests passed.
- T07-E control-count test passed.
- The remaining T07-E binding test failed because the viewer option list contained legacy camera names but not `HF H-03 — property-display`, `HF H-07 — guide`, or `HF H-08 — safety`.
- The failing assertion is in `active_development/tests/browser/specs/t07-e-controlled-presentation.spec.mjs` and requires those canonical camera names to be present. The test was not weakened.

## Canonical model inspection
The supplied `master/HomeFinder.sh3d` is a 5,775,168-byte Git blob matching GitHub's `master/HomeFinder.sh3d` blob SHA `25d7889d4118ea686b51db90ce0aec0e71a1b62f`.
Its `Home.xml` contains nine H-series `observerCamera` entries:
- H-01 hero
- H-02 discovery
- H-03 property-display
- H-04 map
- H-05 government-desk
- H-06 mission
- H-07 guide
- H-08 safety
- H-09 contact

The same model contains five legacy stored cameras: Living room, Exterior, Corridor, Bedroom #1, Kitchen.

## Root cause classification
The H-series cameras are present in the canonical model as `observerCamera` entries without `attribute="storedCamera"`. The Sweet Home 3D JS viewer's selectable camera list is populated from stored-camera semantics, so the H-series names are not exposed as selectable options even though they exist physically in the model XML.

This is a canonical asset/runtime contract mismatch, not a Playwright, Chromium, route, or test defect.

## Candidate remediation
A local candidate was prepared that converts only the nine H-series presentation cameras from default observer-camera entries to `attribute="storedCamera"`, preserving their coordinates and HomeFinder metadata. Candidate artifact SHA-256:
`f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed`

The binary candidate has NOT been committed to GitHub because the available GitHub write interface only supports UTF-8 text and cannot safely write the `.sh3d` binary. No canonical model mutation has been made.

## Gate decision
P03 remains BLOCKED FOR ENDORSEMENT until the candidate model change is reviewed against the protected 3D authority contract and committed through a binary-safe repository handover path, followed by fresh Chromium CI.

Do not change the acceptance test to accommodate the current failure. Do not claim P03 browser endorsement.
