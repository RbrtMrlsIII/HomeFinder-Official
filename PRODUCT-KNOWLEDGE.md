============================================================
HOMEFINDER MASTER PROJECT KNOWLEDGE v1.0
============================================================

PURPOSE

This document is the authoritative long-term engineering,
architecture, development, verification, repository-management,
and continuity guidance for the HomeFinder project.

HomeFinder is a multi-domain software project containing, where
applicable:

- frontend/UI
- backend
- database/Firebase
- authentication/authorization
- security
- contracts
- routes/navigation
- integrations
- 3D/spatial development
- documentation
- verification/testing
- configuration
- historical development artifacts
- reconciliation records
- project continuity material

The repository may contain valuable historical evidence alongside
current implementation.

The objective is NOT to blindly clean, rewrite, reorganize, or
modernize the project.

The objective is to understand the existing system, preserve
evidence, establish trustworthy architecture, improve the software
safely, and progressively make the repository easier to understand
and maintain.

The repository itself is a major source of project knowledge.

The user/project owner is the final source of truth for ambiguous
architectural decisions.

When repository evidence conflicts with assumptions in this
document, current repository evidence must be investigated and the
conflict must be surfaced to the user rather than silently resolved.


============================================================
1. FUNDAMENTAL ENGINEERING PRINCIPLE
============================================================

Follow:

OBSERVE
→ RECORD
→ UNDERSTAND
→ CLASSIFY
→ ALIGN
→ DESIGN
→ VALIDATE
→ ENDORSE
→ EXECUTE
→ RECONCILE
→ CONTINUE

Do not reverse this sequence merely for speed.

The assistant should optimize for:

CORRECTNESS
+
SAFETY
+
TRACEABILITY
+
UNDERSTANDABILITY
+
DEVELOPMENT VELOCITY

Speed is valuable, but not at the expense of evidence or
architectural integrity.


============================================================
2. USER AUTHORITY
============================================================

The project owner/user is the final source of truth for unresolved
architectural decisions.

If evidence is ambiguous:

STOP
→ RECORD THE AMBIGUITY
→ PRESENT THE EVIDENCE
→ EXPLAIN THE OPTIONS
→ ASK THE USER
→ APPLY THE DECISION
→ VALIDATE

Do not silently choose an architectural interpretation merely
because it appears conventional.


============================================================
3. CURRENT REPOSITORY IS THE PHYSICAL SOURCE OF TRUTH
============================================================

Historical reports, checkpoints, previous AI sessions, and this
document provide continuity guidance.

They do NOT replace inspection of the current repository.

Whenever a new project archive is provided:

- inspect the current archive
- establish its actual physical state
- compare against historical evidence when useful
- do not assume historical counts remain accurate
- do not assume previous migrations actually occurred
- do not assume filenames still exist
- do not assume historical conclusions remain correct

Current physical evidence takes precedence over historical claims.


============================================================
4. ORIGINAL PROJECT ARCHIVE PROTECTION
============================================================

The original uploaded project ZIP is the baseline source.

NEVER modify the original archive directly.

Create a separate temporary working/extraction area for analysis
and controlled operations.

The original archive must remain recoverable and untouched.

If a modified project archive is produced, it must be derived from
the original or an explicitly designated working copy.


============================================================
5. DURABLE PROJECT EVIDENCE
============================================================

Important work must not exist only in temporary AI context or an
inaccessible scratch directory.

When a phase produces durable evidence, appropriate evidence should
be incorporated into the project repository.

Examples:

- phase reports
- execution checklists
- baseline manifests
- SHA-256 inventories
- directory trees
- batch maps
- category maps
- dependency maps
- reference scans
- naming proposals
- conflict reports
- migration manifests
- reconciliation records
- archive/lineage records
- decisions
- unresolved questions
- continuity notes
- analysis scripts
- validation results
- technical-debt records
- risk records
- assumption records

Use an existing canonical project location if one exists.

Otherwise, a structure such as:

cleanup/
  phase-01/
  phase-02/
  phase-03/

may be considered after repository inspection.

Do not create a new documentation structure blindly.


============================================================
6. TEMPORARY SCRATCH WORKSPACE
============================================================

A disposable scratch workspace may be used.

Example:

HomeFinder_cleanup_scratch/

It may contain:

- extracted repository
- temporary analysis
- generated inventories
- candidate mappings
- temporary scripts
- intermediate reports

The scratch workspace must not become a hidden project dependency.

Important durable findings must be transferred into the project
repository before the session ends.

Temporary material that has no long-term value should be discarded.


============================================================
7. CONTINUOUS REPOSITORY CLEANLINESS
============================================================

Repository cleanliness is an ongoing engineering responsibility.

Every new contribution should avoid creating unnecessary:

- files
- directories
- reports
- duplicate implementations
- duplicate tests
- temporary artifacts
- backup copies
- abandoned scripts
- generated debris
- unexplained numbered files
- "final" / "final-2" variants
- documentation that merely repeats existing information

Before creating an artifact, ask:

- Does this already exist?
- Is there a canonical location?
- Is it source, generated, historical, or temporary?
- Can an existing artifact be extended?
- Will another developer/AI understand why it exists?
- Is it actually necessary?

Cleanliness is part of correctness.


============================================================
8. REPOSITORY HYGIENE
============================================================

After meaningful development work, perform a lightweight hygiene
review.

Check:

- unnecessary files
- stale generated outputs
- unexplained scripts
- naming quality
- accidental duplicates
- broken references
- outdated documentation
- temporary artifacts
- unexplained structural changes
- missing evidence

A feature that works but leaves unexplained repository debris is
not considered cleanly completed.


============================================================
9. MINIMAL ARTIFACT PRINCIPLE
============================================================

Prefer the smallest number of authoritative artifacts necessary.

Prefer:

ONE canonical implementation
+
ONE authoritative contract
+
ONE appropriate verification mechanism
+
OPTIONAL historical evidence

rather than multiple competing copies.

Do not create artifacts merely because they seem useful in
isolation.

Every durable artifact should have a clear purpose.


============================================================
10. SOURCE VS GENERATED VS HISTORICAL
============================================================

Distinguish:

SOURCE
AUTHORITATIVE
GENERATED
DERIVED
TEMPORARY
HISTORICAL

Generated artifacts should not accidentally become authoritative.

Where practical, generated reports should be reproducible.

Historical artifacts should not be destroyed merely because they
are no longer current.

Current architecture and historical lineage are separate concepts.


============================================================
11. HISTORICAL EXECUTION ARTIFACTS
============================================================

The repository may contain execution-style names such as:

patch
foundation-repair
phase
final
checkpoint
historical
DD
repair

These may contain valuable evidence.

Do not automatically delete them.

Preferred model:

CURRENT CANONICAL IDENTITY
+
HISTORICAL LINEAGE

Do not make historical execution names the primary identity of
current architecture.

Chronological history may be preserved as lineage metadata.


============================================================
12. CANONICAL NAMING
============================================================

Canonical names should describe architectural role, purpose,
scope, and artifact type.

Structured numbering may be used when useful:

001-doc-architecture.md
002-doc-project-guide.md
001-auth-policy.json
002-firestore-contract.json
001-backend-service.mjs

Numbers are indexes, not versions and not execution chronology.

Do not use names such as:

DD01
DD02
PATCH-1
PATCH-2
PHASE-1
REPAIR-05
FINAL
FINAL-2
NEW-FINAL

as the primary identity of current canonical artifacts.

Numbering may repeat across different artifact classes.

For example:

docs/001-doc-architecture.md
contracts/001-auth-contract.json
verification/001-security-verifier.mjs

Matching numbers do not imply matching versions.


============================================================
13. NO BULK RENAME / BULK MOVE
============================================================

Never blindly:

- rename everything
- move everything
- flatten directories
- move all tests into one directory
- move all documents into one directory
- convert everything to sequential numbering
- reorganize by file extension

Every proposed path change requires individual classification and
dependency consideration.

A migration record should eventually contain:

OLD PATH
→ PROPOSED NEW PATH
→ CATEGORY
→ BATCH
→ REASON
→ REFERENCES FOUND
→ CONFLICT LEVEL
→ LINEAGE REQUIREMENT
→ VALIDATION
→ STATUS


============================================================
14. ARTIFACT IDENTITY
============================================================

Artifact identity consists primarily of:

- semantic role
- purpose
- scope
- ownership
- architectural category
- relationship to other artifacts

Filename alone does not determine identity.

File extension alone does not determine identity.

Execution chronology does not determine identity.


============================================================
15. LOGICAL VS PHYSICAL CATEGORIES
============================================================

Candidate logical domains include:

- Backend
- Database/Firebase
- Frontend/UI
- Security
- Authentication/Authorization
- 3D/Spatial
- Routes/Navigation
- Integrations
- Project Guide/Continuity
- Documentation
- Contracts
- Findings
- Reconciliation
- Checkpoints
- Archive/History
- Configuration

These are logical classifications, not automatically approved
physical directories.

One artifact may logically belong to several domains.

Prefer:

ONE PHYSICAL CANONICAL ARTIFACT
+
MULTIPLE LOGICAL CLASSIFICATIONS

rather than duplicating the artifact.


============================================================
16. BACKEND PHYSICAL COHERENCE
============================================================

Physical organization must follow dependency architecture.

Related backend/configuration structures should remain together
when their dependency relationship requires it.

Example:

firebase/
  firestore.rules
  ...

Do not separate related files merely because their extensions
differ.

A .rules, .json, .js, .mjs, .ts, or configuration file should be
classified according to its architectural role.


============================================================
17. DEPENDENCY-AWARE ARCHITECTURE
============================================================

Physical organization must reflect real dependencies.

Before moving or restructuring a subsystem, determine:

- consumers
- imports
- runtime dependencies
- configuration dependencies
- contracts
- verification dependencies
- documentation references
- historical relationships

The dependency graph takes precedence over generic folder
conventions.


============================================================
18. CROSS-DOMAIN IMPACT
============================================================

A change in one domain may affect many others.

Examples:

Navigation may affect:

UI
contracts
spatial mapping
backend
security
verification

Database changes may affect:

backend
security
frontend
contracts
verification
migration/recovery

Always consider cross-domain impact before significant changes.


============================================================
19. REFERENCE SAFETY
============================================================

Before changing a filename, path, identifier, or contract, inspect
references in:

- .js
- .mjs
- .ts
- .json
- .md
- .html
- .css
- .csv
- shell scripts
- configuration
- manifests
- imports
- dynamic path references
- external-facing identifiers

Do not assume a path or identifier is isolated.


============================================================
20. DEPENDENCY GOVERNANCE
============================================================

Do not introduce dependencies merely because they make one task
convenient.

Before adding a dependency, consider:

- existing equivalent functionality
- maintenance status
- security
- complexity
- runtime requirements
- bundle/build impact
- licensing
- long-term value

Prefer existing appropriate dependencies.


============================================================
21. DEPENDENCY VERSION DISCIPLINE
============================================================

Do not casually upgrade dependencies during unrelated work.

Separate:

FEATURE CHANGE
from
DEPENDENCY UPGRADE

When upgrading, record:

- current version
- target version
- reason
- affected areas
- compatibility concerns
- validation
- recovery considerations

Avoid combining large dependency upgrades with unrelated migrations.


============================================================
22. REPRODUCIBLE DEVELOPMENT
============================================================

Important environmental assumptions should be identifiable.

Where relevant, record:

- runtime version
- package manager
- framework version
- build system
- database/emulator requirements
- browser/runtime assumptions
- environment variables
- required services
- important OS-specific behavior

Do not rely on undocumented local machine state.


============================================================
23. CONFIGURATION MANAGEMENT
============================================================

Distinguish:

- source-controlled configuration
- environment-specific configuration
- secrets
- generated configuration
- development configuration
- production configuration

Do not hard-code secrets into source code.

Do not accidentally turn local environment configuration into
canonical project architecture.


============================================================
24. SECURITY AND SECRET HYGIENE
============================================================

Credentials, API keys, private tokens, service accounts, and other
secrets are sensitive.

Never intentionally place secrets in:

- source code
- reports
- tests
- screenshots
- documentation
- checkpoints
- continuity notes
- debug output

If a secret is discovered unexpectedly:

STOP normal development,
record the security issue without reproducing the secret,
and determine appropriate remediation.


============================================================
25. DATA PRIVACY
============================================================

For potentially sensitive data:

- prefer synthetic test data
- minimize exposure
- do not copy real records into documentation
- minimize debug retention
- avoid unnecessary personal data in reports

Real-world data should not become project examples merely for
convenience.


============================================================
26. SCHEMA EVOLUTION
============================================================

Database/schema changes are architectural changes.

Before changing a schema, determine:

- current schema
- current consumers
- existing records
- compatibility requirements
- migration strategy
- recovery strategy
- validation strategy

Prefer backwards-compatible/additive evolution where practical.

Do not silently invalidate existing data.


============================================================
27. BACKWARDS COMPATIBILITY
============================================================

Established interfaces may include:

- APIs
- database fields
- exported functions
- route identifiers
- destination IDs
- configuration keys
- file paths
- data formats
- integration payloads

Before changing one, identify consumers.

For a breaking change, explicitly record:

BREAKING CHANGE
AFFECTED CONSUMERS
MIGRATION REQUIREMENT
VALIDATION


============================================================
28. IDENTIFIER STABILITY
============================================================

Identifiers crossing system boundaries should be treated as
potentially long-lived.

Before changing an identifier, inspect:

- stored data
- URLs
- contracts
- frontend state
- backend logic
- integrations
- verification
- historical records

Do not rename stable identifiers merely for aesthetic reasons.


============================================================
29. CONTRACT-FIRST THINKING
============================================================

Important boundaries should have clearly understood contracts.

Contracts may define:

- inputs
- outputs
- identifiers
- required fields
- optional fields
- allowed states
- authorization expectations
- compatibility expectations
- error behavior

Do not let implementation details silently redefine an established
contract.


============================================================
30. API / LAYER BOUNDARIES
============================================================

Maintain meaningful architectural boundaries.

Avoid unnecessary leakage of:

- UI structures into database contracts
- database implementation details into UI semantics
- spatial coordinates into unrelated application meaning
- security decisions exclusively into frontend code
- generated structures into hidden APIs

When boundaries become blurred, identify the architectural issue
instead of spreading the coupling.


============================================================
31. SINGLE RESPONSIBILITY
============================================================

Do not split files merely because they are large.

Do not merge independent responsibilities merely to reduce file
count.

Separate responsibilities when a meaningful architectural boundary
exists.

Preserve intentional coupling when it represents real architecture.


============================================================
32. FEATURE REQUIREMENTS
============================================================

Before substantial implementation, establish observable acceptance
criteria.

Prefer:

GIVEN [STATE]
WHEN [ACTION]
THEN [EXPECTED RESULT]

Include important failure cases.

Acceptance criteria should allow another developer or AI to determine
whether the feature actually works.


============================================================
33. DEFINITION OF DONE
============================================================

A feature is not automatically complete when code exists.

Depending on scope, completion may require:

- intended behavior implemented
- contracts aligned
- security considered
- error states handled
- integrations considered
- existing behavior preserved
- appropriate verification
- documentation updated where necessary
- no unexplained artifacts
- known limitations recorded


============================================================
34. ERROR HANDLING
============================================================

Significant features must consider failure behavior.

Consider:

- invalid input
- missing data
- unavailable services
- unauthorized access
- network failures
- malformed data
- unsupported states
- partial completion
- retry behavior

Do not hide meaningful failures simply to produce apparent success.


============================================================
35. USER-FACING FAILURE BEHAVIOR
============================================================

Separate technical errors from user-facing messages.

Determine:

- what the system logs
- what the application knows
- what the user sees
- whether retry is safe
- whether recovery is required

Avoid exposing raw internal errors unnecessarily.


============================================================
36. STATE-MACHINE THINKING
============================================================

Complex workflows should have explicit meaningful states.

For example:

INITIAL
→ LOADING
→ READY
→ INTERACTION
→ SUCCESS

with possible:

ERROR
UNAUTHORIZED
EMPTY
UNAVAILABLE
CANCELLED

Avoid complex behavior based on undocumented implicit states.


============================================================
37. CONCURRENCY AND REPEATABILITY
============================================================

Consider:

- duplicate requests
- repeated actions
- retries
- refreshes
- concurrent updates
- race conditions
- stale data

Where appropriate, operations should be idempotent or safely reject
duplicate execution.

Do not assume operations occur exactly once.


============================================================
38. TRANSACTIONAL THINKING
============================================================

When multiple pieces of state must change together, determine
whether partial completion is acceptable.

Define where appropriate:

- atomic operations
- independent operations
- recovery behavior
- inconsistent-state detection
- compensating actions


============================================================
39. REGRESSION AWARENESS
============================================================

Every significant change should identify existing behavior that must
remain true.

Ask:

WHAT CURRENT BEHAVIOR MUST REMAIN TRUE?

Verify important invariants after the change.

Do not validate only newly added behavior.


============================================================
40. ARCHITECTURAL INVARIANTS
============================================================

Important system invariants should be explicitly understood.

Examples:

- authoritative physical model remains authoritative
- protected data cannot bypass authorization
- logical destinations remain distinct from physical locations
- contract fields retain their intended meaning
- required relationships remain valid
- security boundaries remain enforced

Changes that may violate an invariant require additional review.


============================================================
41. GOLDEN BEHAVIOR
============================================================

For especially important functionality, maintain a small set of
known-good expected outcomes.

Potential areas:

- critical navigation
- authentication boundaries
- important database operations
- core property flows
- critical spatial relationships
- essential UI states

Use this selectively for high-value behavior rather than every
feature.


============================================================
42. PERFORMANCE
============================================================

Consider performance during architecture and implementation.

Relevant areas may include:

- startup cost
- network requests
- database reads/writes
- rendering
- bundle size
- memory
- repeated computation
- polling
- caching

Do not prematurely optimize.

Do avoid knowingly introducing unnecessary expensive behavior.


============================================================
43. 3D / SPATIAL DEVELOPMENT
============================================================

HomeFinder's 3D/spatial domain must be treated as a first-class
engineering domain.

Consider:

- authoritative physical model
- geometry
- rooms
- doors
- portals
- cameras
- spatial relationships
- navigation
- route relationships
- asset loading
- runtime representation
- performance

Do not alter authoritative physical geometry merely for convenience.

Distinguish:

PHYSICAL AUTHORITY
from
RUNTIME REPRESENTATION.


============================================================
44. FRONTEND / UI DEVELOPMENT
============================================================

Frontend work must consider:

- behavior
- state
- accessibility
- responsive layout
- touch interaction
- loading
- error states
- data contracts
- security boundaries
- device limitations

Do not treat visual appearance as the only definition of frontend
correctness.


============================================================
45. ACCESSIBILITY
============================================================

Where applicable, consider:

- keyboard accessibility
- semantic controls
- labels
- focus behavior
- meaningful errors
- screen-reader semantics
- responsive layouts
- touch usability

Accessibility is part of quality, not merely cosmetic polish.


============================================================
46. RESPONSIVE / DEVICE BEHAVIOR
============================================================

Consider:

- mobile
- tablet
- desktop
- touch
- orientation
- viewport changes
- bandwidth limitations
- lower-powered devices

Do not assume desktop behavior represents all users.


============================================================
47. OBSERVABILITY
============================================================

Important runtime behavior should be diagnosable.

Where appropriate, use:

- meaningful logs
- structured errors
- operation identifiers
- useful state transitions
- validation signals
- failure context

Avoid excessive logs and never expose sensitive information.


============================================================
48. VERIFICATION ECOSYSTEM
============================================================

The repository already contains an important MJS verification/test
ecosystem.

Historical inspection identified areas such as:

verify/integrations/
verify/contracts/
verify/security/
verify/data/
verify/3d/
verify/routes/

These must be inspected before introducing new testing structures.

Do not create Python tests simply because a category needs a test.

Existing verification must be understood first.


============================================================
49. TEST / VERIFICATION CLASSIFICATION
============================================================

A filename containing:

test
verify
verification
spec

does not automatically make it a canonical test.

It may be:

- executable verification
- test
- fixture
- generated output
- documentation
- manifest
- historical evidence
- helper script

Content and role determine classification.


============================================================
50. PYTHON'S ROLE
============================================================

The historical baseline contained zero Python files.

Python should therefore NOT automatically become a second application
or test framework.

Python may be introduced primarily as repository-analysis and
change-control tooling.

Examples:

repo_inventory.py
repo_classifier.py
repo_batch_map.py
repo_reference_scan.py
repo_naming_candidates.py
repo_duplicate_scan.py

Python analysis should default to read-only.


============================================================
51. PYTHON DICTIONARY / REGISTRY STRUCTURES
============================================================

Python dictionary-based indexes may be used for compact machine-
readable analysis.

Examples:

artifact metadata
category mappings
batch mappings
logical-to-physical mappings
verification coverage
route mappings
dependency relationships
lineage
migration status
conflict status

These are derived analytical structures unless explicitly made
authoritative.

Do not create multiple competing manually maintained registries
describing the same reality.


============================================================
52. PYTHON VERIFICATION
============================================================

Python verification may complement MJS verification for tasks such
as:

- repository structure validation
- manifest consistency
- hash integrity
- duplicate detection
- reference integrity
- naming rules
- migration manifests
- reconciliation checks
- generated-report consistency

Do not replace the existing MJS ecosystem without evidence.


============================================================
53. READ-ONLY AUTOMATION FIRST
============================================================

New automation should normally begin as:

READ
→ INDEX
→ CLASSIFY
→ COMPARE
→ REPORT

Mutation should be a separate capability.

Preferred architecture:

ANALYSIS
→ CANDIDATE MANIFEST
→ REVIEW / AUTHORIZATION
→ MIGRATION
→ VALIDATION


============================================================
54. DRY-RUN MUTATIONS
============================================================

Any automated mutation system should support dry-run behavior when
practical.

Dry-run output should identify:

- files affected
- old paths
- proposed paths
- reference changes
- conflicts
- skipped files
- expected structure

Discovery must not automatically authorize mutation.


============================================================
55. IDEMPOTENT TOOLING
============================================================

Tools should be idempotent where practical.

Running the same analysis twice should not create:

report-final-2
report-final-3

or duplicate repository artifacts.

The same repository state should produce the same analytical result.


============================================================
56. REPRODUCIBLE GENERATED OUTPUT
============================================================

Generated inventories, manifests, trees, and reports should be
regenerable whenever practical.

Where useful, record:

- generation method
- source inputs
- generation timestamp
- relevant tool version

Generated evidence must not be mistaken for source authority.


============================================================
57. TECHNICAL DEBT
============================================================

Material technical debt should be recorded when it affects:

- reliability
- security
- architecture
- performance
- maintainability
- future development

A debt record may contain:

ISSUE
IMPACT
WHY IT EXISTS
RISK
WORKAROUND
RECOMMENDED ACTION
PRIORITY

Do not create debt records for every minor imperfection.


============================================================
58. RISK REGISTER
============================================================

Important unresolved risks should be tracked explicitly.

Useful fields:

RISK
PROBABILITY
IMPACT
AFFECTED DOMAIN
MITIGATION
DECISION REQUIRED
STATUS

Important risks should not disappear inside long conversations.


============================================================
59. ASSUMPTION REGISTER
============================================================

Unverified assumptions should be clearly identified.

Example:

ASSUMPTION:
A logical destination corresponds to a specific physical zone.

STATUS:
UNVERIFIED

REQUIRED EVIDENCE:
Physical model inspection.

Never silently promote an assumption into a project fact.


============================================================
60. PROVENANCE
============================================================

Important architectural conclusions should have identifiable
provenance.

Possible provenance:

- current source code
- configuration
- database/schema
- physical model
- verification
- documentation
- historical artifact
- user decision
- engineering inference

The more consequential the decision, the more important provenance
becomes.


============================================================
61. DECISION RECORDING
============================================================

For significant decisions, record:

QUESTION
EVIDENCE
OPTIONS
TRADE-OFFS
RECOMMENDATION
USER DECISION IF REQUIRED
RESULT

Do not bureaucratize trivial decisions.


============================================================
62. EXPERIMENTAL WORK
============================================================

Experimental approaches should remain distinguishable from
canonical architecture.

For experiments:

- keep scope small
- identify them as experimental
- avoid contaminating canonical structures
- define adoption criteria
- remove or archive them after the decision

Do not let experiments silently become permanent architecture.


============================================================
63. FEATURE FLAGS / TEMPORARY BEHAVIOR
============================================================

Temporary conditional behavior must have an explicit lifecycle.

Avoid undocumented conditions such as:

temporaryFix
newVersion
testing
final

Temporary mechanisms should eventually be:

REMOVED
or
PROMOTED TO CANONICAL BEHAVIOR

with the reason recorded.


============================================================
64. DEPRECATION
============================================================

Replacing functionality should use a deliberate lifecycle when
immediate removal is unsafe:

ACTIVE
→ DEPRECATED
→ REPLACED
→ REMOVAL-ELIGIBLE
→ REMOVED

Removal requires evidence that remaining consumers no longer depend
on the old behavior.


============================================================
65. COMPATIBILITY WINDOWS
============================================================

When old and new representations must temporarily coexist:

- define the compatibility window
- identify consumers
- define conversion rules
- define removal criteria

Do not allow temporary compatibility layers to become accidental
permanent architecture.


============================================================
66. REQUIREMENT TRACEABILITY
============================================================

For major features, maintain the relationship:

REQUIREMENT
→ DESIGN
→ IMPLEMENTATION
→ CONTRACT
→ VERIFICATION
→ RESULT

This can be compact.

The purpose is to prevent implementation from drifting away from
the actual requirement.


============================================================
67. CHANGE IMPACT SUMMARY
============================================================

For significant changes, identify:

AFFECTED
NOT AFFECTED
POTENTIALLY AFFECTED
FOLLOW-UP REQUIRED

This provides a compact cross-domain risk view.


============================================================
68. SMALL SAFE CHANGES
============================================================

Prefer the smallest change that solves the actual problem.

Before modifying something, ask:

Can this be solved without changing it?

Can an existing abstraction be reused?

Can a mapping solve it?

Can a contract clarify it?

Can a generated index solve it?

Avoid speculative infrastructure.


============================================================
69. CHANGE RECOVERY
============================================================

Before high-risk operations, understand:

- previous state
- changed artifacts
- restoration method
- data reversibility
- generated-output regeneration
- reference recovery

Do not rely on "we can probably undo it."


============================================================
70. VERSION HISTORY VS BACKUP VS LINEAGE
============================================================

These are different concepts:

VERSION HISTORY
BACKUP
HISTORICAL EVIDENCE
LINEAGE
CHECKPOINT

Do not treat one as a substitute for another.


============================================================
71. PHASE EXECUTION MODEL
============================================================

Every meaningful phase should have:

BEFORE

- baseline
- scope
- objective
- inputs
- constraints

DURING

- observation
- classification
- analysis
- candidate decisions

AFTER

- results
- changed files
- unchanged files
- conflicts
- decisions
- unresolved questions
- validation
- next action

Durable phase evidence should be incorporated into the project.


============================================================
72. PHASE 01 — REPOSITORY BASELINE
============================================================

Every new session receiving a project archive should begin by
establishing the physical baseline.

Objectives:

- preserve original archive
- create safe working extraction
- inventory every file
- record paths
- record sizes
- calculate SHA-256
- record extensions
- record top-level directories
- record directory tree
- identify special artifacts
- identify likely verification/test artifacts
- identify ambiguous/historical names
- identify backend/configuration artifacts
- identify 3D/spatial artifacts

During Phase 01:

NO RENAMES
NO MOVES
NO DELETIONS
NO CODE REWRITES

At minimum, preserve evidence equivalent to:

phase-01/
  baseline-manifest.csv
  directory-tree.txt
  phase-01-report.md
  execution-checklist.md

Exact location may be adapted after inspection.


============================================================
73. PHASE 02 — TEST / VERIFICATION RECONNAISSANCE
============================================================

Inspect existing test and verification structures.

Determine:

- executable tests/verifiers
- documentation
- fixtures
- outputs
- historical verification
- existing domains
- coverage
- gaps
- duplicates
- canonical verification structures

No migration should be assumed necessary.


============================================================
74. PHASE 03 — CONTENT-LEVEL BATCH MAPPING
============================================================

Inspect actual content, not merely filenames.

Map:

- Backend
- Database/Firebase
- Frontend/UI
- Security
- Authentication
- 3D/Spatial
- Routes/Navigation
- Integrations
- Project Guide
- Documentation
- Contracts
- Findings
- Reconciliation
- Checkpoints
- Archive
- Configuration

Determine:

- physical ownership
- logical categories
- canonical candidates
- verification coverage
- cross-domain relationships
- reference dependencies


============================================================
75. ARCHITECTURE BEFORE MIGRATION
============================================================

Before canonical physical migration, establish and validate:

- naming grammar
- directory taxonomy
- category vocabulary
- batch structure
- artifact identity model
- revision model
- lineage model
- reconciliation architecture
- archive architecture
- verification strategy
- reference migration strategy
- conflict strategy

Only after the architecture is sufficiently understood should
physical migration begin.


============================================================
76. CONTROLLED MIGRATION
============================================================

Future migration stages may include:

CP-07 Canonical Naming Migration
CP-08 Repository Architecture Migration
CP-09 Reconciliation System
CP-10 Archive & Lineage System
CP-11 Reference & Documentation Reconciliation
CP-12 Repository Integrity Validation

These are future planned stages unless explicitly recorded as
completed.

Do not claim execution merely because a stage exists in this
document.


============================================================
77. MIGRATION VALIDATION
============================================================

After every physical migration batch:

OLD STATE
→ CHANGE
→ REFERENCE UPDATE
→ TEST / VERIFICATION
→ HASH / STRUCTURE CHECK
→ DOCUMENTATION CHECK
→ RESULT

If validation fails:

STOP

Do not stack additional migrations onto an uncertain state.


============================================================
78. SUGGESTIVE EXECUTION ORDER
============================================================

When asked what should happen next, evaluate:

- dependencies
- blockers
- verification readiness
- architectural risk
- information value
- migration risk
- expected benefit
- effort/context cost

Then suggest:

RECOMMENDED
ALTERNATIVE
DEFERRED
BLOCKED

A recommendation should explain why its order is appropriate.

Chronology is a planning aid, not architectural identity.


============================================================
79. DEPENDENCY-AWARE EXECUTION
============================================================

A possible heuristic is:

FOUNDATION
→ CONTRACTS
→ DATA
→ SECURITY
→ BACKEND
→ FRONTEND
→ INTEGRATIONS
→ SPATIAL
→ NAVIGATION
→ RUNTIME
→ RECONCILIATION
→ MIGRATION

This is NOT mandatory.

Actual dependency evidence takes precedence.


============================================================
80. STOP-POINTS
============================================================

After meaningful units of work, reassess:

- expected result
- verification
- repository integrity
- reference integrity
- unexpected dependencies
- architectural assumptions
- whether the next step remains justified

If uncertainty appears:

STOP
→ RECORD
→ REASSESS


============================================================
81. PROGRESSIVE CONFIDENCE
============================================================

Treat conclusions as progressively stronger:

UNKNOWN
→ OBSERVED
→ IDENTIFIED
→ CANDIDATE
→ CORRELATED
→ IMPLEMENTED
→ VERIFIED
→ AUTHORITATIVE

Do not skip levels merely because something appears plausible.

This is especially important for:

- spatial mappings
- routes
- contracts
- duplicates
- historical lineage
- canonical names
- physical ownership


============================================================
82. ENGINEERING HONESTY
============================================================

Never hide uncertainty to make progress appear faster.

Use precise status language.

Examples:

"Implemented but not runtime-validated."

"Structurally validated; behavioral validation remains."

"Candidate mapping identified but not authoritative."

"Migration completed and reference checks passed."

Never claim:

DONE
FIXED
COMPLETE
VERIFIED
SAFE

unless evidence supports that exact claim.


============================================================
83. AI SELF-CHECK BEFORE SIGNIFICANT ACTION
============================================================

Before a significant action, ask:

WHAT am I changing?
WHY?
WHAT evidence supports it?
WHAT depends on it?
WHAT could break?
HOW will I validate it?
WHERE will evidence be recorded?
CAN the change be smaller?
IS it canonical, generated, historical, or temporary?

If these cannot be answered sufficiently, do not perform the mutation
yet.


============================================================
84. DEVELOPMENT EFFICIENCY
============================================================

Preferred pattern:

UNDERSTAND ONCE
→ RECORD ONCE
→ REUSE MANY TIMES

Do not repeatedly rediscover:

- file roles
- dependencies
- route relationships
- contracts
- verification results
- historical facts
- architectural decisions

Once validated, capture useful knowledge compactly.


============================================================
85. INFORMATION DENSITY
============================================================

Prefer high-information artifacts.

A good:

- manifest
- table
- dictionary
- graph
- contract
- structured report

may replace large amounts of repetitive prose.

Prefer:

STRUCTURED DATA
+
SHORT INTERPRETATION
+
STATUS
+
AUTHORITATIVE REFERENCES

over repetitive narrative.


============================================================
86. TOKEN / CONTEXT EFFICIENCY
============================================================

Use AI context efficiently without sacrificing accuracy.

Prefer:

INDEX
→ TARGETED SEARCH
→ RELEVANT EXCERPT
→ ANALYSIS
→ COMPACT FINDING

Avoid loading an entire repository when targeted inspection is
sufficient.

Avoid repeatedly reading unchanged material.

Reuse validated evidence while still checking current state when
necessary.


============================================================
87. CONTEXT CHECKPOINTING
============================================================

Long investigations should periodically produce compact checkpoints.

A checkpoint should capture:

CURRENT PHASE
CURRENT SCOPE
KEY FINDINGS
DECISIONS
OPEN QUESTIONS
FILES EXAMINED
FILES CHANGED
FILES UNCHANGED
VERIFICATION STATUS
NEXT RECOMMENDED ACTION

Checkpoints should be compact and durable.

A checkpoint never overrides current repository evidence.


============================================================
88. CLEAN HANDOFF
============================================================

At the end of meaningful work, produce a concise handoff:

CURRENT STATE
COMPLETED
VERIFIED
CHANGED
UNCHANGED
DISCOVERED
BLOCKED
UNRESOLVED
RISKS
NEXT RECOMMENDED ACTION

Future AI sessions should be able to continue from repository
evidence without reconstructing the entire conversation.


============================================================
89. PROJECT AS LONG-TERM MEMORY
============================================================

The repository should progressively become HomeFinder's durable
engineering memory.

Important knowledge should eventually be represented through:

- source
- contracts
- verification
- decisions
- findings
- continuity records
- lineage
- reconciliation evidence
- relevant architectural documentation

Do not depend on one AI session remembering undocumented reasoning.

Do not create excessive documentation merely to compensate for poor
architecture.


============================================================
90. MAINTAINABILITY TEST
============================================================

Before accepting significant implementation, ask:

Could another competent developer understand this six months from now?

Could another AI determine why it exists?

Could it be modified without reverse-engineering hidden assumptions?

If not, improve the architectural boundary or document the missing
knowledge.


============================================================
91. NO MAGIC BEHAVIOR
============================================================

Avoid unexplained:

- constants
- mappings
- fallback behavior
- special cases
- hidden assumptions

Where a value has architectural meaning, give it an appropriate
name or place it in an appropriate contract/configuration.


============================================================
92. FAIL LOUDLY AT ARCHITECTURAL BOUNDARIES
============================================================

Detect impossible or inconsistent states rather than silently
producing plausible but incorrect results.

Examples:

- logical destination without physical binding
- missing required contract field
- unauthorized backend operation
- missing spatial portal
- migration referencing nonexistent source
- identifier collision

Controlled failure is safer than silent corruption.


============================================================
93. QUALITY MODEL
============================================================

HomeFinder quality is multidimensional.

Evaluate:

FUNCTIONAL CORRECTNESS
+
STRUCTURAL CORRECTNESS
+
REFERENCE CORRECTNESS
+
VERIFICATION CORRECTNESS
+
SECURITY
+
DATA CORRECTNESS
+
SPATIAL CORRECTNESS
+
PERFORMANCE
+
ACCESSIBILITY
+
DOCUMENTATION
+
REPRODUCIBILITY
+
MAINTAINABILITY
+
LINEAGE


============================================================
94. PROJECT HEALTH
============================================================

Periodically assess:

FUNCTIONAL
ARCHITECTURAL
SECURITY
DATA
SPATIAL
NAVIGATION
VERIFICATION
PERFORMANCE
ACCESSIBILITY
DOCUMENTATION
REPRODUCIBILITY
MAINTAINABILITY

"The application runs" is not a sufficient project-health measure.


============================================================
95. RELEASE READINESS
============================================================

Implemented does not automatically mean release-ready.

For major features, evaluate:

- functionality
- regression
- security
- error handling
- performance
- accessibility
- configuration
- compatibility
- observability
- documentation
- recovery

If an area has not been assessed, state that explicitly.


============================================================
96. FINAL CLEANLINESS GATE
============================================================

Before declaring a phase complete, confirm:

- no unexplained temporary files
- no accidental duplicate artifacts
- no abandoned scripts
- no stale generated outputs treated as canonical
- no broken references
- no unexplained naming conflicts
- no undocumented structural changes
- no missing phase evidence
- no false completion claims
- no unresolved migration debris

If the repository works but its resulting structure is unexplained,
the phase is not cleanly complete.


============================================================
97. FINAL END STATE
============================================================

The desired HomeFinder repository should behave like a well-indexed
engineering system.

A future developer or AI should be able to determine quickly:

CURRENT ARCHITECTURE
CURRENT IMPLEMENTATION
CURRENT VERIFICATION
CURRENT PHYSICAL MODEL
CURRENT CONTRACTS
CURRENT SECURITY MODEL
CURRENT BLOCKERS
CURRENT DECISIONS
CURRENT RISKS
CURRENT ASSUMPTIONS
CURRENT MIGRATION STATE
HISTORICAL LINEAGE
NEXT RECOMMENDED ACTION

without loading the entire historical development conversation.


============================================================
98. GUIDING PHILOSOPHY
============================================================

This is not a cosmetic cleanup.

It is controlled evolution and reconstruction of a complex,
information-rich engineering repository.

The goal is:

LESS SPAGHETTI,
NOT PRETTIER SPAGHETTI.

The project should progressively become:

- easier to understand
- safer to modify
- easier to verify
- easier to recover
- easier to continue
- easier for another AI to inherit

while preserving valuable historical information.

When uncertain:

PRESERVE INFORMATION
→ RECORD THE UNCERTAINTY
→ STOP
→ ASK THE USER


============================================================
99. NON-NEGOTIABLE RULES
============================================================

NEVER:

- modify the original source archive
- blindly bulk rename
- blindly bulk move
- flatten architecture without evidence
- delete historical evidence without classification
- create duplicate tests to fill categories
- create a competing Python test framework without justification
- treat filenames as authority
- treat execution chronology as architecture
- duplicate one artifact into multiple physical categories without
  justification
- overwrite authoritative artifacts without understanding them
- expose secrets
- silently invalidate data
- silently break established contracts
- stack migrations after failed validation
- declare incomplete work complete
- leave important continuity evidence only in temporary context
- silently resolve conflicts requiring user authority


============================================================
100. HOMEFINDER OPERATING CONTRACT
============================================================

For every substantial task, the assistant should think in this
general pattern:

UNDERSTAND
→ IDENTIFY SCOPE
→ CHECK EXISTING STRUCTURE
→ CHECK DEPENDENCIES
→ CHECK CONTRACTS
→ CHECK SECURITY
→ CHECK VERIFICATION
→ CHECK CROSS-DOMAIN IMPACT
→ PROPOSE THE SMALLEST SAFE CHANGE
→ VALIDATE
→ RECORD IMPORTANT KNOWLEDGE
→ REPORT PRECISE STATUS
→ RECOMMEND THE NEXT SAFE ACTION

The repository owner remains the final authority.

Repository evidence comes before assumptions.

Architecture comes before physical migration.

Verification comes before confidence.

Evidence comes before claims.

Correctness comes before speed.

HomeFinder should become easier to develop as it grows, not harder.