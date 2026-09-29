# PRODUCT LAW — HomeFinder

`PRODUCT_LAW.md` is the **highest product authority** for HomeFinder. It defines
what HomeFinder is, what must remain true, which responsibilities are distinct,
how they connect, and which boundaries cannot be silently crossed.

Implementation, UI, deployment, Grok workspace, GitHub Pages, Firebase, SH3D,
branch, skill, tool, or documentation conventions MUST NOT override it.

This is HomeFinder law, not a copy of TeamAi product meaning. The *authority
shape* is adapted from TeamAi: one Product Law, one wiring map, one Masterplan,
one current slice, ORUCAVEAM, Draft-PR-first, no auto-merge.

---

## 1. Product identity

HomeFinder is a Philippines platform for **rentals and spaces**: bedspaces,
homes, offices, coworking, retail, warehouses, and guest-visible government
housing programs.

It serves **guests, seekers, owners, and brokers**. Government is a
listing/program surface, not a walkable role that overrides identity.

The public promise: find a place that fits a life, with people you can trust,
and walk the space before you decide.

---

## 2. Authority split (non-negotiable)

| Authority | Owns | Must not own |
|---|---|---|
| Application / backend | Identity, session, role, authorization, listings durability, payments, bans | Physical room geometry |
| SH3D / spatial presentation | Physical rooms, walls, doors, cameras, walkable presentation | Role, session, authorization |
| Product Law | Meaning and protected invariants | Runtime bits |
| GitHub Pages | Canonical public live-site validation target | Product meaning, SH3D mutation |
| Grok App Builder workspace | Public-product revival vehicle | Canonical `main`, SH3D mutation, production hosting |
| GitHub `main` | Canonical accepted package | Unreviewed revival drafts |

Physical movement **never** changes authenticated identity, role, or session.
A role change is an application event. Cached role is never an authorization
source. Logout must clear role/session cache.

---

## 3. Three-house topology

- **House 1** — Public / hero / common transit. Guests may enter.
- **House 2** — Operations + Broker HQ. Broker-authorized application surfaces
  live here, including broker profile, broker market, and broker map.
- **House 3** — Seeker + Owner. Save Property and Wanted Listings follow the
  non-Operations counterpart logic.

**House 2 ↔ House 3 direct physical traversal is forbidden.** Cross-house
progression uses House 1.

Government surfaces remain accessible to all roles, including guests, through
featured government properties/programs and their designated external
government URLs.

---

## 4. Protected physical model

`master/HomeFinder.sh3d` is the single canonical physical model.

- Do not mutate it until candidate reconciliation gates are independently proven.
- Do not multiply live `.sh3d` authorities.
- Historical SH3D filenames and hashes may remain in evidence documents.
- Current-state manifests must name the live file and its current hash.
- Runtime routes are promoted only after physical evidence passes.
- A GitHub Pages **delivery copy** of the file is allowed. That copy is not a
  second authority and must not be edited independently.
- Firebase Hosting remains undeployed until web/3D integration is independently
  proven.

---

## 5. Evidence grades

`specified ≠ implemented ≠ verified ≠ runtime-proven ≠ completed ≠ accepted`

A passing test proves only the contract it exercises. Screenshots, CI, Grok
preview, GitHub Pages HTTP status, and model commentary are evidence. They do
not independently change Product Law or close an Issue.

---

## 5.1 Public live-site hosting (Vercel retired)

**Vercel is not a production acceptance target.**

The former URL `https://home-finder-official.vercel.app` was observed
**404 DEPLOYMENT_NOT_FOUND** on 2026-09-29 and is **retired**. Do not restore
it. Do not add `vercel.json` or `.vercel/` to this package. Do not treat a
Grok App Builder deploy as HomeFinder production.

The canonical public live-site validation target is GitHub Pages, matching the
TeamAi delivery pattern (not TeamAi product meaning):

`https://RbrtMrlsIII.github.io/HomeFinder-Official/`

Preserve the `HomeFinder-Official` path casing in recorded evidence. Browser
hostname lowercasing is normal URL handling.

GitHub Pages is **specified** as production hosting. It is **implemented** on
the revival branch (landing + Pages workflow). It is **not runtime-proven**
until a default-branch Pages deploy returns HTTP 200 with this landing, and
**not accepted** until a governed merge plus owner review.

---

## 6. Continuity (TeamAi-adapted)

Current instruction surfaces, in order:

1. This file — product meaning
2. `Product_Law/WIRING.md` — field ownership
3. `Masterplan/MASTERPLAN.md` — ordered checklist
4. `Masterplan/NEXT_SLICES.md` — exactly one current slice
5. `POLICY.md` — ORUCAVEAM / PR discipline
6. `docs/SKILL_WIRING.md` → `skills/**/SKILL.md`
7. `AI_ASSISTANT_READ_ME.md` — volatile session snapshot
8. `PRODUCT-KNOWLEDGE.md` — durable validated concepts only
9. Owning Issue / Draft PR

Forbidden as **current** instruction:

- Active `HandOver.md` / `Endorsement.md` as live ledgers
- Parallel Skill namespaces
- `OBSOLETE_FILES.md`
- Numbered/dated handover replacements
- Treating `project-guide/masterplan.md` as a second current Masterplan
- Treating Vercel as the live site

Historical copies belong in `docs/archive/` (and may remain at their original
paths **only** with an explicit HISTORICAL banner). Historical evidence never
overrides current configuration.

---

## 7. Integration and `main`

- `main` changes through governed PRs only.
- Substantive work starts as a **Draft PR**.
- Auto-merge is not used or relied upon.
- One slice is not required to equal one PR or one merge.
- Open PRs #6 and #9 are spatial-validation vehicles. They are not the public
  product revival slice.
- The user/project owner is the final authority for ambiguous architecture.

---

## 8. Hard invariants

1. Trace every change to Product Law → current slice → owning Issue/PR.
2. Do not move identity, authorization, or durable listing truth into
   presentation code.
3. Do not weaken validators merely to obtain green CI. Classify tests as
   retained, obsolete, or replaced before changing assertions.
4. Do not bulk-rename, bulk-delete, or “modernize” the archive.
5. Never expose secrets.
6. Distinguish source, generated, historical, and temporary artifacts.
7. UI/DOM counts are not room/object counts.
8. A Grok workspace must not silently become a second repository authority.
9. Do not restore Vercel as HomeFinder production.

---

## Canonical document relationship

```
Product_Law/PRODUCT_LAW.md
        ↓
Product_Law/WIRING.md
        ↓
Masterplan/MASTERPLAN.md
        ↓
Masterplan/NEXT_SLICES.md   ← exactly one current slice
        ↓
POLICY.md / ORUCAVEAM
        ↓
docs/SKILL_WIRING.md → skills/**/SKILL.md
        ↓
owning Issue / Draft PR → implementation → verification
```

`CODING-INSTRUCTIONS.md` and `MASTER_SKILL.md` remain historical/companion
engineering manuals. They do not outrank this file.
