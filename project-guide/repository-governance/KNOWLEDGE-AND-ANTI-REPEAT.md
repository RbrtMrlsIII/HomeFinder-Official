# HomeFinder E4 — Knowledge & Anti-Repeat System

## Purpose

Make durable HomeFinder knowledge machine-discoverable before an agent classifies a non-trivial approach, without creating a second knowledge authority.

## Canonical authority

`PRODUCT-KNOWLEDGE.md` remains the authoritative durable project-knowledge document.

`.agent/knowledge/ANTI-REPEAT-INDEX.json` is a derived machine index. It may summarize triggers and point to canonical sources, but it must never override them.

## Pre-Classify rule

Before Classify for a non-trivial approach:

1. Search durable knowledge for related anti-patterns, disproven hypotheses, dead ends, gotchas, and protected boundaries.
2. If a strong match is found, stop the proposed approach and inspect the cited source.
3. Proceed only when new evidence or a changed contract justifies revisiting the path.
4. Record any new result as evidence first; promote durable knowledge only after verification.

## Knowledge promotion

Use:

`FINDING → VERIFIED MEANING → FUTURE ACTION / AVOIDANCE → SOURCE`

Promote to `PRODUCT-KNOWLEDGE.md` when the result is verified, reusable, actionable, stable enough, and traceable.

Current-only orientation facts belong in `project-guide/AI_ASSISTANT_READ_ME.md`; detailed evidence remains in its owning `docs/` location.

## Machine search

Use:

`python scripts/knowledge-search.py "approach" --anti --score`

Exit code `0`: no indexed anti-pattern match.

Exit code `2`: indexed anti-pattern match; inspect the cited canonical source before Classify.

Search is advisory until a later enforcement gate wires it into CI/pre-commit. E4 does not yet alter commit enforcement.

## Indexed HomeFinder lessons

The initial index covers known categories including:

- resolved P04 module-resolution hypothesis;
- current repository-backed GLB blocker;
- superseded WalkMyPlan architecture;
- SH3D authority replacement;
- HTTP 200 versus actual runtime success;
- weakening acceptance assertions;
- invented spatial geometry/centers;
- blanket documentation updates;
- fabricated remote census totals;
- duplicate dictionary creation;
- history rewrite without branch reconciliation.

The index is intentionally compact. Detailed reasoning remains in the canonical source documents.

## E4 acceptance

E4 is complete when:

1. a machine-readable anti-repeat index exists and points to canonical sources;
2. a deterministic search tool can surface indexed anti-patterns and report a gate result;
3. the project has an explicit pre-Classify search requirement;
4. existing durable knowledge remains in its canonical owner;
5. whole-project continuity and endorsement are updated;
6. no duplicate Product Knowledge authority is created.
