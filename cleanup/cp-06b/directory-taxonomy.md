# CP-06B — Canonical Directory Taxonomy

## Proposed Canonical Structure

```
HomeFinder/
├── README.md                          # Root index pointer → project-guide/
│
├── project-guide/                     # Authority & continuity documents
│   ├── README.md                      # project-guide index
│   ├── AI_ASSISTANT_READ_ME.md
│   ├── Endorsement.md
│   ├── HandOver.md
│   └── masterplan.md
│
├── active_development/                # Application code (preserved)
│   ├── firebase/                      # Backend-coherent: rules, functions, config
│   │   ├── firestore.rules
│   │   ├── functions/
│   │   └── firebase.json
│   ├── supabase/                      # Backend-coherent: functions, config
│   │   ├── functions/
│   │   └── config.toml
│   ├── js/                            # Client runtime
│   ├── css/                           # Stylesheets
│   ├── 3d/                            # 3D viewer, assets, spatial data
│   │   ├── app/
│   │   ├── docs/
│   │   └── viewer/
│   ├── data/                          # Runtime JSON configurations
│   ├── tests/                         # Active development test corpus
│   ├── verify/                        # Development verifiers
│   ├── tools/                         # Development tooling
│   └── assets/                        # Static assets (images, avatars)
│
├── verify/                            # Canonical verification (MJS ecosystem)
│   ├── contracts/
│   ├── security/
│   ├── routes/
│   ├── data/
│   ├── 3d/
│   └── integrations/
│
├── docs/                              # Current canonical documentation
│   ├── md/                            # Markdown documentation
│   ├── json/                          # JSON contracts & authority
│   ├── csv/                           # Tabular data / evidence
│   └── g1/                            # G-series spatial evidence
│
├── master/                            # Canonical authority artifacts
│   └── HomeFinder.sh3d                # Sweet Home 3D — physical spatial authority
│
├── archive/                           # Unified historical evidence
│   ├── historical-tests/              # Superseded test artifacts
│   ├── checkpoints/                   # Dated execution evidence (from verification/)
│   ├── walkmyplan/                    # WalkMyPlan historical material
│   ├── superseded/                    # Dead-or-superseded implementation
│   ├── json/                          # Historical JSON evidence
│   └── reconciliation/                # Reconciliation copies
│
└── cleanup/                           # Cleanup process evidence (durable)
    ├── phase-01/
    ├── phase-02/
    ├── phase-03/
    ├── cp-06b/
    ├── cp-07/                         # (future)
    └── ...
```

## Coherence Rules

### Backend Coherence
Firebase and Supabase artifacts must remain physically coherent. Do not scatter:
- Rules
- Functions
- Configuration
- Manifests
- Migrations
merely because their extensions differ.

### 3D Coherence
- `master/HomeFinder.sh3d` is the canonical spatial authority.
- `active_development/3d/` contains viewer code and runtime 3D assets.
- These are distinct roles and must not be merged.

### Verification Coherence
- `verify/` is the canonical verification layer.
- `active_development/tests/` is the active development test corpus.
- `archive/historical-tests/` is superseded evidence.
- These three roles must remain distinct.

### Archive Coherence
All historical evidence eventually migrates to `archive/` with semantic subdirectories:
- `archive/checkpoints/` — dated execution evidence
- `archive/historical-tests/` — superseded tests
- `archive/walkmyplan/` — WalkMyPlan legacy
- `archive/superseded/` — dead implementation
- `archive/reconciliation/` — reconciliation workspace copies

## What NOT to Do
- Do not flatten `active_development/` by file type.
- Do not merge `verify/` into `active_development/tests/`.
- Do not scatter `docs/` contents by extension.
- Do not create generic folders like `all-json/`, `all-md/`, `all-tests/`.
