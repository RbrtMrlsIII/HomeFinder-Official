# HomeFinder — Verification & Evidence

## Verification stack

1. static file/reference checks;
2. JavaScript/TypeScript syntax checks;
3. domain/unit tests;
4. authority and role tests;
5. route tests;
6. cinematic/model mapping tests;
7. browser smoke tests;
8. role/access matrix;
9. device/performance matrix;
10. production provider readback.

## Evidence law

File existence is not semantic proof. A module importing successfully does not prove that its owner, data contract, security boundary, or route is correct.

## 3D verification

Before architectural edits are accepted:

- open/inspect the `.sh3d` model;
- confirm level and camera names;
- verify embedded resource references;
- update model census/hash;
- reconcile affected WalkMyPlan registries;
- run cinematic mapping tests;
- validate fallback/reduced-motion behavior.

## Backend verification

Trusted mutations must be tested at the server boundary. Payment and entitlement tests must distinguish real provider state from smoke-test state.

## Migration verification

The final archive must satisfy:

- exactly 20 human-readable docs in `docs/`;
- no `.md`, `.txt`, or `.rules` documentation files outside `docs/`;
- no old WalkMyPlan logs/checkpoints/docs remain as active documentation;
- Sweet Home 3D model exists at the canonical path;
- vendor runtime remains intact;
- required WalkMyPlan machine-readable registries remain available;
- the original source ZIPs remain untouched.

## Failure handling

If verification finds a semantic conflict, classify it as `BLOCKED`, `REVIEW`, `MIGRATION`, `REPAIR`, or `DEFERRED`. Do not hide the conflict by deleting the evidence.
