# HomeFinder CI Execution Rules

**Status:** PROJECT-WIDE ACTIVE CI/DISCIPLINE GUIDE  
**Authority:** `MASTER_SKILL.md` is canonical. This guide operationalizes its CI/CD and testing requirements.

## 1. Purpose

GitHub Actions is an evidence-producing gate, not a mechanism for obtaining green status at any cost.

A workflow failure MUST be investigated and classified before any retry, code change, or test change is proposed.

The workflow must fail loudly when a prerequisite is absent so that missing inputs do not masquerade as application defects.

## 2. Gate contract

Each CI workflow must make these facts visible:

- exact commit under test;
- branch / pull-request context;
- authoritative source and important hashes where applicable;
- required runtime/toolchain versions;
- preflight checks;
- exact tests executed;
- failure classification;
- artifact/evidence policy;
- what the run proves and what it does not prove.

A green run is **VERIFIED evidence for that workflow's assertions only**. It does not automatically mean ENDORSED or FROZEN.

## 3. Preflight before expensive tests

Before browser or integration tests, check deterministic prerequisites that can otherwise create misleading red suites.

For the HomeFinder browser gate this includes, as applicable:

- required governance documents exist;
- the canonical `master/HomeFinder.sh3d` file is present and has an approved SHA-256;
- all four approved P04 runtime GLBs exist at the manifest-declared canonical paths;
- each approved GLB has the expected SHA-256;
- required browser test configuration and lockfile exist;
- no prohibited diagnostics are already tracked in Git (`playwright-report`, `test-results`, CI screenshots, traces, or equivalent generated run output).

If preflight fails, stop there. Do not run the full browser suite and then misclassify six derivative failures as six independent defects.

## 4. Runtime reproducibility

Prefer explicit versions and immutable references for CI infrastructure.

Current browser gate baseline:

- Node: `22.23.2`
- Playwright container: `mcr.microsoft.com/playwright:v1.62.0-noble`
- Current validated container digest: `sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07`

When changing any CI runtime version or image, treat it as an execution-system change. Record why, validate the affected gate, and update this guide.

## 5. Workflow noise control

Avoid creating red runs that do not provide useful gate evidence.

Recommended controls:

- concurrency cancellation for superseded commits on the same development line;
- path filters so documentation-only changes do not trigger runtime suites that cannot be affected;
- `workflow_dispatch` for deliberate manual verification;
- pull-request execution for review gates and protected-branch execution for integration confidence;
- fail-fast preflight for known repository/artifact prerequisites.

Noise reduction MUST NOT suppress a required validation gate or turn a real failure into success.

## 6. Retry discipline

Do not blindly re-run a failed workflow.

First classify the failure:

| Classification | Default action |
|---|---|
| repository artifact missing | repair authoritative artifact/path, then rerun |
| contract mismatch | reconcile source/contract before code mutation |
| application defect | investigate implementation and consumers |
| environment/dependency failure | verify environment, version, or service before rerun |
| flaky/nondeterministic | reproduce and document evidence; do not hide with retries |
| test defect | repair test only after proving the test is wrong |
| governance/documentation drift | reconcile canonical records before advancing |

A retry is justified only after the failure mode is understood or there is strong evidence of transient infrastructure failure.

## 7. Red workflow handling

When a workflow is red:

1. identify the exact failing job and step;
2. identify the exact commit being tested;
3. read the relevant logs and test output;
4. capture failed assertions and affected files/paths;
5. classify the failure;
6. check known durable knowledge for prior failed approaches;
7. record the blocker or bounded remediation;
8. only then make a new action.

Never patch around a red status merely because other tests pass.

## 8. Evidence boundary

Generated screenshots, traces, HTML reports, video recordings, and test-result directories are **evidence artifacts**, not source.

For this project they belong in the project ZIP/evidence package and must not become committed repository content.

CI may expose textual logs and summaries needed to diagnose a run. The browser workflow should not upload a persistent Playwright report artifact when the project evidence policy requires diagnostics to remain in the ZIP.

Legitimate product assets (logos, UI artwork, avatars, model/source assets) are not diagnostic artifacts and remain governed by their owning discipline.

## 9. Test-change rule

A test is part of a contract. Before changing it, record:

- the contract it enforces;
- why the current assertion is incorrect or stale;
- what source evidence proves the change;
- which negative or boundary behavior must remain protected;
- what consumers become newly covered or uncovered.

Never change a test solely because the current implementation fails it.

## 10. Agent commit rule

No agent may commit a substantive change without completing the repository startup gate in `AGENT_START_HERE.md`.

After committing, the agent must inspect the resulting CI run and reconcile the project checkpoint before advancing.

## 11. Gate states

Use precise states:

**PROPOSED → OBSERVED → DERIVED → VERIFIED → ENDORSED → FROZEN**

or, when blocked:

**OBSERVED → UNRESOLVED / BLOCKED → DEFERRED / REJECTED / REMEDIATION**

Do not write `ENDORSED` or `FROZEN` merely because a workflow is green.

## 12. Current P04 lesson

The P04 browser gate previously spent a full suite on a missing canonical GLB-path condition. That failure mode is now explicitly covered by preflight so future agents can see the real repository-artifact problem before browser assertions are attempted.

The current 2026-09-03 run verified the four P04 GLB/browser assertions successfully, while the remaining failure is a T07-E runtime contract mismatch. That is a separate blocker and must not be disguised as a GLB failure.
