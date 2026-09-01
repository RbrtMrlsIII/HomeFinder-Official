# HomeFinder E7 — Automated Enforcement

## Purpose
Turn already-endorsed execution rules into deterministic repository checks without inventing new governance or creating a second CI architecture.

## Enforcement boundary
E7 is responsible for enforcing existing HomeFinder invariants:

- one canonical `MASTER_SKILL.md`;
- whole-project `HandOver.md` as a mandatory gate output;
- chronological `Endorsement.md` consistency;
- durable-knowledge / anti-repeat ownership;
- derived structural-index boundaries;
- populated build/artifact provenance;
- preservation of `master/HomeFinder.sh3d` as physical authority;
- no fabricated full-project census claims from remote API views;
- no silent history rewriting.

## Enforcement executable
`scripts/execution-gate.py`

The checker is read-only against project source. It fails closed when required canonical records are missing, contradictory, malformed, or violate established ownership boundaries.

## CI integration boundary
HomeFinder already owns CI workflows for browser verification and P04 spatial/visual verification. E7 does **not** create a competing repository-wide workflow owner.

The previously introduced `.github/workflows/homefinder-execution-gate.yml` was removed during the E-series reconciliation because it duplicated orchestration. The enforcement executable remains the reusable E7 capability and must be integrated into an existing workflow or invoked through an explicitly scoped/on-demand gate after the CI integration design is endorsed.

Existing workflow owners remain:

- `.github/workflows/homefinder-browser.yml` — repository/browser verification.
- `.github/workflows/homefinder-p04.yml` — P04 spatial/visual verification.
- `.github/workflows/AI_Key.yml` — independent privileged scheduled/manual automation; outside E-series authority.

## Trigger principle
Workflow scope must follow execution impact. Documentation-only continuity commits must not automatically become product browser-test executions merely because a generic push trigger exists. Trigger refinement is a separate bounded CI reconciliation and must be validated before changing existing product-verification behavior.

## E7 acceptance
A compliant checkout must pass the enforcement checker.

A deliberate violation in the self-test must be rejected by the same invariant path without modifying repository source.

E7 automation does not endorse feature behavior. P04 runtime/GLB acceptance remains a separate gate.

## Non-goals

- no automatic mutation of canonical project documents;
- no automatic deletion or cleanup;
- no automatic Git history rewriting;
- no replacement of project authority with generated state;
- no browser-runtime inference from HTTP/static success;
- no new dictionary or parallel knowledge authority;
- no second CI workflow universe.
