# G-series evidence merge — 2026-08-27

## Sources
- Drive latest (G1.4 + G1.5 already merged)
- `HomeFinder-G1.3.zip` — full G1, G1.1, G1.3, G2 census + verifications
- `HomeFinder_checkpoint_2026-08-26_5_5F3-...zip` — F3 reports already in tree

## Now on disk under docs/g1/
G1, G1.1, G1.3, G1.4, G1.5, G2 evidence files (see directory listing).

## Authority rules unchanged
- Canonical `master/HomeFinder.sh3d` SHA `0e4d75bcedbf2d9827917cd61c01780d0c1d4ba9b852dbcac65ca63e8353cb34`
- F3 candidate SHA `21309c26ac11728180402b0ee94f97eab9f2c3ba6e9093ed071c955eb89ab5c5`
- G2 adjacency is **evidence**, not validated routes
- No runtime promotion of physical doors without unique endpoint binding

## Next
Resolve duplicate room representation (G1.4 remainder); bind only uniquely evidenced doors; still no route validation until binding is clean.
