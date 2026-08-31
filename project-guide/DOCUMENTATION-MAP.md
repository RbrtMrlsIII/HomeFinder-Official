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
| `project-guide/HandOver.md` | Single live checkpoint: findings, decisions, unresolved constraints, and continuation point. |
| `project-guide/Endorsement.md` | Chronological gate ledger and acceptance state. |
| `project-guide/masterplan.md` | Long-lived architecture, chronology, and institutional memory. |
| `MASTER_SKILL.md` | Skills and agent procedures. |
| `CODING-INSTRUCTIONS.md` | Coding and implementation conventions. |
| `PRODUCT-KNOWLEDGE.md` | Product and domain context. |
| `docs/` | Detailed contracts, audits, manifests, and validation evidence. |
| `archive/` | Historical evidence that is no longer the live source. |

## Browser verification wiring

Existing browser verification surfaces must be discovered before creating another one:

- `.github/workflows/homefinder-browser.yml` — repository-wide browser verification.
- `.github/workflows/homefinder-p04.yml` — P04 spatial/visual validation.
- `active_development/tests/browser/package.json` — Playwright package definition.
- `active_development/tests/browser/playwright.config.mjs` — browser project and harness configuration.
- `active_development/tests/browser/server.mjs` — test server.
- `active_development/tests/browser/specs/` — browser tests.

## Continuity principle

Current state is represented by the actual repository plus `HandOver.md` and `Endorsement.md`. Detailed history belongs in `masterplan.md`; detailed proof belongs in `docs/`; agent procedures belong in `MASTER_SKILL.md`; coding conventions belong in `CODING-INSTRUCTIONS.md`; product context belongs in `PRODUCT-KNOWLEDGE.md`.

Do not use the continuity file as a duplicate of those sources.
