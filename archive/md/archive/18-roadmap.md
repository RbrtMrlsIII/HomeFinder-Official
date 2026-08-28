# HomeFinder — Consolidated Roadmap

## Phase 0 — Reality lock
**Done.** Inventory the actual repository, application routes, backend boundaries, tests, and model package.

## Phase 1 — Authority and vocabulary
**Maintain.** Keep product, data, role, integration, UI, and 3D authorities explicit.

## Phase 2 — Sweet Home 3D model lock
**Done at migration baseline.** `master/2BedroomHouseWithBasement.sh3d` is the authoritative architectural model.

## Phase 3 — Spatial reconciliation
**Next.** Map the actual model's levels, rooms, doors, furniture, and stored cameras to application zones and physical UI registries.

## Phase 4 — Main Hall integration
**Next.** Bind Home sections to real model locations and model cameras without creating new routes.

## Phase 5 — Room/door graph
**Next.** Establish `room → route → role → door → destination → fallback` using actual model geometry.

## Phase 6 — Physical UI
**Next.** Reconcile the existing WalkMyPlan object registry against actual Sweet Home 3D furniture/room geometry.

## Phase 7 — Production assets
**Later.** Introduce optimized production assets through manifests, adapters, LOD, budgets, and fallbacks.

## Phase 8 — Themes and cinematic polish
**Later.** Day/sunset/night/rain/mist/storm presentation, camera choreography, and physical interaction polish.

## Phase 9 — Performance and accessibility
**Required before production.** Validate device tiers, reduced motion, lazy loading, failure paths, and core UI usability.

## Phase 10 — Retirement
**After proof.** Retire superseded compatibility paths only after dependency and regression evidence.

## Phase 11 — Production checkpoint
Package the project with model census, verification receipt, known limitations, and a new archive hash.

## Governing dependency chain

```text
REALITY
→ AUTHORITY
→ VOCABULARY
→ WIRING
→ FUNCTIONAL CONTRACTS
→ SWEET HOME 3D MODEL
→ ROOMS/DOORS/CAMERAS
→ PHYSICAL UI
→ ASSETS
→ THEMES
→ PERFORMANCE
→ VERIFICATION
→ RETIREMENT
→ PRODUCTION
```
