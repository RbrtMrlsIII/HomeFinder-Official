# HomeFinder — Master Cross-System Matrix

The machine-readable master matrix is `data/master-page-room-pov-theme-role-object-responsive.csv`. It bridges page/room/POV, cinematic environment compatibility, UI theme behavior, access role, physical UI object mapping, and responsive state.

This matrix is a living reconciliation artifact, not immutable law. If a page, role, camera, object, or theme changes, update this matrix and the relevant authority document together.

Columns:
`Page → Room → POV → Allowed Environment Themes → UI Theme Compatibility → Role State → Physical UI Objects → Responsive State`

Camera state remains a presentation consumer. HTML, route-access, application controllers, Firestore rules, callable functions, and backend contracts remain authoritative.
