# POLICY — ORUCAVEAM execution discipline

**Role:** execution policy only. Product meaning belongs to
`Product_Law/PRODUCT_LAW.md`. Procedures belong to `skills/**/SKILL.md`.
Current slice belongs to `Masterplan/NEXT_SLICES.md`.

Adapted from TeamAi POLICY. HomeFinder does **not** import TeamAi advisory
reviewer slots, OpenRouter sequences, or Seat/Firestore commerce workflows.

## ORUCAVEAM

`O → R → U → C → A → V → E → A → M`

- **O — Objective:** exact authorized outcome.
- **R — Restrictions:** protected boundaries (SH3D, House 2↔3, no auto-merge,
  Vercel is not production).
- **U — User Authority:** owner decision and explicit permission.
- **C — Canonical Authority:** Product Law, then current slice, then owning Issue.
- **A — Action:** smallest coherent change.
- **V — Verification:** test the behavior actually claimed.
- **E — Efficiency:** no duplicate ledgers, no speculative refactors.
- **A — Audit:** reconcile code, contracts, Skills, and evidence.
- **M — Minimalistic Efficiency:** evidence surface no larger than required.

Flashlight-method rules in the historical README map onto ORUCAVEAM. Do not
keep a second named execution doctrine.

## Governance

- `Product_Law/PRODUCT_LAW.md` is the single product authority.
- `Product_Law/WIRING.md` owns field purposes only.
- `Masterplan/MASTERPLAN.md` is the ordered checklist (backend → frontend → polish).
- `Masterplan/NEXT_SLICES.md` is exactly one current slice with six required
  sections: Role, Current Slice, Status, Objective, Dependencies, Verification.
- `tools.md` is the operational tool registry.
- `docs/SKILL_WIRING.md` owns Skill routing.
- Reusable procedures live only under `skills/**/SKILL.md`.
- `AI_ASSISTANT_READ_ME.md` owns current session, recovery, and validation-change
  guidance.
- `PRODUCT-KNOWLEDGE.md` owns durable validated concepts only.
- `docs/archive/` is historical storage.
- `docs/evidence/` holds **new** evidence after the 2026-09-29 unfreeze.
- Active `HandOver.md`, active `Endorsement.md`, a parallel Skill namespace, and
  `OBSOLETE_FILES.md` are forbidden as current instruction.

## Canonical public live-site validation

For public live website testing, use only
`https://RbrtMrlsIII.github.io/HomeFinder-Official/`.
Preserve the `HomeFinder-Official` path casing in recorded evidence. Browser
hostname lowercasing is normal URL handling.

**Vercel and guessed/retired routes are not live acceptance targets.**
Grok preview is revival evidence, not production acceptance. Public live-site
validation is evidence only and does not change Product Law or promotion status.

## PR discipline

- Substantive work starts as a **Draft PR**.
- Required checks run on Draft PRs.
- **Ready for review** is a promotion action after exact-head substantive
  validation succeeds. It is not merge authorization.
- **Auto-merge is not used or relied upon.**
- A PR may contain multiple commits.
- One slice is not required to equal one PR or one merge.
- `main` changes through governed PRs only.

## Evidence discipline

`specified ≠ implemented ≠ verified ≠ runtime-proven ≠ completed ≠ accepted`

Public live-site validation uses only the URL named in Product Law. Guessed
routes are not acceptance targets. Grok preview is revival evidence, not
production acceptance.

Validations are **unfrozen**. Historical freeze-era green is not current proof.
Classify tests as retained, obsolete, or replaced before changing assertions.

## Validation-change protocol

When a request conflicts with an existing validation surface:

```text
VALIDATION CHANGE WARNING
Protected old invariant:
Authorized new rule:
Why the old invariant is obsolete/retained:
Replacement invariant:
Implementation impact:
Validation impact:
Evidence/browser impact:
Residual uncertainty:
```

Then: `warning → authority reconciliation → implementation → replacement
validation → verification → evidence → session update`.

Never weaken a validator merely to obtain green CI.

## 2026-09-29 Vercel production retirement

```text
VALIDATION CHANGE WARNING
Protected old invariant: Canonical public live URL is https://home-finder-official.vercel.app
Authorized new rule: Vercel is not a production acceptance target. Canonical public live-site validation is GitHub Pages https://RbrtMrlsIII.github.io/HomeFinder-Official/
Why the old invariant is obsolete: Vercel returns 404 DEPLOYMENT_NOT_FOUND; owner authorized remove Vercel from production on 2026-09-29.
Replacement invariant: GitHub Pages is the public live-site validation target. Firebase Hosting remains undeployed until web/3D integration is independently proven. Grok App Builder is a revival vehicle, not GitHub main.
Implementation impact: index.html landing, github-pages.yml, Product Law §5.1, no vercel.json
Validation impact: authority-chain forbids vercel.json and requires the Pages URL in Product Law
Evidence/browser impact: Pages HTTP 200 is runtime proof only after merge + owner-enabled github-pages environment
Residual uncertainty: Pages environment enablement requires repository admin (RbrtMrlsIII); Tenaj36 and teamaiofficialph have write, not admin
```

## 2026-09-29 validation unfreeze

```text
VALIDATION CHANGE WARNING
Protected old invariant: 5.5G.6C protected-logic freeze and Endorsement.md checklists are live blockers
Authorized new rule: Validations are unfrozen. Produce new evidence. Historical freeze/Endorsement remain evidence, not current instruction.
Why the old invariant is obsolete: Owner authorized revival, chronological masterplan rebuild, and new evidence on 2026-09-29.
Replacement invariant: Classify tests as retained, obsolete, or replaced before changing assertions. Never weaken a validator to obtain green CI.
Implementation impact: MASTERPLAN rebuilt backend→frontend→polish; tools.md; docs/evidence/; gap Issues
Validation impact: authority-chain requires tools.md and a backend-first MASTERPLAN
Evidence/browser impact: Grok preview is revival evidence; Pages HTTP 200 waits on owner enablement
Residual uncertainty: live Firebase/Supabase/PayPal and SH3D portal proof are successor slices
```

## 2026-10-04 Cloudflare retirement; Supabase Edge bridge

```text
VALIDATION CHANGE WARNING
Protected old invariant: Cloudflare owns DNS/WAF/TLS when an executable Worker exists; the PayPal + Cloudflare edge contract and its tests
Authorized new rule: Cloudflare is not used by HomeFinder. Supabase Edge Functions are the single trusted path connecting Firebase (identity + domain state) and PayPal (provider state), end to end.
Why the old invariant is obsolete: Project owner decision on 2026-10-04. tools.md already recorded Cloudflare as dormant until an executable Worker exists.
Replacement invariant: Firebase ID token -> Edge Function -> PayPal API/webhook (signature-verified, idempotent) -> Firestore entitlement through a scoped service account. Provider state != admin smoke-test. Browser approval never grants entitlement. Secrets live only in Edge secrets, never git.
Implementation impact: tools.md, MASTERPLAN sections 3-4, WIRING, AI_ASSISTANT_READ_ME; Issues #15 #21 #22 #24 #25
Validation impact: paypal-cloudflare-contract, patch-26-paypal-cloudflare-hardening, patch-12-integration-hardening must be classified retained/obsolete/replaced (Issue #25); replacement Edge-bridge contract tests are added under #15. Archive evidence is not deleted. No assertion is weakened to obtain green CI.
Evidence/browser impact: none until the bridge is proven in PayPal Sandbox
Residual uncertainty: Supabase project of record (#21); HomeFinder webhook registration at PayPal; retirement timing of the Cloud Function webhook
```
