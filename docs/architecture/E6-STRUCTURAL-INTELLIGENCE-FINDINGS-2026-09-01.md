# HomeFinder E6 — Structural Intelligence Findings

**Date:** 2026-09-01  
**Milestone:** E6 — Structural Intelligence Reconciliation  
**Scope:** existing dictionaries, structural maps, manifests, 3D/spatial records, route/UI mappings, contracts, execution-skill procedure selection, and cross-domain discoverability.

## Process

Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.

No structural source was replaced merely because a second representation could be convenient. Existing authorities remain authoritative for their owned meanings.

## Findings

### E6-F01 — Semantic dictionary already has a canonical owner
**Observed:** `active_development/data/dictionary.json` exists and its entries identify `docs/dictionary/INDEX.json` as the canonical registry for lexical meaning.

**Understanding:** A second semantic dictionary would create the exact duplication risk identified by the E4 anti-repeat index.

**Classification:** PROTECTED / SEMANTIC / AUTHORITATIVE.

**Disposition:** RETAIN. No replacement or duplicate dictionary.

### E6-F02 — 3D/model census already owns authored-model inventory
**Observed:** `active_development/3d/docs/model-census.json` remains the detailed authored-model census, while E3 owns the source-first project census capability.

**Understanding:** E6 should not build another model inventory. Structural intelligence may reference this source and preserve its authority boundary.

**Classification:** PROTECTED / 3D / AUTHORITATIVE-FOR-OWNED-CENSUS.

**Disposition:** RETAIN and index.

### E6-F03 — UI/3D code-reality mapping already exists
**Observed:** `active_development/data/house-ui-ux-code-reality-map.json` maps rooms, routes, sections, physical objects, roles, and authority boundaries. `feature-wiring-matrix.json` adds route/code/camera/door relationships.

**Understanding:** HomeFinder already possesses substantial structural knowledge. The gap is finding and relating these sources consistently, not inventing their content.

**Classification:** DERIVED / CROSS-DOMAIN STRUCTURAL EVIDENCE.

**Disposition:** RETAIN and index.

### E6-F04 — Design roots and camera/data maps provide additional structural contracts
**Observed:** `design-roots.json`, `house-camera-rig.json`, cinematic target/world/scene/assets records, and related data files encode stable relationships among presentation, camera, environment, and spatial identity.

**Understanding:** These are domain-owned structural inputs, not candidates for consolidation into a new generic master file.

**Classification:** CURRENT / DERIVED OR CONTRACTUAL BY SOURCE.

**Disposition:** RETAIN and index by role.

### E6-F05 — Genuine gap: no single derived structural discovery index
**Observed:** structural knowledge is distributed across several domain-owned records and project documents; documentation routing identifies owners but does not provide a machine-readable cross-reference of structural sources, authority roles, consumers, and procedure hints.

**Understanding:** An executor can discover individual sources, but reliable cross-domain structural navigation still depends on private knowledge or repeated manual inspection.

**Classification:** SYSTEMIC / DERIVED / STRUCTURAL-INTELLIGENCE GAP.

**Disposition:** ADOPT a small derived structural index. It must never override source authority.

### E6-F06 — Architecture map generation is not yet justified as a new authority or mandatory generator
**Observed:** existing architecture/code-reality maps already encode substantial structure and explicitly preserve authoritative-source boundaries.

**Understanding:** A new architecture-map generator would duplicate existing representations unless it adds a demonstrated capability beyond source discovery.

**Classification:** SYSTEMIC / DERIVED / IMPLEMENTATION-RISK.

**Disposition:** DEFER generator implementation. The E6 structural index may reference existing maps and their owners.

### E6-F07 — Skill selection can be represented as derived hints without creating a second skill system
**Observed:** `MASTER_SKILL.md` is the single canonical execution skill with discipline procedures; E6 needs to expose which structural sources are relevant to each discipline/gate.

**Understanding:** The useful immediate capability is a procedure/source selection matrix, not another collection of skills or an autonomous authority.

**Classification:** DERIVED / EXECUTION-SUPPORT.

**Disposition:** ADOPT as metadata inside the structural index; defer autonomous orchestration until its decision rules are proven.

### E6-F08 — Remote GitHub tree data cannot serve as full census totals
**Observed:** GitHub API tree responses are truncated in this execution environment, while E3 explicitly prohibits promoting partial API views into project-wide numeric totals.

**Understanding:** E6 must use explicit known source paths and qualitative structural relationships, not fabricated full-repository counts.

**Classification:** PROTECTED / CENSUS CONSTRAINT.

**Disposition:** RETAIN E3 rule; do not publish incomplete numeric totals.

## Alignment decision

Implement only the demonstrated gap:

**HomeFinder Structural Intelligence Index**

A derived, machine-readable navigation index that records:
- structural source;
- domain;
- authority role;
- representation role;
- owned meaning;
- major consumers;
- related sources;
- relevant execution disciplines/procedures;
- current status.

It does **not** replace the semantic dictionary, authored-model census, contracts, SH3D authority, handover, product knowledge, or canonical execution skill.

## Rejected for E6

- second semantic dictionary;
- replacement architecture authority;
- generic universal build/tree migration;
- automatic skill generation;
- full repository numeric counts from remote API output;
- history rewrite or PR reconciliation;
- P04 runtime/GLB changes.

## Knowledge distillation assessment

New durable knowledge identified:

`HomeFinder has sufficient domain-owned structural sources; the missing execution capability is a derived cross-reference that exposes ownership and relationships without consolidating or replacing those sources.`

Source: this E6 findings record plus the existing domain-owned structural records.

## Gate decision criteria

E6 is eligible for endorsement after:
1. the structural index schema and ownership boundary are implemented;
2. the index resolves all explicitly adopted structural source categories used by this gate;
3. procedure/source hints point back to `MASTER_SKILL.md` rather than creating a second skill system;
4. deterministic validation proves schema integrity and authority-role separation;
5. whole-project continuity and endorsement records are synchronized;
6. the session trace is closed with validation evidence.
