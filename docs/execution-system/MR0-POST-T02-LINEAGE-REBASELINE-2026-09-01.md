# MR0 — Post-T02 Masterplan & Execution-Lineage Rebaseline

## Purpose
Re-establish the canonical development chronology after T02 and reconcile the E0–E7 execution-system layer against that chronology before any further product-development room/gate is advanced.

## Governing rule
The masterplan/development lineage is the project sequence. The E-series is an execution-system capability layer that supports, records, validates, and eventually enforces that sequence. E-series artifacts must not become an alternative product-development chronology.

## Evidence sources inspected
- `project-guide/masterplan.md`
- `project-guide/HandOver.md`
- `project-guide/Endorsement.md`
- `project-guide/AI_ASSISTANT_READ_ME.md`
- `project-guide/PROJECT-EXECUTION-DISCIPLINE.md`
- `project-guide/repository-governance/FINDINGS-TO-KNOWLEDGE.md`
- current E0–E6 findings/validation material
- aligned HomeFinder checkpoint containing the detailed historical masterplan
- current GitHub branch/PR/workflow state

## Reconstructed canonical post-T02 chronology

### T02 — Approved Geometry / House 1 Main Hall Public-Arrival Slice
T02 is frozen as a four-execution controlled target:
T02-A target definition → T02-B geometry binding → T02-C runtime representation → T02-D web integration.
The canonical SH3D remained authoritative. T02-C produced a derived GLB representation and T02-D integrated the target into the existing cinematic runtime. The next permitted gate after T02 was T03.

### T03 — House 1 Primary Interior Network
T03 extended the proven T02 hub to source-backed Kitchen and Bedroom #1 presentation spaces.
T03-A/B/C/D were completed/frozen sequentially. The derived GLB remained subordinate to canonical SH3D and the web integration reused the existing cinematic routing owner. The next permitted gate after T03 was T04.

### T04 — Navigation / Runtime Binding
T04 established a source-backed House 1 vertical interface across basement and first floor.
T04-A/B/C/D were completed/frozen sequentially. T04-C produced a derived vertical runtime representation; T04-D integrated it into page state while deliberately leaving physical walkability/route promotion unproven. The next permitted work after T04 was T05 planning/gate design.

### T05 — House 1 Level 1 Interior Network
T05 extended the House 1 Corridor/Main Hall network to Living room and Bedroom #2.
T05-A/B/C/D were completed/frozen sequentially. Existing H-03 was reused for Living; no unsupported Bedroom #2 camera was invented. The next permitted gate after T05 was T06 target definition.

### T06 — Spatial Systems Architecture
T06 established the reusable spatial-system model:
1. spatial architecture model;
2. three-house semantic model;
3. POV/camera graph;
4. asset-readiness/evidence model;
5. negative architecture registry.
T06-A/B/C/D were completed/frozen. House 1 remains the semantic/transit hub; House 2 is Operations/Broker; House 3 is Seeker/Owner; direct House 2 ↔ House 3 traversal is forbidden. The next permitted project work after T06 was T07 planning.

### T07 — Frozen
T07 is frozen. Post-T07 GLB work became a separate P01→P06 controlled track.

### Post-T07 GLB track
P01 Discovery & Census → P02 SH3D ↔ GLB Correspondence → P03 GLB Viewer Runtime → P04 Spatial / Visual Validation → P05 Navigation Readiness → P06 GLB Acceptance / Promotion Decision.
Current P04 is active; P04.0–P04.2 are accepted, P04.3–P04.6 are not endorsed.

## Chronology integrity finding
The authoritative development chronology is therefore **T02 → T03 → T04 → T05 → T06 → T07(frozen) → post-T07 P01→P06**.

The E0–E7 execution-system program does not replace this ordering. It is an overlay:

```text
MASTER DEVELOPMENT LINEAGE
T02 → T03 → T04 → T05 → T06 → T07 → P01…P06
              │
              ▼
EXECUTION SYSTEM
E0 → E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8
```

## E-series reconciliation

| E milestone | Rebaseline disposition | Reason |
|---|---|---|
| E0 | RETAIN / REBASELINE | Evaluation remains valid, but its original baseline must be interpreted against the reconstructed post-T02 chronology. |
| E1 | RETAIN | Canonical `MASTER_SKILL.md` remains useful; its procedures support the chronology and do not supersede the masterplan. |
| E2 | RETAIN / EXTEND | Session tracing and impact-aware updates directly support the chronology. Historical sequence must be traceable. |
| E3 | RETAIN / REBASELINE | Census is valid only when its state is tied to a known lineage point; future authoritative totals require checked-out source state. |
| E4 | RETAIN / STRENGTHEN | Knowledge must distinguish canonical, historical, superseded, rejected, and unverified lineage. |
| E5 | RETAIN / REBASELINE | Provenance must bind artifacts to exact development gate, source commit, validation, and endorsement rather than only to infrastructure. |
| E6 | RETAIN / HOLD FOR DEPENDENCY CHECK | Structural intelligence must describe the reconstructed chronology and remain derived navigation state. |
| E7 | HOLD | Automated enforcement must not enforce an unresolved or incomplete development chronology. |
| E8 | HOLD | Full execution-system integration is downstream of lineage and CI reconciliation. |

## Critical findings

### MR0-F01 — Master chronology must outrank execution-system convenience
A later E-series mechanism cannot move, merge, reopen, or reinterpret a product-development gate without an explicit project-gate decision.

**Disposition:** ACCEPT / DURABLE KNOWLEDGE.

### MR0-F02 — T02–T06 are frozen historical development lineage, not optional context
The four-execution structures and “next permitted gate” boundaries are part of the project's controlled chronology. They must remain visible to future AI sessions.

**Disposition:** ACCEPT / DURABLE KNOWLEDGE.

### MR0-F03 — Post-T07 P01–P06 is a separate controlled track
The GLB track does not retroactively replace T02–T06. It consumes their established authority and remains independently gated.

**Disposition:** ACCEPT / DURABLE KNOWLEDGE.

### MR0-F04 — Proven automation must be reused
The T01/T02 browser execution path is historical proof of the project browser baseline. Later gates must reuse or deliberately extend that mechanism; creating a parallel workflow requires evidence of a materially different requirement.

**Disposition:** ACCEPT / DURABLE KNOWLEDGE.

### MR0-F05 — E-series state cannot authorize product development by itself
An endorsed E milestone means an execution capability is available. It does not endorse P04, T07 reopening, SH3D mutation, or any subsequent development gate.

**Disposition:** ACCEPT / DURABLE KNOWLEDGE.

## Required implementation changes
1. Update the compact masterplan current pointer to name MR0 as the rebaseline boundary and preserve T02→T06 chronology in its sequencing section.
2. Update AI continuity with the reconstructed chronology and the rule that E-series cannot outrun masterplan lineage.
3. Update whole-project `HandOver.md` with MR0, current branch/PR state, CI cleanup state, and exact next gate.
4. Keep E7/E8 held until CI / execution-system integration is reconciled against this baseline.
5. Preserve detailed historical chronology in `masterplan.md`; do not replace it with a shorter E-series summary.
6. Regenerate the project checkpoint from the reconciled state after validation.

## Knowledge promotion assessment
The following are stable enough for durable AI memory:
- T02–T06 form the frozen post-T02 development lineage.
- T07 is frozen.
- P01–P06 is a distinct post-T07 GLB track.
- E-series is an overlay and never a replacement chronology.
- Proven T01/T02 browser verification is the default baseline for later browser work.

No raw logs or full historical reports are promoted here.

## Exit criteria
MR0 may be endorsed only when:
- the compact masterplan current pointer and chronological section agree;
- AI continuity names the same chronology and current gate;
- whole-project HandOver names the same chronology and current gate;
- Endorsement records MR0 without falsely endorsing E7/E8;
- machine-readable MR0 registry exists;
- validation evidence confirms no product runtime authority was mutated.
