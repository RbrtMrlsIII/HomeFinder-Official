# CP-06B — Architecture Before Migration

## Status
**Phase:** CP-06B — Architecture Before Migration  
**Date:** 2026-08-28  
**Operation status:** COMPLETED  
**Physical migration status:** NOT STARTED  
**Renames:** None executed  
**Moves:** None executed  
**Deletions:** None executed  
**Source archive modified:** No (only `cleanup/cp-06b/` evidence added)

## Endorsement
This report was produced under the authority of the Master Session Endorsement and the repository owner's explicit decisions dated 2026-08-28. All findings, rules, and suggestions were approved before execution.

## Scope
CP-06B establishes the canonical architecture, naming grammar, directory taxonomy, category vocabulary, artifact identity model, and file-level candidate mapping required before any physical migration (CP-07/CP-08).

## Repository State
- **Total files:** 799
- **Original repository files:** 787
- **Cleanup evidence added (Phase 01–03 + CP-06B):** 12
- **Duplicate groups:** 12 exact-content groups
- **High-conflict files:** 28
- **Pending-mapping files:** 104

## Decisions Applied

### Decision 1: Project-Guide Physical Location — Option A
- `AI_ASSISTANT_READ_ME.md` → `project-guide/AI_ASSISTANT_READ_ME.md`
- `Endorsement.md` → `project-guide/Endorsement.md`
- `HandOver.md` → `project-guide/HandOver.md`
- `masterplan.md` → `project-guide/masterplan.md`
- `README.md` stays at root as index pointer

### Decision 2: verification/ vs. verify/ — Option A
- `verification/` → `archive/checkpoints/` (all dated checkpoint/execution evidence)
- `verify/` remains canonical verification ecosystem

### Decision 3: active_development/tests/ — Option A
- Classify only; no migration during CP-06B
- 85 MJS test files remain in place pending G-series completion

### Decision 4: cleanup/ Durability
- All CP-06B evidence placed in `cleanup/cp-06b/`
- Structure mirrors Phase 01–03: report, checklist, session continuity, mapping, registers

### Decision 5: Duplicate Handling — Option A
- All 12 duplicate groups mapped and classified
- No physical deduplication executed
- Reconciliation copies, archive copies, and shared contracts all documented

## Key Architectural Principles

1. **Repository evidence first.** Every classification is based on physical content, path, references, and dependency analysis.
2. **Backend coherence preserved.** Firebase and Supabase artifacts remain physically grouped.
3. **No extension-based taxonomy.** Files are classified by purpose, not by `.json`, `.md`, `.mjs`, etc.
4. **Historical material is not automatically canonical.** Archive contents remain evidence, not authority.
5. **No chronological labels as identity.** `patch-*`, `DD*`, `foundation-repair-*` are lineage clues only.
6. **Validation after every change.** No migration proceeds without reference verification.

## Deliverables

| # | Deliverable | File | Status |
|---|-------------|------|--------|
| 1 | CP-06B Report | `cp-06b-report.md` | ✅ Complete |
| 2 | Execution Checklist | `execution-checklist.md` | ✅ Complete |
| 3 | Session Continuity | `SESSION-CONTINUITY.md` | ✅ Complete |
| 4 | Naming Grammar | `naming-grammar.md` | ✅ Complete |
| 5 | Directory Taxonomy | `directory-taxonomy.md` | ✅ Complete |
| 6 | Category Vocabulary | `category-vocabulary.md` | ✅ Complete |
| 7 | Artifact Identity Model | `artifact-identity-model.md` | ✅ Complete |
| 8 | Canonical Candidate Mapping | `canonical-candidate-mapping.csv` | ✅ Complete |
| 9 | Canonical Candidate Mapping (JSON) | `canonical-candidate-mapping.json` | ✅ Complete |
| 10 | Conflict Register | `conflict-register.md` | ✅ Complete |
| 11 | Unresolved Questions | `unresolved-questions.md` | ✅ Complete |
| 12 | Statistics | `cp-06b-statistics.json` | ✅ Complete |

## Next Phase

**CP-07 — Canonical Naming Migration** (requires explicit authorization)
- Apply approved renames to LOW-conflict files
- Update references for MEDIUM-conflict files
- Resolve HIGH-conflict files with repository owner

**CP-08 — Repository Architecture Migration** (requires explicit authorization)
- Execute physical moves per canonical candidate mapping
- Validate after every batch
- Update project-guide index

## Source-of-Truth Rule
Where repository evidence conflicts with assumptions in this document, stop and request the repository owner's decision. The repository owner remains the source of truth.
