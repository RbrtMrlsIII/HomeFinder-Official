# Checkpoint Packaging and Continuity Skill

**Status:** ACTIVE SUPPORTING PROCEDURE  
**Owner:** `MASTER_SKILL.md`  
**Purpose:** keep whole-project checkpoints complete, traceable, and non-recursive.

## Core rule

A whole-project checkpoint contains one current project source baseline plus only the evidence and manifests needed to continue the project safely.

## Required packaging sequence

`Census → Classify duplicates → Select canonical baseline → Exclude recursive checkpoints → Index historical evidence → Assemble → Verify → Hash`

## Packaging rules

1. Keep exactly one physical copy of the current project baseline.
2. Never embed a previous whole-project ZIP inside a new whole-project ZIP.
3. Never carry `_base`/nested-baseline trees forward as current source.
4. Do not duplicate the same GLB, SH3D, or other large current artifact under multiple current-source paths.
5. Keep historical evidence traceable by an index containing filename, size, hash where available, and retention reason.
6. Omit large historical report archives from the new checkpoint unless an active gate explicitly requires the binary archive itself.
7. Preserve the original source checkpoint externally as the immutable historical package; do not destroy it merely because a clean package is generated.
8. Record the final clean checkpoint hash after the archive is completely assembled.

## Continuity rules

The E-series is complete at E8 and does not become a product gate. Product/P-series acceptance remains independent.

When a branch contains stale E0–E6 or MR0-era continuity text, reconcile it against the latest endorsed E0–E8 state before advancing the product gate. Do not silently choose the newer text; record the reconciliation and update the canonical continuity owners.

P04.1 is accepted. P04.3–P04.5 require fresh evidence; P04.6 requires an endorsement decision. P05/P06 remain held without authoritative acceptance specifications.

## Verification checklist

- [ ] One current project baseline only.
- [ ] No nested prior whole-project ZIP.
- [ ] No duplicate baseline directories.
- [ ] No duplicate current GLB/SH3D copies.
- [ ] Historical evidence indexed.
- [ ] `HandOver.md` and `Endorsement.md` agree.
- [ ] `MASTER_SKILL.md` version is current.
- [ ] Final archive hash recorded.

This procedure supplements `MASTER_SKILL.md`; it does not create a second execution authority.
