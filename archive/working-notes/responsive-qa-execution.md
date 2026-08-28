# HomeFinder — Responsive QA Execution

Status: **SOURCE-VERIFIED / BROWSER-HARNESS-LIMITED**

The route matrix covers all 12 current routes across mobile portrait, mobile landscape, tablet, desktop, wide desktop, and reduced-motion.

Source-level checks verified:
- every route has a viewport meta tag;
- route-linked CSS contains responsive media queries;
- reduced-motion CSS is available through the active theme/cinematic CSS root;
- camera/environment presentation references remain present;
- HTML remains the authority for navigation and page content.

A Chromium harness was attempted, but Firebase/remote SDK initialization kept the pages alive beyond the bounded headless execution window. The matrix therefore records browser execution as unavailable in this environment rather than fabricating runtime passes.

Future browser/device runs should execute the same matrix with Firebase/3D service dependencies available or mocked intentionally, and must verify camera overlay behavior, touch targets, map surfaces, reduced motion, slow network, 3D failure, hidden tab, and interrupted navigation.
