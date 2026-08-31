# P04 CI Trigger Finding — 2026-09-01

Status: **BLOCKED — GitHub-hosted execution not queued**

## Observe
The clean P04 branch `p04/glb-runtime-restored-2026-09-01` contains the dedicated `homefinder-p04.yml` workflow. The workflow is configured for `pull_request` events targeting `main` and a push event on the older P04 branch.

A dedicated draft PR #6 was opened from the clean branch to `main` solely as a controlled execution trigger. It remains unmerged and does not authorize changes to `main`.

## Record
GitHub Actions run collection for the clean PR branch reports zero `pull_request` runs.

Direct inspection confirms `.github/workflows/homefinder-p04.yml` does **not** exist on `main`.

Therefore the PR cannot trigger this newly introduced workflow while the workflow definition exists only on the head branch.

## Understand
The P04 workflow itself is valid on the clean branch and still runs the unchanged Chromium Playwright command:

`npx playwright test specs/p04-spatial-visual-validation.spec.mjs --project=chromium`

However, GitHub-hosted pull-request execution requires the workflow definition to be available from the base/default workflow context. The current repository state does not provide that context on `main`.

## Classify
Classification: **CI workflow availability / trigger dependency**.

This is distinct from:
- approved GLB integrity;
- SH3D physical authority;
- P04 viewer correctness;
- Chromium runtime correctness;
- Vercel deployment health.

## Validate
Completed:
- clean branch isolation remains intact;
- PR #6 created as draft and remains unmerged;
- direct GitHub Actions run query returned zero PR runs;
- `.github/workflows/homefinder-p04.yml` confirmed absent from `main`;
- no P04 Chromium pass is claimed.

## Next Authorized Gate
Before a GitHub-hosted P04 run can occur, establish an evidence-backed CI trigger path. Preferred options, in order:

1. Promote only the minimal P04 workflow definition into the canonical workflow surface through the normal repository review path, then use a subsequent clean P04 PR for execution.
2. If available, invoke `workflow_dispatch` directly through an authorized GitHub Actions API/tooling path.

Do not merge PR #6 merely to make CI run. Do not weaken P04 assertions to compensate for the missing trigger.

No P04 endorsement is granted by this record.
