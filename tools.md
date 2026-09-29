# HomeFinder tool registry

**Role:** what each tool is for, what it may own, and what it must not become.
A tool being connected or capable does **not** make it authoritative.

Adapted from TeamAi `tools.md` **shape**, not TeamAi product meaning.
HomeFinder does not import Seat/Firestore commerce, OpenRouter reviewer slots,
or TeamAi hosting.

**Status date:** 2026-09-29 (HF-REVIVAL-001)

```text
capability != authorization
identity != authorization
walking != role change
Grok workspace != GitHub main
GitHub Pages HTTP 200 != product acceptance
CI green != production proof
docs != live rules
admin smoke-test != PayPal provider state
Supabase storage != listing truth
Firebase Hosting undeployed != "use Vercel"
```

Lifecycle: **ACTIVE** · **AVAILABLE BUT DORMANT** · **NOT CONNECTED** · **RETIRED**.

---

## GitHub

**Status:** ACTIVE — source/change/governance authority.

**Do:** source, branches, Draft PRs, reviews, Issues, Actions evidence, exact-head checks.
**Don't:** application database, secret store, production proof by itself, auto-merge.

Connected login for this revival: `Tenaj36` (write). Also write: `teamaiofficialph`.
Owner/admin: `RbrtMrlsIII`. Pages environment enablement is admin-only.

Canonical repo: `RbrtMrlsIII/HomeFinder-Official`.
Public live-site path: `https://RbrtMrlsIII.github.io/HomeFinder-Official/`

## GitHub Pages

**Status:** ACTIVE as the **specified** public live-site host. Implemented on the
revival branch. **Not runtime-proven** until a `main` deploy returns HTTP 200.

**Do:** serve the landing + (later) a delivery copy of SH3D/runtime assets.
**Don't:** mutate Product Law, authorize SH3D edits, or stand in for Firebase data.

## Grok App Builder workspace

**Status:** ACTIVE as a **revival vehicle** only.

**Do:** walkable public catalog, preview evidence, localStorage demo persistence.
**Don't:** become a second repository authority; mutate `master/HomeFinder.sh3d`;
count as HomeFinder production hosting; enable Auth/DB in this slice.

## Vercel

**Status:** RETIRED as HomeFinder production.

Former URL `https://home-finder-official.vercel.app` → 404 DEPLOYMENT_NOT_FOUND
(2026-09-29). Do not restore. Do not add `vercel.json` to this package.

(Grok platform may still deploy *its* workspace to Vercel. That is not this
package's production.)

## Firebase Authentication

**Status:** ACTIVE in the package as **identity authority**. Not wired in the
Grok revival (Auth OFF).

**Do:** signed-in identity, phone (`639XXXXXXXXX`), session.
**Don't:** let presentation, SH3D, or cached `canonicalRole` authorize.

Project: `homefinder-official`.

## Cloud Firestore

**Status:** ACTIVE in the package as **domain-state authority**. Dormant in Grok
revival.

Named database: `homefinder`.
Collections: `propertyListings`, `wantedListings`, `users`, `publicProfiles`.

**Do:** durable listings, wanted posts, user docs, public profiles.
**Don't:** store secrets; let clients write tier/boost/KYC/admin fields;
treat Grok `localStorage` as this store.

Rules: `active_development/firebase/firestore.rules`.
Indexes: `active_development/firebase/firestore.indexes.json`.

## Firebase Cloud Functions

**Status:** ACTIVE in the package as trusted mutations/projections.

Known functions: public-profile projection, broker-HQ discovery projection,
KYC contracts, tiers/backfill.

**Do:** server writes that rules forbid to clients.
**Don't:** let `admin.html` hard-coded UID bypass become the production
authorization story without a fresh audit (flagged HF-BE-001).

## Firebase Hosting

**Status:** AVAILABLE BUT DORMANT. **Do not deploy** until web/3D integration
is independently proven.

**Don't:** use it to paper over the Vercel 404.

## Supabase (Edge Functions + Storage + SQL)

**Status:** ACTIVE in the package as **trusted edge / storage**, not domain
authority. Must consume Firebase identity.

Functions in tree: `upload-kyc-document`, `get-kyc-signed-url`, `upload-listing-image`.

**Do:** KYC blobs, listing images, signed URLs.
**Don't:** become listing truth; allow KYC self-escalation; hold PayPal secrets
in client config.

## PayPal

**Status:** AVAILABLE — package has a hardened boundary; **not runtime-proven**
in this revival.

**Do:** real provider subscription state; retry-safe webhooks
(processing/processed/failed); bind provider identity to the signed-in
HomeFinder account.
**Don't:** let admin smoke-test overwrite provider state; let a browser
return URL grant entitlement; commit client/secret/webhook IDs.

## Cloudflare

**Status:** AVAILABLE BUT DORMANT until an executable Worker exists.

**Do:** DNS/WAF/TLS only from observed config.
**Don't:** invent a Worker; guess records; treat docs as live routing.

## Sweet Home 3D (`master/HomeFinder.sh3d`)

**Status:** ACTIVE — **physical/presentation authority**.

**Do:** rooms, walls, doors, cameras, walkable presentation.
**Don't:** grant roles; be silently copied into a second live authority;
be mutated until portal gates have new evidence.

A GitHub Pages **delivery copy** is allowed. It is not a second authority.

## MapLibre / icon libraries

**Status:** ACTIVE as presentation.

**Don't:** become business-data authority.

## Browser / Playwright evidence

**Status:** ACTIVE as presentation/integration evidence.

**Don't:** close an Issue or change Product Law by screenshot alone.

## Python / XML census of SH3D

**Status:** ACTIVE as independent geometry verification.

**Don't:** replace runtime walk proof.

---

## Recording a new tool

Add a section with: status, authority, do, don't, security, current proof grade.
Do not add a tool to production merely because it is connected.
