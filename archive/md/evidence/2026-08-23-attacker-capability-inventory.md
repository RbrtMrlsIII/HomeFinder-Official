# HomeFinder — Attacker Capability Inventory

## Scope

This pass traces the maximum authority a client can attempt to manufacture by writing directly to Firebase or invoking callable functions, with emphasis on `users/{uid}`, authentication/session state, role transitions, verification, entitlements, quotas, public projections, and operational authority.

## Findings

### 1. Self-created historical role provenance — fixed

The user-create Firestore allowlist previously permitted `previousAccountType`.

That field is provenance, not self-service profile state. Allowing a client to seed it creates attacker-controlled historical authority data that could later be misinterpreted by a consumer.

**Change:** removed `previousAccountType` from the self-service create allowlist.

### 2. Single canonical role — enforced by contract and rule

Self-service creation permits only:

- `owner`
- `seeker`

Normal role changes permit only owner/seeker transitions.

`broker`, `staff`, `moderator`, and `admin` remain privileged outcomes.

Legacy aliases normalize at the boundary; they are not additional active roles.

### 3. Privileged user fields are server/admin controlled

The user write boundary protects fields such as:

- `verified`
- `prcVerified`
- `suspended`
- `suspendedUntil`
- `listingCapOverride`
- `wantedCapOverride`
- map relocation state
- pin relocation state
- tier subcollections

### 4. Important remaining gap: suspension is not a server authentication control

The client contains `assertNotSuspended()` and signs the user out when `users/{uid}.suspended` is active.

That is useful UX, but it is not an attacker-proof authentication boundary. A modified client can skip it.

The repository's Firebase callable functions do not currently establish a single global suspended-account guard, and the Firestore rules do not contain a global `isSuspended()` gate.

**Risk:** a suspended Firebase account may retain Firebase authentication and could still invoke any callable whose own authorization does not independently reject suspended accounts.

**Recommended next execution:** make suspension authoritative at the authentication boundary (Firebase Auth `disabled`) when an admin suspends an account, and restore/clear `disabled` when the suspension expires or is lifted. For callable defense-in-depth, add a shared `requireActiveUser(request)` guard to security-sensitive callables.

### 5. Custom claims are not the current authority

The source does not currently use `setCustomUserClaims()` as a role authority mechanism.

That is acceptable and avoids a second role store. The canonical Firestore user record remains the current role authority, with explicitly documented bootstrap UID exceptions.

Do not introduce custom claims casually; doing so would create another synchronization problem.

### 6. Bootstrap admin UIDs are a deliberate break-glass boundary

Firestore rules contain explicit bootstrap UIDs for admin/moderator/staff and callable admin helpers use a designated admin UID.

This is not client-forgeable, but it is operationally sensitive. A future hardening pass should make these bootstrap identities documented, rotated deliberately, and eventually removable after all operations identities are normalized.

### 7. Public profile is projection-only

`publicProfiles/{uid}` is read-only to clients and written by trusted backend code. This is the correct authority direction:

```text
users/{uid}
    ↓
trusted projection
    ↓
publicProfiles/{uid}
```

Clients must not be able to promote private verification state into the public projection.

### 8. Quota and entitlement writes are protected

Tier data and capacity overrides are not normal user-write surfaces. Listing and wanted creation also calculate effective capacity server-side.

The remaining risk is semantic rather than direct-write: every callable that consumes entitlements must continue resolving them from the same canonical role/tier/boost sources.

## Callable surface snapshot

The repository exposes these callable operations:

- checkPhoneAvailability — intentionally public lookup
- getConversationPeerProfile
- setBrokerServiceRadius
- brokerHQDiscover
- createContract
- agreeContract
- declineContract
- renewContract
- hideContract
- markAssistanceSuccessful
- confirmContract
- brokerHQWorkspace
- recordListingActivity
- toggleListingSave
- createWantedListing
- notifyListingMatches
- createListing
- markRentToOwnRescue
- getKycSignedUrl
- relocateUserPin
- getPinEntitlement
- grantAdminSubscription
- revokeAdminSubscription
- recordSubscriptionApproval

The audit principle is:

```text
Firebase Auth
    ↓
request.auth.uid
    ↓
canonical user authority
    ↓
operation-specific authorization
    ↓
server-side entitlement / ownership checks
```

A callable should never treat a client-supplied role, UID, verification flag, quota, or entitlement as authoritative.

## Attack transitions to keep under regression

```text
owner → broker
seeker → broker
user → staff
user → moderator
user → admin

pending KYC → verified
pending broker application → approved
unsuspended → suspended
normal quota → override quota
private profile → public projection

unclaimed ticket → claimed ticket
staff ticket → moderator pool
moderator ticket → admin pool
```

## Current conclusion

The direct user-write surface is substantially constrained and the single-role model is now clearer.

The highest remaining security concern from this pass is **suspension enforcement at the authentication/server boundary**. Client-side sign-out is not sufficient as an attacker control.

The next hardening action should therefore be:

1. Admin suspension changes Firebase Auth `disabled` state.
2. Unsuspension restores it.
3. Expired temporary suspensions are reconciled.
4. Sensitive callable functions use a shared active-account guard as defense in depth.
5. Tests prove suspended accounts cannot use either the UI or direct callable paths.
