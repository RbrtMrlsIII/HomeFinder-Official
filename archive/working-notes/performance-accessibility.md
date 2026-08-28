# HomeFinder — Performance, Device Tiers & Accessibility

## Performance tiers

### Tier 0
2D or static fallback. Use when 3D is unavailable or inappropriate.

### Tier 1
Lightweight mobile 3D and limited animation.

### Tier 2
Standard desktop experience.

### Tier 3
High-fidelity desktop experience.

## Asset rules

Do not ship raw 4K masters to every device. Use adaptive/transcoded media and device tiers.

Do not load every heavy room asset at startup. Stream or lazy-load by active room and likely next destination.

Production assets must pass:

- triangle budget;
- texture budget;
- draw-call budget;
- LOD selection;
- loading fallback;
- hidden-scene pause;
- mobile bypass where needed.

## Sweet Home 3D consideration

The `.sh3d` model is authoritative, but its full scene does not imply that every object must be rendered at maximum fidelity simultaneously. Rendering policy is a presentation constraint layered on the authoritative model.

## Accessibility

Every cinematic path must support:

- reduced motion;
- keyboard/focus access;
- semantic labels;
- touch interaction;
- readable UI;
- non-3D fallback;
- failure recovery.

## Verification matrix

Test at minimum:

- mobile;
- low-end desktop;
- normal desktop;
- high-end desktop;
- reduced motion;
- hidden browser tab;
- slow network;
- failed model/media load;
- interrupted navigation.

Core application usability must survive any cinematic failure.
