# HomeFinder — 5.5G.6M.4
## Browser Acceptance Contract Reconciliation

Status: IMPLEMENTED + CI VALIDATED
Date: 2026-08-29
Baseline: 5.5G.6M.3 candidate state

### Problem

The prior Playwright acceptance expected the original 3D viewer DOM to remain after clicking House 2 or House 3. The application intentionally navigates to an application-root destination for controlled transport legs, so the original viewer DOM disappears.

### Evidence

- `HomeFinderViewer.html` contains `#homefinderHouseStatus`.
- `planJourney()` returns role-aware application routes.
- `HomeFinderViewer.html` intentionally assigns a document location for a non-`index.html` final leg.
- `toApplicationHref()` in 5.5G.6M.3 makes those routes root-relative.
- Destination pages exist under `active_development/` for every role × House 2/House 3 route.

### Correction

Reconciled the browser acceptance contract to validate the resulting application route and preserved session role after navigation, instead of asserting on the departed viewer DOM.

The role × house destination matrix remains unchanged.

The broker House 2 → House 3 hub-routing invariant continues to be validated by the existing browser runtime contract because the real browser document navigation intentionally leaves the viewer after a controlled leg.

Guest House 2/House 3 navigation is validated to resolve to `login.html`, with the guest role preserved in session storage.

### Validation

- Playwright spec syntax: PASS
- Existing inter-house unit tests: 5/5 PASS
- Existing inter-house contract verifier: PASS
- Chromium CI run `33228660402`: PASS
- Chromium browser verification job: PASS
- Chromium browser installation and system dependencies: PASS
- Playwright report upload: PASS

CI observation is complete against the canonical GitHub lineage. No remaining M.4 failure was observed in the recorded Chromium run.

### Closure

5.5G.6M.4 is closed as a green acceptance checkpoint.

The browser contract is reconciled with intentional document navigation, and the canonical CI execution confirms the resulting acceptance suite passes in Chromium.

### Next

Proceed to the next navigation/UX gate only after preserving this checkpoint as the evidence baseline.
