# Living authority (trimmed excerpt)

> Historical full narrative retained in git history / prior zips if needed. Operational SoT is `docs/md/*-authority.md` and `docs/json/project-authority.json`.

# HomeFinder — Living Sweet Home 3D Migration Authority & Reconciliation Note

Date: 2026-08-23

## Authority status

`master/HomeFinder.sh3d` is the current canonical architectural master scene. Its freeze hash is `c27a764f2af0ab8ca674871f7ba291febbe94ae4dde11bb6cd0a9e11b593908d`.

The project SoT is treated as **living/versioned guidance**, not immutable final law. A future product or modeling development may supersede a current rule through the documented change-control path. The authority is therefore temporal: the latest accepted change record + current master scene + current application contracts govern.

## Documentation review outcome

The 20 canonical documents were reviewed for Sweet Home 3D / WalkMyPlan authority, migration, reconciliation, change-control, retirement, and roadmap language. The decisions are internally consistent on the core split:

- Sweet Home 3D owns physical architectural geometry and model-defined cameras.
- HomeFinder application contracts own routes, roles, permissions, data semantics, and interaction behavior.
- WalkMyPlan registries are derived mapping aids, not geometry authority.
- Reconciliation must use real model facts and must not invent physical rooms just to satisfy an old plan.
- Retirement follows inventory → dependency audit → quarantine → migration → proof → retirement → regression.

### Stale statements to revise when the documentation is next propagated

1. Any current reference to a path other than `master/HomeFinder.sh3d` is superseded; deployment/runtime artifacts must consume the canonical model or a derived runtime asset.
2. Language such as “product law” / “final authority” should be interpreted as **current canonical guidance subject to supersession**, not an irreversible final product specification.
3. The old WalkMyPlan implementation remains useful only where it supplies recovered semantic mappings, behavior requirements, or machine-readable reconciliation data that has not yet been migrated.
4. The final state should remove WalkMyPlan from the active 3D geometry pipeline, not necessarily erase every historical reference from the sealed recovery/archive.

## Recovered page → room structure

The 12-page census is intact. The page-to-logical-room binding is recovered semantically; physical anchoring is deliberately a separate reconciliation step.

See `12_page_room_mapping_candidates.csv`.

## Camera structure

The logical camera census is intact. The current master has only six stored viewpoints (five named plus one unnamed), so the 42 logical POVs cannot be treated as already-existing model cameras. They are **behavioral POV requirements** that must be bound to model viewpoints. Existing named cameras are seeds, not forced identities.

See `13_main_hall_section_camera_seed_candidates.csv` and `14_logical_camera_master_binding_candidates.csv`.

## Physical UI objects

The semantic physical-object census is recovered. Name matching is insufficient because most HomeFinder object names (for example, “Listings Book” or “Search Console”) are application concepts rather than Sweet Home 3D furniture catalog names. Physical UI objects therefore need stable HomeFinder IDs and explicit attachment to a chosen scene object or scene anchor.

The two-record discrepancy in the old physical-object registry (header vs actual record count) should remain an explicit reconciliation item until reviewed.

## Deletion gate

No WalkMyPlan 3D content should be deleted from the active project until all three are true:

1. page/room semantic bindings are accepted;
2. logical POVs are visually bound or intentionally marked virtual/non-3D;
3. physical UI objects are bound, quarantined, or explicitly retired.

The sealed recovery archives remain outside the active project.

## Immediate work order

A. Validate the candidate page/room anchors.
B. Open the master in Sweet Home 3D and establish the camera seed set.
C. Build the logical POV → actual camera/viewpoint table.

*(…trimmed…)*
