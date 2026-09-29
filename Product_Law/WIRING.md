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
| Spatial / 3D | Canonical SH3D, three-house topology, cameras, portals, walk presentation |
| Frontend & Experience | Public product UI, role chrome, market, wanted, finance, broker HQ |
| Backend, Identity & Security | Auth, session, role, listings durability, bans, phone/ID verification |
| Application Integration & Contracts | Firebase, Supabase, Cloudflare, PayPal, government URLs |
| Verification & CI/Browser | Tests, governance integrity, browser evidence, promotion evidence |
| Documentation, Knowledge & Session | Session snapshot, PRODUCT-KNOWLEDGE, skill routing |
| Recovery, History & Reconciliation | Archives, original zip/package, historical hashes, restoration |
| Delivery & Operations | Vercel, Firebase Hosting, Grok preview as revival vehicle only |

## Canonical field companions

| Concern | File |
|---|---|
| Ordered checklist | `Masterplan/MASTERPLAN.md` |
| Current slice | `Masterplan/NEXT_SLICES.md` |
| Execution policy | `POLICY.md` |
| Session snapshot | `AI_ASSISTANT_READ_ME.md` |
| Durable concepts | `PRODUCT-KNOWLEDGE.md` |
| Skill routing | `docs/SKILL_WIRING.md` |
| Protected model | `master/HomeFinder.sh3d` |
| Historical continuity | `docs/archive/continuity/` and bannered `project-guide/` files |

## Authority boundaries

- Presentation code must not self-attest identity or authorization.
- SH3D must not grant roles.
- Grok App Builder must not mutate `master/HomeFinder.sh3d`.
- Vercel 404 is delivery evidence, not a license to fork Product Law.
- PRs #6 and #9 remain spatial-validation vehicles under Recovery / Spatial.
  They are not the current public-revival slice.

## No parallel authority

Do not add a live `HandOver.md` ledger, a second Masterplan, or a second
current slice. Flashlight-method rules in the root README are execution
hygiene; they are implemented as ORUCAVEAM in `POLICY.md`.
