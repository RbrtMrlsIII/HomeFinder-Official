# Migration reconciliation (excerpt)

# HomeFinder Sweet Home 3D Migration Audit — 2026-08-23

## Authority decision
The reconciled `master/HomeFinder.sh3d` is the single declared **canonical 3D scene** for HomeFinder. Earlier SH3D variants are historical recovery evidence only.

**Master SHA-256:** `c27a764f2af0ab8ca674871f7ba291febbe94ae4dde11bb6cd0a9e11b593908d`

## Master-scene census
- Levels: 3 — Basement, 1st floor, Roof
- Room polygons: 13 — 7 named, 6 unnamed
- Walls: 42
- Doors/windows: 27
- Furniture: 114
- Furniture groups: 6
- Lights: 6
- Observer cameras: 6 — 5 named, 1 unnamed

Named model rooms: Bedroom #1, Bedroom #2, Corridor, Garage, Kitchen, Living room, Terrace

Named model cameras: Living room, Exterior, Corridor, Bedroom #1, Kitchen

## Recovered census
The scattered archives recover the following logical planning layers:

- 42 logical camera/POV entries
- 57 physical UI-object entries (registry declares 55; the file actually contains 57 — **registry count discrepancy to resolve**)
- 9 logical/app room labels
- 12 page-level room/page definitions
- UI response mapping, section choreography, room/zone registries, camera/door graphs, and spatial reconciliation records

## Reconciliation results
### Cameras / POVs
- Exact master-camera name matches: 0
- Potential semantic matches: 0
- Rebuild required: 42

**Interpretation:** the old `H-01`, `H-02`, `P-01`, `M-01`, etc. identifiers are **logical application POV IDs**, not IDs that already exist in the Sweet Home 3D file. They should be preserved as HomeFinder logical IDs and re-bound to Sweet Home 3D stored cameras after visual calibration.

### Rooms
Exact name matches between logical app rooms and named Sweet Home 3D rooms: 0.

*(…trimmed…)*
