# Main Hall Camera → Physical UI Contract

Status: LIVING / CAMERA-READY

This contract binds H-01..H-09 to the semantic physical UI object registry. Logical POVs remain application-authoritative; Sweet Home 3D cameras are presentation implementations only.

## Rules
- Every Main Hall POV declares the object(s) it frames.
- All Main Hall POVs support the environment theme set: day, sunset, night, rain, mist, storm.
- UI styling is environment-driven; no dark/light theme branch exists.
- Responsive behavior is root-token driven and must preserve semantic identity and access policy.
- `prefers-reduced-motion` disables/interprets camera/object motion as instant or fade.
- HTML sections remain usable without the cinematic layer.
- 3D camera state can never authorize access, mutate roles, approve KYC, or change data/payment authority.

## POV → object map
| POV | Object(s) | Primary role |
|---|---|---|
| H-01 | home-hero-focal | Hero / primary CTA |
| H-02 | main-search-console | Universal search |
| H-03 | property-catalogue | Featured property discovery |
| H-04 | home-map-table | Map gateway |
| H-05 | government-info-desk | Government reference |
| H-06 | mission-wall | About / mission reading |
| H-07 | guide-book | Spaces / roles / guide |
| H-08 | safety-board | Features / safety |
| H-09 | start-cta, contact-desk, credits-wall | Start / contact / exit |

Detailed behavior is maintained in `data/main-hall-camera-object-contract.json` and `.csv`.
