# HomeFinder — Current HandOver

> Single live handover authority. Update this file after every execution gate.

## CURRENT STATE — POST-T07 P03 CAMERA-CONTRACT RECONCILIATION — 2026-08-31

**Execution discipline:** Observe → Record → Understand → Classify → Align → Validate → Endorse → Advance.

**T07:** FROZEN. Do not reopen T07 without an explicit new bounded gate.

**Current track:** Post-T07 GLB Promotion Track.

**P03 verdict:** **BLOCKED FOR ENDORSEMENT.**

**Physical authority:** `master/HomeFinder.sh3d` remains protected and unchanged.

### Fresh browser evidence

The corrected import-path revision resolved the earlier browser infrastructure failure. Fresh Chromium evidence reports:

- Browser infrastructure: PASS
- Chromium setup: PASS
- Browser health: PASS
- All inter-house navigation journeys: PASS
- T07-E control count/visibility: PASS
- T07-E canonical camera binding: **FAIL**
- Overall: **18/19 PASS, 1/19 FAIL**

The remaining failing contract is specifically the selectable-camera binding for:

- `HF H-03 — property-display`
- `HF H-07 — guide`
- `HF H-08 — safety`

The acceptance test remains unchanged and is intentionally not softened.

### Root cause classification

Inspection of the canonical `HomeFinder.sh3d` XML confirms that all nine H-series cameras exist. The failing three, however, are ordinary `observerCamera` entries. Legacy selectable cameras such as Living room, Kitchen, and Bedroom #1 use `attribute="storedCamera"`.

The viewer's selectable-camera collection is therefore driven by stored-camera semantics. **Camera exists physically ≠ camera is selectable by the viewer.**

Classification: **canonical asset/runtime contract mismatch**, not a Playwright, Chromium, route, or acceptance-test defect.

### Candidate remediation

A bounded candidate was prepared outside the repository. It changes only the nine H-series presentation-camera entries to `attribute="storedCamera"` and preserves geometry, furniture, rooms, levels, coordinates, and camera metadata.

Candidate SHA-256:
`f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed`

The candidate binary is **not committed**. No canonical SH3D mutation has been made.

### Checkpoint / ZIP evidence

The supplied full reconciliation checkpoint was inspected against the project's execution standard. It confirms the required continuity files and the project-wide execution discipline. Historical snapshot material is treated as evidence, not as authority when newer evidence exists.

The checkpoint's canonical `master/HomeFinder.sh3d` is SHA-256:
`2463bbf41a92012bbd81b66ea957c993075f5a2bf6db8a43e676b0c832b0e58c`

### Required gate sequence

1. Introduce the verified candidate through a genuinely binary-safe repository path.
2. Verify the committed artifact hash equals `f8a0bf7d0181155d342dfc97fad0679741e38fdcfda60982dfa3ee534eb81aed`.
3. Run the unchanged Playwright Chromium suite.
4. Require H-03, H-07, and H-08 camera bindings to pass.
5. Perform the full P03 browser gate.
6. Only then evaluate endorsement and advance to P04.

**Do not:** weaken the acceptance test, alter unrelated geometry/runtime behavior, reopen T07, or claim P03 endorsement from the current evidence.

## Mandatory continuity outputs

- Human-readable findings: `docs/reconciliation/2026-08-31-p03-camera-contract-drift.md`
- Machine-readable registry: `docs/reconciliation/2026-08-31-p03-camera-contract-drift.json`
- Validation evidence: fresh Chromium result; repository CI remains the execution authority
- Team handover/checkpoint: this `project-guide/HandOver.md`

## File authority

- `project-guide/Endorsement.md` = chronological execution ledger.
- `project-guide/HandOver.md` = latest project state and continuation point.
- `README.md` = project-wide execution/session rules.
- `project-guide/masterplan.md` = durable architecture/chronology.
- `project-guide/AI_ASSISTANT_READ_ME.md` = assistant orientation.
- Existing `docs/` audits/contracts = detailed evidence.

Do not create another handover file.
