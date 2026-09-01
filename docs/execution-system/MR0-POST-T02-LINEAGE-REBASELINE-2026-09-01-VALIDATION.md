# MR0 Validation — Post-T02 Masterplan & Execution-Lineage Rebaseline

## Scope
Validation of the reconstructed project chronology and its dependency relationship to E0–E8.

## Evidence checked
- Detailed historical masterplan chronology for T02, T03, T04, T05, and T06.
- Current compact `project-guide/masterplan.md`.
- Current whole-project `project-guide/HandOver.md`.
- Current chronological `project-guide/Endorsement.md`.
- Current `project-guide/AI_ASSISTANT_READ_ME.md`.
- Project execution discipline and findings-to-knowledge rules.
- Existing E-series findings, validation records, and program reconciliation.
- Current GitHub branch, PR, and workflow state.
- Current CI retirement evidence.

## Validation results

| Check | Result | Evidence interpretation |
|---|---|---|
| T02 is a controlled frozen development gate | PASS | Masterplan lineage records T02 complete/frozen and next permitted gate T03. |
| T03 follows T02 | PASS | Masterplan lineage records T03 complete/frozen and next permitted gate T04. |
| T04 follows T03 | PASS | Masterplan lineage records T04 complete/frozen and next permitted gate T05. |
| T05 follows T04 | PASS | Masterplan lineage records T05 complete/frozen and next permitted gate T06. |
| T06 follows T05 | PASS | Masterplan lineage records T06 complete/frozen and next permitted work T07. |
| T07 is frozen | PASS | Current canonical state identifies T07 as frozen. |
| P01-P06 is separate post-T07 GLB track | PASS | Current masterplan and continuity records describe the separate GLB sequence. |
| E-series replaces product chronology | PASS/NEGATIVE | No authority permits the E-series to reorder or reopen product gates; MR0 explicitly rejects that interpretation. |
| E0-E6 can remain as supporting capabilities | PASS | Capabilities remain useful when consumed as an execution overlay. |
| E7 may enforce before CI/lineage reconciliation | FAIL/HELD | E7 remains held until CI/execution-system integration is reconciled against the corrected lineage. |
| E8 may proceed | FAIL/HELD | E8 remains held pending stable E7 and CI boundaries. |
| SH3D authority altered by MR0 | PASS/NEGATIVE | `master/HomeFinder.sh3d` remains protected. |
| P04 acceptance altered by MR0 | PASS/NEGATIVE | P04.3–P04.6 remain unchanged and unendorsed. |
| Git history rewritten | PASS/NEGATIVE | No history rewrite performed. |
| MR0 artifacts reside on the active P04 branch | PASS | Rebaseline artifacts are explicitly written to `p04/glb-runtime-restored-2026-09-01`. |
| Main contains active MR0 gate material | PASS/NEGATIVE | Stray MR0 material was removed from `main`; main AI continuity was restored to its pre-MR0 state. |
| Durable browser anti-repeat rule is in active continuity | PASS | Active branch AI continuity names T01/T02 browser verification as the proven baseline and requires evidence before a new workflow is introduced. |

## Canonical sequence

```text
T02 → T03 → T04 → T05 → T06 → T07 (FROZEN)
                                      ↓
                         P01 → P02 → P03 → P04 → P05 → P06

E0 → E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8
          (execution-system overlay; never a replacement chronology)
```

## CI evidence boundary
The final retired P04 workflow run `33471269425` reached checkout, Node setup, external Three.js preflight, dependency installation, Chromium installation, focused P04 execution, and evidence upload. The focused application/runtime validation failed. This confirms that runner/infrastructure state and application assertion state are separate evidence dimensions. The result is retained as historical evidence and does not authorize creation of another browser workflow.

## Conclusion
MR0 validation **PASSES and the gate is ENDORSED** as a whole-project rebaseline capability. The canonical records agree that the masterplan chronology outranks the execution-system overlay, T02–T06 are frozen lineage, T07 is frozen, P01–P06 is a separate post-T07 GLB track, and E7/E8 remain held until CI/execution-system integration is reconciled. No product runtime authority was mutated.
