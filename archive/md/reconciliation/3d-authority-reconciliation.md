# 3D Authority Reconciliation

## Status
**RECONCILED / LOCKED**

## Canonical
`master/HomeFinder.sh3d`

SHA-256:
`0e4d75bcedbf2d9827917cd61c01780d0c1d4ba9b852dbcac65ca63e8353cb34`

## Comparison result
- `master/2BedroomHouseWithBasement.sh3d`: architectural XML outside camera nodes was byte-equivalent after normalization; its useful architectural geometry was therefore already represented in `HomeFinder.sh3d`.
- `active_development/3d/home/HomeFinder.sh3d`: promoted to `master/HomeFinder.sh3d`; this was the HomeFinder-enhanced scene containing the nine H-series cameras.
- `active_development/3d/viewer/SweetHome3DJSViewer-7.5.2/default.sh3d`: independent viewer/demo scene; it was not architectural authority and was removed.

## Canonical model census
- walls: 42
- doors/windows: 27
- furniture: 114
- rooms: 13
- lights: 6
- HomeFinder cameras: 9
- remaining `.sh3d` files: 1

## Cleanup decision
Per explicit project authority instruction, every SH3D except `master/HomeFinder.sh3d` was removed.

Removed binary hashes are preserved in `3d-authority-reconciliation.json` as evidence; the redundant binaries themselves are not retained.

## Lock rule
No future SH3D modification is accepted as canonical without reconciliation, verification, and SHA-256 update.
