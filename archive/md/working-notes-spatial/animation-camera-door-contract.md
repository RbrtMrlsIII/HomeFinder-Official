# HomeFinder — Animation, Camera & Door Contract

## Spatial graph

The canonical conceptual graph remains:

```text
room → zone → object → route → role → camera → door → destination → fallback
```

The physical geometry and model-defined camera inventory come from Sweet Home 3D. The route/role/action fields come from HomeFinder application authority.

## Camera law

A camera is a presentation state. It may focus attention on a real section or object but never grants access.

Camera names stored in the `.sh3d` model are authoritative for model integration. WalkMyPlan camera registries are derived mapping aids and must be reconciled when model cameras change.

## Door law

A door represents an in-app transition only when the destination is a real route. No door may point to an invented route.

Failure behavior must provide a normal application fallback if the cinematic layer cannot load.

## Reduced motion

Every transition needs a reduced-motion path. Browser-native window/tab close behavior remains separate from in-app door animation.

## Lazy loading

Do not eagerly load the entire house's heavy assets. Load by active room and likely next destination where practical.

## Camera choreography

The previous WalkMyPlan choreography concepts remain valid as behavior requirements: entry/exit, door transition, center return, section focus, and fallback. Their concrete geometry must now be read from the Sweet Home 3D model.

## Animation authority

The animation system may animate model geometry, camera movement, lighting, and presentation overlays. It may not mutate business records, roles, permissions, or payment entitlements.
