# HomeFinder

HomeFinder is a web application with an authored 3D presentation environment. The repository contains application code, authoritative spatial assets, validation tooling, deployment configuration, product documentation, skills, and historical evidence.

## Start here

For AI-assisted work, begin with:

`project-guide/AI_ASSISTANT_READ_ME.md`

That file is the current continuity index and identifies the active product gate, completed execution-system state, and protected authorities.

For the full document-routing model, read:

`project-guide/DOCUMENTATION-MAP.md`

## Document wiring

| Document | What belongs here | What does not belong here |
| --- | --- | --- |
| `README.md` | Repository doorway and high-level state | Detailed gate history, skills, coding procedure, product doctrine, test logs |
| `project-guide/AI_ASSISTANT_READ_ME.md` | Current continuity and pointers | Skills, coding instructions, product rules, long historical narratives |
| `project-guide/HandOver.md` | Single live whole-project handover and continuation point | Permanent historical archive or a second handover |
| `project-guide/Endorsement.md` | Chronological execution and acceptance ledger | Detailed evidence or replacement for HandOver |
| `project-guide/masterplan.md` | Durable architecture, chronology, and institutional memory | Per-run logs or transient notes |
| `project-guide/DOCUMENTATION-MAP.md` | Ownership and routing of documentation | Product implementation or runtime logic |
| `MASTER_SKILL.md` | Canonical agent skill and operating procedures | Project-state continuity |
| `CODING-INSTRUCTIONS.md` | Coding conventions and implementation guidance | Current checkpoint state |
| `PRODUCT-KNOWLEDGE.md` | Product/domain context | Agent procedure or gate status |
| `project-guide/skills/` | Supporting reusable procedures owned by the canonical skill | Independent authority or current checkpoint state |
| `docs/` | Detailed contracts, audits, manifests, reconciliation and validation evidence | A duplicate continuity authority |
| `archive/` | Historical evidence | Current source of truth |

## Current state

The execution-system track is complete: **E0–E8 executed, validated, and endorsed** as an overlay beneath the product chronology.

The current product track is **P04 Spatial / Visual Validation**.

P04.0, P04.1, and P04.2 are accepted. P04.3–P04.5 remain unendorsed/blocked pending fresh evidence. P04.6 remains the endorsement decision gate. P05/P06 remain held until authoritative acceptance specifications exist.

The canonical product chronology remains:

`T02 → T03 → T04 → T05 → T06 → T07 (FROZEN) → P01 → P02 → P03 → P04 → P05 → P06`

The canonical physical model is:

`master/HomeFinder.sh3d`

The main application-facing 3D viewer remains the Sweet Home 3D JS Viewer. The P04 GLB viewer is a separate validation surface for derived GLB artifacts and does not replace SH3D authority.

## Browser and execution-system governance

The E-series has one governance workflow and must not become a second product-browser system. Before changing CI, inspect the current branch workflows, proven historical browser path, permissions, and actual gate requirements.

P04 runtime validation remains independently owned by the P-series product track. A failed application assertion is not by itself evidence of a runner defect, and P04 assertions must not be weakened to make CI green.

## Checkpoint packaging

A whole-project checkpoint must contain one current project baseline. Never recursively embed a prior checkpoint, duplicate the project baseline under `_base` paths, or duplicate current SH3D/GLB artifacts merely because they also appear in evidence.

Historical evidence remains traceable through a retention/evidence index. The original historical archive is not silently destroyed merely because a clean checkpoint is generated.

## Session continuity

Use this order for a new session:

1. `README.md`
2. `project-guide/AI_ASSISTANT_READ_ME.md`
3. `project-guide/HandOver.md`
4. `project-guide/Endorsement.md`
5. `project-guide/masterplan.md`
6. `MASTER_SKILL.md` and relevant `project-guide/skills/` procedures
7. `CODING-INSTRUCTIONS.md`, `PRODUCT-KNOWLEDGE.md`, and relevant `docs/` evidence/contracts

At every checkpoint, the actual repository state, `HandOver.md`, and `Endorsement.md` must agree.
