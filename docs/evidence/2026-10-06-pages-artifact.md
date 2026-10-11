# Evidence — Pages artifact and live probe (2026-10-06)

**Grade:** observed (local build of the real artifact, HTTP probes of the live site). The deploy
path itself is not exercised until the workflow is on `main`.

## Live site today

`node scripts/pages/probe.mjs https://rbrtmrlsiii.github.io/HomeFinder-Official/`

| Check | Result |
|---|---|
| landing returns HTTP 200 | pass |
| landing is the revival page | **FAIL** (neither marker present) |
| landing does not auto-redirect | **FAIL** (legacy meta-refresh to the 3D viewer) |
| 3D viewer page returns HTTP 200 | pass |
| unknown path serves the HomeFinder 404 page | **FAIL** (GitHub's default 404) |
| SH3D delivery copy is served | pass (5,775,168 bytes) |

Cause: the site still serves the legacy `main` page. `github-pages.yml` exists only on the
revival branch, so nothing deploys the revival landing; Pages itself is already in GitHub
Actions mode (`build_type: workflow`, observed 2026-10-04).

## The artifact, built exactly as the workflow builds it

7.3 MB (`index.html`, `404.html`, `active_development/3d`, `master/HomeFinder.sh3d`). Served by a
Pages-like server under `/HomeFinder-Official/`, all eight probe checks pass: landing 200 with the
revival markers and no redirect, viewer 200, custom 404 page for unknown paths, SH3D copy served.
The only references in the landing and 404 pages are relative, so the sub-path is safe.

## What this change adds

- `scripts/pages/lib.mjs`, `verify-dist.mjs`, `probe.mjs`, `smoke-dist.mjs`: artifact verifier (required
  files, markers, no auto-redirect, no root-absolute or broken links, no Vercel links, size limit), a
  live probe with retries, and a Pages-like local server.
- `scripts/pages/pages.test.mjs`: 11 tests, including one that proves the probe rejects today's legacy page.
- `github-pages.yml`: a `build` job that verifies the artifact on every relevant pull request (no
  deployment), then `deploy` and a `verify-live` probe on pushes to `main`. A deploy whose landing is not
  live now fails the run.

## Owner steps (admin-only)

1. Merge the stack to `main`; the `push` runs build, deploy, then the live probe.
2. After the first green run, update the repository `homepage` field (still the retired Vercel URL).
3. If the deploy job is blocked, check Settings → Environments → `github-pages` → deployment branches allow `main`.

## Not proven

The deploy and live-probe jobs (they need a push to `main`); environment protection rules (admin-only to
read); propagation time after deploy (the probe retries 10 times, 6 s apart).
