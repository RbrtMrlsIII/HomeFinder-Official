# E5 — Validation Evidence — 2026-09-01

## Gate
E5 — Canonical Artifact & Build Provenance

## Validation principle
Provenance records must be tied to exact source state and must preserve the distinction between artifact production, build/deployment status, runtime validation, and endorsement.

## GitHub evidence

**Workflow:** `HomeFinder P04 Spatial Visual Verification`  
**Run:** `33451823171`  
**Head commit:** `5c9903113010d88c6a91677dc3709552bc297ed0`  
**Branch:** `p04/glb-runtime-restored-2026-09-01`  
**Conclusion:** `failure`

Job `99683217304` completed setup successfully through:
- checkout
- Node setup
- external Three.js dependency preflight
- browser-test dependency installation
- Chromium installation

The focused P04 browser validation step failed. The Playwright evidence upload step succeeded.

Artifact:
- id `9780126370`
- name `homefinder-p04-playwright-report`
- size `2,153,255` bytes
- SHA-256 `d4e59131592c7af694b222726c603c3fa5683cf392cd1e876953632402cdec67`

**Interpretation:** the artifact is valid provenance/evidence output for a failed runtime-validation attempt. It is not proof that the GLB viewer passed.

## Vercel evidence

**Project:** `home-finder-official`  
**Project ID:** `prj_RAMdD7obaecLEPjD7cK12eFXYV3Q`  
**Deployment:** `dpl_5Fi2KT76WLu7zUFH1wcu3yPPU6Nj`  
**State:** `READY`  
**Repository:** `RbrtMrlsIII/HomeFinder-Official`  
**Branch:** `p04/glb-runtime-restored-2026-09-01`  
**Source commit:** `d2149c79d8197d6ee7879f9ad677bd959808db7f`

**Interpretation:** Vercel proves a deployment reached READY for the recorded commit/ref. It does not prove browser, GLB, camera, scale, coordinate, or P04 acceptance success.

## Repository validation

Confirmed from the live branch after promotion:
- `E5-CANONICAL-BUILD-PROVENANCE.md` exists and defines the evidence ladder.
- `builds.json` exists and contains concrete GitHub and Vercel records.
- `build-provenance.py` contains explicit tooling and endorsement-state fields matching the registry contract.
- `E5-FINDINGS-2026-09-01.md` records observations, classifications, and dispositions.
- `project-guide/HandOver.md` contains the E5 whole-project continuity state.
- `project-guide/Endorsement.md` contains the E5 endorsement entry.
- the E5 session trace exists under `.agent/sessions/` and records start-before-mutation plus closure.

## Protected-boundary validation

No E5 change authorizes or claims:
- modification of `master/HomeFinder.sh3d`;
- replacement of the main SH3D viewer;
- promotion of inherited base64 GLB workarounds;
- weakening of P04 assertions;
- merge of PR #6;
- history rewrite of the P04 branch.

## Conclusion

E5 provenance capability is validated. GitHub CI artifact provenance and Vercel deployment provenance are both represented with exact source-state identifiers and bounded evidence interpretations. P04 runtime validation remains separately unresolved.
