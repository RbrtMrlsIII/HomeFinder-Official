# HomeFinder — WalkMyPlan → Sweet Home 3D Spatial Reconciliation

## Migration decision

WalkMyPlan's useful architectural thought is preserved, but Sweet Home 3D is now the physical-model authority.

The reconciliation is intentionally asymmetric:

- **HomeFinder application** decides what a feature means.
- **Sweet Home 3D** decides what the house physically is.
- **WalkMyPlan data** maps application meaning onto the physical model.

## Preserved WalkMyPlan concepts

The prior work established:

- Main Hall as a spatial composition of Home sections.
- rooms/zones as presentation groupings;
- camera/door graph;
- physical UI object mapping;
- theme/lighting/performance budgets;
- role-path constraints;
- asset readiness and loading policies;
- reduced-motion and fallback requirements;
- phase gates and landmine detection.

These concepts are incorporated into the new SoT rather than retained as competing prose files.

## Current Sweet Home 3D facts

The model currently has three levels — Basement, 1st floor, Roof — with 13 room polygons, 27 door/window objects, 114 furniture objects, 6 furniture groups, 6 lights, and 6 stored observer cameras.

## Reconciliation table

| Concern | Authority | WalkMyPlan role |
|---|---|---|
| physical levels | Sweet Home 3D | mapping |
| room geometry | Sweet Home 3D | mapping |
| doors/windows geometry | Sweet Home 3D | transition mapping |
| furniture geometry | Sweet Home 3D | object mapping |
| stored model cameras | Sweet Home 3D | route/section binding |
| route meaning | HomeFinder | spatial presentation |
| role/access | HomeFinder/backend | visual gating only |
| UI interaction | HomeFinder UI | physical presentation |
| animation choreography | HomeFinder + model | derived from model |
| performance policy | HomeFinder | asset/model implementation constraint |

## Required next reconciliation

Build and maintain:

`room → zone → object → route → role → camera → door → theme → performance → status`

The table should reference actual model names/IDs wherever possible. Do not create a fictional room merely to satisfy an old WalkMyPlan plan.

## Historical cleanup rule

Logs, terminal transcripts, receipts, and repetitive checkpoints are no longer active project documents. Their durable conclusions are preserved in this 20-document set.
