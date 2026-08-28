# HomeFinder — Phase 02 Test & Verification Reconnaissance

Date: 2026-08-27
Status: RECONNAISSANCE COMPLETE — NO SOURCE MIGRATION AUTHORIZED

## Scope
Inspected the repository's existing MJS test, verification, audit/tool, and historical verification structures. Phase 02 was observational/classificatory only. No source files were renamed, moved, deleted, or rewritten.

## Physical inventory
The Phase 01 baseline contained 787 original repository files. Phase 01 added durable cleanup evidence, so the working repository now contains 794 files.

MJS inventory:
- 149 total `.mjs`
- 16 under canonical top-level `verify/`
- 85 under `active_development/tests/`
- 1 under `active_development/verify/`
- 38 under `docs/archive/`
- 9 under `active_development/tools/`

## Canonical verification finding
`docs/md/verification-model.md` explicitly identifies the canonical verification layer as:
- `verify/contracts/`
- `verify/security/`
- `verify/routes/`
- `verify/data/`
- `verify/3d/`
- `verify/integrations/`

This is strong repository evidence that the root `verify/` tree should be treated as the current canonical verification structure unless later source-of-truth evidence conflicts.

The 16 current `verify/` modules are assertion-oriented and cover contracts, security, routes, data, 3D, and integrations.

## Active development test finding
`active_development/tests/` contains 85 MJS files, including nested `from-verify/`, `authority/`, and `dictionary/` groups.

The files generally use Node's assertion facilities and/or Node test APIs. They are therefore materially different from the root `verify/` layer, but their filenames show substantial historical execution vocabulary (`patch-*`, `foundation-repair-*`, `dd*`, etc.).

Existing repository evidence also states that root `patch-*.test.mjs` files were consolidated into `active_development/tests/`, while historical duplicates were moved to archive. Therefore filenames alone must not be used as proof that an active test is historical or current.

## Historical verification finding
`docs/archive/` contains 38 MJS test artifacts, including:
- `historical-contract-tests/`
- `walkmyplan/tests/`
- `dead-or-superseded/`

Repository documentation explicitly identifies these as historical evidence and says they do not replace canonical verification.

## Exact duplicate finding
One exact-content duplicate group was found:
- `docs/archive/dead-or-superseded/cinematic-3d-adapter.from-verify.test.mjs`
- `active_development/tests/cinematic-3d-adapter.test.mjs`

No deletion or automatic consolidation was performed. This requires lineage/canonical-role confirmation before any future migration.

## Important structural conclusion
The repository already has at least three distinct verification/testing roles:
1. **Canonical verification** — root `verify/`
2. **Active development tests** — `active_development/tests/`
3. **Historical verification/test evidence** — `docs/archive/`

There is also a fourth role:
4. **Audit/migration tooling** — `active_development/tools/`

Python should therefore not be introduced as a second test framework merely to classify these domains. A Python analysis tool may remain useful as read-only repository archaeology/change-control tooling, but Node/MJS is already the native verification/test ecosystem.

## Verification execution evidence
Existing repository records report prior Node test-suite executions (including differing historical counts such as 95 and 106 tests). These records are treated as historical evidence only. Phase 02 did not rerun the suite because this phase is reconnaissance and the user's instruction is to begin with evidence and avoid replaying chronological execution work.

## Naming conclusion
Do not rename the MJS corpus in bulk. A future naming pass may establish semantic canonical names and optional numeric targeting such as `001-verify-...mjs` or `001-test-...mjs`, but only after Phase 03/CP-06B establishes artifact identity, ownership, references, and conflict rules.

Execution labels such as `patch-*`, `DD*`, `foundation-repair-*`, and `phase*` should be treated as lineage clues rather than canonical identity.

## Required next step
Proceed to Phase 03 — Content-Level Batch Mapping, where individual files are classified by actual role and dependency context across Backend, Database/Firebase, Frontend/UI, Security/Auth, 3D/Spatial, Routes/Navigation, Integrations, Project Guide, Documentation, Contracts, Findings, Reconciliation, Checkpoints, Archive, and Configuration.

Physical migration remains unauthorized until CP-06B architecture is established and endorsed.
