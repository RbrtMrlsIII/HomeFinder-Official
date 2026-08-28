# CP-06B — Canonical Naming Grammar

## Principle
Canonical filenames must describe the artifact's **architectural identity**, not the chronological execution event that created it.

## Forbidden Patterns
The following must never appear as the primary identity of a canonical artifact:
- `DD01`, `DD02`, `DD57`
- `PATCH-1`, `PATCH-57`, `patch-21`
- `PHASE-1`, `phase10`, `phase11`
- `REPAIR-05`, `foundation-repair-07`
- `FINAL`, `FINAL-2`, `FINAL-FINAL`, `FINAL-FINAL-FINAL`
- `checkpoint`, `5.5G.6H`, `5.5f3`

These are **lineage clues**, not canonical names. They may be preserved as metadata, comments, or archive folder names where useful.

## Allowed Canonical Form
```
[optional-numeric-index]-[semantic-class]-[purpose-description].[ext]
```

### Numeric Index Rules
- The number is an **addressing/index aid**, not a version.
- Numbering may repeat across independent artifact classes or bounded namespaces.
- Example: `docs/001-doc-architecture.md` and `contracts/001-contract-auth.json` are independent.
- Do not infer that `001.md` and `001.json` are versions of the same object.

### Semantic Class Prefixes
| Prefix | Class | Example |
|--------|-------|---------|
| `doc-` | Documentation | `001-doc-architecture.md` |
| `contract-` | Contracts / Authority | `001-contract-auth.json` |
| `verify-` | Canonical Verification | `001-verify-security.mjs` |
| `test-` | Active Development Test | `001-test-camera-rig.mjs` |
| `backend-` | Backend / Firebase / Supabase | `001-backend-firestore.rules` |
| `ui-` | Frontend / UI Component | `001-ui-property-card.js` |
| `3d-` | 3D / Spatial | `001-3d-camera-rig.json` |
| `data-` | Runtime Data / Configuration | `001-data-theme-system.json` |
| `route-` | Routes / Navigation | `001-route-portal-auth.mjs` |
| `security-` | Security / Auth | `001-security-role-contract.json` |
| `integration-` | Third-party Integration | `001-integration-paypal.md` |
| `archive-` | Historical Evidence | `archive/001-archive-walkmyplan-tests/` |

### Extension Rules
- Extension is preserved and never used as the sole classification criterion.
- A `.json` file may be a contract, data config, or test fixture — inspect content.
- A `.md` file may be documentation, project guide, or historical evidence — inspect content.

## Archive Naming
Archive material retains its original name for lineage purposes. If moved to unified archive, the path provides context:
```
archive/historical-tests/patch-21-role-need-help.test.mjs
archive/checkpoints/2026-08-26/5.5c-v4-cinematic-3d-slice.txt
archive/superseded/foundation-repair-05-subscription-entitlement.test.mjs
```

## Backend Coherence Exception
Backend artifacts (Firebase, Supabase) are named by their platform conventions. Do not force canonical naming onto:
- `firestore.rules`
- `firebase.json`
- `supabase/config.toml`
- Cloud function entry points

These names are determined by deployment architecture, not by cleanup taxonomy.
