# HomeFinder E2 — Execution Trace & Impact-Aware File Update Protocol

## Purpose

Make every substantive HomeFinder session traceable from session start through close,
while updating only the canonical records actually affected by a change.

This protocol implements the E2 gate under the single canonical `MASTER_SKILL.md`.
It does not create a parallel governance system.

## 1. Session-start requirement

A machine-readable session record MUST be created before substantive mutation.
It records:

- session ID and timestamps;
- milestone/gate;
- branch/ref;
- planned next gate;
- actions;
- files changed;
- validation results;
- completion state.

Use `scripts/session_logger.py start ...` for new local sessions.

A session created only at the end is invalid because it cannot prove the pre-mutation state.

## 2. Action recording

Every bounded execution action should record:

`timestamp → action → impact → affected file(s)`

Impact is one of:

### LOCAL
The change is self-contained and has no contract, architecture, consumer, or canonical-state consequence beyond the changed artifact.

Required update chain:

`source → session trace → focused validation`

### BOUNDED
The change affects a known set of consumers, contracts, state, evidence, or documentation.

Required update chain:

`source → session trace → affected canonical owner(s) → consumer validation → checkpoint as applicable`

### SYSTEMIC
The change alters shared architecture, contracts, authority, repository structure, security boundaries, or cross-discipline behavior.

Required update chain:

`source → session trace → affected canonical owners → architecture/contract reconciliation → consumer validation → whole-project continuity → endorsement`

## 3. File-update decision

Do not update every project document mechanically after every edit.
Instead ask:

1. What changed?
2. Who owns it?
3. Who consumes it?
4. Which contract/state/evidence is affected?
5. Does the change alter project-wide strategy or chronology?
6. Does durable knowledge change?
7. Does the whole-project handover need a new continuation point?

Update the minimum complete canonical set.

## 4. Canonical update map

- Current project state / continuation → `project-guide/HandOver.md`
- Chronological acceptance → `project-guide/Endorsement.md`
- Durable architecture / chronology → `project-guide/masterplan.md`
- AI operational memory → `project-guide/AI_ASSISTANT_READ_ME.md`
- Execution procedure → `MASTER_SKILL.md`
- Coding procedure → `CODING-INSTRUCTIONS.md`
- Product/domain knowledge → `PRODUCT-KNOWLEDGE.md`
- Detailed proof → owning `docs/` contract/audit/evidence record
- Session trace → `.agent/sessions/session-*.json`

## 5. Session close

Before closing:

- all changed artifacts are recorded;
- each change has an impact classification;
- validation is recorded and failures are classified;
- canonical records are updated when required;
- knowledge promotion is assessed;
- handover continuity is current;
- the next safe gate is explicit.

Then close the machine-readable session record.

## 6. Safety boundaries

This protocol does not grant authorization.

Capability to edit a file, GitHub, CI, deployment, or browser state does not grant
authority to redefine project decisions.

A failed validation does not become a success by changing its assertion.

A planned action does not become executed state until an actual mutation exists.

## 7. E2 acceptance

E2 is complete when the repository can demonstrate:

1. a session record created before mutation;
2. actions and files recorded during execution;
3. LOCAL / BOUNDED / SYSTEMIC impact classification;
4. canonical-document updates selected by impact rather than by blanket duplication;
5. validation and close state recorded deterministically.
