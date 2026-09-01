# CI Workflow Retirement Reconciliation — 2026-09-01

## Purpose
Record the evidence-backed retirement of redundant or ungoverned GitHub Actions workflows and preserve the anti-repeat rule for future AI sessions.

## Finding
HomeFinder previously exposed multiple browser/automation workflow definitions. The project already had a proven browser-verification lineage from T01/T02. A milestone-specific P04 workflow duplicated that browser execution path instead of demonstrating a materially different execution requirement.

The scheduled `AI_Key.yml` workflow also granted `contents: write` and could push directly to `main`; that was not part of the governed execution-system architecture and was therefore retired from the active repository surface rather than absorbed into E7.

## Evidence
At the time of reconciliation, the branch contained:
- `.github/workflows/AI_Key.yml`
- `.github/workflows/homefinder-browser.yml`
- `.github/workflows/homefinder-p04.yml`
- the previously introduced E7 workflow, which had already been classified as redundant and removed.

The three remaining workflow files were then retired from the active branch. The workflow directory now returns not-found on the clean P04 branch, confirming there are no active workflow YAML definitions there.

The final in-flight P04 run `33471269425` was triggered before `homefinder-p04.yml` disappeared from the branch. Its final job `99741339268` shows:
- checkout: success
- Node setup: success
- Three.js CDN preflight: success
- npm dependencies: success
- Chromium installation: success
- focused P04 spatial/visual validation: failure
- evidence upload: success

Artifact `9786685961` was uploaded with digest `sha256:a6cfc1979930dfe93ebbd2c87106e59b7d47419eb86c69b6348d4e85fe88c8cd`.

This confirms that the failure is application/runtime evidence, not runner infrastructure failure.

## Disposition
- Retire all three active workflow definitions from the clean P04 branch.
- Preserve historical workflow runs and artifacts as evidence.
- Preserve PR #6 as the sole active P04 validation vehicle; do not create another validation PR merely to retry the same healthy runner.
- Do not recreate `homefinder-p04.yml` or another milestone-specific browser workflow unless new evidence proves a materially different execution requirement.
- Future CI design must first evaluate the proven T01/T02 browser execution mechanism and determine whether it should be reused, extended, or replaced for a specific current requirement.

## Durable knowledge
`AI_ASSISTANT_READ_ME.md` now contains the hard anti-repeat rule: proven T01/T02 browser verification is the default browser-execution baseline, and a new workflow requires evidence of a materially different requirement plus an explicit reason reuse/extension is insufficient.

## Scope boundaries
No product runtime, SH3D authority, GLB binary authority, P04 acceptance assertion, Vercel deployment, or Git history was modified by this reconciliation.
