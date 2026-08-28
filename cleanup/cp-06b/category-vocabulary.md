# CP-06B — Category Vocabulary

## Logical Batches

| Batch | Description | Physical Homes | Count |
|-------|-------------|----------------|-------|
| **Backend / Firebase** | Firebase rules, functions, configuration, deployment | `active_development/firebase/` | 9 |
| **Backend / Supabase** | Supabase functions, configuration, shared contracts | `active_development/supabase/` | 10 |
| **Frontend / UI** | CSS, client JS, HTML, static assets, UI components | `active_development/js/`, `css/`, `assets/` | 168 |
| **3D / Spatial** | SH3D authority, viewer code, camera rigs, room maps | `master/`, `active_development/3d/` | 19 |
| **Security / Auth** | KYC, roles, authorization contracts, security rules | `active_development/firebase/`, `docs/json/` | (cross-cutting) |
| **Routes / Navigation** | Route authority, portal contracts, traversal logic | `verify/routes/`, `active_development/js/` | (cross-cutting) |
| **Integrations** | PayPal, Cloudflare, third-party configuration | `docs/md/`, `active_development/js/` | (cross-cutting) |
| **Contracts** | Canonical authority documents, JSON contracts | `docs/json/`, `verify/contracts/` | 20 |
| **Verification** | Executable tests and verifiers | `verify/`, `active_development/tests/` | 111 |
| **Documentation** | Guides, architecture, API docs, evidence | `docs/md/`, `docs/csv/`, `docs/g1/` | 225 |
| **Project Guide** | Continuity and authority documents | `project-guide/` | 15 |
| **Configuration / Data** | Runtime JSON, theme config, dictionaries, tools | `active_development/data/`, `tools/` | 40 |
| **Archive** | Historical evidence, superseded material, checkpoints | `docs/archive/`, `verification/`, `docs/json/archive/` | 144 |
| **Cleanup Process** | Cleanup phase evidence and reconnaissance | `cleanup/` | 19 |
| **Unclassified** | Requires further review | — | 19 |

## Cross-Cutting Domains
Some artifacts belong logically to multiple batches but have one physical canonical location:

| Artifact | Logical Batches | Canonical Location |
|----------|-----------------|-------------------|
| `firestore.rules` | Backend + Firebase + Database + Security | `active_development/firebase/firestore.rules` |
| `kyc-authorization.json` | Security + Auth + Contracts + Backend | `active_development/firebase/functions/contracts/` |
| `HomeFinder.sh3d` | 3D + Spatial + Authority | `master/HomeFinder.sh3d` |
| `project-authority.json` | Contracts + Documentation + Authority | `docs/json/project-authority.json` |

## Artifact Classes

| Class | Definition | Examples |
|-------|------------|----------|
| `backend` | Server-side or platform-specific code/config | Firebase functions, Supabase functions, rules |
| `frontend` | Client-side presentation layer | CSS, JS, HTML, images |
| `3d-spatial` | Three-dimensional or spatial content | SH3D, viewer, camera rigs |
| `security` | Authentication, authorization, access control | KYC contracts, role contracts |
| `verification` | Executable tests, verifiers, assertions | MJS in `verify/` and `tests/` |
| `contracts` | Canonical agreements, authority documents | `project-authority.json` |
| `documentation` | Human-readable guides and evidence | `.md`, `.csv` in `docs/` |
| `data` | Runtime configuration and data | JSON in `active_development/data/` |
| `configuration` | Build, deploy, tool config | `firebase.json`, tooling |
| `archive` | Historical evidence, superseded material | `docs/archive/`, `verification/` |
| `project-guide` | Continuity and authority documents | `README.md`, `Endorsement.md` |
| `cleanup-evidence` | Cleanup process artifacts | `cleanup/phase-*/` |
| `unclassified` | Requires further review | — |
