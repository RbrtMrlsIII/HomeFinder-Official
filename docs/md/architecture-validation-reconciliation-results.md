# Architecture Validation Reconciliation — WalkMyPlan Test Migration

**Execution date:** 2026-08-26

**Purpose:** Reconcile the 14 remaining WalkMyPlan-dependent tests against the already-established census and current authority contracts without restoring WalkMyPlan or changing the canonical SH3D model.

## Baseline

- 14 test files explicitly reference `cinematic/WalkMyPlan`.
- Each was executed individually from `active_development`.
- All 14 currently fail at startup with `ENOENT` because the active WalkMyPlan registry paths are absent.
- This is expected evidence of the retired authority, not evidence that WalkMyPlan should be restored.

## Decision matrix

| Test | Decision | Finding | Recommended execution |
|---|---|---|---|
| `dd05-ui-response-mapping.test.mjs` | **MIGRATE** | Current response mapping, feature wiring, house UI/UX map are active; camera IDs need logical-camera reconciliation, not WalkMyPlan registry. | Rewrite to validate logical presentation/camera IDs against archive/csv-reconciliation/logical-camera-reconciliation.csv and current response mapping. Do not require physical camera positions. |
| `dd05-h09-contact-exit.test.mjs` | **MIGRATE** | Current main-hall UI map and house-camera-rig exist; physical object registry survives as reconciliation evidence. | Rewrite physical-object dependency to current reconciliation object registry; keep H-09 DOM/mailto/legal assertions and logical camera anchors. |
| `room-shell-physical-ui-mapping.test.mjs` | **MIGRATE** | Current room/object reconciliation artifacts already encode room shells, objects and routes; WalkMyPlan path is obsolete. | Rewrite to docs/json/reconciliation artifacts and explicitly assert their authority/status. Do not recreate cinematic/WalkMyPlan. |
| `theme-lighting-performance-budget.test.mjs` | **ARCHIVE** | The referenced theme/performance contracts exist only under archived WalkMyPlan evidence; no current active authority equivalent is established. | Archive as historical planning evidence. Later create a 3D presentation-performance contract test when the three-house spatial contract is current. |
| `deep-dive-04-auth-roles-permissions.test.mjs` | **SPLIT/MIGRATE** | Authentication/authorization assertions target current JS contracts; only role-path spatial assertions depend on retired WalkMyPlan matrices. | Split into current auth/route contract test now; archive spatial-room assertions until current physical route/role boundary contract is authored. |
| `dd05-h05-government-housing.test.mjs` | **MIGRATE** | Main-hall UI map is current; physical object mapping exists in reconciliation evidence. | Rewrite against current reconciliation object registry and preserve response/route assertions. |
| `asset-integration-planning.test.mjs` | **ARCHIVE** | This is explicitly an asset-planning checkpoint tied to WalkMyPlan asset root; no production assets should be reintroduced. | Archive. Recreate as a current asset-ingestion contract when staged SH3D/asset pipeline reaches the relevant chronological gate. |
| `dd04-final-authority-freeze.test.mjs` | **SPLIT/MIGRATE** | Current route/authority JS assertions remain valuable; role-path and door registry are retired spatial authority. | Split security/route assertions into current test; archive physical door assertions until current spatial route authority exists. |
| `role-contract-subscription-path.test.mjs` | **SPLIT/MIGRATE** | Profile/auth/subscription assertions are current; physical door/camera checks are old spatial authority. | Keep current application assertions; move door/camera checks to future spatial-route contract. |
| `dd05-main-hall-cinematic-map.test.mjs` | **MIGRATE** | Current main-hall UI map is active; physical object/zone registries survive as reconciliation artifacts. | Rewrite against current reconciliation registries and distinguish logical camera anchors from physical authored cameras. |
| `dd05-h06-mission.test.mjs` | **MIGRATE** | Current main-hall map and UI response mapping are active; physical object evidence is available in reconciliation. | Rewrite object lookup to current reconciliation artifact; retain accessible HTML authority assertions. |
| `dd05-main-hall-sequence-reconciliation.test.mjs` | **MIGRATE** | Current main-hall UI map and choreography reconciliation exist; camera IDs are logical planning IDs and physical cameras remain rebuild-required. | Rewrite to validate UI section order against choreography and logical camera registry; defer physical camera assertions. |
| `canonical-room-camera-door-graph.test.mjs` | **ARCHIVE** | Entire graph depends on retired WalkMyPlan room/camera/door/role-path registries. Current canonical SH3D has not yet been authored into an equivalent runtime route graph. | Archive. Replace later with a canonical SH3D room-camera-door-route validation test after spatial reconciliation/camera authoring. |
| `hero-world-environment-shell.test.mjs` | **ARCHIVE** | Hero/environment/choreography registries are historical WalkMyPlan planning artifacts; current spatial authority is canonical SH3D and current camera rig is only a seed. | Archive. Replace at the 3D reconciliation/camera-authoring gate with tests against canonical SH3D and current presentation contract. |

## Execution rule

The replacement tests must validate the current architecture: application contracts remain authoritative for security/data/routes, while logical presentation identities resolve toward the canonical `master/HomeFinder.sh3d` spatial authority. No replacement may make `cinematic/WalkMyPlan` active again.

## Rejoin criterion

This reconciliation branch rejoins the master chronological plan when current validation tests cover the accepted UI/spatial census without depending on WalkMyPlan, and the remaining spatial tests are explicitly gated on the future SH3D reconciliation/camera/route phases.


## 2026-08-26 — First Seven Migration Execution

### Scope
The first seven tests classified as **MIGRATE** were rewritten in place to consume current HomeFinder census/contracts rather than `cinematic/WalkMyPlan` registries. No WalkMyPlan artifact was restored and `master/HomeFinder.sh3d` was not modified.

### Executed tests

| Test | Current authority used | Result | Decision |
|---|---|---:|---|
| `dd05-ui-response-mapping.test.mjs` | `data/ui-response-mapping.json`, `data/feature-wiring-matrix.json`, `data/house-ui-ux-code-reality-map.json`, `data/main-hall-camera-object-contract.json`, logical-camera reconciliation | PASS | Migrated |
| `dd05-h09-contact-exit.test.mjs` | `data/main-hall-cinematic-ui-map.json`, `data/physical-ui-objects.json`, `data/main-hall-camera-object-contract.json` | PASS | Migrated |
| `room-shell-physical-ui-mapping.test.mjs` | `data/physical-ui-objects.json`, `data/main-hall-camera-object-contract.json` | PASS | Migrated |
| `dd05-h05-government-housing.test.mjs` | `data/main-hall-cinematic-ui-map.json`, `data/physical-ui-objects.json`, `data/main-hall-camera-object-contract.json` | PASS | Migrated |
| `dd05-main-hall-cinematic-map.test.mjs` | `data/main-hall-cinematic-ui-map.json`, `data/physical-ui-objects.json`, `data/main-hall-camera-object-contract.json` | PASS | Migrated |
| `dd05-h06-mission.test.mjs` | `data/main-hall-cinematic-ui-map.json`, `data/ui-response-mapping.json`, `data/physical-ui-objects.json`, `data/main-hall-camera-object-contract.json` | PASS | Migrated |
| `dd05-main-hall-sequence-reconciliation.test.mjs` | `data/main-hall-cinematic-ui-map.json`, `data/main-hall-camera-object-contract.json`, `data/main-hall-camera-contract-phase13.json` | PASS | Migrated |

### Important finding
The current camera/object authority is deliberately **Main Hall-scoped**. `ui-response-mapping.json` contains 37 surfaces, including logical cameras for rooms beyond the Main Hall. The migrated response-mapping test therefore validates all surfaces against the logical-camera reconciliation and requires the current Main Hall camera contract for H-01..H-09. This preserves the distinction between **logical presentation identities** and **physically authored camera completion**. Non-Main-Hall logical cameras remain `REBUILD_REQUIRED` in `logical-camera-reconciliation.csv` and are not falsely promoted to current physical authority.

### Test semantics strengthened
The migration does not merely replace import paths. It changes assertions from retired WalkMyPlan registry ownership to the current architectural rule:

- application contracts own response mapping;
- `master/HomeFinder.sh3d` is the spatial authority;
- current Main Hall camera/object contracts bind H-01..H-09;
- physical presentation remains `presentation-only` and is never a security boundary;
- logical cameras outside the current authored Main Hall contract remain explicitly incomplete rather than invented.

### Result
**7/7 migrated tests pass individually.** This is the first current-authority validation baseline for this migration branch.

### Next gate
Continue with the remaining three **SPLIT/MIGRATE** tests, separating their still-valid application/security assertions from obsolete physical-authority assertions. Do not proceed to SH3D merge until that validation branch is reconciled and checkpointed.


## 2026-08-26 — Three Split/Migrate Executions

### Scope
The three tests classified as **SPLIT/MIGRATE** were reconciled against current application authority contracts. Their valid authentication, authorization, route, profile, and subscription assertions were retained. Assertions that depended on retired WalkMyPlan room/door/camera registries were deliberately removed from the active tests and recorded as deferred spatial-contract work.

### Executed tests

| Test | Current authority used | Result | Decision |
|---|---|---:|---|
| `deep-dive-04-auth-roles-permissions.test.mjs` | `docs/json/roles-contract.json`, `docs/json/routes-contract.json`, `route-access-contract.js`, `authority-contract.js`, `auth.js`, `session.js`, `admin/core.js` | PASS | Migrated application/security portion |
| `dd04-final-authority-freeze.test.mjs` | `docs/json/roles-contract.json`, `docs/json/routes-contract.json`, `route-access-contract.js`, `authority-contract.js` | PASS | Migrated route/authority portion |
| `role-contract-subscription-path.test.mjs` | `docs/json/roles-contract.json`, `docs/json/routes-contract.json`, profile HTML, `auth.js`, subscription/ongoing-contract modules | PASS | Migrated application/profile/subscription portion |

### Deliberately deferred spatial assertions

The following old assertions were not silently discarded:

- role-to-room permissions from `role-path-matrix.json`;
- role-specific physical door entries from `door-registry.json`;
- physical security-camera coverage from `security-camera-registry.json`.

Those files are preserved under `archive/json/walkmyplan/` and the original test files are preserved under `archive/walkmyplan/tests/`.

They are **historical evidence**, not current authority.

The replacement spatial tests must be authored only after the current spatial route/door/role presentation contract exists. That contract must bind presentation transitions to `master/HomeFinder.sh3d` while keeping authentication and authorization in the application/backend authority layer.

### Architectural conclusion

The split confirms the authority boundary:

`Firebase Auth → canonicalRole → route authority → data authority`

is current application authority, while:

`logical presentation → canonical SH3D → authored room/camera/door/route`

is presentation authority.

The two must not be conflated.

### Checkpoint status

- Three split/migrate tests: **3/3 PASS**
- WalkMyPlan active test dependencies introduced: **0**
- Canonical `master/HomeFinder.sh3d` modified: **NO**
- Original superseded test sources preserved: **YES**
- Deferred spatial assertions recorded: **YES**

### Rejoin gate

The validation-reconciliation branch now has all **10 actionable tests** migrated/split and passing individually:

- 7 previously migrated
- 3 split/migrated

The remaining four tests are explicitly archival and should not be made green against the retired authority.

The branch is ready for the next chronological gate once the project accepts this checkpoint: **establish the current validation baseline, then rejoin the master chronology at three-house allocation / UI ↔ 3D presentation contract work.**


## Current validation baseline — 2026-08-26

The ten migrated/split tests were re-executed together from the correct repository execution context (`active_development`) using Node's test runner:

- 10 tests
- 10 passed
- 0 failed

This establishes the **current-authority migration baseline**.

### Four superseded tests formally archived

The following tests were moved from `active_development/tests/` to `archive/walkmyplan/tests/`:

- `theme-lighting-performance-budget.test.mjs`
- `asset-integration-planning.test.mjs`
- `canonical-room-camera-door-graph.test.mjs`
- `hero-world-environment-shell.test.mjs`

After the archive operation, active test files contain **zero `WalkMyPlan` references**.

The archived tests remain evidence and are not deleted. Their future replacements belong to later spatial-authority gates:

- presentation-performance contract
- current asset-ingestion contract
- canonical SH3D room/camera/door/route validation
- canonical hero/world environment contract

### Full active-suite baseline after archive

The active suite was then executed from `active_development`:

- 102 tests
- 56 passed
- 46 failed

The 46 failures are **not classified as product defects yet**. They must be classified before remediation into current-contract failures, stale repository/test assumptions, or historical/superseded contracts.

A key integrity rule was confirmed: no WalkMyPlan authority was restored and `master/HomeFinder.sh3d` was not modified.

## Execution principle

The ten-test current-authority baseline is now the guardrail for subsequent work. The remaining active-suite failures will be classified before implementation changes. This prevents historical tests from driving the architecture backward.
