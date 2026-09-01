# E-Series Reconciliation — Validation Evidence

## Validation contract

| Requirement / risk | Observable evidence | Result |
|---|---|---|
| Existing automation is part of baseline | `.github/workflows/` contains `homefinder-browser.yml`, `homefinder-p04.yml`, and `AI_Key.yml` | PASS |
| E7 does not create a competing workflow owner | `.github/workflows/homefinder-execution-gate.yml` was removed; E7 procedure now identifies existing owners | PASS |
| Browser CI trigger overbreadth is real | `homefinder-browser.yml` uses push + pull_request without path filtering; screenshot/run history shows repeated docs-triggered browser executions | CONFIRMED |
| P04 has a dedicated owner | `homefinder-p04.yml` is branch/PR scoped and performs P04 browser validation | PASS |
| Existing P04 failure is not infrastructure success | Run `33451823171` has successful checkout/setup/CDN preflight/Chromium/artifact upload but failed focused browser assertions | PASS |
| Privileged automation is outside E-series | `AI_Key.yml` uses scheduled/manual execution and `contents: write` and pushes to main | CONFIRMED |
| E5 platform provenance remains valid | GitHub artifact `9780126370` and Vercel deployment `dpl_5Fi2KT76WLu7zUFH1wcu3yPPU6Nj` are recorded separately | PASS |
| E6 remains derived intelligence | Structural index and protocol remain non-authoritative; domain-owned sources remain owners | PASS |
| E7 endorsement is not falsely claimed | E7 is explicitly held pending CI integration validation | PASS |
| E8 does not advance early | Whole-project handover points to bounded CI/Execution-System Integration Reconciliation | PASS |

## Fresh GitHub evidence

GitHub Actions run `33451823171` for `homefinder-p04.yml` executed on branch `p04/glb-runtime-restored-2026-09-01` at source commit `5c9903113010d88c6a91677dc3709552bc297ed0`. The job successfully checked out the repository, set up Node, reached both external Three.js resources, installed browser dependencies and Chromium, and uploaded 40 evidence files. The focused P04 browser suite failed all six tests. The first target showed `data-renderer="three-glb"` but `data-glb-loaded="false"`; other target transitions did not produce their expected target IDs. This is P04 validation evidence, not an execution-system failure. 

## Workflow inventory

Current `.github/workflows/` inventory on the active branch:

- `AI_Key.yml`
- `homefinder-browser.yml`
- `homefinder-p04.yml`

The E7-specific `homefinder-execution-gate.yml` has been removed after classification as duplicate orchestration.

## Scope conclusion

The E-series does not need another CI engine. It needs disciplined integration of its checks into the already-existing HomeFinder automation architecture, with trigger scope aligned to impact and with privileged write automation kept outside the execution-system authority boundary.

The next bounded gate is **CI / Execution-System Integration Reconciliation**. Until that gate is endorsed, E7 remains unendorsed and E8 remains on hold.
