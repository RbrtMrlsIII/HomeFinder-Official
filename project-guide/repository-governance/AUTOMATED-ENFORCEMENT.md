# HomeFinder E7 — Automated Enforcement

## Purpose
Turn already-endorsed execution rules into deterministic repository gates without inventing new governance.

## Enforcement boundary
E7 enforces existing HomeFinder invariants:

- one canonical `MASTER_SKILL.md`;
- whole-project `HandOver.md` as mandatory gate output;
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

## Automated workflow
`.github/workflows/homefinder-execution-gate.yml`

The workflow runs on pushes and pull requests for repository-wide changes. It executes the gate checker and its deterministic negative-control self-test.

## E7 acceptance

A compliant checkout must pass the gate checker.

A deliberate violation in the self-test must fail the same invariant path without modifying repository source.

E7 automation does not endorse feature behavior. P04 runtime/GLB acceptance remains a separate gate.

## Non-goals

- no automatic mutation of canonical project documents;
- no automatic deletion or cleanup;
- no automatic Git history rewriting;
- no replacement of project authority with generated state;
- no browser-runtime inference from HTTP/static success;
- no new dictionary or parallel knowledge authority.
