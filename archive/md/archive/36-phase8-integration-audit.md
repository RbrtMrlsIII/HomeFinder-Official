# HomeFinder Integration / Security / Responsiveness Audit — Phase 8

## Authority posture
`HomeFinder.sh3d` remains the frozen 3D master. The SoT remains a living, versioned authority; this phase does not convert candidate camera mappings into immutable law.

## Current system contract
`page/section → route-access + role state → feature/data controller → response contract → physical UI mount → logical POV/camera → Sweet Home 3D presentation`.

Camera state is presentation-only. It cannot grant access, mutate roles, approve KYC, change payment entitlements, or become the authoritative ledger.

## Security authority restored
Recovered `firebase/firestore.rules` is present in the checkpoint. SHA-256: `ceb5167e573fba91fba935f993ae911d4c9aa491d786316cb4178c08464abecd`. The restored security boundary is now source-verifiable.

## Verified tests
- foundation-repair-01 authority contracts: PASS
- patch-22 Admin/Ops authority: PASS
- deep-dive-04 Auth/Roles/Permissions: PASS
- role-contract-subscription-path: PASS
- dd05 UI response mapping: PASS (37 surfaces / 42 camera definitions)
- room-shell physical UI mapping: PASS (57 objects)

One legacy authority-wiring test remains blocked because its harness expects `docs/dictionary/domains/authority-wiring-audit.dictionary.json`, which is absent from the checkpoint. This is a missing test dependency, not a security logic failure.

## Responsive / resilience QA
The matrix has been generated for all 12 current routes across mobile portrait, mobile landscape, tablet, desktop, wide desktop, and reduced-motion. Additional resilience cases cover slow network, 3D load failure, hidden tab, and interrupted navigation. These are **NOT_RUN** until executed in a browser/device harness.

## Route security matrix
Each route now has an explicit access-policy row. Cameras may present a locked/unlocked state but may never authorize access. Backend rules/callables remain authoritative.

## Next development gate
Do not finalise cameras solely on geometric appearance. For every page, visually approve the POV and then exercise the same POV under:
1. allowed role;
2. denied role;
3. loading/success/error/empty response states;
4. mobile portrait + desktop;
5. reduced motion;
6. 3D failure fallback.

This phase therefore converts camera tuning from an isolated visual task into a testable system contract.
