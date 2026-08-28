# HomeFinder — Theme & Animation Root

Status: **LIVING / ADJUSTABLE**

## Theme authority
HomeFinder no longer uses a light/dark UI mode. The active UI theme is driven by the cinematic environment state. Current environment themes are `day`, `sunset`, `night`, `rain`, `mist`, and `storm`. The system is extensible, so future environment themes may be added through the same registry and compatibility matrix.

## Root files
- `data/environment-modes.json` — environment states and lighting parameters.
- `data/theme-system.json` — active theme architecture and boundaries.
- `css/variables.css` — global UI/design/animation tokens.
- `js/cinematic-ui.js` — shared animation/navigation runtime owner.
- `data/master-page-room-pov-theme-role-object-responsive.csv` — cross-system bridge matrix.

## Design tokens
The root owns surfaces, text, borders, accents, radii, typography, shadows, motion durations, easing, and motion intensity. Cards, boxes, forms, navigation, overlays, cinematic UI, and future animation components consume these variables.

## Animation root
New animations must consume the root animation tokens rather than inventing independent timing systems. Every transition requires a reduced-motion path. Camera movement, door transitions, overlays, lighting changes, and UI motion remain presentation-only and cannot mutate application authority.

## Security boundary
Changing environment/theme presentation must never change roles, permissions, routes, business logic, payment state, data authority, or security decisions.

## Responsiveness
Theme and animation tokens must remain usable across mobile portrait, mobile landscape, tablet, desktop, wide desktop, hidden-tab, slow-network, interrupted-navigation, 3D-failure, and reduced-motion states.
