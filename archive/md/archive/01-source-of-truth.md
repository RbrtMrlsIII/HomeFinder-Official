# HomeFinder — Project Source of Truth

Status: **canonical overall-project SoT**  
Migration baseline: merged HomeFinder + WalkMyPlan checkpoint + Sweet Home 3D DD05 package  
Effective rule: this document is the first current authority for product and architectural governance; it may be superseded through change control.

## 1. Authority order

1. This document — product law, authority boundaries, and overall project decisions.
2. The remaining numbered documents in `docs/` — detailed canonical contracts.
3. Executable code, backend rules, tests, and machine-readable registries — implementation evidence and operational truth.
4. Sweet Home 3D model `master/2BedroomHouseWithBasement.sh3d` — **sole architectural/model geometry source of truth for the 3D/animation layer**.
5. Derived WalkMyPlan registries under `cinematic/WalkMyPlan/data/` — spatial mapping data derived from the authoritative model and application contracts.
6. Historical patch/log material — retired as standalone documentation; its useful decisions are incorporated into this SoT set.

A lower layer may not silently redefine a higher layer.

## 2. Core project law

HomeFinder owns application behavior, routes, data semantics, permissions, UI, and integrations. Sweet Home 3D owns the authoritative architectural model used by the animation/3D layer. The browser viewer and animation layer present that model; they do not become authorities for business data, authentication, roles, permissions, routes, payments, or backend state.

The previous WalkMyPlan architectural idea is retained as the **spatial design vocabulary and reconciliation history**, but WalkMyPlan is no longer the authoritative geometry source.

## 3. Canonical product boundaries

- `market.html` is the canonical Market route. Do not create or restore `marketplace.html`.
- Market owns normal property discovery and property-detail presentation.
- Broker HQ owns broker discovery/workflows and is not a second Market.
- Admin is confined to the Admin Console; Moderator and Staff remain confined to their own operational consoles.
- `propertyListings` and `wantedListings` are the canonical inventory collections.
- `properties` is legacy/migration-only and must not receive new inventory writes.
- 3D objects are presentation shells. Real forms and actions remain HTML/CSS/JS and backend contracts.
- Cinematic navigation has one owner: `js/cinematic-ui.js`; `js/leave-guard.js` owns dirty-state protection; `js/transition.js` is the compatibility navigation bridge; environment theme state is owned by the cinematic environment registry and root theme tokens.
- Every cinematic sequence has a reduced-motion/fallback path.

## 4. Sweet Home 3D migration law

`2BedroomHouseWithBasement.sh3d` is the only current authoritative HomeFinder architectural model.

The supplied viewer runtime under `3d/viewer/SweetHome3DJSViewer-7.5.2/` is vendor-owned and must remain isolated from HomeFinder integration code. `3d/app/` is HomeFinder-owned integration/presentation code.

WalkMyPlan camera, room, door, zone, and physical-object registries remain useful derived planning artifacts, but when a registry conflicts with the `.sh3d` model, the model wins for geometry, levels, named architectural objects, and stored observer cameras. When application semantics conflict with a model object, application authority wins.

## 5. Migration principle

No historical thought is preserved merely by keeping obsolete files. A historical decision is preserved when its useful constraint, rationale, status, or unresolved issue has been reconciled into these canonical documents.

The old patch logs, terminal-style receipts, checkpoints, and duplicated planning notes were therefore consolidated rather than carried forward as active SoT.

## 6. Definition of done for this documentation migration

- exactly 20 documentation files exist under `docs/`;
- no Markdown/text/rules documentation file exists outside `docs/`;
- WalkMyPlan historical reasoning has been reconciled into the 20 documents;
- Sweet Home 3D is explicitly authoritative for the 3D/animation model;
- operational registries and executable code remain available where required;
- no original uploaded ZIP is modified.
