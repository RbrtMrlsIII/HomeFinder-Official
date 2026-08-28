# Main Hall Physical UI Contract

## Purpose
The Main Hall is the first implementation surface for the centralized design roots. Physical UI objects are semantic interaction gateways mapped to HTML sections and Sweet Home 3D camera anchors.

## Root rules
- Theme: `data-hf-theme-inherit="environment"` and CSS root tokens.
- Motion: component transitions consume `--hf-component-motion` / `--hf-component-ease`.
- Responsive: components consume `--hf-density`, `--hf-ui-scale`, and root breakpoints.
- Accessibility: HTML remains authoritative; reduced motion removes cinematic interpolation and uses immediate/short state changes.
- Security: object activation never grants roles or permissions.

## Main Hall object IDs
`main-search-console`, `home-map-table`, `property-catalogue`, `government-info-desk`, `mission-wall`, `guide-book`, `safety-board`, `start-cta`, `contact-desk`, `credits-wall`, plus the five rendered physical-deck objects.

## State model
`idle → hover/focus → interaction-start → ui-open → loading/success/error/empty/disabled`.

## Camera boundary
An object may request a camera/section focus through its logical POV mapping. It may not authorize access, mutate security state, or bypass HTML route authority.
