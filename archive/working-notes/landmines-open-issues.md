# HomeFinder — Landmines, Open Issues & Decision Register

## Locked landmines

1. `market.html` is canonical; do not invent `marketplace.html`.
2. Brokers use Broker HQ for broker workflows, not normal Market discovery.
3. 3D never becomes application authority.
4. Do not duplicate the cinematic router.
5. Do not ship raw 4K everywhere.
6. Do not treat the Home map as Market discovery authority.
7. Do not duplicate Profile header ownership.
8. One CSS owner per selector family.
9. Theme must not leak into business logic.
10. Reduced motion is mandatory.
11. Do not eagerly load the full house.
12. Never clean up by keyword alone.

## Open/review items

### Model-to-registry reconciliation
The Sweet Home 3D model is now authoritative, but existing WalkMyPlan registries were authored against earlier spatial assumptions. They need an explicit model-to-registry reconciliation pass.

### Production cinematic assets
The current package does not establish final `.mp4`, `.webm`, `.glb`, or `.gltf` production assets. Treat the current 3D stack as an integration/model foundation, not as proof of final cinematic fidelity.

### Legal pages
Privacy and Terms references require legal approval and should not be filled with invented legal language.

### `createWantedListing`
Client/backend mismatch remains a review item. Do not invent a callable as a documentation cleanup.

### Cloudflare Worker
The project contains recovery/contract knowledge but no authoritative executable Worker source in the reviewed package. Treat deployment routing as a separate infrastructure gate.

### Browser close behavior
In-app door transitions cannot replace browser-native beforeunload semantics.

## Decision rule

When a new conflict appears, stop the affected implementation slice, identify the authority layer, record the conflict here, and resolve it before continuing.
