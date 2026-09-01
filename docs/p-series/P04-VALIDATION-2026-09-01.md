# P04 Validation Evidence — 2026-09-01

Static checkpoint verification:

- T02 GLB SHA-256: `d3e1851fdf737dc59c4d4939b9aed6d6036c33d500a0bc2be0390130a91fc22d`
- T03 GLB SHA-256: `83d1eadf8ac940c213618e5afdd5f7d96b71e7f17aa61a7582d3516f6271020c`
- T04 GLB SHA-256: `330b4afc1068554abab84ac985e30f5cd39ec16887ee2f036a42424f7ddd57a0`
- T05 GLB SHA-256: `b71bc456b3fc1aaf4659926b2626da0d4bc61c47a8f495ff64043473d661f1e6`

All four hashes match the approved values and each file has a valid GLB v2 header with matching declared length.

The new real Chromium workflow is present on `p/series-execution-2026-09-01` and follows the proven Playwright/Chromium execution pattern.

GitHub Actions run `33480279339` failed at the explicit repository-backed binary verification step because the four approved GLB files are not currently present at the canonical branch paths. Browser assertions therefore did not execute against substitute assets.

Local `npm ci` also timed out in the execution environment and the P04 viewer's external Three.js/GLTFLoader modules are unavailable offline. No local browser pass is claimed.

Disposition:
- P04.3: BLOCKED / NOT ENDORSED
- P04.4: BLOCKED / NOT ENDORSED
- P04.5: BLOCKED / NOT ENDORSED
- P04.6: HELD
- P05: HELD, no authoritative gate specification found
- P06: HELD, no authoritative gate specification found

Next enabling condition: binary-safe promotion of the exact four approved GLBs to the manifest paths, followed by a fresh real Chromium run of the existing P04 spec.
