# WIRING — HomeFinder field map

**Role:** navigation and field-ownership map for `Product_Law/`. This file does
not create a second Product Law.

## Canonical Product Law root

`Product_Law/PRODUCT_LAW.md`

## Current execution routing

Consume `Masterplan/NEXT_SLICES.md` as the only current slice. Do not hard-code
an Issue number here as authority.

## Development fields

| Field | Purpose |
|---|---|
| Product & Governance | Product meaning, protected invariants, authority chain, PR discipline |
| Backend, Identity & Security | Auth, session, role, listings durability, bans, phone/ID verification |
| Application Integration & Contracts | Firebase, Supabase (Edge bridge to PayPal), PayPal, government URLs (Cloudflare retired 2026-10-04) |
| Spatial / 3D | Canonical SH3D, three-house topology, cameras, portals, walk presentation |
| Frontend & Experience | Public product UI, role chrome, market, wanted, finance, broker HQ |
| Verification & CI/Browser | Tests, governance integrity, browser evidence, promotion evidence |
| Documentation, Knowledge & Session | Session snapshot, PRODUCT-KNOWLEDGE, skill routing |
| Recovery, History & Reconciliation | Archives, original zip/package, historical hashes, restoration |
| Delivery & Operations | GitHub Pages public live site; Grok preview as revival vehicle only; Vercel retired; Firebase Hosting undeployed |

Field order in this table is the execution order: backend before frontend.

## Canonical field companions

| Concern | File |
|---|---|
| Ordered checklist | `Masterplan/MASTERPLAN.md` |
| Current slice | `Masterplan/NEXT_SLICES.md` |
| Execution policy | `POLICY.md` |
| Tool registry | `tools.md` |
| Session snapshot | `AI_ASSISTANT_READ_ME.md` |
| Durable concepts | `PRODUCT-KNOWLEDGE.md` |
| Skill routing | `docs/SKILL_WIRING.md` |
| Protected model | `master/HomeFinder.sh3d` |
| Public live site | `index.html` + `.github/workflows/github-pages.yml` |
| New evidence | `docs/evidence/` |
| Historical continuity | `docs/archive/continuity/` and bannered `project-guide/` files |

## Authority boundaries

- Presentation code must not self-attest identity or authorization.
- SH3D must not grant roles.
- Grok App Builder must not mutate `master/HomeFinder.sh3d`.
- Vercel is not a production acceptance target.
- GitHub Pages is the public live-site validation reference only. It does not
  create product authority or authorize SH3D mutation.
- PRs #6 and #9 remain spatial-validation vehicles under Recovery / Spatial.
  They are not the current public-revival slice.
- Validations are unfrozen. New evidence replaces freeze-era green.

## Live delivery reference

Canonical public live-site validation target:
`https://RbrtMrlsIII.github.io/HomeFinder-Official/`

## No parallel authority

Do not add a live `HandOver.md` ledger, a second Masterplan, or a second
current slice. Flashlight-method rules in the root README are execution
hygiene; they are implemented as ORUCAVEAM in `POLICY.md`.
