# Checkpoint Packaging Reconciliation — 2026-09-01

## Finding

The supplied `HomeFinder.zip` contains 3,855 entries, 59,401,785 bytes uncompressed, and 32,962,098 bytes compressed. Its size is primarily explained by recursive checkpoint packaging: the project baseline is duplicated under `project/` and nested `_base` trees, and current SH3D/GLB artifacts are repeated in those baselines.

The duplication is packaging redundancy, not additional product completeness.

## Canonical packaging decision

The clean checkpoint was rebuilt from the single `project/` baseline. Nested `_base` baselines and recursive checkpoint archives were excluded. Current GLB and SH3D artifacts occur once at their canonical project paths.

Historical evidence remains represented by retention/index metadata rather than recursive physical copies.

## Clean checkpoint verification

Artifact: `HomeFinder_E8_PSeries_Clean_2026-09-01.zip`

Compressed size: 10,498,000 bytes
Entries: 1,285
SHA-256: `944690768e96cf9078497eb7adb57def7dd4abb6b286ca51e5f6a08fb2265956`

Structural checks:
- exactly 1 `.sh3d` file: `project/master/HomeFinder.sh3d`
- exactly 4 `.glb` files under current project assets
- 0 nested `.zip` files
- 0 `_base` paths
- `project/MASTER_SKILL.md` present at v1.3
- `project/project-guide/skills/CHECKPOINT-PACKAGING-AND-CONTINUITY.md` present

## Continuity state

E0–E8: complete / validated / endorsed.

P04.0–P04.2: accepted.
P04.3–P04.5: unendorsed / blocked pending fresh real browser and binary evidence.
P04.6: held for endorsement decision.
P05/P06: held pending authoritative acceptance specifications.

`master/HomeFinder.sh3d` remains protected and unchanged by this reconciliation.

## Retention rule

The original uploaded `HomeFinder.zip` remains the historical source package. This reconciliation does not silently destroy historical evidence. It removes redundant physical copies from the new checkpoint and retains traceability through `CHECKPOINT/HISTORICAL-EVIDENCE-INDEX.md`.
