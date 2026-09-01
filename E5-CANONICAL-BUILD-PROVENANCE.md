# HomeFinder E5 — Canonical Artifact & Build Provenance

## Purpose
Define one HomeFinder-native provenance model for generated builds, derived artifacts,
validation artifacts, and deployments without changing existing source/asset ownership.

## Core distinction
A status is never promoted beyond the evidence it actually proves:

SOURCE
→ ARTIFACT GENERATED
→ BUILD VERIFIED
→ DEPLOYMENT READY
→ RUNTIME VALIDATED
→ ENDORSED

A Vercel READY deployment or successful CI setup is not by itself proof that the
application runtime or GLB viewer works.

## Canonical provenance record
Each buildable artifact should be attributable to:
- build_id
- timestamp_utc
- source_commit
- branch
- gate/milestone
- source inputs
- artifact paths
- artifact hashes where available
- build command/tooling
- result
- validation evidence
- deployment reference when applicable
- endorsement state

## Ownership
Existing HomeFinder source assets and established artifact locations remain authoritative.
This phase does not relocate:
- `master/HomeFinder.sh3d`
- existing `active_development/assets/*`
- existing browser evidence
- existing project documentation

## Required state vocabulary
- GENERATED
- BUILD_VERIFIED
- DEPLOYMENT_READY
- RUNTIME_VALIDATED
- ENDORSED
- FAILED
- BLOCKED

## Evidence rule
A record may only claim the highest state directly supported by evidence.
Never infer RUNTIME_VALIDATED from DEPLOYMENT_READY.
Never infer ENDORSED from RUNTIME_VALIDATED.

## E5 completion boundary
E5 is complete when:
1. the provenance schema/procedure exists;
2. a machine-readable build registry exists;
3. a reproducible provenance helper exists;
4. a real existing validation/deployment artifact is recorded without overstating it;
5. whole-project HandOver and Endorsement are updated;
6. session trace is complete.
