# P03 Camera Contract Drift Reconciliation — 2026-08-31

Status: REOPENED — CANDIDATE-BACKED BROWSER GATE

## Evidence
- The prior Chromium CI run `33385616929` executed against the pre-candidate canonical model and recorded 18/19 passing tests with the T07-E binding test failing.
- Browser health, Chromium setup, all inter-house navigation journeys, and T07-E control-count/visibility passed in that run.
- The remaining binding failure was that the viewer option list contained legacy camera names but not `HF H-03 — property-display`, `HF H-07 — guide`, or `HF H-08 — safety`.
- The failing assertion remains in `active_development/tests/browser/specs/t07-e-controlled-presentation.spec.mjs`; the acceptance test is unchanged.

## Candidate remediation
The approved candidate `master/HomeFinder.sh3d` is the exact nine-camera presentation remediation:
- Candidate SHA-256: `f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed`
- Historical pre-candidate canonical SHA-256: `2463bbf41a92012bbd81b66ea957c993075f5a2bf6db8a43e676b0c832b0e58c`
- Scope: add `attribute="storedCamera"` to H-01 through H-09 only.
- Protected: geometry, furniture, rooms, levels, coordinates, camera metadata, routes, role/security authority, and the unchanged T07-E acceptance contract.

The candidate has been independently verified in the supplied handoff package and is now authorized for the bounded browser evidence gate. It is not yet P03-endorsed.

## Gate execution
This reconciliation branch is intentionally being push-triggered so the existing CI workflow can:
1. verify the protected pre-candidate source hash,
2. deterministically construct the exact approved candidate,
3. verify the candidate hash,
4. run the unchanged Chromium suite against the candidate-backed model, and
5. retain the Playwright report as fresh evidence.

## Gate decision
P03 remains BLOCKED FOR ENDORSEMENT pending fresh candidate-backed Chromium evidence and the full P03 browser gate.

Do not weaken the acceptance test. Do not treat the historical 18/19 run as candidate evidence. Do not promote to production from this gate.
