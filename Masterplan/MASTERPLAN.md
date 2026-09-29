# MASTERPLAN — HomeFinder chronological checklist

**Role:** durable ordered checklist. Current execution frontier belongs only in
`NEXT_SLICES.md`.

Historical architecture narrative remains in `project-guide/masterplan.md`
(bannered HISTORICAL for *current instruction*; the file is still evidence).

A `☑️` means implemented, independently verified, documented in the session
snapshot, and present on the **accepted** checkpoint. Partial work stays unchecked.

`specified ≠ implemented ≠ verified ≠ runtime-proven ≠ completed ≠ accepted`

**Chronology:** governance → backend identity → durable data → trusted edge →
payments/network → spatial model → frontend product → new evidence → delivery →
polish. Do not invert this order to chase a green UI.

**Validation unfreeze (2026-09-29):** the 5.5G.6C protected-logic freeze and the
historical Endorsement ledger are **not live blockers**. Produce **new** evidence
for each remaining item. Do not weaken validators to obtain green CI. Classify
old tests as retained, obsolete, or replaced before changing assertions.

Owning Issues for remaining work are listed beside the open items. They are
**not** the current slice unless `NEXT_SLICES.md` names them.

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
- [ ] GitHub Pages default-branch deploy HTTP 200 (runtime-proven). Owner must enable the `github-pages` environment.

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

**Open — new evidence required (Issue HF-BE-001):**

- [ ] Audit PH 12-digit phone (`639XXXXXXXXX`) against live Firebase Auth + `users/{uid}` writes.
- [ ] Audit timeout penalties, banned-account handling, and account-creation abuse controls against actual rules/functions — not docs.
- [ ] Prove logout cache-clear and authorization-source separation with a fresh test, not the freeze-era suite.

---

## 2 — Backend · durable listings and profiles

Firebase project `homefinder-official`, named database `homefinder`.
Canonical collections: `propertyListings`, `wantedListings`, `users`, `publicProfiles`.
Cloud Functions own trusted mutations and projections. Client UI must not impersonate server authority.

**Retained:**

- [x] ☑️ Data contract named (`docs/json/data-contract.json`, `docs/json/firebase/`).
- [x] ☑️ Firestore rules and indexes live under `active_development/firebase/` (not under docs).
- [x] ☑️ Functions exist: public-profile projection, broker-HQ discovery projection, KYC contracts, tiers.

**Open — new evidence required (Issue HF-BE-002):**

- [ ] Re-verify security rules/authorization boundaries against the current role model with a fresh rules test.
- [ ] Re-verify listings/wanted durability and public-profile projection on the live named database.
- [ ] Do not treat Grok `localStorage` (`homefinder.revival.v1`) as listing truth.

---

## 3 — Backend · trusted edge (Supabase)

Supabase is the **trusted server/storage boundary** (KYC signed URLs, listing image upload, storage SQL).
It must consume Firebase identity. It is **not** HomeFinder domain authority.

**Open — new evidence required (Issue HF-BE-003):**

- [ ] Census live Edge functions vs `active_development/supabase/functions/` (replace stale census).
- [ ] Prove KYC upload/read is admin-gated and seeker/owner cannot self-escalate.
- [ ] Prove listing-image upload cannot write property documents.

---

## 4 — Backend · payments and network edge

PayPal owns provider subscription state. Cloudflare owns DNS/WAF/TLS when an executable Worker exists.
MapLibre is presentation only.

**Open — new evidence required (Issue HF-BE-004):**

- [ ] Preserve: real PayPal provider state ≠ admin smoke-test entitlement. Smoke-test must not overwrite provider state.
- [ ] Preserve: webhook processing/processed/failed, retry-safe, no duplicate side effects.
- [ ] Preserve: browser approval callback identifies a subscription; it does not grant entitlement.
- [ ] Do not invent a Cloudflare Worker or guess DNS/TLS values.
- [ ] Secrets never in git.

---

## 5 — Spatial · physical model (SH3D)

`master/HomeFinder.sh3d` is the single canonical physical model.
Walking never changes role.

**Retained:**

- [x] ☑️ WalkMyPlan retired as runtime/spatial authority.
- [x] ☑️ House 1 / House 2 / House 3 allocated and promoted into `master/HomeFinder.sh3d`.
- [x] ☑️ No direct House 2 ↔ House 3 portal in the canonical model.
- [x] ☑️ Single SH3D authority; noncanonical SH3Ds have no runtime dependency.

**Open — new evidence required (Issue HF-3D-001). Unfrozen; not the current slice:**

- [ ] Identify and prove House 1 ↔ House 2 physical portal, clearance, camera continuity; promote runtime route only if evidence passes.
- [ ] Identify and prove House 1 ↔ House 3 physical portal, clearance, camera continuity; promote runtime route only if evidence passes.
- [ ] Re-prove no House 2 ↔ House 3 direct route after any portal work.
- [ ] Do not mutate `master/HomeFinder.sh3d` until those gates pass.

---

## 6 — Frontend · public product

Logical destinations ≠ physical doors. Role chrome is application state.

**Retained / this revival vehicle:**

- [x] ☑️ Government accessibility for guests and authenticated roles (package).
- [x] ☑️ Save Property / Wanted Listings counterpart logic (package).
- [x] ☑️ Grok preview: market, listing detail, wanted, finance, saved, orbit home, FPS walk, Broker HQ application gate (workspace; not `main`).

**Open — new evidence required (Issue HF-FE-001):**

- [ ] Reconcile logical intent → semantic destination → physical zone → eligible portal → route/camera.
- [ ] Keep logical destinations distinct from physical doors.
- [ ] Validate role-specific visibility against protected contracts (broker HQ vs seeker/owner vs guest).
- [ ] Validate responsive UI against spatial presentation density.

---

## 7 — Verification · unfrozen evidence

Old freeze-era suites are historical. New evidence replaces them; they are not deleted.

**Retained:**

- [x] ☑️ Historical UI/DOM census, WalkMyPlan test migration, and failure classification exist as archive.

**Open — new evidence required (Issue HF-QA-001):**

- [ ] Authority-chain check PASSes on the exact Draft-PR head (includes `tools.md`).
- [ ] Grok preview: listings render; Broker HQ role-gated; no House 2↔3 door in the walk world.
- [ ] GitHub Pages HTTP 200 with the revival landing after `main` deploy (runtime-proven).
- [ ] Classify package `verify/**` tests as retained / obsolete / replaced before changing assertions.
- [ ] Never weaken a validator merely to obtain green CI.

---

## 8 — Delivery

- [x] ☑️ Vercel production URL retired. Do not restore `home-finder-official.vercel.app`. No `vercel.json` in this package.
- [x] ☑️ GitHub Pages named as public live-site target; landing + workflow on revival branch.
- [ ] GitHub Pages runtime-proven on `main` (Issue HF-OPS-001 — owner enables `github-pages` environment).
- [ ] Do not deploy Firebase Hosting while web/3D integration is incomplete.
- [ ] Grok App Builder deploy is not HomeFinder production.

---

## 9 — Polish (after 1–8 have current evidence)

Issue HF-POLISH-001. Not the current slice.

- [ ] Door animation / traversal integration.
- [ ] Responsive spatial/UI integration.
- [ ] End-to-end frontend ↔ spatial ↔ backend validation on accepted hosting.
- [ ] Repository cleanup (no bulk delete of archive).
- [ ] Production 3D polish against the canonical SH3D.
- [ ] Final production/deployment gate (owner).
