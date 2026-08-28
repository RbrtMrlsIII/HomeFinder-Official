# HomeFinder — Session Continuation Lock

## Status

**FROZEN — 5.5G.6C**

This file is a continuation guard for future development sessions.

### Rules that must not be reinterpreted

1. Broker top-level access is **Broker HQ only**.
2. Broker profile functionality remains available **inside Broker HQ**; the profile implementation must not be deleted.
3. Broker discovery/market and broker service map are owned by **Broker HQ**. `market.html` is not a Broker destination.
4. Government housing reference information is public from the main experience and visible in Profile to **Seeker, Owner, and Broker**.
5. Seeker and Broker may save property listings; Owner and Broker may save wanted listings.
6. House 1 is the sole inter-house transit/common hub.
7. House 2 and House 3 have **no direct physical connection**.
8. Physical travel never changes authentication identity or role.
9. A Broker reaching House 1 remains a Broker. Operating as Seeker/Owner requires an explicit authenticated identity transition.
10. Client role caches are presentation hints only and are cleared on logout.
11. `master/HomeFinder.sh3d` is the sole canonical runtime physical authority. SH3Ds in `3d/imports` and `3d/staging` are evidence-only.
12. Logical navigation never promotes a physical route. Physical routes require evidence and validation.
13. Suspension expiry must reconcile both Firestore suspension state and Firebase Auth disabled state.
14. Philippine phone identity normalization is exactly 12 digits in canonical `639XXXXXXXXX` form.

## Repair policy

A future session may **repair** a frozen rule only when fresh evidence demonstrates that the rule itself is wrong. Such a repair must:

- document the evidence;
- update the contract deliberately;
- update the protected hashes;
- add/adjust verification;
- create a new checkpoint;
- never silently weaken the rule to make a failing test pass.

## Required preflight

Run:

`node --experimental-default-type=module verify/contracts/protected-logic-freeze.mjs`

before modifying protected logic.

A hash mismatch is a **stop-and-review condition**, not permission to overwrite the lock.
