# HomeFinder Documentation Map

This file is a navigation index. It tells readers which document owns which kind of project information.

## Read in this order

1. `README.md` — repository doorway and document routing.
2. `project-guide/AI_ASSISTANT_READ_ME.md` — current continuity only.
3. `project-guide/HandOver.md` — current checkpoint and continuation point.
4. `project-guide/Endorsement.md` — chronological gate status.
5. `project-guide/masterplan.md` — durable architecture and institutional history.
6. Relevant `docs/` contracts, audits, manifests, and validation evidence.
7. `MASTER_SKILL.md` — agent skill and operating procedure.
8. `CODING-INSTRUCTIONS.md` — coding conventions.
9. `PRODUCT-KNOWLEDGE.md` — product/domain knowledge.

## Ownership

| File | Primary purpose |
| --- | --- |
| `README.md` | High-level repository orientation and wiring to the project documents. |
| `project-guide/AI_ASSISTANT_READ_ME.md` | Current verified continuity, active phase, latest state, next gate, and pointers. |
| `project-guide/HandOver.md` | Single live whole-project checkpoint: findings, decisions, unresolved constraints, and continuation point. |
| `project-guide/Endorsement.md` | Chronological gate ledger and acceptance state. |
| `project-guide/masterplan.md` | Long-lived architecture, chronology, and institutional memory. |
| `MASTER_SKILL.md` | Single canonical skill and discipline procedures. |
| `CODING-INSTRUCTIONS.md` | Coding and implementation conventions. |
| `PRODUCT-KNOWLEDGE.md` | Product and domain context and durable engineering knowledge. |
| `docs/` | Detailed contracts, audits, manifests, reconciliation and validation evidence. |
| `docs/census/` | Census baselines and census-specific evidence. |
| `docs/knowledge/` | Knowledge-system and knowledge-distillation evidence. |
| `archive/` | Historical evidence that is no longer the live source. |
| `.agent/sessions/` | Machine-readable execution-session traces. |
| `.agent/census/` | Machine-readable census configuration and generated census state. |
| `.agent/knowledge/` | Derived machine indexes for durable-knowledge discovery; never an authority replacement. |

## Execution-system governance

- `project-guide/repository-governance/EXECUTION-TRACE-AND-FILE-UPDATE.md` — E2 session trace and impact-aware update protocol.
- `project-guide/repository-governance/CENSUS-AND-INVENTORY.md` — E3 source-first inventory protocol.
- `project-guide/repository-governance/KNOWLEDGE-AND-ANTI-REPEAT.md` — E4 durable-knowledge and anti-repeat protocol.
- `scripts/session_logger.py` — canonical local session trace helper.
- `scripts/census.py` — canonical source-first project census tool.
- `scripts/knowledge-search.py` — deterministic durable-knowledge and anti-pattern search helper.
- `.agent/census/census.config.json` — census configuration.
- `.agent/knowledge/ANTI-REPEAT-INDEX.json` — derived anti-pattern trigger index.

## Browser verification wiring

Existing browser verification surfaces must be discovered before creating another one:

- `.github/workflows/homefinder-browser.yml` — repository-wide browser verification.
- `.github/workflows/homefinder-p04.yml` — P04 spatial/visual validation.
- `active_development/tests/browser/package.json` — Playwright package definition.
- `active_development/tests/browser/playwright.config.mjs` — browser project and harness configuration.
- `active_development/tests/browser/server.mjs` — test server.
- `active_development/tests/browser/specs/` — browser tests.

## Continuity principle

Current state is represented by the actual repository plus `HandOver.md` and `Endorsement.md`. Detailed history belongs in `masterplan.md`; detailed proof belongs in `docs/`; agent procedures belong in `MASTER_SKILL.md`; coding conventions belong in `CODING-INSTRUCTIONS.md`; product context and durable knowledge belong in `PRODUCT-KNOWLEDGE.md`; census evidence belongs in `docs/census/` and derived `.agent/census/` state; anti-repeat discovery belongs in derived `.agent/knowledge/` state backed by `PRODUCT-KNOWLEDGE.md`.

Do not use the continuity file as a duplicate of those sources.
