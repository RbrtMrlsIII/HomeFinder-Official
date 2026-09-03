# HomeFinder Agent Start Here

**Status:** PROJECT-WIDE MANDATORY EXECUTION GUIDE  
**Authority:** `MASTER_SKILL.md` remains the single canonical execution skill. This file is an execution entrypoint, not a competing authority.

## Before touching the repository

Every substantive agent session MUST establish the real project state before mutation.

Read, in this order:

1. `MASTER_SKILL.md`
2. `CODING-INSTRUCTIONS.md`
3. `README.md`
4. the newest whole-project checkpoint/status, especially `active_development/CURRENT_CHECKPOINT_STATE.json`
5. `HandOver.md`
6. `Endorsement.md`
7. the current masterplan and relevant contracts/architecture records
8. the active gate's guides, tests, and evidence records
9. `docs/execution-system/CI_EXECUTION_RULES.md`

Then record:

- current branch and commit
- active gate and exact scope
- authoritative source(s)
- consumers affected
- accepted lineage
- current blockers / deferred work
- expected validation command(s)
- protected boundaries

### Hard stop conditions

Do **not** mutate when any of these is true:

- authority conflicts are unexplained;
- the current checkpoint cannot be reconciled with repository reality;
- a required contract, manifest, or evidence record is missing;
- the proposed action would silently change another discipline's authority;
- the agent cannot state what the change is expected to prove;
- the agent is relying on memory rather than current repository evidence.

## Mandatory execution order

Use the project lifecycle exactly:

**Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance**

For changes, additionally use:

**read → inspect → trace consumers → define bounded change → validate source → validate consumers → update machine state → update canonical docs → checkpoint/handover**

## No-commit gate

An agent MUST NOT create a commit until all of the following are true:

- [ ] the intended files and exact change are known;
- [ ] source authority is identified;
- [ ] consumers and cross-discipline impact are identified;
- [ ] existing failed approaches / durable knowledge were checked;
- [ ] the change is the smallest bounded change that addresses the stated problem;
- [ ] deterministic validation has been selected before editing;
- [ ] local/source validation passes as applicable;
- [ ] no known contradiction remains hidden by the change;
- [ ] generated diagnostics, screenshots, traces, and reports are not being added to the Git tree;
- [ ] canonical machine-readable state and documentation will remain truthful after the commit;
- [ ] the commit message identifies the bounded gate or purpose.

A commit is an implementation event, **not** an endorsement event.

## No-green-by-accident rule

A red workflow is evidence, not a nuisance. Never:

- weaken an assertion to make CI green;
- delete a failing test because the result is inconvenient;
- substitute a different model, file, route, camera, or fixture without authority;
- rerun repeatedly without first classifying the failure;
- declare success from HTTP 200, static file presence, or a partially passing suite;
- edit tests and implementation together merely to make them agree without reconciling the contract.

When CI fails, classify it as one or more of:

**environment / dependency / repository artifact / contract mismatch / application defect / flaky or nondeterministic / test defect / governance or documentation drift.**

Record the classification before remediation.

## Commit-to-CI rule

After a substantive commit, the owning agent MUST inspect the resulting workflow run. A passing run proves only the assertions executed by that workflow. It does not create endorsement by itself.

Before advancing a gate:

1. verify the run is for the intended commit;
2. inspect the relevant job and failed tests, if any;
3. distinguish transient infrastructure failure from product failure;
4. capture exact evidence identifiers;
5. update the checkpoint and canonical documentation;
6. obtain the appropriate endorsement or record the blocker.

## Artifact boundary

Repository source stays clean. Diagnostic screenshots, traces, Playwright HTML reports, generated visual evidence, and similar run artifacts belong in the project ZIP/evidence package, not as repository source files.

Legitimate product assets remain governed by their normal source ownership. Do not delete real application images merely because they are image files.

## Handover minimum

Every substantive handover must let another authorized executor continue without private memory. It must state:

- authority and current state;
- branch / commit / gate;
- what changed;
- proof obtained;
- unresolved blockers;
- protected boundaries;
- deferred work;
- exact next safe action.

**When in doubt, stop and reconcile before writing code.**
