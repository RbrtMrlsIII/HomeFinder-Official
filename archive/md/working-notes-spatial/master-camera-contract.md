# Master Camera Contract

Status: LIVING / ADJUSTABLE

The master camera matrix is the bridge between the page/room/POV census, environment themes, UI system, role authority, public-profile projection, physical UI objects, and responsive behavior.

For every POV, the following invariants apply:

1. The Sweet Home 3D camera is presentation-only. It cannot grant access, mutate roles, approve KYC, change payment entitlements, or become authoritative data storage.
2. `users/{uid}` remains authoritative and private except for owner/admin-authorized paths.
3. `publicProfiles/{uid}` is the only broad public identity projection and contains explicitly public fields.
4. Environment themes affect presentation only. They never change authorization, business logic, data authority, or security.
5. Responsive behavior belongs to the UI state machine; cameras must degrade without blocking HTML/business functionality.
6. A POV is not final until its visual framing, theme compatibility, role state, response states, responsive states, and 3D-fallback behavior are all verified.
7. SoT is living and versioned. Candidate mappings remain candidates until explicitly promoted.

The machine-readable source is `data/master-page-room-pov-theme-role-object-responsive.csv`.
