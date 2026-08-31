# HomeFinder

HomeFinder is a web application with an authored 3D presentation environment. The repository contains application code, authoritative spatial assets, validation tooling, deployment configuration, product documentation, and historical evidence.

## Start here

For AI-assisted work, begin with:

`project-guide/AI_ASSISTANT_READ_ME.md`

That file is the current continuity index. It tells the agent what is active now and where the detailed source material lives.

For the full document-routing model, read:

`project-guide/DOCUMENTATION-MAP.md`

## Document wiring

| Document | What belongs here | What does not belong here |
| --- | --- | --- |
| `README.md` | Repository doorway, document map, high-level state | Detailed gate history, skills, coding procedure, product doctrine, test logs |
| `project-guide/AI_ASSISTANT_READ_ME.md` | Current continuity, active phase, latest verified state, next gate, pointers | Skills, coding instructions, product rules, security guidance, long historical narratives |
| `project-guide/HandOver.md` | Single live checkpoint and exact continuation point | Permanent historical archive or a second handover |
| `project-guide/Endorsement.md` | Chronological execution and acceptance ledger | Detailed evidence or replacement for HandOver |
| `project-guide/masterplan.md` | Durable architecture, chronology, and institutional memory | Per-run logs or transient notes |
| `project-guide/DOCUMENTATION-MAP.md` | Ownership and routing of documentation | Product implementation or runtime logic |
| `MASTER_SKILL.md` | Agent skills and operating procedures | Project-state continuity |
| `CODING-INSTRUCTIONS.md` | Coding conventions and implementation guidance | Current checkpoint state |
| `PRODUCT-KNOWLEDGE.md` | Product/domain context | Agent procedure or gate status |
| `docs/` | Detailed contracts, audits, manifests, reconciliation and validation evidence | A duplicate continuity authority |
| `archive/` | Historical evidence | Current source of truth |

## Current state

The project is currently in the **P04 Spatial / Visual Validation** track.

P04.0, P04.1, and P04.2 are accepted. P04.3–P04.6 remain unendorsed.

The canonical physical model is:

`master/HomeFinder.sh3d`

The main application-facing 3D viewer remains the Sweet Home 3D JS Viewer. The P04 GLB viewer is a separate validation surface for derived GLB artifacts and does not replace the SH3D authority.

## Browser verification

The repository already contains browser verification infrastructure. Inspect it before creating another workflow or harness:

- `.github/workflows/homefinder-browser.yml` — repository-wide browser verification.
- `.github/workflows/homefinder-p04.yml` — dedicated P04 spatial/visual validation.
- `active_development/tests/browser/package.json` — Playwright package definition.
- `active_development/tests/browser/playwright.config.mjs` — browser project and harness configuration.
- `active_development/tests/browser/server.mjs` — browser test server.
- `active_development/tests/browser/specs/` — browser acceptance tests.

## Session continuity

Use this order for a new session:

1. `README.md`
2. `project-guide/AI_ASSISTANT_READ_ME.md`
3. `project-guide/HandOver.md`
4. `project-guide/Endorsement.md`
5. the relevant `docs/` evidence/contracts
6. `project-guide/masterplan.md` when durable architecture or historical context is needed
7. the dedicated skill/coding/product files when their subject is relevant

At every checkpoint, the actual repository state, `HandOver.md`, and `Endorsement.md` must agree.
