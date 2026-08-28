# HomeFinder Engineering System
## Master Skill v1.0

---

# 00. PURPOSE AND AUTHORITY

This is the unified engineering skill for the HomeFinder project.

It combines repository intelligence, architecture, development,
verification, reconstruction, tooling, and continuity procedures into
one coordinated operating system.

It helps an AI:

- understand HomeFinder
- inspect the repository
- reconstruct architecture
- classify artifacts
- trace dependencies
- reconcile contracts
- develop features
- investigate bugs
- verify behavior
- analyze 3D/spatial systems
- maintain repository integrity
- perform controlled cleanup
- preserve historical lineage
- create repository-analysis tooling
- maintain session continuity

This skill operates under:

1. HomeFinder Master Project Knowledge
2. HomeFinder Master Custom Instructions
3. explicit user decisions
4. current repository evidence

This skill does not override those authorities.

---

# 01. CORE OPERATING MODEL

Use:

OBSERVE
→ UNDERSTAND
→ CLASSIFY
→ MAP
→ PLAN
→ IMPLEMENT / MIGRATE
→ VERIFY
→ RECONCILE
→ RECORD
→ CONTINUE

Do not jump directly from request to mass change when investigation is
required.

Scale investigation to risk and scope.

For low-risk read-only work, keep the process lightweight.
For high-risk changes, establish stronger evidence before acting.

---

# 02. ENGINEERING ORCHESTRATION

## Purpose

Determine:

- what the user is actually asking
- what engineering problem is involved
- what must be known first
- which system modes are required
- what order minimizes risk

## Request Classification

Classify requests as one or more of:

- discovery
- architecture
- implementation
- bug investigation
- verification
- contract work
- security work
- Firebase/database work
- frontend/UI work
- 3D/spatial work
- integration work
- repository cleanup
- migration
- historical reconstruction
- tooling
- documentation
- mixed-domain work

The wording of a request is not necessarily its real engineering
category.

Example:

"Move this file"

may require:

Artifact Classification
+
Reference Tracing
+
Architecture Mapping
+
Cleanup / Reconstruction
+
Verification

## Dependency-Aware Ordering

Prefer:

DISCOVERY
→ CLASSIFICATION
→ DEPENDENCY ANALYSIS
→ ARCHITECTURE / CONTRACT
→ IMPLEMENTATION OR MIGRATION
→ VERIFICATION
→ RECONCILIATION

Skip completed stages only when trustworthy existing evidence already
establishes the required facts.

## Risk Levels

### LOW

- read-only inspection
- searches
- inventories
- reports
- analysis

### MODERATE

- localized implementation
- test changes
- configuration changes
- limited restructuring

### HIGH

- renaming
- moving
- deleting
- schema migration
- authentication changes
- security-rule changes
- major architectural changes
- bulk repository operations

Higher-risk work requires stronger evidence and validation.

---

# 03. REPOSITORY ARCHAEOLOGY MODE

## Purpose

Understand the physical repository before making substantial changes.

Default behavior:

READ-ONLY

## Initial Archive Handling

When receiving a project archive:

1. preserve the original
2. create a safe working extraction/copy
3. inspect the working copy
4. do not mutate the original archive
5. preserve important durable findings inside the project repository

Never assume historical file counts remain current.

## Inventory

Record where appropriate:

- path
- filename
- extension
- size
- SHA-256
- parent directory
- top-level directory
- probable role
- unusual characteristics

## Structural Inspection

Identify:

- root artifacts
- major directories
- nested structures
- frontend
- backend
- database/Firebase
- verification
- documentation
- contracts
- configuration
- historical records
- 3D/spatial artifacts
- generated outputs
- tooling

Directory names are evidence, not automatic proof of canonical
architecture.

## Historical Signals

Investigate names containing:

- patch
- phase
- checkpoint
- repair
- foundation
- final
- historical
- old
- backup
- archive
- temporary
- generated

These are investigation signals, not deletion instructions.

## Baseline Deliverables

For formal baseline work, produce appropriate records such as:

phase-01/
- baseline-manifest.csv
- directory-tree.txt
- phase-01-report.md
- execution-checklist.md

Adapt the location if an existing canonical project structure already
serves the same purpose.

---

# 04. ARTIFACT CLASSIFICATION MODE

## Purpose

Determine what an artifact actually represents.

Never classify from extension or filename alone.

## Lifecycle Classes

An artifact may be:

- current
- historical
- superseded
- deprecated
- generated
- temporary
- unresolved

## Functional Classes

Possible roles:

- implementation
- configuration
- contract
- documentation
- verification
- fixture
- tooling
- data
- asset
- model
- manifest
- report

## Domain Classes

Possible domains:

- frontend
- backend
- database
- Firebase
- security
- authentication
- routes/navigation
- 3D/spatial
- integrations
- contracts
- verification
- documentation
- findings
- reconciliation
- checkpoints
- archive
- configuration

An artifact may have multiple logical classifications.

## Authority

When evidence permits, classify an artifact as:

- authoritative
- canonical candidate
- derived
- supporting
- historical
- generated
- unknown

Do not infer authority merely from:

- filename
- location
- timestamp
- numerical prefix
- words such as "final"

## Verification Classification

A test-looking artifact may actually be:

- executable test
- executable verifier
- helper
- fixture
- output
- report
- historical evidence
- documentation
- duplicate
- unknown

Do not create a new test merely because an artifact is ambiguous.

## Duplicate Classification

Potential duplicates must be classified as:

- exact duplicate
- near duplicate
- historical copy
- generated copy
- superseded
- independent
- supporting
- canonical candidate
- unresolved

Never delete merely because content appears duplicated.

---

# 05. REFERENCE TRACING MODE

## Purpose

Determine what depends on an artifact before changing it.

## Search Targets

Inspect references across:

- `.js`
- `.mjs`
- `.ts`
- `.json`
- `.md`
- `.html`
- `.css`
- `.csv`
- shell scripts
- configuration
- manifests
- imports
- exports
- routes
- dynamic paths

## Reference Types

Classify references as:

- direct
- indirect
- dynamic
- documentation
- historical
- generated
- external

## Dynamic References

Pay attention to:

- template literals
- string concatenation
- environment variables
- path resolution
- globbing
- dynamic imports
- runtime route construction
- registry lookup

Static search is not proof that dynamic references do not exist.

## Migration Impact

Before a rename or move, determine:

OLD PATH
→ REFERENCES
→ CONSUMERS
→ DEPENDENCIES
→ DOCUMENTATION
→ CONFIGURATION
→ HISTORICAL IMPACT
→ UNKNOWN REFERENCES
→ RISK

No high-impact migration should proceed while critical dependencies
remain unresolved.

---

# 06. ARCHITECTURE MAPPING MODE

## Purpose

Reconstruct how HomeFinder actually works.

Always distinguish:

CURRENT ARCHITECTURE
INTENDED ARCHITECTURE
PROPOSED ARCHITECTURE

## Major Domains

Investigate as supported by evidence:

- frontend/UI
- application logic
- backend
- database
- Firebase
- authentication
- authorization
- security
- routes/navigation
- 3D/spatial
- integrations
- contracts
- configuration
- verification
- tooling

Do not invent missing architecture.

## Dependency Mapping

For important components determine:

- upstream dependencies
- downstream consumers
- shared dependencies
- external dependencies
- runtime dependencies
- build dependencies
- verification dependencies
- cycles

Do not automatically refactor detected cycles.

## Ownership

For important artifacts determine:

WHAT SYSTEM DEFINES IT?
WHAT SYSTEM MAINTAINS IT?
WHAT SYSTEM CONSUMES IT?

Physical location is not automatically ownership.

## Authority Model

Prefer:

SOURCE OF TRUTH
→ DERIVED REPRESENTATIONS
→ CONSUMERS
→ VERIFIERS

Distinguish:

- canonical
- derived
- cached
- runtime
- historical
- supporting

## Frontend Architecture

Inspect:

- entry points
- initialization
- components
- state
- services
- API access
- authentication state
- routes
- data fetching
- error handling
- loading states
- configuration

Determine how UI obtains and mutates application data.

## Backend Architecture

Inspect:

- entry points
- services
- handlers
- business logic
- validation
- authorization
- configuration
- external calls

Determine where important business rules are enforced.

## Firebase / Database Architecture

Map:

APPLICATION
→ DATA ACCESS
→ DATABASE
→ SECURITY RULES

Determine:

- collections/tables
- document structures
- fields
- relationships
- rules
- access boundaries
- validation
- migration assumptions

Database structure may be a shared architectural contract, not merely
a backend implementation detail.

## Authentication / Authorization

Keep authentication and authorization conceptually separate.

Determine:

- where identity is established
- where identity is stored
- where permissions are evaluated
- where access is enforced

UI visibility is not authorization.

## Navigation

Map relationships among:

- application routes
- UI routes
- backend endpoints
- property identifiers
- spatial identifiers
- navigation state
- deep links

## Integrations

For external services determine:

- boundary
- credentials/configuration
- data flow
- transformations
- error handling
- retries
- verification

Distinguish:

HomeFinder-owned data
from
external data
from
transformed data.

## Architecture Record

For important systems, record:

SYSTEM:
PURPOSE:
PRIMARY COMPONENTS:
DEPENDENCIES:
DATA FLOW:
CONTROL FLOW:
SOURCE OF TRUTH:
DERIVED REPRESENTATIONS:
OWNERSHIP:
SECURITY BOUNDARIES:
VERIFICATION:
CROSS-DOMAIN CONNECTIONS:
ARCHITECTURAL RISKS:
CONFIDENCE:

---

# 07. CONTRACT RECONCILIATION MODE

## Purpose

Compare intended contracts with actual implementation.

Potential contracts include:

- API contracts
- database contracts
- Firebase structures
- security rules
- authentication contracts
- route contracts
- frontend/backend assumptions
- shared identifiers
- data schemas

## Comparison

Classify findings as:

MATCH
MISMATCH
MISSING
EXTRA
AMBIGUOUS
UNVERIFIED

## Shared Concepts

For important shared concepts determine:

- where defined
- who owns it
- who consumes it
- format
- validation
- verification

Examples include:

- user ID
- property ID
- listing ID
- room ID
- route ID
- spatial ID
- status
- timestamps

## Contract Change Gate

Before changing a shared contract determine:

- consumers
- compatibility
- migration impact
- verification
- recovery/rollback implications

Never change a shared contract as though it were an isolated file.

---

# 08. 3D / SPATIAL ANALYSIS MODE

## Purpose

Analyze HomeFinder's physical and spatial architecture.

Potential artifacts include:

- `.sh3d`
- spatial data
- room structures
- doors
- portals
- coordinates
- cameras
- levels
- navigation structures

## Spatial Pipeline

Distinguish:

PHYSICAL MODEL
→ SPATIAL DATA
→ RUNTIME REPRESENTATION
→ NAVIGATION
→ UI

Determine the source of truth at each stage.

Do not "correct" spatial information based only on visual intuition.

## Spatial Relationships

Investigate:

- rooms
- doors
- portals
- coordinates
- cameras
- levels
- paths
- properties
- identifiers

Record physical/runtime discrepancies rather than silently correcting
them.

---

# 09. FEATURE DEVELOPMENT MODE

## Purpose

Implement new HomeFinder functionality safely.

Workflow:

REQUIREMENT
→ EXISTING FUNCTIONALITY
→ ARCHITECTURE
→ CONTRACT
→ DEPENDENCIES
→ DESIGN
→ IMPLEMENTATION
→ VERIFICATION
→ REGRESSION CHECK
→ DOCUMENTATION

## Before Coding

Determine:

- whether the feature already partially exists
- where it belongs
- which contracts it affects
- which components consume it
- security implications
- existing verification

## Implementation

Prefer:

- smallest coherent change
- existing abstractions
- established conventions
- compatibility
- explicit error handling
- secure boundaries

Avoid unnecessary rewrites.

## Completion

A feature is not complete merely because code exists.

Use:

IMPLEMENTED
+
VERIFIED
+
RECONCILED

---

# 10. BUG INVESTIGATION MODE

## Purpose

Find root causes instead of repeatedly treating symptoms.

Workflow:

SYMPTOM
→ REPRODUCE
→ TRACE
→ ISOLATE
→ ROOT CAUSE
→ MINIMAL FIX
→ REGRESSION TEST
→ VALIDATE

## Cause Confidence

Classify causes as:

- confirmed
- probable
- possible
- unrelated

Do not present hypotheses as confirmed root causes.

## Fix Philosophy

Prefer the smallest fix that resolves the actual cause while
preserving architecture.

Do not rewrite entire subsystems merely because a localized defect
exists.

---

# 11. VERIFICATION ENGINEERING MODE

## Purpose

Use HomeFinder's existing verification ecosystem effectively.

## First Inspect Existing Verification

Look for:

- MJS verifiers
- integration verification
- contract verification
- security verification
- data verification
- 3D verification
- route verification
- regression checks

Do not automatically create Python tests.

Do not create duplicate verification systems.

## Verification Types

Distinguish:

- static validation
- structural validation
- unit-style verification
- integration verification
- contract verification
- runtime validation
- regression validation

Never describe one type as another.

## Coverage

For important changes determine:

WHAT CHANGED?
WHAT VERIFIES IT?
WHAT IS NOT VERIFIED?

## Failure Handling

If verification fails:

STOP
→ RECORD FAILURE
→ IDENTIFY IMPACT
→ INVESTIGATE
→ FIX OR ESCALATE
→ RE-VERIFY

Do not stack uncertain changes on a failed validation state.

---

# 12. CLEANUP / RECONSTRUCTION MODE

## Purpose

Perform controlled repository cleanup without destroying information.

Workflow:

OBSERVE
→ CLASSIFY
→ MAP
→ PROPOSE
→ REFERENCE CHECK
→ MIGRATION MANIFEST
→ AUTHORIZATION
→ MIGRATE
→ VERIFY
→ RECONCILE

## Prohibited

Never automatically:

- bulk rename
- bulk move
- flatten
- delete historical artifacts
- duplicate artifacts into every logical category
- create parallel test systems
- rewrite architecture for cosmetic reasons

## Canonical Migration Record

For each approved migration record:

OLD PATH
→ NEW PATH
→ CATEGORY
→ REASON
→ REFERENCES
→ CONFLICT LEVEL
→ LINEAGE
→ VALIDATION
→ STATUS

## Physical vs Logical Classification

Prefer:

ONE PHYSICAL CANONICAL ARTIFACT
+
MULTIPLE LOGICAL CLASSIFICATIONS

rather than duplicate physical copies.

---

# 13. RECONCILIATION / LINEAGE MODE

## Purpose

Maintain the relationship between current architecture and project
history.

## Identity Model

Prefer:

CURRENT CANONICAL IDENTITY
+
HISTORICAL LINEAGE

Do not erase historical evidence merely to achieve clean naming.

## Historical Artifacts

Classify whether an artifact is:

- historical evidence
- superseded implementation
- current implementation
- generated output
- unresolved alternative
- lineage record

Do not automatically execute or delete historical artifacts.

## Reconciliation

After significant migration or restructuring compare:

OLD STATE
→ CHANGE
→ NEW STATE

Verify where applicable:

- references
- structure
- hashes
- contracts
- verification
- documentation
- lineage

---

# 14. PYTHON ANALYSIS TOOLING MODE

## Purpose

Use Python as a repository-analysis instrument, not as an automatic
replacement for the existing project verification ecosystem.

Typical tools may include:

- inventory
- classifier
- reference scanner
- duplicate detector
- batch mapper
- category mapper
- naming candidate generator
- migration manifest generator
- reconciliation validator
- report generator

## Dictionary / Index Design

Use compact dictionary/index structures when useful for:

- file records
- artifact identity
- category mappings
- dependency mappings
- references
- verification coverage
- lineage
- migration candidates
- conflicts

Prefer structured machine-readable intermediate data over repeated
manual parsing.

## Default Safety

Analysis tools should be:

- read-only
- deterministic
- reproducible
- narrowly scoped
- reusable
- documented

## Mutation Gate

Mutation-capable tooling must follow:

ANALYSIS
→ CANDIDATE MANIFEST
→ REVIEW
→ AUTHORIZATION
→ EXECUTION
→ VALIDATION

Never hide bulk mutation inside an analysis script.

---

# 15. REPOSITORY HYGIENE

Repository cleanliness is an ongoing engineering responsibility, not
a one-time cleanup event.

Continuously watch for:

- accidental files
- debug artifacts
- temporary outputs
- duplicate implementations
- abandoned experiments
- obsolete generated files
- stale documentation
- unexplained directories
- orphaned scripts
- unused migration artifacts
- accidental build outputs

Before removing anything:

CHECK
→ CLASSIFY
→ TRACE
→ CONFIRM
→ REMOVE OR PRESERVE WITH PURPOSE

Do not delete merely because something looks messy.

A clean repository should make artifact purpose understandable.

---

# 16. DEVELOPMENT FIELD COVERAGE

HomeFinder development must not become narrowly focused on repository
cleanup.

When relevant, consider the full development surface:

- product behavior
- frontend/UI
- backend/services
- database/data
- Firebase
- authentication
- authorization
- security
- search/discovery
- property/listing concepts
- routes/navigation
- 3D/spatial behavior
- integrations
- configuration
- performance
- accessibility
- responsive behavior
- error handling
- observability
- testing/verification
- documentation
- deployment/build concerns
- repository architecture

A cleanup task should not accidentally ignore active product
development.

A feature task should not accidentally ignore repository integrity.

---

# 17. DOCUMENTATION AND CONTINUITY

Documentation should preserve durable knowledge, not create noise.

Record important:

- architecture
- decisions
- contracts
- findings
- verification
- lineage
- risks
- assumptions
- migration evidence
- unresolved questions

## Session Continuity

At the end of substantial work record:

PHASE:
OBJECTIVE:
WORK COMPLETED:
FILES CHANGED:
FILES UNCHANGED:
DISCOVERIES:
VALIDATION:
DECISIONS:
UNRESOLVED:
RISKS:
NEXT ACTION:

Important continuity evidence should live inside the project repository,
not only inside the conversation or temporary workspace.

---

# 18. CHANGE VALIDATION GATE

After meaningful implementation or migration:

CHANGE
→ REFERENCE CHECK
→ STRUCTURAL CHECK
→ CONTRACT CHECK
→ TEST / VERIFICATION
→ DOCUMENTATION CHECK
→ RECONCILIATION

Not every change requires every check.

The AI must deliberately determine which checks apply.

---

# 19. STATUS DISCIPLINE

Use precise status terms:

- DISCOVERED
- ANALYZED
- PROPOSED
- AUTHORIZED
- IMPLEMENTED
- PARTIALLY IMPLEMENTED
- STATICALLY VALIDATED
- BEHAVIORALLY VALIDATED
- RUNTIME VALIDATED
- BLOCKED
- UNVERIFIED
- CONFLICTED
- DEFERRED

Do not use:

- done
- fixed
- perfect
- fully verified
- production ready

unless evidence actually supports the claim.

---

# 20. EVIDENCE AND CONFIDENCE

For significant findings use:

### CONFIRMED

Directly demonstrated.

### STRONGLY INDICATED

Supported by multiple evidence sources.

### INFERRED

Reasonable interpretation.

### UNKNOWN

Insufficient evidence.

Never upgrade confidence merely because a hypothesis seems likely.

---

# 21. ARCHITECTURAL CHANGE GATE

Before introducing a new:

- framework
- library
- abstraction
- service
- directory
- registry
- test system
- configuration mechanism

answer:

WHAT EXISTS?
WHY?
WHAT PROBLEM REMAINS?
DOES AN EXISTING MECHANISM SOLVE IT?
WHAT DEPENDS ON IT?
WHAT WILL IT COST TO MAINTAIN?
HOW WILL IT BE VERIFIED?

Prefer extension over parallel architecture when appropriate.

---

# 22. MULTI-DOMAIN CHANGE

When a change crosses domains, explicitly map the impact.

Example:

PROPERTY SEARCH

may affect:

UI
↓
APPLICATION LOGIC
↓
BACKEND
↓
DATABASE
↓
SECURITY
↓
ROUTES
↓
VERIFICATION

Another example:

PROPERTY LOCATION

may affect:

DATABASE
+
ROUTES
+
3D
+
NAVIGATION
+
UI
+
VERIFICATION

Do not assume a change is local merely because only one file initially
appears relevant.

---

# 23. DOMAIN-SPECIFIC SAFETY

## Security

Treat authentication, authorization, user data, database rules,
credentials, and external APIs as security-sensitive.

## Data

Treat schema and stored-data changes as high-impact.

## Spatial

Treat physical/spatial authority as evidence-based.

## Frontend

Consider accessibility, responsive behavior, loading, errors,
empty states, and interaction states.

## Performance

Consider database, network, rendering, memory, and repeated work
without prematurely optimizing.

---

# 24. OUTPUT ARTIFACT DISCIPLINE

Create durable artifacts only when they provide future value.

Potential artifacts include:

- manifests
- architecture maps
- dependency maps
- contract reports
- verification matrices
- migration manifests
- reconciliation records
- lineage records
- decision records
- findings
- continuity reports

Avoid generating many near-identical reports.

Prefer one authoritative record over several redundant summaries.

---

# 25. EXECUTION CHECKPOINTS

For substantial work, maintain explicit checkpoint state.

A checkpoint should identify:

- current phase
- completed work
- validated work
- pending work
- blocked work
- changed files
- evidence location
- known risks
- next recommended action

Suggested conceptual progression:

CP-01 Repository Baseline
CP-02 Verification Reconnaissance
CP-03 Content-Level Classification
CP-04 Dependency / Reference Mapping
CP-05 Architecture Reconstruction
CP-06 Contract and Architecture Reconciliation
CP-06B Architecture Before Migration
CP-07 Canonical Naming Migration
CP-08 Repository Architecture Migration
CP-09 Reconciliation System
CP-10 Archive / Lineage
CP-11 Reference / Documentation Reconciliation
CP-12 Repository Integrity Validation

These are planning labels only.

Never claim a checkpoint was executed unless it actually was.

---

# 26. SUGGESTIVE EXECUTION ORDER

When the user gives a broad task without specifying the exact
sequence, suggest a chronological execution order based on
dependencies and risk.

The suggested order is not authorization.

For example:

1. establish baseline
2. inspect existing structures
3. classify artifacts
4. trace dependencies
5. reconstruct architecture
6. reconcile contracts
7. design change
8. implement
9. verify
10. reconcile documentation/lineage
11. validate final state

If the user specifies another order, follow the user's order unless it
would create an unacceptable integrity or safety risk; explain the
conflict before changing course.

---

# 27. STOP CONDITIONS

Stop and ask the user when:

- authoritative sources conflict
- source of truth cannot be determined
- destructive action lacks authorization
- migration impact is unclear
- critical dependencies cannot be resolved
- external consumers may be affected
- security implications are uncertain
- data integrity may be compromised
- historical/current identity cannot be separated
- verification produces contradictory evidence

Use:

STOP
→ RECORD
→ EXPLAIN
→ ASK

Do not silently guess.

---

# 28. RESPONSE FORMAT

For substantial work:

## Understanding

What the request actually means.

## Evidence

What has actually been established.

## Plan

Smallest appropriate sequence.

## Execution

What was actually performed.

## Validation

What was actually checked.

## Result

Current state.

## Remaining

Unresolved issues, risks, or limitations.

## Next

Recommended next action.

Do not use this format mechanically for trivial requests.

---

# 29. NO HIDDEN EXECUTION

Always distinguish:

PLANNED
PROPOSED
AUTHORIZED
EXECUTED
VALIDATED

A planned checkpoint is not an executed checkpoint.

A generated migration manifest is not a completed migration.

A passing static check is not necessarily runtime verification.

Never imply an operation occurred when only its plan was created.

---

# 30. EFFICIENCY AND TOKEN DISCIPLINE

Use the minimum investigation necessary to establish sufficient
confidence for the requested operation.

For simple tasks:

inspect narrowly.

For complex tasks:

build durable structured evidence.

Do not repeatedly rediscover established facts.

Do not load large unrelated files into context.

Prefer:

TARGETED SEARCH
→ RELEVANT EVIDENCE
→ COMPACT MODEL
→ ACTION

Use summaries, manifests, dictionaries, indexes, and checkpoint
records to avoid repeatedly consuming context on the same information.

Correctness outranks token savings.

Never omit critical evidence merely to reduce context usage.

---

# 31. ENGINEERING DECISION RECORD

For meaningful architectural or migration decisions, record:

DECISION:
CONTEXT:
EVIDENCE:
OPTIONS:
SELECTED OPTION:
REASON:
IMPACT:
TRADE-OFFS:
VALIDATION:
REVERSIBILITY:
USER AUTHORITY:
DATE / CHECKPOINT:

Do not create a decision record for every trivial coding choice.

---

# 32. COMPLETION DEFINITION

Substantial engineering work should generally reach:

IMPLEMENTATION
+
VERIFICATION
+
RECONCILIATION
+
CONTINUITY

Where one component is intentionally absent, explicitly state why.

Example:

IMPLEMENTED
+
STATICALLY VALIDATED
+
RUNTIME VALIDATION PENDING

is preferable to falsely saying:

COMPLETE

---

# 33. FINAL ENGINEERING GATE

Before declaring substantial work complete, ask:

1. Did we understand the actual problem?
2. Did we inspect existing architecture?
3. Did we reuse existing mechanisms where appropriate?
4. Did we identify affected dependencies?
5. Did we preserve authoritative artifacts?
6. Did we avoid unnecessary duplication?
7. Did we verify the change appropriately?
8. Did we reconcile documentation/contracts where necessary?
9. Did we leave the repository understandable?
10. Did we record enough information for the next session?
11. Are unresolved risks explicitly recorded?
12. Is the actual state accurately represented?

If important answers are no or unknown, do not falsely declare
completion.

---

# 34. HOMEFINDER ENGINEERING PRINCIPLE

The objective is not maximum code output.

The objective is a system that becomes progressively:

- more understandable
- more reliable
- more verifiable
- more maintainable
- more coherent
- more recoverable
- more traceable

The preferred engineering cycle is:

UNDERSTAND
→ CHANGE CAREFULLY
→ VERIFY
→ RECONCILE
→ RECORD
→ IMPROVE

When uncertain:

PRESERVE
→ RECORD
→ INVESTIGATE
→ ASK

---

# END OF SKILL