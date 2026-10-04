# Evidence — reconciliation census (2026-10-04)

**Grade vocabulary:** *observed* = tool or probe output on this date · *source-read* = read in
the repository, not executed against live services · *not proven* = listed at the end.
No secret values are recorded here. Every connector call was read-only; on the LIVE PayPal
account only list/get calls were made.

**Method:** Composio read-only calls (GitHub, Supabase, PayPal, Firebase) · unauthenticated
`curl` status probes from a sandbox · fresh clone of revival branch `ae02df2` ·
Node 20 `node` / `node --test` · the uploaded Grok workspace zip (file reads only).

## Findings

| # | Finding | Grade | Issue |
|---|---|---|---|
| E1 | `main` = `1a101c8` (2026-09-01). Revival tip `ae02df2` (2026-09-29). No commits, workflow runs, or Issues between 2026-09-29 and 2026-10-04. | observed | #10 |
| E2 | Pages API: `build_type: workflow`, `status: built`, HTTPS enforced, public. A `github-pages` deployment record exists (2026-09-29). | observed | #19 |
| E3 | `GET https://rbrtmrlsiii.github.io/HomeFinder-Official/` → **200 text/html**, but the body is the legacy `main` meta-refresh to the SH3D viewer, not the revival landing. `github-pages.yml` exists only on the revival branch. | observed | #19, #26 |
| E4 | `https://home-finder-official.vercel.app/` → 404. The repository `homepage` field still holds that URL. | observed | #19 |
| E5 | Supabase: HomeFinder project (ap-southeast-1) **INACTIVE**; TeamAi project (ap-southeast-2) ACTIVE_HEALTHY. The HomeFinder host has **no DNS record** (a POST probe fails to resolve). `supabase-config.ts` defaults to the paused project. | observed | #21 |
| E6 | HomeFinder project lists `get-kyc-signed-url` (v19) and `upload-kyc-document` (v4), last updated mid-Aug 2026. `upload-listing-image` is **not deployed**. The TeamAi project lists 10 functions, all `teamai-*`. | observed | #14, #21 |
| E7 | PayPal is **LIVE**. One product, three plans (two ACTIVE, one INACTIVE). The plan hard-coded in `payment-config.js` is ACTIVE: ₱0 for 3 months, then ₱4,999.99/year, ₱499.99 setup. The other ACTIVE plan is referenced nowhere in the repo. | observed | #15 |
| E8 | Exactly one webhook on the connected PayPal app (71 event types). Its URL is a `teamai-paypal-webhook…` function on the TeamAi Supabase project. No HomeFinder webhook is visible from this app. Whether HomeFinder's client ID belongs to this same app is unverified. | observed | #15 |
| E9 | Composio's Firebase toolkit is the Auth client bound to `team-ai-official`; the project-config call returned 403. No Firestore or Functions admin tool is connected. | observed | #23 |
| E10 | Edge functions: CORS reflects the request `Origin`; token verified but no suspension check (Cloud Functions have `requireActiveUser`); two KYC signing paths; raw storage errors returned; KYC upload uses `x-upsert`; 12 MB cap only. | source-read | #24 |
| E11 | The bootstrap admin UID appears in 7 files (rules, Cloud Functions, three KYC-contract copies, `js/admin-uid.js`, one verify script). | source-read | #12 |
| E12 | Boosts: 5 seeker + 5 owner Hosted-Button packages and a ₱99.99 help button; orders are recorded `pending_payment`; no server-side payment verification. | source-read | #22 |
| E13 | Grok workspace: TanStack Start + React, 12 mock listings, role selector, zustand `homefinder.revival.v1`, Auth OFF / DB OFF, three-house walk. The scaffold also carries Better Auth, PGlite/Neon, `vercel.json`, and `.vercel/` output. | observed (files) | #26 |
| E14 | Package frontend: 12 HTML pages, 123 JS modules, 37 exported Cloud Functions, 35 rules `match` blocks, Firestore named database `homefinder`. The 12 pages contain no root-relative `src`/`href`. | observed (files) | #26, #13 |

## Test baseline (Node 20, no browser)

| Suite | Result |
|---|---|
| `verify/**` (18 scripts, static contract checks) | **17 pass**, 1 fail (`verify/data/canonical-listings.mjs`: stale path `docs/contracts/data/canonical-data.json`) |
| `active_development/tests` (94 files), cwd = repo root | 52 pass, 42 fail |
| same files, cwd = `active_development/` (the cwd the tests assume) | **74 pass**, 20 fail |
| the 20 remaining failures | 17 missing/moved files · 1 missing `docs/dictionary/INDEX.json` · 1 assertion drift (`patch-18`) · 1 test-source defect (`patch-29`: invalid regex literal) |
| Cloudflare-named tests (`paypal-cloudflare-contract`, `patch-26-paypal-cloudflare-hardening`, `patch-12-integration-hardening`) | pass today; to be reclassified under #25 |

A pass here means the static contract held. It is not runtime proof of any live service.
Browser (Playwright) specs were not run.

## Not proven

Live Firebase rules/data/functions · Supabase buckets and RLS (project paused) · HomeFinder
PayPal webhook registration · the revival landing on Pages · SH3D portals · browser specs.

## Reproduce

`git clone --branch governance/revival-orucaveam-2026-09-29` · `node scripts/governance/verify-authority-chain.mjs`
· `for f in verify/**/*.mjs; do node "$f"; done` · from `active_development/`: `node --test tests/<file>`
· Composio: GitHub Pages site + latest build, Supabase project/function lists, PayPal plan/product/webhook lists.
