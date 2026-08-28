# HomeFinder — Physical UI Object Contract

## Principle

A physical UI object is a visual representation of an existing HomeFinder feature.

Examples from the reconciled WalkMyPlan design:

- Market map → physical map/table surface.
- Listing → property catalogue/dossier.
- List Property → property dossier/work surface.
- Wanted → notice board.
- Messages → communication terminal.
- Contracts → contract folder.
- Saved Properties → cabinet.
- Broker requests → request board.
- Government Housing → reference desk.

These are design mappings, not new data authorities.

## Object contract

Every production object should identify:

- stable `data-asset` identifier;
- source room/zone;
- real route or action;
- UI mount/entry point;
- role/access expectation;
- loading/error state;
- reduced-motion behavior;
- quality/performance tier;
- fallback.

## Interaction boundary

The object can trigger or visually host real UI. The HTML/CSS/JS application remains responsible for validation, persistence, server calls, and security.

## Accessibility

Objects must have an equivalent accessible interaction path. A user must not be forced to discover a 3D object to complete a core task.

## Reconciliation

WalkMyPlan's existing physical-object registry is retained as derived implementation data under `cinematic/WalkMyPlan/data/physical-ui-object-registry.json`. If an object requires a physical location that does not exist in the current Sweet Home 3D model, mark it as pending reconciliation rather than silently altering the model or inventing geometry.
