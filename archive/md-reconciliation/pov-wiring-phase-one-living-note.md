# HomeFinder POV Wiring Phase 1 — Living Authority Note

This checkpoint treats `master/HomeFinder.sh3d` as the current canonical Sweet Home 3D master scene. The SoT remains living/versioned and may change with future development.

## Current route set
The active 12 HTML routes are: index.html, login.html, register.html, market.html, profile.html, broker-hq.html, admin.html, moderator.html, staff.html, financing.html, privacy.html, terms.html.

## POV census clarification
The recovered formal `camera-registry.json` contains 42 registered logical cameras. The current `section-camera-choreography.json` references 47 distinct logical POV IDs across its pages; 10 of these are section-level Login/Register anchors not present in the formal camera registry. This checkpoint therefore distinguishes `REGISTERED_LOGICAL_POV`, `SECTION_ANCHOR_RECONSTRUCTED`, and `NEW_VARIANT`.

A new `LGL-02` variant is introduced for `terms.html` so Privacy and Terms remain separate page-level camera identities while sharing the Reference room.

## Wire rule
Page/section/tab -> logical POV -> Sweet Home 3D stored camera. HTML routes, tabs, permissions, feature state, and responsive behavior remain application authority. Camera movement is presentation only.

## Master scene policy
The existing Sweet Home 3D cameras are not overwritten. New `HF <POV-ID> — <focus>` stored cameras are created as copies/variants and visually tuned against the frozen master scene. A POV is only promoted from candidate to confirmed after visual validation.
