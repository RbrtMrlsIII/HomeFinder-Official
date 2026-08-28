# HomeFinder — Sweet Home 3D Source of Truth

## Status

**Authoritative for the 3D/animation architectural model.**

## Model

`master/2BedroomHouseWithBasement.sh3d`

This is the single authoritative HomeFinder architectural model. The previously supplied `.sh3x` model is retired and is not part of the current architecture.

## Ownership split

### HomeFinder model

The `.sh3d` file owns architectural geometry and model-defined entities: levels, rooms, doors/windows, furniture, lights, stored observer cameras, dimensions, labels, and embedded model resources.

### HomeFinder integration

`3d/app/homefinder-viewer.js` owns HomeFinder-specific viewer configuration and `homefinder-viewer.css` owns presentation styling.

Current model-aware viewer configuration includes:

- default level: `1st floor`;
- selectable levels: `Basement`, `1st floor`, `Roof`;
- default camera: `Living room`;
- selectable cameras include `Living room`, `Exterior`, `Corridor`, `Bedroom #1`, and `Kitchen`;
- automatic rotation disabled;
- Sweet Home 3D default navigation panel disabled;
- space-bar camera mode switching enabled.

If model names change, integration configuration must be updated from the model rather than inventing replacement names.

### Vendor runtime

`3d/viewer/SweetHome3DJSViewer-7.5.2/` is supplied vendor runtime. Its libraries and demo model remain isolated and are not rewritten by HomeFinder integration code.

## Model integrity

The authoritative `.sh3d` was audited as a packaged model. Embedded images, OBJ resources, MTL resources, and their references were internally consistent at migration time.

## Conflict resolution

If WalkMyPlan data says one architectural fact and the `.sh3d` model says another, the `.sh3d` model wins for physical architecture. If the model suggests an interaction or permission that conflicts with application contracts, the application contract wins.

This distinction is the key reconciliation rule for the migration.
