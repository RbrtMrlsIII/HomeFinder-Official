# HomeFinder — Domain Dictionary & Vocabulary

## Contract classes

| Class | Meaning |
|---|---|
| canonical | Source-of-truth definition; contract review required |
| derived | Computed/read-model representation; must identify its source |
| presentation | UI-only vocabulary; cannot invent business authority |
| integration | External-system boundary |
| deprecated | Retained for migration/history; no new consumers |
| quarantined | Isolated until explicit repair/retirement decision |

## Core vocabulary

| Concept | Canonical meaning |
|---|---|
| Property listing | `propertyListings` record |
| Wanted listing | `wantedListings` record |
| Broker owned | Broker is canonical publisher/owner |
| Broker assisted | Existing assistance/contract relationship |
| Market | Normal seeker discovery surface |
| Broker HQ | Broker workspace/discovery surface |
| Cinematic world | Presentation layer around real application surfaces |
| Sweet Home 3D model | Authoritative 3D architectural representation |
| WalkMyPlan registry | Derived spatial mapping data |
| Physical UI object | 3D presentation shell bound to a real UI action |
| Camera | Model/view presentation state; never business authority |

## Roles and capabilities

Role names, capabilities, routes, lifecycle states, integration names, and UI owners must be treated as one vocabulary system. If a concept is renamed or materially changed, every producer, consumer, security rule, test, and documentation reference must be reconciled in the same change set.

## Data-state discipline

A visual state such as locked, unlocked, loading, active, or highlighted is not automatically a backend state. Do not map presentation labels into database authority without an explicit contract.

## Deprecated vocabulary

Do not resurrect `properties`, `listings`, `wanted`, ambiguous staff aliases, or legacy Boost shapes as new authority merely because old files still contain them.
