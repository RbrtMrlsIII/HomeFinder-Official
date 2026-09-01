# HomeFinder E6 — Structural Intelligence Protocol

## Purpose
Provide a small derived navigation layer for structural project knowledge without replacing any existing authority.

## Authority boundary
The E6 structural index is DERIVED. It must not override or become a competing authority for:

- `active_development/data/dictionary.json`
- `active_development/3d/docs/model-census.json`
- contracts and manifests
- `master/HomeFinder.sh3d`
- `MASTER_SKILL.md`
- `project-guide/HandOver.md`
- `project-guide/Endorsement.md`
- `PRODUCT-KNOWLEDGE.md`

## Required behavior

1. Discover known structural sources from configuration.
2. Record their domain, structural role, authority boundary, owner, and presence state.
3. Record only evidenced relationships between known sources.
4. Expose procedure-selection hints that route back to the single canonical `MASTER_SKILL.md`.
5. Never invent missing entities, coordinates, permissions, routes, or full-repository counts.
6. Never convert a derived map into a new authority.

## Source configuration
`.agent/structural/structural-index.config.json`

## Generator
`scripts/structural-index.py`

## Derived output
`.agent/structural/STRUCTURAL-INDEX.json`

## E6 inventory boundary
The index records structural source discoverability, not a replacement project census. E3 remains responsible for project-wide source-first inventory and prohibits fabricated totals from partial remote API output.

## Change rule
When a structural source changes, update this derived index only when the change affects source ownership, structural role, relation, or procedure-selection metadata. Do not mechanically rebuild unrelated project documentation.

## Validation
At minimum verify:
- configuration is valid JSON;
- generated index is valid JSON;
- every adopted source has an explicit owner and authority role;
- `MASTER_SKILL.md` remains the sole execution skill;
- semantic dictionary ownership is unchanged;
- SH3D physical authority is unchanged;
- no full-project numeric totals are asserted from remote API output;
- procedure hints are references, not independent procedures.
