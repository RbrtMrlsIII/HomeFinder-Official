# HomeFinder — UI Ownership & Interaction Contracts

## Ownership rule

Every important selector family, component behavior, and navigation behavior has one owner. Duplicate implementation is preferred only when separate domain ownership is proven.

Known legitimate duplicate module names include domain-specific `core.js`, `logout.js`, `responsive.css`, `tabs.js`, and server/browser `tiers.js`.

## Cinematic ownership

- `js/cinematic-ui.js` — cinematic navigation.
- `js/leave-guard.js` — dirty-state authority.
- `js/transition.js` — compatibility/theme bridge.

Do not add a page-specific cinematic router.

## Physical UI

A physical UI object has:

- stable asset identifier;
- room/zone binding;
- real route/action;
- real HTML/UI mount;
- loading/error/disabled states;
- reduced-motion behavior;
- performance tier;
- fallback.

The object itself is not the source of data or permissions.

## Profile

Respect the existing Profile header owner and scroll model. Do not recreate collapse/height motion in another module.

## CSS

One owner per selector family. Avoid `!important` as a substitute for ownership resolution.

## Interaction model

Recommended physical-object state sequence:

```text
idle → hover/focus → active → loading → success/error
```

A 3D interaction may open, focus, mount, or animate a real UI surface, but submission and persistence remain owned by the application.

## Accessibility

Keyboard focus, semantic labels, reduced motion, touch interaction, and non-3D fallbacks must remain available. Cinematic enhancement is never a prerequisite for completing a core task.
