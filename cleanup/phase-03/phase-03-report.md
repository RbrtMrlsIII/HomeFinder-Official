# Phase 03 — Content-Level Batch Mapping

## Status
Completed as a mapping/reconnaissance phase. No source files were renamed, moved, deleted, or rewritten.

## Scope
The Phase 02 project ZIP was used as the physical input. The archive currently contains 800 files because Phase 01/02 evidence was durably added under `cleanup/`. The original application/repository content remains unchanged.

## Method
This phase mapped files using physical path, extension, repository structure, and limited content signals. The resulting batch assignments are **provisional classifications**, not canonical decisions. Ambiguous files remain explicitly unresolved.

Primary candidate batches:
- Backend / Firebase / Database
- Verification / Tests
- 3D / Spatial
- Security / Authentication
- Frontend / UI
- Routes / Navigation
- Contracts
- Documentation / Project Guide
- Configuration / Data
- Unclassified / Needs Review

## Important architectural finding
Backend/configuration artifacts must be classified by dependency ownership rather than by extension. Firebase/Firestore-related files should remain physically coherent when their dependency architecture requires it. No generic extension-based flattening was performed.

## Verification finding
Existing MJS verification/test structures remain the preferred project verification mechanism. Python is retained only as repository-analysis/change-control tooling unless later evidence establishes a genuine project need.

## Historical material
A broad set of historical/archive/patch/checkpoint/dead-or-superseded candidates was identified. These are **deletion candidates only**, not deletion approvals. Historical documentation that references such material must be reconciled before deletion so obsolete execution history is not accidentally revived or left as a broken dependency.

## Reference safety
A path-reference scan was performed against textual repository files. Findings are recorded separately in `historical-reference-findings.csv`. References must be classified before any historical artifact is removed: authoritative/current reference, historical evidence, stale reference, or unresolved.

## Naming
No canonical renaming was executed. Future names such as `001-doc-...`, `001-auth-...`, or `001-backend-...` must be assigned only after artifact identity, ownership, references, conflicts, and canonical status are reviewed. Numeric prefixes may repeat across independent artifact classes.

## Next architectural gate
Before physical migration, CP-06B should establish:
- naming grammar
- directory taxonomy
- category vocabulary
- batch structure
- canonical artifact identity
- revision and lineage model
- reconciliation/archive architecture
- verification strategy
- reference migration strategy
- conflict-resolution rules

## Safety result
No bulk rename, bulk move, deletion, code rewrite, or test-framework migration was performed.
