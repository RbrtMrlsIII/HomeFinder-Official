# Animation Root + Physical UI State + Responsive Transformation Contract

## Scope
This contract governs presentation-only behavior for physical UI objects and their related camera/overlay transitions. It does not own authentication, roles, payments, routing authority, or business records.

## Animation root
- `js/animation-root.js` is the runtime motion authority.
- `css/variables.css` defines duration/easing tokens.
- `prefers-reduced-motion` collapses animation to immediate presentation changes.
- Components must reference named profiles (`micro`, `state`, `emphasis`, `cinematic`, `door`) rather than inventing page-local timings.

## Object state machine
States:
`idle → hover/focus → interaction-start → ui-open → loading/success/error/empty/disabled`.

Terminal states return to `idle` through `reset` or start a new activation where allowed. Invalid transitions retain the current state. Disabled objects can only return through `enable`.

## Responsive transformation root
The semantic identity of an object never changes with viewport size. Only presentation transforms:
- `mobile-portrait`: stacked, compact, 44px minimum interaction target.
- `mobile-landscape`: compact row, 44px minimum interaction target.
- `compact`: adaptive layout.
- `tablet`: adaptive grid.
- `desktop`: full composition.
- `wide-desktop`: capped composition.

The camera safe area is separate from the DOM layout safe area. HTML remains authoritative when cinematic presentation is unavailable.

## Theme contract
Objects inherit the environment theme. They do not create a parallel light/dark mode. Theme changes presentation only.
