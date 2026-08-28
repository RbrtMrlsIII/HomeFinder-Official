# Main Hall H-01/H-02/H-03/H-05 Targeted Refinement

Status: TUNED_VISUAL_REVIEW

This pass refines only H-01, H-02, H-03, and H-05 against the physical-object contract. The frozen master remains unchanged.

## Orientation correction
Sweet Home 3D camera orientation was reconciled using the stored-camera convention observed in the master scene: yaw forward vector `(-sin(yaw), cos(yaw))`. Positive pitch is treated as downward in the derived camera contract. The diagnostic renderer had previously used a different convention, which made several views appear artificially ceiling-dominant.

## Targeted intent
- H-01: broad living-room hero with corner-sofa / living-centre emphasis and mobile-safe focal hierarchy.
- H-02: corridor-to-living discovery threshold, with a wider context envelope for the universal search surface.
- H-03: tighter living-room property-display axis toward the TV/property side.
- H-05: public-service reference axis from the corridor toward the living threshold, with reading-width protection.

## Review status
The derivative diagnostic renderer confirms the cameras now use the corrected orientation convention and contract-specific targets. Native Sweet Home 3D visual approval remains required because the diagnostic renderer is not Sweet Home 3D's native renderer and does not reproduce final materials, lighting, or UI overlays.

## Current tuned values

- H-01: position (300, 520, 150), target (470, 465, 85), FOV 1.22 rad.
- H-02: position (55, 330, 150), target (250, 440, 90), FOV 1.18 rad.
- H-03: position (350, 560, 150), target (480, 460, 85), FOV 0.92 rad.
- H-05: position (55, 265, 150), target (300, 360, 90), FOV 1.16 rad.

These are `TUNED_VISUAL_REVIEW`, not final art approval. The diagnostic renderer is intentionally treated as a geometry/composition aid only.
