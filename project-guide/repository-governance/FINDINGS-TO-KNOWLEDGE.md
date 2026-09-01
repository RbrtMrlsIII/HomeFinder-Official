# Findings → Knowledge Lifecycle

## Purpose

HomeFinder must gain knowledge without accumulating permanent documentation debt.

A finding is **not** the final knowledge form. A finding becomes project knowledge only after its meaning, authority, impact, and disposition are established.

The repository therefore uses this lifecycle:

```text
OBSERVE
  ↓
RECORD
  ↓
UNDERSTAND
  ↓
CLASSIFY
  ↓
ALIGN
  ↓
VALIDATE
  ↓
ENDORSE / REJECT / DEFER
  ↓
DISTILL INTO AI_ASSISTANT_READ_ME.md
  ↓
RETAIN DETAILED EVIDENCE AS NEEDED
  ↓
DELETE / ARCHIVE REDUNDANT DERIVATIVE DOCUMENTS
```

## 1. What belongs in AI_ASSISTANT_READ_ME.md

Only durable, high-value operational memory belongs there:

- current project state and exact next gate;
- canonical authority and protected boundaries;
- verified facts that prevent repeated experiments;
- decisions that future agents must not rediscover;
- known failure classifications and the correct interpretation;
- proven validation entry points;
- explicit deferred/blocked work;
- links to the detailed evidence that proves the memory.

The file is an **AI orientation layer**, not a diary, report archive, test-output dump, or replacement for contracts.

## 2. What stays outside AI_ASSISTANT_READ_ME.md

Keep detailed material in its owning location when it has independent evidentiary value:

- raw test reports;
- screenshots/traces;
- machine-readable manifests;
- detailed audit/reconciliation records;
- contracts and architecture specifications;
- historical snapshots;
- large generated artifacts.

The AI orientation layer points to these sources rather than copying them.

## 3. Knowledge promotion test

A finding may be distilled into `AI_ASSISTANT_READ_ME.md` only when it is:

1. **Verified** — supported by current evidence or an endorsed decision.
2. **Reusable** — useful to more than one future execution step.
3. **Actionable** — changes what an agent should do, avoid, or check.
4. **Stable enough** — not merely a transient log line.
5. **Traceable** — linked to the detailed source of truth.

A speculative observation stays in the detailed finding record until resolved.

## 4. Minimalism rule

When promoting knowledge, prefer one compact statement over reproducing a report.

```text
DETAILED FINDING
    ↓ extract decision / constraint / proven fact
AI MEMORY ENTRY
    ↓ retain source reference
DETAILED ARTIFACT
    ↓ archive or delete only after reconciliation
```

Never preserve a duplicate explanation merely because it once helped an agent understand the problem.

## 5. Anti-trial-and-error memory

When a previous execution disproves a hypothesis, the distilled memory should state the result explicitly enough to prevent that hypothesis from being retried without new evidence.

Example pattern:

```text
HYPOTHESIS → TEST → RESULT → CORRECT INTERPRETATION → DO NOT REPEAT
```

For HomeFinder, a useful memory entry is:

> P04 Chromium infrastructure and Three.js CDN reachability were proven healthy. The remaining failure is repository-backed GLB availability, not a reason to weaken the renderer assertions or restore superseded architecture.

The detailed CI logs remain the evidence source.

## 6. Deletion gate for findings documents

A detailed findings document becomes a deletion candidate only after:

- its unique decisions/facts have been distilled into the proper canonical document(s);
- its evidence role is either retained elsewhere or intentionally no longer required;
- active references have been scanned;
- no unresolved gate depends on it;
- historical significance has been classified;
- the deletion decision is recorded when material.

Deletion must never be used as a substitute for knowledge extraction.

## 7. Required future-session behavior

At session start, an AI agent should read `AI_ASSISTANT_READ_ME.md` first and use it to avoid repeating already-resolved investigations.

When new work produces a reusable finding:

1. update the detailed owner record;
2. decide whether the finding passes the knowledge promotion test;
3. update `AI_ASSISTANT_READ_ME.md` with the smallest durable memory statement;
4. update `masterplan.md` only when the finding changes project-wide strategy or chronology;
5. archive/delete redundant detail only after reconciliation.

## 8. Scope boundary

This lifecycle governs documentation knowledge, not authorization.

`AI_ASSISTANT_READ_ME.md` cannot override:

- canonical project status;
- endorsed contracts;
- machine-readable manifests;
- security rules;
- repository authority;
- human project-owner decisions.

Its role is to make those authorities **discoverable immediately and without repeated trial-and-error**.
