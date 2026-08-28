# HomeFinder — Design Roots Implementation

Status: **LIVING / ADJUSTABLE**

## Purpose
This document defines the active root contract for future UI and cinematic development.

## Roots
- **Theme root:** `css/variables.css`
- **Root metadata:** `data/design-roots.json`
- **Runtime root:** `js/design-roots.js`
- **Environment authority:** `data/environment-modes.json`
- **Cinematic runtime:** `js/cinematic-ui.js`

## UI root layers
1. Surface: page, panel, card, input, overlay, glass.
2. Typography: display, UI, monospace, size, weight, line-height.
3. Geometry: radii and minimum hit targets.
4. Spacing: shared scale, content max-width, gutters, section gaps.
5. Elevation: card, floating, focus.
6. Responsive: density, UI scale, viewport class.
7. Animation: enabled/intensity, duration, easing.
8. Camera: transition duration/easing, scale and offsets.
9. UI object: semantic surface/ink/border/radius/shadow/gap/motion/ease.

## Rules
New UI elements, animation, camera transitions, and physical UI objects consume these roots. They do not invent another page-wide timing, typography, spacing, or theme system.

The environment theme can change presentation but cannot change security, role, route, data authority, payment state, or business meaning.

Reduced motion collapses animation durations to the root instant token and disables interactive hover transforms.
