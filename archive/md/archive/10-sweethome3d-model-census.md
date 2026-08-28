# HomeFinder — Sweet Home 3D Model Census

Source model: `master/HomeFinder.sh3d`

## Authoritative inventory

| Entity | Count |
|---|---:|
| Levels | 3 |
| Room polygons | 13 |
| Doors/windows | 27 |
| Furniture objects | 114 |
| Furniture groups | 6 |
| Lights | 6 |
| Stored observer cameras | 6 |
| Dimension lines | 20 |
| Polylines | 2 |
| Labels | 2 |
| Text elements | 2 |

## Levels

| ID | Name | Elevation |
|---|---|---:|
| `level0` | Basement | -150 |
| `level1` | 1st floor | 112 |
| `level2` | Roof | 374 |

## Migration baseline

Model SHA-256:

`33f7266779dd52c865c0529ffecd19f29986a15c65bfba384113f59b314c06b4`

The hash is a checkpoint identifier, not a permanent value. Any architectural edit should create a new model census and update this document.

## Vendor demo

The supplied viewer demo SH3D was removed during 3D authority reconciliation; it is not part of the HomeFinder project authority.

## Required future census

When the model changes, record:

- new hash;
- level names/elevations;
- room count;
- door/window count;
- furniture count/groups;
- light count;
- observer cameras;
- labels/dimensions;
- embedded resource integrity.

Do not update animation assumptions from memory when the authoritative model can be inspected directly.
