# HomeFinder — Product, Routes, Roles & Access

## Canonical route law

- Home is the public entry and cinematic preview surface.
- `market.html` is the sole canonical Market route.
- Profile is the authenticated personal workspace and remains a living product surface.
- Broker HQ is the broker-only workspace for broker-owned and broker-assisted work.
- Admin, Moderator, and Staff have separate operational consoles and must not be collapsed into a generic operations route.
- Login/Register remain authentication surfaces.
- Privacy and Terms are legal surfaces and require legal approval before production reliance.

## Role boundaries

The project distinguishes product users from operations roles. Admin is the highest-security surface for identity/KYC and final approvals. Moderator and Staff remain confined to their respective consoles.

A 3D room or object may represent a role-specific destination, but the role decision is always made by application/backend authority.

## Broker HQ

Canonical broker read-side wiring:

- `propertyListings` — broker-owned property inventory.
- `wantedListings` — broker-owned wanted inventory.
- `assistanceRequests` — broker-assisted work state.
- `contracts.brokerId` — broker relationship when a contract exists.
- `listingStats/{propertyId}` — private performance aggregate for authorized owned listings.
- `brokerHQDiscover` — server-authorized nearby dual-inventory discovery.
- `brokerHQWorkspace` — server-authorized Broker HQ workspace projection.

Assisted records do not grant private owner analytics.

## Market

Market owns normal discovery. The Home map is a preview/demo surface and must not become a competing discovery authority. The canonical inventory is `propertyListings` and `wantedListings`.

## 3D access rule

The animation model may expose or hide a route through presentation, but access is still enforced by the real application. A locked room is a visual reflection of access state, not a security boundary.

## Landmine

Never invent a route because a room, button, or model label seems to imply one. In particular, do not restore `marketplace.html` or create a separate Property Detail route without repository evidence.
