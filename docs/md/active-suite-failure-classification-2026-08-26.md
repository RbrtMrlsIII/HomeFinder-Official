# Active Suite Failure Classification — 2026-08-26

## Execution

The cumulative current-validation checkpoint was executed from `active_development/` using Node.js `v22.16.0`.

After the four WalkMyPlan tests were archived, the active suite contained 95 test subtests in this checkpoint.

Result:
- 53 passed
- 42 failed
- 0 WalkMyPlan active references
- canonical `master/HomeFinder.sh3d` unchanged

The prior 46-failure figure referred to an earlier active-suite count. The current checkpoint contains 42 failures after the four formal archives and after the current-authority migration work.

## Classification principle

A failing test is not treated as a product defect until its asserted contract is compared with current repository authority.

### Summary

| Classification | Failed subtests | Disposition |
|---|---:|---|
| Current test path / execution-context defects | 11 | Repair tests; do not change product architecture |
| Current contract assertion drift | 1 | Migrate assertion to current contract |
| Superseded/historical documentation-contract dependencies | 30 | Migrate to current authority where behavior remains current; archive when the old contract itself is no longer authoritative |
| **Total** | **42** | |

## A. Current test path / execution-context defects — 11

These failures reference artifacts that are present in the current repository but from the wrong test-relative location.

1. Patch 57 A.2.2 — shared cinematic camera loop
2. Patch 57 A.2.2 — cinematic focal contract
3. Patch 57 A.2.2 — clean cinematic visual
4. Patch 57 A.2.2 — reduced motion/mobile composition
5. A.4.2 — architectural house camera rig
6. A.4.2 — Home architectural anchors
7. A.4.2 — camera state publication
8. A.4.2 — reduced motion/mobile camera scaling
9. `listings-book-interaction.test.mjs`
10. `market-profile-physical-ui-propagation.test.mjs`
11. `physical-ui-object-system.test.mjs`

Evidence:
- `active_development/data/house-camera-rig.json` exists.
- `active_development/data/physical-ui-objects.json` exists.
- `active_development/js/home/physical-ui-objects.js` exists.
- `active_development/index.html` exists.
- `docs/csv/from-app-data/market-profile-physical-ui-root-matrix.csv` exists.

**Recommendation:** repair test path resolution only. Do not relocate runtime files to satisfy stale test-relative paths.

## B. Current contract assertion drift — 1

### `patch-21-role-need-help.test.mjs`

The test expects the broker redirect to be driven directly by `data.accountType`.

Current implementation intentionally uses:

`canonicalRoleFromData(data) === "broker" && !isOpsUid(user.uid)`

The current implementation also retains the Ops exception and broker-HQ redirect.

**Disposition:** MIGRATE TEST.

The test should assert the current canonical-role contract rather than reverting the runtime code to the older `accountType` implementation.

## C. Superseded/historical documentation-contract dependencies — 30

These failures occur because patch-era tests require documentation/contract artifacts that are absent from the active tree and, in several cases, have been explicitly archived or superseded.

### C1. Retired Source-of-Truth document — 12

Affected tests:
- foundation-repair-04-tier-entitlement
- foundation-repair-05-subscription-entitlement
- foundation-repair-07-admin-capacity-override
- foundation-repair-09-pin-authority
- foundation-repair-10-radius-authority
- foundation-repair-11-match-notification-dedupe
- foundation-repair-12-stale-match
- market-patch-11a-audit
- patch-11c-r7-pin-authority
- patch-14-listing-activity
- patch-19-discovery-impression
- paypal-cloudflare-contract

The referenced `docs/core/01-SOURCE-OF-TRUTH.md` is not present in the active tree; the historical copy is under `archive/md/archive/01-source-of-truth.md`.

**Disposition:** do not restore the old document. Migrate only assertions that remain current to the current `docs/md/` and `docs/json/` authority contracts; archive assertions whose only purpose was the historical patch contract.

### C2. Retired integration/patch contracts — 10

Affected:
- patch-12-integration-hardening
- patch-16-listing-activity-contracts
- patch-17-contract-activation
- patch-18-listing-inquiry
- patch-20-statistics-read-map
- patch-25-admin-subscription-grant
- patch-26-paypal-cloudflare-hardening
- patch-27-market-data-wiring
- patch-28-broker-hq-data-wiring
- patch-29-broker-hq-interaction-smoke

Their referenced patch documents are absent from the active tree.

**Disposition:** inspect the runtime assertions and current contracts. Preserve business/security behavior as current tests where it still exists; archive patch-specific documentation assertions. Do not recreate missing patch documents solely to make tests green.

### C3. Historical dictionary/governance contracts — 5

Affected:
- patch-38-authority-wiring-audit
- patch-40-boundary-decision
- patch-43-compatibility-inventory
- patch-44-boost-compatibility
- patch-50-boost-parser-retirement

The old dictionary-domain files are absent from the active tree.

**Disposition:** migrate meaningful current authority assertions to the current machine-readable contracts; archive patch-specific dictionary checks that no longer represent current authority.

### C4. Historical migration receipt — 1

Affected:
- patch-49-boost-parser-retirement

The referenced Patch 48 production migration receipt template is absent.

**Disposition:** preserve as historical migration evidence; do not recreate the old receipt template as a current authority contract.

### C5. Patch 52 multi-check wiring — 1

Affected:
- patch-52-multi-check-wiring

The audit tool itself requires the retired dictionary/governance set and the absent Patch 52 wiring map.

**Disposition:** migrate the audit to current authority manifests rather than restoring the old dictionary hierarchy. This is a validation-tool migration, not a product defect.

### C6. Patch 53 UI/UX contract — 1

Affected:
- patch-53-ui-ux-contract

The expected contract exists only under `archive/json/stray/PATCH-53-UI-UX-CONTRACT.json`.

**Disposition:** use the current UI/UX/census contracts as the authority. The stray archived Patch 53 contract remains evidence; do not reactivate it.

## What this means architecturally

The 42 failures do **not** justify changing HomeFinder's current architecture.

They reveal three kinds of debt:

1. test-relative path debt;
2. one assertion that has lagged behind the canonical-role implementation;
3. a larger body of patch-era tests whose documentation dependencies belong to superseded governance generations.

The current 10-test WalkMyPlan migration baseline remains green and independent of this historical test debt.

## Recommended next execution

**5.5C-V.2 — Repair current test paths and migrate current assertions.**

Execute in this order:

1. repair the 11 stale test paths;
2. migrate Patch 21 to `canonicalRoleFromData`;
3. run those 12 tests individually;
4. then classify the 30 historical-contract tests by retained runtime value;
5. migrate only assertions backed by current authority;
6. archive tests whose entire contract is superseded;
7. establish a new active-suite baseline.

Do not proceed to SH3D merge until this validation branch has a trustworthy current-contract baseline.

