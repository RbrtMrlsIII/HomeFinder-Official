# MASTERPLAN — HomeFinder chronological checklist

**Role:** durable ordered checklist. Current execution frontier belongs only in
`NEXT_SLICES.md`.

Historical architecture narrative remains in `project-guide/masterplan.md`
(bannered HISTORICAL for *current instruction*; the file is still evidence).

A `☑️` means implemented, independently verified, documented in the session
snapshot, and present on the **accepted** checkpoint. Partial work stays unchecked.

`specified ≠ implemented ≠ verified ≠ runtime-proven ≠ completed ≠ accepted`

**Chronology:** governance → backend identity → durable data → trusted edge →
payments bridge → spatial model → frontend product → new evidence → delivery →
polish. Do not invert this order to chase a green UI.

**Validation unfreeze (2026-09-29):** the 5.5G.6C protected-logic freeze and the
historical Endorsement ledger are **not live blockers**. Produce **new** evidence
for each remaining item. Do not weaken validators to obtain green CI. Classify
old tests as retained, obsolete, or replaced before changing assertions.

**Reconciled 2026-10-04.** The live census and a fresh test baseline are in
`docs/evidence/2026-10-04-reconciliation-census.md`. Only what that evidence
changes is edited below; retained ☑️ items are untouched.

Owning Issues are listed beside open items. They are **not** the current slice
unless `NEXT_SLICES.md` names them.

---

## Owner decisions

| ID | Decision | State |
|---|---|---|
| D0 | **Cloudflare is retired.** Supabase Edge Functions connect Firebase and PayPal end to end. | Decided 2026-10-04 (project owner). Docs and tests follow in #25. |
| D1 | Supabase project of record: restore the dedicated HomeFinder project (recommended) or reuse TeamAi's. | **Open** · #21 |
| D2 | Frontend of record and what GitHub Pages serves: package pages (recommended first) or the Grok app. | **Open** · #26 |
| D3 | Firebase evidence path: rules-emulator tests plus an owner-run census (recommended). | **Open** · #23 |

---

## 0 — Governance (HF-REVIVAL-001 / Issue #10)

- [x] ☑️ Install Product Law / Wiring / Masterplan / Next Slices / Policy / Skill wiring (revival branch).
- [x] ☑️ Banner `project-guide/HandOver.md` and `Endorsement.md` as HISTORICAL (revival branch).
- [x] ☑️ Name Issue #10 as the single current slice.
- [x] ☑️ Retire Vercel as a production acceptance target (revival branch).
- [x] ☑️ Name GitHub Pages as the canonical public live-site target (revival branch).
- [x] ☑️ Keep `master/HomeFinder.sh3d` unmodified as source.
- [x] ☑️ Rebuild this checklist chronologically (backend → frontend → polish) and adopt `tools.md`.
- [ ] Draft PR #11 remains Draft until exact-head governance check passes on the new head.
- [ ] Human review + merge to `main` (owner). Not this agent session's acceptance.
- [ ] Review the reconciliation PR stacked on #11 (this file, `tools.md`, the evidence census).
- [ ] Classify and retire Cloudflare across docs, contracts, and tests without deleting history (#25).

---

## 1 — Backend · identity, session, authorization

Application/backend owns identity, session, role, authorization, bans, and
phone/ID verification. Presentation and SH3D must not.

**Retained (package, historical evidence):**

- [x] ☑️ Application/backend authority boundary established.
- [x] ☑️ Canonical role/session authorization contracts exist (`canonicalRole`; legacy `accountType` / `role` / `agent` are not authorization).
- [x] ☑️ Logout must clear role/session cache; cached role is never an authorization source.
- [x] ☑️ Ops split: admin (KYC + final approvals), moderator (listing/payment truth), staff (intake/support).
- [x] ☑️ Broker surfaces constrained to Broker HQ (profile, market, map live in House 2).
- [x] ☑️ Government housing remains guest-visible.

**Open — new evidence required (Issue #12 HF-BE-001; #23, #24):**

- [ ] Audit PH 12-digit phone (`639XXXXXXXXX`) against live Firebase Auth + `users/{uid}` writes.
- [ ] Audit timeout penalties, banned-account handling, and account-creation abuse controls against actual rules/functions — not docs.
- [ ] Prove logout cache-clear and authorization-source separation with a fresh test, not the freeze-era suite.
- [ ] Replace the hard-coded bootstrap admin UID with a role-document or custom-claim path; keep it only as documented break-glass. It appears in 7 files (rules, Cloud Functions, three KYC-contract copies, `js/admin-uid.js`, one verify script); the moderator and staff bootstrap UIDs are hard-coded in the rules as well.
- [ ] `users/{uid}` creation (#29): fixed in the repo rules and proven on the emulator (registration payload, privilege and KYC checks); **not deployed**. Deploying needs owner approval, then a check against the live rules (#23).
- [ ] Registration abuse gate without Cloudflare: Firebase App Check or Edge rate limiting (#24).
- [ ] Firebase proof path: rules-emulator suite plus owner-run census (D3, #23).

---

## 2 — Backend · durable listings and profiles

Firebase project `homefinder-official`, named database `homefinder`
(35 `match` blocks in `firestore.rules`).
Canonical collections: `propertyListings`, `wantedListings`, `users`, `publicProfiles`.
Cloud Functions own trusted mutations and projections. Client UI must not impersonate server authority.

**Retained:**

- [x] ☑️ Data contract named (`docs/json/data-contract.json`, `docs/json/firebase/`).
- [x] ☑️ Firestore rules and indexes live under `active_development/firebase/` (not under docs).
- [x] ☑️ Functions exist: public-profile projection, broker-HQ discovery projection, KYC contracts, tiers.

**Open — new evidence required (Issue #13 HF-BE-002; #23):**

- [ ] Re-verify security rules/authorization boundaries against the current role model with a fresh rules test.
- [ ] Re-verify listings/wanted durability and public-profile projection on the live named database.
- [ ] Do not treat Grok `localStorage` (`homefinder.revival.v1`) as listing truth.
- [ ] Compare the 37 exported Cloud Functions with the deployed set (owner-run census) and confirm the project's billing plan supports them.
- [ ] Negative rules tests: contracts, points ledger, notifications, tier/boost/KYC fields are not client-writable.

---

## 3 — Backend · trusted edge (Supabase)

Supabase is the **trusted server/storage boundary**: KYC signed URLs, listing image
upload, storage SQL, and (D0) the Firebase↔PayPal bridge. It must consume Firebase
identity. It is **not** HomeFinder domain authority.

**Open — new evidence required (Issue #14 HF-BE-003; #21, #24):**

- [ ] Choose and restore the project of record (D1). The repo defaults to `hdeqixswsscyvmziinxt`, which is **paused with no DNS record** (2026-10-04).
- [ ] Live function census equals the tree. Live has 2 of 3 (`get-kyc-signed-url`, `upload-kyc-document`); `upload-listing-image` is not deployed.
- [ ] Read `SUPABASE_URL` from configuration, not a hard-coded default.
- [ ] Prove KYC upload/read is admin-gated and seeker/owner cannot self-escalate.
- [ ] Prove listing-image upload cannot write property documents (source read: no Firestore write path; not runtime-proven).
- [ ] Harden per #24: CORS allowlist, suspension parity, one KYC signing path, error hygiene, rate limits.

---

## 4 — Backend · payments bridge (Supabase Edge ↔ Firebase ↔ PayPal)

**D0:** Cloudflare is retired. Supabase Edge Functions are the only trusted path
between Firebase and PayPal. Firebase ID token in → PayPal API/webhook verified →
entitlement truth written to Firestore through a scoped service account.
PayPal owns provider subscription state. MapLibre is presentation only.

**Preserve (existing invariants):**

- [ ] Real PayPal provider state ≠ admin smoke-test entitlement. Smoke-test must not overwrite provider state.
- [ ] Webhook processing/processed/failed, retry-safe, no duplicate side effects.
- [ ] Browser approval callback identifies a subscription; it does not grant entitlement.
- [ ] Secrets never in git. Edge secrets only.

**Build — new evidence required (Issue #15 HF-BE-004; #22 HF-BE-005):**

- [ ] `paypal-record-approval` Edge function: Firebase-token authenticated; verifies the subscription with PayPal; binds subscription → uid.
- [ ] `paypal-webhook` Edge function: public endpoint; PayPal signature verification; idempotency ledger; subscription → uid → entitlement.
- [ ] The six subscription-path defects (#28) are fixed in the Cloud Function path and proven on the emulator; a seventh, a retry-unsafe webhook ledger transaction, was found and fixed on the way. **Not deployed.** The Edge port must reproduce each fix and pass the same suite in `active_development/tests/emulator/`. Follow-up: pass `custom_id` = uid when the PayPal subscription is created.
- [ ] Make the PayPal API base configurable (sandbox by default); the current code is hard-wired to the live host.
- [ ] Port the entitlement transition logic as pure functions; reuse the existing PayPal tests as the oracle; keep the Cloud Function path until parity is proven, then retire it.
- [ ] Register the HomeFinder webhook (PayPal Sandbox first). Today the only webhook on the connected PayPal app targets a TeamAi Supabase function.
- [ ] Sandbox end-to-end proof: approve → webhook → entitlement; replay-safe; cancel / suspend / expire / payment-failed.
- [ ] Boost and Help payments server-verified (#22).
- [ ] Owner PayPal hygiene: the connected account is **LIVE**; one extra ACTIVE plan is unused; plan names say "Monthly" for a yearly plan.
- [ ] Keep plan facts in sync: ₱499.99 setup, 3 months free, ₱4,999.99/year; plan `P-4NX50080BD8317322NKDAODA` was ACTIVE on 2026-10-04.

---

## 5 — Spatial · physical model (SH3D)

`master/HomeFinder.sh3d` is the single canonical physical model.
Walking never changes role.

**Retained:**

- [x] ☑️ WalkMyPlan retired as runtime/spatial authority.
- [x] ☑️ House 1 / House 2 / House 3 allocated and promoted into `master/HomeFinder.sh3d`.
- [x] ☑️ No direct House 2 ↔ House 3 portal in the canonical model.
- [x] ☑️ Single SH3D authority; noncanonical SH3Ds have no runtime dependency.

**Presentation model (historical evidence, G6E):** the product presents the house through **nine
canonical H-series camera points of view** (H-01 hero, H-02 discovery, H-03 property display,
H-04 map, H-05 government desk, H-06 mission, H-07 guide, H-08 safety, H-09 contact) embedded in
`master/HomeFinder.sh3d` and bound in `active_development/3d/app/homefinder-viewer.js`. H-04 is
presentation-only (no containing room). Camera selection never authorizes roles, auth, KYC,
payments, or physical traversal. Free walking is not part of this model.

**Open — new evidence required (Issue #16 HF-3D-001). Unfrozen; not the current slice:**

- [ ] Identify and prove House 1 ↔ House 2 physical portal, clearance, camera continuity; promote runtime route only if evidence passes.
- [ ] Identify and prove House 1 ↔ House 3 physical portal, clearance, camera continuity; promote runtime route only if evidence passes.
- [ ] Re-prove no House 2 ↔ House 3 direct route after any portal work.
- [ ] Do not mutate `master/HomeFinder.sh3d` until those gates pass.

---

## 6 — Frontend · public product

Logical destinations ≠ physical doors. Role chrome is application state.
The product wiring (Firebase, Supabase, PayPal) lives in the package pages:
12 HTML pages and 123 JS modules in `active_development/`. The Grok app is a
preview vehicle with mock data.

**Retained / this revival vehicle:**

- [x] ☑️ Government accessibility for guests and authenticated roles (package).
- [x] ☑️ Save Property / Wanted Listings counterpart logic (package).
- [x] ☑️ Grok preview: market, listing detail, wanted, finance, saved, orbit home, FPS walk, Broker HQ application gate (workspace; not `main`). The walk is a preview stand-in, not the product's presentation (see §5).

**Open — new evidence required (Issue #17 HF-FE-001; #26 HF-FE-002):**

- [ ] Owner decides the frontend of record and what Pages serves (D2).
- [ ] Audit package JS imports and `fetch` URLs for `/HomeFinder-Official/` sub-path hosting before publishing product pages.
- [ ] Quarantine the Grok scaffold's Better Auth / PGlite / Neon and Vercel build output; none may become authority.
- [ ] Reconcile logical intent → semantic destination → physical zone → eligible portal → route/camera.
- [ ] Keep logical destinations distinct from physical doors.
- [ ] Validate role-specific visibility against protected contracts (broker HQ vs seeker/owner vs guest).
- [ ] Validate responsive UI against spatial presentation density.
- [ ] Prove each surface in the feature ledger below on the chosen frontend.

---

## 7 — Verification · unfrozen evidence

Old freeze-era suites are historical. New evidence replaces them; they are not deleted.

**Baseline 2026-10-04 (Node 20, no browser):**

- `verify/**`: 17 of 18 pass (static contract checks). The failure is a stale path to `docs/contracts/data/canonical-data.json`.
- `active_development/tests` (94 files): 52 pass from the repo root; **74 pass from `active_development/`**, the cwd these tests assume. The other 20: 17 missing or moved files, 1 missing dictionary index, 1 assertion drift, 1 test-source defect (invalid regex).

**Emulator smoke (secretless, 2026-10-05):** 67 tests — all pass, 0 todo, stable over 3 consecutive runs (#28, #29 fixed in repo code; not deployed). It runs the real Cloud Function handlers and the real rules on the local Firestore emulator with PayPal mocked, and refuses to start if any credential is present. CI runs it with no secrets (`emulator-smoke.yml`).

**Retained:**

- [x] ☑️ Historical UI/DOM census, WalkMyPlan test migration, and failure classification exist as archive.

**Open — new evidence required (Issue #18 HF-QA-001; #23, #25):**

- [ ] Run the suite from the package root in CI; classify the 20 failures retained / obsolete / replaced before touching assertions.
- [ ] Authority-chain check PASSes on the exact Draft-PR head (includes `tools.md`).
- [ ] Grok preview: listings render; Broker HQ role-gated; no House 2↔3 door in the walk world.
- [ ] Rules-emulator suite for the role model, phone index, suspension, and subscription collections (#23). The payment collections are covered; the rest is open.
- [ ] Edge-bridge contract tests added; Cloudflare-named tests reclassified (#25).
- [ ] Playwright browser specs run against the Pages URL; screenshots are evidence, not closure.
- [ ] Keep the emulator suite as the oracle for the Edge port; never weaken an assertion to turn it green.
- [ ] Never weaken a validator merely to obtain green CI.

---

## 8 — Delivery

- [x] ☑️ Vercel production URL retired. Do not restore `home-finder-official.vercel.app` (404 re-observed 2026-10-04). No `vercel.json` in this package.
- [x] ☑️ GitHub Pages named as public live-site target; landing + workflow on revival branch.

**Observed 2026-10-04:** Pages source is GitHub Actions (`build_type: workflow`), status built,
`github-pages` environment exists. The URL returns HTTP 200 but serves the **legacy `main`
redirect page**: `github-pages.yml` exists only on the revival branch.

- [ ] Put the workflow on `main` (merge PR #11 or a workflow-only PR), then probe for HTTP 200 **and** the revival landing (Issue #19 HF-OPS-001).
- [ ] Owner: update the repository homepage field (still the retired Vercel URL).
- [ ] Decide what the artifact serves beyond landing + 3D viewer (D2, #26).
- [ ] Do not deploy Firebase Hosting while web/3D integration is incomplete.
- [ ] Grok App Builder deploy is not HomeFinder production.

---

## 9 — Polish (after 1–8 have current evidence)

Issue #20 HF-POLISH-001. Not the current slice.

- [ ] Door animation / traversal integration.
- [ ] Responsive spatial/UI integration.
- [ ] End-to-end frontend ↔ spatial ↔ backend validation on accepted hosting.
- [ ] Repository cleanup (no bulk delete of archive; 14 stale branches, `.cp07-backup` files).
- [ ] Production 3D polish against the canonical SH3D.
- [ ] Final production/deployment gate (owner).

---

## Feature ledger (package)

Named in source files and functions; behavior is **not** verified. Each row must
earn evidence in its phase.

| Surface | Feature | Authority | Phase |
|---|---|---|---|
| Public | Home/discovery, government housing (guest-visible), guides, privacy/terms | static + government URLs | 6 |
| Account | Register/login, PH phone, session, logout cache clear | Firebase Authentication + `users`, `phoneIndex` | 1 |
| Roles | Seeker, owner, broker; admin, moderator, staff | `canonicalRole` in Firestore, rules + Functions | 1 |
| Market | Search/filter, pins + radius + cooldown, map | `propertyListings`, `listingStats` | 2, 6 |
| Listings | Create/edit, per-tier image caps, images | Functions + Supabase `listing-images` | 2, 3 |
| Wanted / saved | Post, save, match notifications | `wantedListings`, Functions | 2 |
| Contracts | Create, agree/decline, confirm, renew, expire | `contracts`, Functions | 2 |
| Messaging | Conversations, notifications | `conversations`, `notifications/{uid}/items` | 2 |
| Trust | Reviews, ratings, commendations, reports, blocks | Firestore + Functions | 2 |
| Tiers / points | Perks, tier progression, points ledger | `tiers.js`, points ledger | 2 |
| KYC | ID / broker-licence upload, admin review | Supabase private bucket + Firestore reference index | 3 |
| Subscription | Annual plan (₱499.99 setup, 3 months free, ₱4,999.99/yr) | PayPal → Edge bridge → `subscriptionEntitlements` | 4 |
| Boosts / help | 10 Boost packages, ₱99.99 listing help | PayPal Hosted Buttons → `boostOrders` | 4 |
| Broker HQ | Discovery, workspace, service radius | Functions (`brokerHQDiscoveryProjection`) | 2, 6 |
| Operations | Admin (users, KYC, orders, reports, tickets, grants), moderator, staff | rules + Functions | 1, 6 |
| Spatial | Three-house world, portals, camera | `master/HomeFinder.sh3d` | 5 |

---

## Issue index

| Issue | Phase | Topic |
|---|---|---|
| #10 / PR #11 | 0 | HF-REVIVAL-001 governance revival |
| #12 | 1 | HF-BE-001 identity, session, PH phone, bans |
| #13 | 2 | HF-BE-002 Firestore listings/wanted durability |
| #14 | 3 | HF-BE-003 Supabase KYC/storage trusted edge |
| #15 | 4 | HF-BE-004 PayPal ↔ Firebase via Supabase Edge bridge |
| #16 | 5 | HF-3D-001 House 1↔2 and 1↔3 portal certification |
| #17 | 6 | HF-FE-001 logical destinations vs physical model |
| #18 | 7 | HF-QA-001 unfrozen validation |
| #19 | 8 | HF-OPS-001 GitHub Pages runtime proof |
| #20 | 9 | HF-POLISH-001 polish and cleanup |
| #21 | 3 | HF-OPS-002 Supabase project of record (D1) |
| #22 | 4 | HF-BE-005 Boost/Help payment verification |
| #23 | 1, 2, 7 | HF-BE-006 Firebase evidence path (D3) |
| #24 | 1, 3 | HF-SEC-001 Edge and registration hardening |
| #25 | 0, 7 | HF-GOV-001 Cloudflare retirement (D0) |
| #26 | 6, 8 | HF-FE-002 frontend of record and Pages delivery (D2) |
| #28 | 4 | HF-BE-007 subscription-path defects proven on the emulator |
| #29 | 1 | HF-BE-008 repo rules deny every `users/{uid}` self-create |
