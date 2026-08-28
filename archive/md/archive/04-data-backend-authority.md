# HomeFinder — Data & Backend Authority

## Canonical inventories

- `propertyListings` — canonical property inventory.
- `wantedListings` — canonical wanted inventory.
- `properties` — legacy compatibility only; no new inventory writes.
- `listings` and `wanted` — deprecated/quarantined vocabulary.

## Contracts

Normal clients do not directly create or mutate authoritative contract records. Trusted callable functions include:

- `createContract`
- `agreeContract`
- `declineContract`
- `renewContract`

A contract becomes `active` only after the required seeker and owner agreements are true. Broker agreement is retained as metadata and is not required for activation.

A qualifying normal property contract creates one immutable `listing_match` activity event and increments `listingStats/{propertyId}.matches` idempotently. Broker-assist contracts are not silently converted into Market matches.

## Listing activity

Inquiry, match, and discovery-impression events are server-authoritative product events. Client presentation must not be treated as the authoritative ledger.

## Discovery

Discovery read models are derived from canonical inventory and authorized projections. A map pin is presentation state; pin authority remains with the established server/data contracts.

## Backend change rule

Do not invent a callable because a client module references a missing name. `createWantedListing` remains a recorded mismatch until its intended backend authority is explicitly designed and implemented.

## Authority sequence

```text
authority → dictionary/schema → producers → security → consumers
→ normalization → UI → tests/readback → documentation
```

This sequence is mandatory for material data-contract changes.
