# HomeFinder — Project Map

## Repository structure

```text
HomeFinder/
├── docs/                         # exactly 20 canonical project documents
├── 3d/
│   ├── ../master/HomeFinder.sh3d     # authoritative architectural model
│   ├── app/                     # HomeFinder viewer integration
│   └── viewer/                  # isolated Sweet Home 3D JS Viewer vendor runtime
├── cinematic/WalkMyPlan/data/   # derived spatial/runtime registries
├── data/                        # application/cinematic machine-readable data
├── js/                          # browser application modules
├── css/                         # presentation modules
├── firebase/                    # Firebase rules/functions/configuration
├── supabase/                    # KYC edge functions
├── tests/                       # executable verification
├── tools/                       # audits/build utilities
├── verify/                      # fixtures and verification assets
└── assets/                     # project media/assets
```

## Frontend

The frontend intentionally remains at the repository root for Firebase Hosting. Do not move pages into `src/` merely for aesthetics.

Important product surfaces include Home (`index.html`), Market (`market.html`), Profile (`profile.html`), Broker HQ (`broker-hq.html`), Admin, authentication, financing, verification, privacy, and terms surfaces.

## 3D architecture

The 3D stack has three ownership layers:

1. **Authoring/model:** `master/HomeFinder.sh3d`
2. **HomeFinder integration:** `3d/app/homefinder-viewer.js` and `homefinder-viewer.css`, plus the two HomeFinder viewer entry points.
3. **Vendor runtime:** `3d/viewer/SweetHome3DJSViewer-7.5.2/`

The bundled Sweet Home 3D demo scene was removed from the project checkpoint; only `master/HomeFinder.sh3d` remains.

## WalkMyPlan data

`cinematic/WalkMyPlan/data/` is retained because executable tests and cinematic mapping code use these machine-readable registries. They are not the architectural source of truth. They describe mappings such as room zones, camera choreography, doors, physical UI objects, asset bindings, role paths, and performance policies.

## Documentation rule

All human-readable project documentation is consolidated into `docs/`. Runtime JSON, CSV, JavaScript, CSS, HTML, model, image, and vendor files are not documentation merely because they contain descriptive metadata.
