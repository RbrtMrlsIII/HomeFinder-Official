# HomeFinder — Cinematic & Animation Principles

## Purpose

The cinematic layer translates real HomeFinder surfaces into an explorable visual environment. It must improve orientation and delight without changing application semantics.

## Core principle

**Application reality first, presentation second.**

A room represents a real destination or feature grouping. A camera represents a view. A door represents navigation. A physical UI object represents an interaction. None of these objects becomes a backend authority.

## Main Hall

Home sections are camera zones rather than separate applications or separate houses. The existing WalkMyPlan planning vocabulary includes anchors such as hall, gallery, window, living, garden, library, lounge, stairs, study, directory, feature-wall, quiet, center-return, exit, and front-door-return. These are planning identifiers, not independent route authorities.

## World states

Day, sunset, night, rain, mist, and storm may alter:

- lighting;
- atmosphere;
- materials;
- animation intensity;
- UI presentation palette.

They must never alter:

- roles;
- permissions;
- routes;
- data contracts;
- payment state;
- security.

## Navigation

Cinematic entry/exit choreography, door transitions, reduced motion, mobile fallback, and performance-tier detection are established foundations. The Sweet Home 3D viewer now supplies the architectural model underneath this presentation layer.

## Production asset rule

The current source package does not prove the existence of final hyper-realistic production `.mp4`, `.webm`, `.glb`, or `.gltf` assets. Procedural/low-poly geometry is staging, not a claim that final cinematic media exists.

## Replacement path

Production assets are introduced through an explicit manifest/adapter/LOD pipeline. Never import arbitrary heavy assets directly from page HTML.
