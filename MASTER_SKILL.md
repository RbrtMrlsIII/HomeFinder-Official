# HomeFinder Engineering System — Master Skill v1.2

**Status:** PROJECT-WIDE ACTIVE STANDARD  
**Canonical role:** Single project execution skill for HomeFinder  
**Scope:** Whole project; all disciplines, gates, changes, validations, handovers, and cleanup

## 1. Authority and purpose

This is the one canonical HomeFinder execution skill. It defines how the project is executed across product, architecture, implementation, verification, 3D/spatial, repository governance, continuity, knowledge promotion, and whole-project handover.

It does not replace authoritative project sources, contracts, manifests, ADRs, or user decisions. Discipline-specific documents remain in their canonical locations; this skill defines how they are used together.

Never create parallel copies of this skill for individual disciplines.

## 2. Non-negotiable execution lifecycle

Every substantive execution follows:

**Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance**

After decision:

**Endorse / Reject / Defer → Distill durable knowledge → Update continuity → Retain necessary evidence → Archive/Delete justified redundancy → Advance**

Precise states are required: **PROPOSED, OBSERVED, DERIVED, VERIFIED, ENDORSED, FROZEN, DEFERRED, SUPERSEDED, HISTORICAL, UNRESOLVED, BLOCKED, REJECTED.**

Never describe a proposal as executed, execution as validated, or validation as endorsed without evidence.

## 3. Startup: whole-project continuity first

Before mutation, establish the complete current HomeFinder state. Read the newest endorsed project-wide checkpoint/status, current `HandOver.md`, `Endorsement.md`, execution discipline records, masterplan, relevant contracts, this skill, required supporting guides, and `AI_ASSISTANT_READ_ME.md`.

Identify authority, branch, active gate, accepted lineage, blockers, deferred work, protected boundaries, consumers, and already-proven evidence. Stop on unexplained drift, conflicting authority, missing context, or endorsement contradiction.

A bounded gate may change one area; startup and handover remain project-wide.

## 4. Universal procedure

### Observe
Inspect actual source, runtime, repository, contracts, tests, deployment, or evidence. Do not infer implementation from names alone.

### Record
Record the smallest useful human-readable finding and machine state with provenance.

### Understand
Determine intent, authority, ownership, dependencies, consumers, constraints, failure mode, and evidence role.

### Classify
Classify discipline, owner, impact, state, authority role, evidence role, scope, current/historical status, and cross-discipline impact.

### Align
Reconcile contracts, interfaces, paths, schemas, identifiers, ownership, naming, architecture, and consumers before mutation.

### Validate
Validate changed source and affected consumers using deterministic evidence. Separate environment failures from application failures.

### Endorse
A designated authority accepts, rejects, or defers. Passing tests do not automatically create endorsement.

### Advance
Update canonical state, machine records, documentation, continuity, evidence references, and the whole-project handover before entering the next gate.

## 5. Cross-cutting baseline

1. `master/HomeFinder.sh3d` and other actually authoritative sources remain authoritative; derivatives corroborate only.
2. Preserve accepted lineage and start from the latest consolidated checkpoint.
3. Use source-first census; registries corroborate actual source.
4. Keep active work bounded to the gate; discoveries outside scope become recorded future targets.
5. One new physical 3D target may be ACTIVE unless an endorsed architecture changes that rule.
6. Sequential gates cannot bypass a frozen predecessor.
7. Use actual source coordinates and transform semantics; never silently substitute calculated centers.
8. Keep distinct identity dimensions separate: source IDs, semantic IDs, physical elevation, house ownership, spatial IDs, etc.
9. Presentation never invents authorization semantics.
10. Physical traversal requires evidenced openings/circulation; logical routing remains distinct from geometry.
11. Record multiple logical POVs individually where source behavior requires them.
12. Record responsive behavior when viewport changes camera, FOV, visibility, layout, or interaction.
13. Synchronize DOM/CSS/JS/camera/3D choreography through explicit contracts where applicable.
14. GLB/KTX2/other runtime assets are derived and never replace SH3D authority.
15. Evidence must state exactly what passed, failed, and was not proven.
16. Canonical documentation/state is updated in the same gate when required.
17. Required checkpoint packages represent the whole project continuity state and contain no nested handoff archives.

## 6. Discipline procedures

### Product / Requirements
Observe behavior, journeys, acceptance criteria, constraints, and non-goals. Record ambiguities and contradictions. Understand user intent and acceptance boundaries. Classify functional, non-functional, UX, policy, deferred, and unresolved requirements. Align with architecture, contracts, data, UI, and spatial behavior. Validate observable acceptance criteria. Endorse only when behavior and boundary are unambiguous. Distill durable product decisions.

**Do not:** invent product behavior to unblock engineering.

### Architecture
Observe modules, data flow, boundaries, contracts, ownership, dependencies, and existing patterns. Record findings. Understand why current structure exists. Classify local, cross-domain, migration, compatibility, and architectural impact. Align with authority and ownership. Validate integration points and affected consumers. Endorse only when boundaries and ownership remain explicit. Update architecture records.

**Do not:** redefine another discipline's authority to fix a local symptom.

### Frontend / UI
Observe rendered UI, components, routes, state, styles, accessibility, responsiveness, and runtime output. Record visual/interaction/state findings. Understand data/state ownership and user flow. Classify presentation, state, routing, binding, accessibility, or cross-domain impact. Align with product, backend, data, 3D, and security contracts. Validate affected viewports and interactions. Endorse against explicit acceptance criteria.

**Do not:** use visual polish to conceal functional or contract failures.

### Backend / API
Observe routes, handlers, schemas, persistence, validation, authorization, errors, and consumers. Record request/response semantics. Understand ownership, consistency, compatibility, and lifecycle. Classify contract/data/security/performance/compatibility impact. Align API behavior with canonical contracts. Validate happy paths, invalid input, authorization, and consumers. Endorse only when contract behavior is proven.

**Do not:** change API semantics merely to satisfy one client.

### Data / Storage
Observe schemas, storage paths, migrations, fixtures, indexes, permissions, provenance, and authority declarations. Record shape/integrity/lifecycle findings. Understand authoritative versus derived, cached, fixture, and historical data. Classify source/derived/cache/fixture/migration/historical roles. Align schemas and identifiers. Validate integrity, compatibility, permissions, and migration safety. Endorse only with authority-preserving evidence.

**Do not:** promote a generated export or cache to authority without endorsement.

### 3D / Spatial
Observe SH3D/source XML, spatial census, rooms, objects, levels, cameras, coordinates, and consumers. Record findings with source provenance. Understand units, coordinates, IDs, house ownership, and spatial authority. Classify source-model, derived-geometry, camera, transform, interaction, traversal, and presentation impacts. Align derived artifacts with authoritative source. Validate extraction, transforms, scale, orientation, target IDs, containment, adjacency, and consumers. Endorse only when source and derived behavior agree.

**Do not:** mutate authoritative SH3D to make a derivative pass.

### GLB / Web Graphics
Observe provenance, hashes, canonical paths, import logic, renderer state, target IDs, and binary availability. Keep binary evidence separate from module/CDN evidence. Align approved binaries with canonical runtime paths. Validate network, module resolution, binary availability, parsing/loading, target binding, scale, coordinate state, and renderer state. Endorse only when approved binaries actually load and assertions pass.

**Do not:** weaken tests, invent geometry, substitute unrelated models, or resurrect deferred functionality for green CI.

### Browser / Runtime
Observe server behavior, browser configuration, network, console errors, runtime markers, and application state. Record infrastructure versus application failures separately. Classify environment, dependency, routing, runtime, and application impact. Align browser configuration with supported contracts. Validate actual runtime markers. Endorse only on intended browser behavior.

**Do not:** treat HTTP 200 or static availability as application success.

### Testing / QA
Observe test definitions, fixtures, logs, traces, screenshots, CI context, and outputs. Record exact assertions and scope. Understand what each test proves and cannot prove. Classify evidence type. Align tests with acceptance gates and contracts. Validate changed source and consumers, preserving meaningful negative tests. Endorse only when evidence is sufficient and reproducible.

**Do not:** weaken assertions because an upstream dependency is missing.

### Security
Observe authentication, authorization, input validation, file boundaries, secrets handling, exposed surfaces, and access paths. Record security findings. Understand trust boundaries and threat surfaces. Classify confidentiality, integrity, authorization, injection, exposure, and operational impact. Align with security contracts. Validate allowed and denied cases, boundaries, permissions, and secret handling. Endorse when required security evidence exists.

**Do not:** weaken security boundaries to make functional tests pass.

### CI / CD
Observe triggers, jobs, dependencies, artifacts, branch context, permissions, and environment setup. Record which changes triggered which gates and what each run proves. Classify trigger/environment/build/test/artifact/deployment impact. Align workflow scope with gate intent. Validate positive and negative trigger behavior where appropriate. Endorse only when evidence matches the intended gate.

**Do not:** let documentation-only activity masquerade as spatial-runtime evidence without an explicit gate reason.

### Deployment / Hosting
Observe configuration, environment variables, domains, CDN, builds, runtime endpoints, and deployment identity. Record environment differences. Understand source/build/hosting/CDN boundaries. Align deployment with validated state. Validate actual user/runtime path. Endorse against deployment criteria.

**Do not:** equate source validation with production validation.

### Documentation / Knowledge
Observe canonical documents, routing, status, evidence, duplicates, and stale material. Record gaps and knowledge candidates. Understand policy versus contract, evidence, history, continuity, and implementation guidance. Classify before editing/moving/archive/delete. Align each durable fact with one canonical owner. Validate links, references, consistency, and machine state. Promote verified, reusable, stable, actionable knowledge.

**Do not:** preserve document volume as a proxy for knowledge.

### Operations / Whole-Project Handover
A handover is always for the **complete HomeFinder project state**, never merely the current feature or discipline. It must account for or route to canonical sources for project direction; repository/Git state; branch/gate/PR/deployment state where applicable; architecture and authority; requirements/contracts; frontend/backend/data; 3D/SH3D/GLB/runtime; QA/CI; security; deployment; documentation/knowledge; skills; accepted/rejected/deferred/blocked/unresolved findings; evidence; protected boundaries; known non-repeatable lessons; exact next safe action; and recovery considerations.

Validate that another authorized executor can continue without private memory. Keep the handover concise and routed rather than duplicating canonical sources.

## 7. Repository governance

For add/move/rename/restructure/delete decisions identify producing discipline, consumers, authority role, historical role, test/CI impact, documentation impact, and whole-project handover impact. Make the smallest justified mutation, validate references and consumers, then update canonical state.

Before deletion: **confirm identity → classify → scan references → resolve historical role → identify replacement/knowledge promotion → record disposition → delete only when justified → validate.**

Prefer one physical canonical artifact with multiple logical classifications over duplicated physical copies.

## 8. Knowledge and anti-repeat gate

Before Classify for a non-trivial approach, check current durable knowledge for known anti-patterns, disproven hypotheses, dead ends, gotchas, and protected boundaries. If a proposed approach repeats a known failed path, stop and record why before proceeding.

A finding is not durable knowledge merely because it is documented. Durable knowledge must be verified, reusable, stable, actionable, and traceable.

Optimize for: **minimal repository footprint + increasing institutional knowledge.**

## 9. Session and update protocol

Every substantive session starts a trace before mutation and records start state, actions, changed files, validation, decisions, and end state. Update canonical records according to impact; do not mechanically touch every document for every change.

A change is complete only when its affected consumers, machine state, canonical documentation, knowledge impact, and whole-project continuity state are addressed.

## 10. Artifact/build provenance

Buildable outputs must have canonical ownership and provenance sufficient to identify source state, timestamp, gate, inputs, status, artifacts, and validation. Do not relocate HomeFinder assets merely to imitate a generic build directory.

## 11. Census and structural intelligence

Inventory before transformation. A HomeFinder census may cover product, UI, routes, backend, data, security, 3D/spatial, cameras, GLB, browser, tests, CI/CD, documentation, contracts, knowledge, and builds. Existing canonical dictionaries remain authoritative for their owned semantics; do not create duplicate dictionaries.

Architecture maps and structural indexes are derived views, not new authorities.

## 12. Git history mutation

History rewriting is itself a bounded architectural operation. Before squash/force-update/low-level Git mutation: establish source branch/current commit; preserve a recoverable reference; establish desired tree and parent(s); validate the tree; perform mutation with an authorized repository executor; rerun gates; verify branch/PR/CI; update continuity and endorsement.

Do not rewrite `main` merely to clean an experimental branch without separate authorization.

## 13. Evidence and acceptance

Every completed gate produces:

1. human-readable findings;
2. machine-readable state;
3. validation/test evidence;
4. **whole-project** handover/checkpoint.

Knowledge-distillation is assessed explicitly: promote when durable knowledge exists; otherwise record that no new durable knowledge was identified.

Evidence types remain distinct: source, deterministic/unit/integration, browser/runtime, visual QA, CI, deployment, and historical evidence.

## 14. Final pre-advance checklist

Before advancing:

- [ ] current whole-project state established;
- [ ] authority explicit;
- [ ] active gate and scope explicit;
- [ ] affected consumers known;
- [ ] proposal/execution/validation/endorsement not conflated;
- [ ] source and consumer validation complete;
- [ ] failures classified rather than hidden;
- [ ] machine state updated;
- [ ] canonical documentation updated;
- [ ] durable knowledge promoted where appropriate;
- [ ] retention/deletion disposition recorded;
- [ ] whole-project handover current and consistent;
- [ ] exact next gate/action explicit;
- [ ] no protected boundary silently weakened.

**Advance only when the evidence supports the state being claimed.**