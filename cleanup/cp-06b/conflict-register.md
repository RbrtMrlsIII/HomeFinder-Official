# CP-06B — Conflict Register

## Overview
- **HIGH conflicts:** 28 files
- **MEDIUM conflicts:** 610 files
- **LOW conflicts:** 161 files

## HIGH Conflict Files

These files require repository owner authorization before any migration.

| # | Current Path | Proposed Path | Reason | References |
|---|-------------|---------------|--------|------------|
| 1 | `AI_ASSISTANT_READ_ME.md` | `project-guide/AI_ASSISTANT_READ_ME.md` | Top-level continuity document — heavily referenced | 19 |
| 2 | `Endorsement.md` | `project-guide/Endorsement.md` | Top-level continuity document — heavily referenced | 8 |
| 3 | `HandOver.md` | `project-guide/HandOver.md` | Top-level continuity document — heavily referenced | 8 |
| 4 | `README.md` | `README.md` | Top-level continuity document — heavily referenced | 18 |
| 5 | `active_development/cinematic/WalkMyPlan/README.md` | `README.md` | High reference count or critical dependency | 3 |
| 6 | `active_development/firebase/firestore.rules` | `active_development/firebase/firestore.rules` | Backend artifact — deployment coupling | 16 |
| 7 | `active_development/firebase/functions/contracts/kyc-authorization.json` | `active_development/firebase/functions/contracts/kyc-authorization.json` | Backend artifact — deployment coupling | 6 |
| 8 | `active_development/js/reference-3d/README.md` | `README.md` | High reference count or critical dependency | 3 |
| 9 | `active_development/supabase/README.md` | `README.md` | Backend artifact — deployment coupling | 4 |
| 10 | `active_development/supabase/functions/_shared/kyc-authorization.json` | `active_development/supabase/functions/_shared/kyc-authorization.json` | Backend artifact — deployment coupling | 6 |
| 11 | `active_development/supabase/functions/upload-kyc-document/index.ts` | `active_development/supabase/functions/upload-kyc-document/index.ts` | Backend artifact — deployment coupling | 6 |
| 12 | `active_development/supabase/functions/upload-listing-image/index.ts` | `active_development/supabase/functions/upload-listing-image/index.ts` | Backend artifact — deployment coupling | 6 |
| 13 | `active_development/supabase/migrations/0001_homefinder_storage_authority.sql` | `active_development/supabase/migrations/0001_homefinder_storage_authority.sql` | Backend artifact — deployment coupling | 6 |
| 14 | `docs/archive/historical-contract-tests/README.md` | `README.md` | High reference count or critical dependency | 5 |
| 15 | `docs/json/3d-contract.json` | `docs/json/3d-contract.json` | High reference count or critical dependency | 7 |
| 16 | `docs/json/checkpoint-manifest-root.json` | `docs/json/checkpoint-manifest-root.json` | High reference count or critical dependency | 8 |
| 17 | `docs/json/firebase/kyc-authorization.json` | `docs/json/firebase/kyc-authorization.json` | Backend artifact — deployment coupling | 7 |
| 18 | `docs/json/project-authority.json` | `docs/json/project-authority.json` | Canonical authority document — high reference count | 10 |
| 19 | `docs/json/roles-contract.json` | `docs/json/roles-contract.json` | High reference count or critical dependency | 8 |
| 20 | `docs/json/routes-contract.json` | `docs/json/routes-contract.json` | High reference count or critical dependency | 8 |
| 21 | `docs/md/cloudflare/README.md` | `README.md` | High reference count or critical dependency | 3 |
| 22 | `docs/md/contracts/README.md` | `README.md` | High reference count or critical dependency | 3 |
| 23 | `docs/md/firebase/README.md` | `README.md` | Backend artifact — deployment coupling | 3 |
| 24 | `docs/md/paypal/README.md` | `README.md` | High reference count or critical dependency | 3 |
| 25 | `docs/md/reconciliation/README.md` | `README.md` | High reference count or critical dependency | 3 |
| 26 | `docs/md/supabase/README.md` | `README.md` | Backend artifact — deployment coupling | 3 |
| 27 | `master/HomeFinder.sh3d` | `master/HomeFinder.sh3d` | Canonical 3D authority — 96 references | 96 |
| 28 | `masterplan.md` | `project-guide/masterplan.md` | Top-level continuity document — heavily referenced | 16 |

## MEDIUM Conflict Files (Summary)

610 files have MEDIUM conflict level. These require reference updates during migration but do not block execution. Key categories:

| Category | Count | Migration Strategy |
|----------|-------|-------------------|
| Documentation (docs/md/) | ~180 | Update internal Markdown links |
| Frontend (active_development/js/, css/) | ~150 | Update import paths, CSS references |
| Verification (verify/, active_development/tests/) | ~100 | Update test imports, verifier references |
| Data/Config (active_development/data/) | ~30 | Update JSON references |
| Contracts (docs/json/) | ~20 | Update documentation references |
| 3D/Spatial (active_development/3d/) | ~15 | Update viewer references |
| Archive (docs/archive/) | ~80 | Verify no active references before move |
| Cleanup evidence | ~19 | No migration needed — already in cleanup/ |

## Duplicate Groups Requiring Classification

12 exact-content duplicate groups exist. Each requires lineage/canonical-role confirmation before deduplication.

| Group | Files | Duplicate Status |
|-------|-------|-----------------|
| `7dc0b14b77ab70ba` | 2 | needs-classification, reconciliation-copy |
| `5e02d080b77e029f` | 2 | needs-classification, reconciliation-copy |
| `9abf6dd157fcb050` | 2 | needs-classification, reconciliation-copy |
| `fe33492af62c4958` | 2 | needs-classification, reconciliation-copy |
| `dddfd46d6010cec9` | 2 | needs-classification |
| `4068c63613779c56` | 2 | archive-copy, needs-classification |
| `8922a7ed2f8d6b44` | 2 | archive-copy, reconciliation-copy |
| `ff09635fa9d13112` | 2 | archive-copy, reconciliation-copy |
| `44abd96f6d7ee427` | 2 | archive-copy, reconciliation-copy |
| `fe1f428b3a50ecdb` | 2 | archive-copy, reconciliation-copy |
| `40f84b8ce733db15` | 2 | archive-copy, reconciliation-copy |
| `dfb3f97f37716ab6` | 2 | reconciliation-copy |

## Resolution Protocol

1. For HIGH conflicts: Obtain explicit repository owner authorization before migration.
2. For MEDIUM conflicts: Plan reference updates as part of the migration batch.
3. For duplicate groups: Classify each file's role, then determine canonical owner.
4. After resolution: Update this register and the canonical candidate mapping.
