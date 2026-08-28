# CP-06B — Unresolved Questions

## Questions for Repository Owner

### Q1: Project-Guide Migration Timing
The 5 top-level continuity documents (`README.md`, `AI_ASSISTANT_READ_ME.md`, `Endorsement.md`, `HandOver.md`, `masterplan.md`) are approved to move to `project-guide/`. However, they are actively referenced by the G-series development workflow.

**Question:** Should the project-guide migration wait until the current G-series gate (5.5G.6I) is complete, or can it proceed in parallel?

**Suggested answer:** Wait until 5.5G.6I is complete to avoid disrupting active development references.

### Q2: Archive Unification Scope
The `docs/archive/` directory contains historical material. The proposed unified `archive/` directory would consolidate:
- `docs/archive/` → `archive/`
- `verification/` → `archive/checkpoints/`
- `docs/json/archive/` → `archive/json/`
- `docs/json/reconciliation/` → `archive/reconciliation/`

**Question:** Should all these be unified in CP-08, or should the `docs/json/reconciliation/` copies be deleted first after validation?

**Suggested answer:** Unify all in CP-08, but validate that reconciliation copies have no active dependencies before moving.

### Q3: active_development/tests/ Canonical Promotion
85 MJS files in `active_development/tests/` include canonical-looking tests alongside historical `patch-*` and `foundation-repair-*` tests.

**Question:** Should any of these tests be promoted to `verify/` as canonical verifiers, or should all remain in `active_development/tests/` until the G-series is complete?

**Suggested answer:** Classify only during CP-06B; promotion decisions deferred to CP-09 (Reconciliation System Establishment).

### Q4: Firebase/Supabase Shared Contract
`kyc-authorization.json` exists in both:
- `active_development/firebase/functions/contracts/`
- `active_development/supabase/functions/_shared/`

**Question:** Should this be a single shared contract in a neutral location, or should each backend keep its own copy?

**Suggested answer:** Maintain backend coherence — keep copies in each backend directory but document the relationship. Do not create a shared neutral location that breaks backend physical coherence.

### Q5: Unclassified Files
19 files remain unclassified.

**Question:** Should these be reviewed individually, or can they be batch-classified by extension and path pattern?

**Suggested answer:** Review individually in CP-07 as part of the first migration batch.

### Q6: Cleanup Evidence Longevity
`cleanup/` currently contains Phase 01–03 and CP-06B evidence. As cleanup progresses, this directory will grow.

**Question:** Should older cleanup phases be archived or compressed after CP-12 (Repository Integrity Validation)?

**Suggested answer:** Keep all cleanup evidence permanently. It serves as the audit trail for the reconstruction process.

## Questions for Future AI Sessions

### Q7: Reference Graph Completeness
The reference graph was built by scanning textual files for path-like strings. It may miss:
- Dynamic references (computed paths in JS)
- Import aliases
- Build-time path resolution

**Action:** Future sessions should enhance the reference scanner to handle dynamic references.

### Q8: Verification Coverage Gaps
Some canonical artifacts have no mapped verification coverage.

**Action:** Future sessions should audit `verify/` coverage against canonical artifacts and identify gaps.

### Q9: Historical Test Execution State
Previous sessions reported Node test suite executions with varying counts (95, 106 tests). The current state of the test suite is unknown.

**Action:** Future sessions should run the test suite and record the current baseline before any test migration.
