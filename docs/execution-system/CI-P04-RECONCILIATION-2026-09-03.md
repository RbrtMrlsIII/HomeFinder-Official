# P04 CI / Execution-System Reconciliation — 2026-09-03

**State:** BLOCKED / VERIFIED PARTIAL / NOT ENDORSED  
**Branch:** `p04/glb-runtime-restored-2026-09-01`  
**Purpose:** reconcile repository artifacts, browser evidence, CI behavior, and agent execution rules before any new development.

## Observed

The earlier P04 browser run `33728751161` spent the browser suite on four missing canonical GLB URLs. That produced multiple red GLB assertions even though the underlying approved binaries existed elsewhere in the handoff package. The correct failure class was **repository artifact / canonical-path drift**, not renderer logic.

The exact approved GLB hashes are now enforced in the browser workflow preflight at their canonical manifest paths:

- T02 `d3e1851fdf737dc59c4d4939b9aed6d6036c33d500a0bc2be0390130a91fc22d`
- T03 `83d1eadf8ac940c213618e5afdd5f7d96b71e7f17aa61a7582d3516f6271020c`
- T04 `330b4afc1068554abab84ac985e30f5cd39ec16887ee2f036a42424f7ddd57a0`
- T05 `b71bc456b3fc1aaf4659926b2626da0d4bc61c47a8f495ff64043473d661f1e6`

## Fresh runtime evidence

Run `33729859227` tested commit `9ff45ce45981bfdfce5a024891aadf8965477a2d`.

Result: **24 passed, 1 failed**.

The four P04 GLB browser assertions passed. House navigation assertions passed. The sole failure was T07-E camera-option binding: the runtime selector did not expose the expected `HF H-03 — property-display`, `HF H-07 — guide`, and `HF H-08 — safety` options even though the integration source and T07-E test contract name those canonical cameras.

This is classified as **contract/runtime mismatch** and remains a blocker. No test was weakened and no camera was invented.

## Workflow hardening

The browser workflow now:

- runs a deterministic CI-governance preflight before dependency installation and browser execution;
- verifies exact canonical GLB presence and SHA-256;
- fails before the expensive suite when duplicate GLBs remain in the old viewer location;
- fails when generated diagnostic files are tracked in Git;
- records the exact commit/ref under test;
- uses explicit Node `22.23.2` and an immutable Playwright container digest;
- cancels superseded runs on the same development line;
- uses path filters so documentation/archive-only changes do not create unrelated browser-red noise;
- exposes `workflow_dispatch` for deliberate manual verification;
- emits retry/classification guidance after a real failure;
- does not upload a persistent Playwright report artifact because diagnostics belong in the project ZIP/evidence package.

### Guardrail lesson: infrastructure references must themselves be validated

An attempted action-ref pin to the observed `actions/setup-node` commit SHA failed at workflow setup because the Actions runner could not resolve that exact ref. This was not allowed to masquerade as a project failure. The workflow was immediately restored to the supported `@v6` action ref while keeping the deterministic runtime/container improvements.

**Durable rule:** do not assume an observed action SHA is a usable immutable workflow ref merely because it appeared in a previous runner log. Validate the reference before committing the workflow change.

## Artifact boundary

Repository source remains free of diagnostic screenshots, traces, Playwright reports, `test-results`, CI screenshot folders, and equivalent generated run output. The evidence package remains external/project-ZIP evidence.

Legitimate product images and authoritative model assets are not covered by the diagnostic rule.

## Endorsement state

P04.3 remains **NOT ENDORSED**. The current evidence proves that the GLB canonical-path correction is effective under CI, but it does not prove the full P04/T07 acceptance contract because the T07-E runtime camera binding still fails.

No new product development should begin from this branch until the active blocker is reconciled and the whole-project checkpoint/handover is updated consistently.

## Exact next safe action

Investigate the runtime population of `#levelsAndCameras` against the authoritative `master/HomeFinder.sh3d` camera entries and the T07-E binding contract. Determine whether the defect is in SH3D camera authority, viewer option population, or runtime timing. Record the classification before any implementation mutation. Then run the hardened CI gate again and update the checkpoint with the result.
