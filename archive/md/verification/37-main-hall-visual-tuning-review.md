# Main Hall H-01–H-09 Visual Tuning Review

Status: TUNED_VISUAL_REVIEW

The current active Sweet Home 3D scene contains nine H-01…H-09 stored cameras derived from the frozen master. The camera positions were retuned using actual level-1 room geometry and explicit camera/object contract targets.

Diagnostic renders were produced from the real `.sh3d` geometry with a lightweight VTK renderer. Walls are intentionally ghosted in this diagnostic so they do not falsely occlude the composition; this is a composition audit, not a claim that VTK is a byte-for-byte replacement for Sweet Home 3D's native renderer.

Key review results:
- H-01/H-02/H-03/H-05 read as corridor-like in the diagnostic renderer and should receive native Sweet Home 3D visual approval before being considered final.
- H-04 reads as an elevated exterior/map composition and is structurally appropriate for the map gateway role.
- H-06 reads as a broad interior mission composition.
- H-07/H-08 read as room-specific guide/safety compositions.
- H-09 reads as a transition/exit composition.

Theme checks were rendered for day and night. The cameras retain the environment-driven theme contract and no camera grants authority.

Responsive safety remains the existing `main-hall-root` contract. Native browser/overlay validation remains a separate gate.
