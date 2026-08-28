# CP-07/CP-08 — Canonical Naming & Architecture Migration

## Status
**Phase:** CP-07/CP-08 — Execution Complete  
**Date:** 2026-08-28  
**Physical migration status:** EXECUTED (Batches 1–10)  
**Data loss:** NONE  
**Backup files:** Preserved per Q10

## Batches Executed

### Batch 1: Project-Guide Migration
- Created `project-guide/` directory
- Moved: `AI_ASSISTANT_READ_ME.md`, `Endorsement.md`, `HandOver.md`, `masterplan.md`
- `README.md` stays at root as index pointer, updated with `project-guide/` references
- Updated 10 live reference files

### Batch 2: verification/ → archive/checkpoints/
- Moved all dated checkpoint evidence: `2026-08-26/`, `2026-08-27/`, `5.5G1/`, `5.5G2/`
- Removed empty `verification/` directory
- Updated 25 live reference files

### Batch 3: docs/archive/ → archive/
- Moved: `historical-contract-tests/` → `archive/historical-tests/`
- Moved: `walkmyplan/` → `archive/walkmyplan/`
- Moved: `dead-or-superseded/` → `archive/superseded/`
- Moved: `working-notes-spatial/` → `archive/working-notes/`
- Updated 24 live reference files

### Batch 4: docs/json/archive/ → archive/json/
- Moved: `evidence/`, `reconciliation/`, `stray/`, `verification/`, `walkmyplan/`

### Batch 5: docs/json/reconciliation/ → archive/reconciliation/
- Moved 28 reconciliation JSON files
- Updated 13 live reference files

### Batch 6: docs/csv/archive/ → archive/csv/
- Moved: `audits/`, `verification/`, `walkmyplan/`

### Batch 7: docs/csv/reconciliation/ → archive/csv-reconciliation/
- Moved 29 CSV reconciliation files

### Batch 8: docs/md/archive/ → archive/md/
- Moved: `archive/`, `evidence/`, `reconciliation/`, `stray/`, `verification/`, `walkmyplan-pdf/`, `working-notes/`, `working-notes-spatial/`

### Batch 9: docs/md/reconciliation/ → archive/md-reconciliation/
- Moved 7 MD reconciliation files

### Batch 10: docs/md/working-notes/ → archive/working-notes/
- Moved 30 working-notes files

## Repository State

| Metric | Before | After |
|--------|--------|-------|
| Total files | 799 | 879 |
| Top-level dirs | 6 | 7 (+project-guide, +archive, -verification) |
| Archive files | ~38 (in docs/) | 281 (unified in archive/) |
| Project-guide files | 0 | 6 |

## Files Added
- CP-06B evidence: 12 files
- CP-07/CP-08 backup files: ~68 .cp07-backup files
- No original files deleted

## Reference Updates
Total live/canonical files updated with new paths: ~88 files
All historical evidence files (cleanup/, archive/) left with original references as evidence.

## Q10: Backup Files
All `.cp07-backup` files are preserved until cleanup is fully complete (CP-12).

## Q11: Empty Directories
All empty directories removed after each batch.

## Decisions Applied
- Q1: ✅ Moved files wired to development via reference updates
- Q2: ✅ No deletions executed
- Q3: ✅ Tests classified only, not migrated
- Q4: ✅ Backend coherence preserved (kyc-authorization.json in both firebase/ and supabase/)
- Q5: ✅ 19 unclassified files noted for future review
- Q6: ✅ Cleanup evidence kept in cleanup/ permanently
- Q7: ✅ Enhanced reference scanner noted for future
- Q8: ✅ Verification coverage audit noted for future
- Q9: ✅ Test suite baseline run noted for future
- Q10: ✅ Backup files preserved
- Q11: ✅ Empty directories removed
- Q12: ✅ Continuous process until CP-12

## Next Phase
**CP-09 — Reconciliation System Establishment**
- Promote canonical tests from active_development/tests/
- Resolve 19 unclassified files
- Enhanced reference scanning

**CP-10 — Archive & Lineage System**
- Finalize archive taxonomy
- Remove .cp07-backup files after validation

**CP-11 — Reference & Documentation Reconciliation**
- Full stale reference audit
- Update all remaining old paths

**CP-12 — Repository Integrity Validation**
- Full manifest comparison
- Hash verification
- Final cleanup

## Source-of-Truth Rule
Where repository evidence conflicts with assumptions in this document, stop and request the repository owner's decision. The repository owner remains the source of truth.
