# CP-06B — Artifact Identity Model

## Purpose
Every artifact in the repository must have a complete identity record before any physical migration. This model ensures that no file is moved, renamed, or deleted without understanding its role, dependencies, and risk.

## Identity Fields

### 1. CURRENT_PATH
The physical location of the artifact in the repository today.

**Example:** `active_development/firebase/firestore.rules`

### 2. PROPOSED_CANONICAL_PATH
The target location after migration, if approved.

**Example:** `active_development/firebase/firestore.rules` (no change — backend coherence)
**Example:** `project-guide/Endorsement.md` (move from root)
**Example:** `archive/checkpoints/2026-08-26/5.5c-v4-cinematic-3d-slice.txt` (move from `verification/`)

### 3. ARTIFACT_CLASS
The semantic classification of the artifact's content and purpose.

**Values:** `backend`, `frontend`, `3d-spatial`, `security`, `verification`, `contracts`, `documentation`, `data`, `configuration`, `archive`, `project-guide`, `cleanup-evidence`, `unclassified`

### 4. LOGICAL_BATCH
The primary domain to which the artifact belongs. One artifact may logically belong to multiple domains, but has one primary batch.

**Values:** `Backend / Firebase`, `Backend / Supabase`, `Frontend / UI`, `3D / Spatial`, `Security / Auth`, `Routes / Navigation`, `Integrations`, `Contracts`, `Verification`, `Documentation`, `Project Guide`, `Configuration / Data`, `Archive`, `Cleanup Process`, `Unclassified`

### 5. PURPOSE
A one-sentence description of what the artifact does.

**Example:** "Firebase security rules for Firestore database access control"
**Example:** "Canonical verifier for role authority invariants"

### 6. AUTHORITY_STATUS
Whether this artifact is a source of truth for the current system.

| Value | Meaning |
|-------|---------|
| `canonical` | Current source of truth |
| `active-dev` | Part of active development, may become canonical |
| `historical-evidence` | Preserved for historical reference |
| `reconciliation-copy` | Copy created for comparison/validation |
| `process-evidence` | Artifact of the cleanup process itself |
| `unresolved` | Cannot determine authority without more evidence |

### 7. HISTORICAL_STATUS
The lifecycle position of the artifact.

| Value | Meaning |
|-------|---------|
| `current` | Active and current |
| `evidence` | Preserved as historical evidence |
| `deletion-candidate` | Proposed for deletion after validation |
| `lineage-required` | Must preserve lineage information |
| `unresolved` | Cannot determine without more evidence |

### 8. REFERENCES_COUNT
Number of other repository files that contain a path reference to this artifact.

**High count** = moving/renaming this file requires updating many references.

### 9. DEPENDENCIES
Other artifacts that this artifact references or imports.

**Example:** `active_development/js/firebase.js` depends on `active_development/firebase/firestore.rules` (conceptual)

### 10. DUPLICATE_STATUS
Whether this artifact is part of a duplicate group.

| Value | Meaning |
|-------|---------|
| `unique` | No exact-content duplicates |
| `duplicate-group-<hash>` | Part of an exact-content duplicate group |
| `...|reconciliation-copy` | Known to be a reconciliation copy |
| `...|archive-copy` | Known to be an archive copy |
| `...|needs-classification` | Duplicate role not yet determined |

### 11. CONFLICT_LEVEL
The risk level of moving/renaming this artifact.

| Level | Criteria | Action Required |
|-------|----------|-----------------|
| `LOW` | No meaningful references; clearly independent | Document and proceed |
| `MEDIUM` | Referenced by docs, manifests, or multiple structures | Plan reference updates |
| `HIGH` | Executable imports, deployment refs, backend coupling, duplicate with unclear ownership, unique evidence | STOP — ask repository owner |

### 12. LINEAGE_REQUIRED
Whether execution history or provenance must be preserved for this artifact.

**Values:** `Yes`, `No`

### 13. VERIFICATION_COVERAGE
Which verifiers or tests cover this artifact.

**Example:** `verify/security/`, `verify/contracts/`, `active_development/tests/`

### 14. MIGRATION_STATUS
The current state of this artifact in the migration pipeline.

| Value | Meaning |
|-------|---------|
| `pending-mapping` | Classified but not yet approved for migration |
| `approved` | Approved for migration when CP-07/CP-08 begins |
| `blocked` | Cannot migrate until conflict is resolved |
| `completed` | Migration executed and validated |

## Usage
Before any rename, move, or delete:
1. Look up the artifact in `canonical-candidate-mapping.csv`
2. Verify all 14 fields are populated
3. Check CONFLICT_LEVEL
4. If HIGH, stop and ask the repository owner
5. If MEDIUM, plan reference updates
6. If LOW, proceed with documentation
7. After migration, update MIGRATION_STATUS to `completed`
