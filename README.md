# HomeFinder package

**Agents:** open `AI_ASSISTANT_READ_ME.md`, then `Masterplan/NEXT_SLICES.md`.
Do **not** start from `project-guide/HandOver.md` — that ledger is HISTORICAL.

Docs: `docs/md`, `docs/csv`, `docs/json`  
Integrations: `docs/md/firebase|supabase|cloudflare|paypal`  
App: `active_development/` (`firestore.rules` stays under `firebase/`)  
3D: `master/HomeFinder.sh3d` (protected)

## Authority chain (TeamAi-adapted)

```
Product_Law/PRODUCT_LAW.md
  → Product_Law/WIRING.md
  → Masterplan/MASTERPLAN.md
  → Masterplan/NEXT_SLICES.md     ← exactly one current slice
  → POLICY.md (ORUCAVEAM)
  → docs/SKILL_WIRING.md → skills/**/SKILL.md
  → owning Issue / Draft PR
```

`specified ≠ implemented ≠ verified ≠ runtime-proven ≠ completed ≠ accepted`.

## Engineering execution — ORUCAVEAM

Future sessions preserve this behavior (the former Flashlight Method maps here):

1. Read Product Law, current slice, and the session snapshot before changes.
2. Execute only the current slice unless evidence requires a documented branch.
3. One bounded hypothesis at a time; inspect evidence before repairing.
4. Classify failures before fixing; distinguish current contracts from historical ones.
5. Protect `master/HomeFinder.sh3d` until candidate reconciliation gates pass.
6. Prefer repairing useful staged work over rebuilding it.
7. Do not pursue green tests at the expense of the current architecture.
8. Do not delete old runtime/navigation code until replacement is reconciled.
9. House 2 ↔ House 3 direct physical traversal is forbidden.
10. Draft-PR-first. No auto-merge. `main` changes through governed PRs only.

Companions (not current ledgers): `CODING-INSTRUCTIONS.md`, `MASTER_SKILL.md`,
`PRODUCT-KNOWLEDGE.md`, bannered files under `project-guide/`.

## Current execution state

See `Masterplan/NEXT_SLICES.md`. As of 2026-09-29 the current slice is
**HF-REVIVAL-001** (Issue #10): restore the public product while Vercel is 404
and install this authority chain. Physical portal certification (5.5G.6I)
is **not** the current slice.

## SESSION CONTINUITY

HomeFinder no longer uses live `HandOver.md` / `Endorsement.md` ledgers.

- Current session: `AI_ASSISTANT_READ_ME.md`
- Current slice: `Masterplan/NEXT_SLICES.md`
- Historical ledgers: `project-guide/HandOver.md`, `project-guide/Endorsement.md`
  (HISTORICAL banners) and `docs/archive/continuity/`

At checkpoint time, the session snapshot, NEXT_SLICES, and the actual files
must agree. Partial work stays unchecked.
