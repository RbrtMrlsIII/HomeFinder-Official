# Phase 12 — Animation Root + Physical UI Object State Machine + Responsive Transformation

## Result
The three presentation subsystems are now explicit and reusable:

```text
Animation Root
      ↓
Physical UI Object State Machine
      ↓
Responsive Transformation
      ↓
Camera / UI presentation
```

They remain downstream of page/role/data/security authority.

## Animation root
`js/animation-root.js` owns named presentation profiles:
- micro
- state
- emphasis
- cinematic
- door

All profiles resolve timing/easing from `css/variables.css` and collapse to immediate presentation under reduced motion.

## Physical UI state machine
`js/physical-ui-state.js` owns the state transition vocabulary:
`idle`, `hover`, `focus`, `interaction-start`, `ui-open`, `loading`, `success`, `error`, `empty`, `disabled`.

Invalid transitions retain the current state. Disabled objects can only recover through `enable`.

## Responsive transformation
Objects keep their semantic identity across viewport changes. Only presentation changes:
- mobile portrait: stacked / compact
- mobile landscape: compact row
- compact: adaptive
- tablet: adaptive grid
- desktop: full composition
- wide desktop: capped composition

Minimum touch target remains 44px.

## Main Hall integration
All 15 physical-object records have root contracts. The nine H-POVs already reference their object targets. Main Hall is the calibration surface for propagating this subsystem to the remaining pages.

## Verification
- 236 JS/MJS files syntax-clean.
- Phase 12 state behavior test: PASS.
- Main Hall camera/object contract: PASS.
- Main Hall physical UI root contract: PASS.
- Design roots contract: PASS for 12 pages.
- Theme/lighting performance budget: PASS.
- Cinematic world and routing tests: PASS after updating one stale WalkMyPlan authority assertion to the current Sweet Home 3D authority.

## Known limitation
Native Sweet Home 3D visual approval remains separate from the source/package checks. Browser/device runtime validation is also separate from these deterministic contract checks.
