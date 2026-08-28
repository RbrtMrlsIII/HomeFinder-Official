# Phase 5.5C — UI/DOM/CSS/JS Spatial Census

**Status: INITIATED**

## Purpose

Establish the dependency graph between the existing web application and the three-house physical presentation model before further SH3D merge/authoring.

## Required evidence per UI target

- HTML/DOM location
- CSS selectors and consumers
- JavaScript selectors/consumers
- animation/state behavior
- responsive behavior
- UI density
- logical presentation identity
- house assignment
- room assignment
- camera requirement
- physical route/door requirement

## Governing principle

The 3D environment adapts to stable application presentation contracts. The application does not invent camera coordinates.

## Current allocation

| House | Purpose |
|---|---|
| House 1 | Public / Hero |
| House 2 | Operations + Broker |
| House 3 | Seeker + Owner |

House 1 also owns Footer, Credits, Contact, Privacy Policy and Terms & Conditions.

## Merge gate

Additional SH3D geometry must remain staged until this census and the resulting House 2/House 3 room allocation are reconciled.
