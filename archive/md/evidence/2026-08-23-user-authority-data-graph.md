# HomeFinder — users/{uid} Authority/Data Graph Audit

## Scope

Traced the `users/{uid}` document and its dependencies across Firebase Auth, Firestore rules, profile/auth clients, KYC, public profile projection, notifications, tiers, admin controls, and KYC reference uniqueness.

## Canonical graph

```text
Firebase Auth UID
      |
      v
users/{uid}
      |
      +--> canonicalRole --------------------> route/capability decisions
      |
      +--> profile fields -------------------> private profile UI
      |
      +--> KYC state ------------------------> KYC workflow
      |
      +--> brokerApplication ----------------> application state (not role)
      |
      +--> tier/{role} ----------------------> capability/rank surfaces
      |
      +--> favourites/{listingId} -----------> saved-listing relationship
      |
      +--> publicProfiles/{uid} <------------- server-only projection
      |
      +--> notifications/{uid}/items --------> user-facing system events
      |
      +--> admin-controlled flags ------------> suspension/cap/quota controls
```

## Findings addressed

### P0 — user document creation was too permissive

The create rule previously checked the role but did not constrain the complete field set. A direct Firestore client could attempt to create server-owned projection/security fields such as `verified` or `prcVerified`.

**Resolution:** self-service creation now has an explicit allowed-field surface, permits only `owner`/`seeker`, requires active status, and rejects self-set verification flags.

### P1 — legacy `license` field remained in auth bootstrap

The active auth save path still initialized `license`, while `brokerLicense` is canonical.

**Resolution:** removed the active auth bootstrap write.

### P1 — suspension state was inconsistent

Admin UI writes `suspended`, `suspendedUntil`, and `suspendReason`, while login checked `status == suspended`.

**Resolution:** login now checks the actual suspension fields and honors an active `suspendedUntil` timestamp.

### P1 — KYC reference uniqueness could be bypassed with an arbitrary document ID

The previous rules assumed the client always computed the canonical `indexId`.

**Resolution:** creation/update now require safe normalized `idType`, normalized uppercase alphanumeric `referenceNumber`, and `indexId == idType + '_' + referenceNumber`.

### P2 — role vocabulary was still resolved ad hoc in profile code

**Resolution:** profile role consumption now uses the shared `canonicalRoleFromData()` resolver.

## Server-owned user fields

These are not self-service authority fields:

- `verified`
- `prcVerified`
- `suspended`
- `suspendedUntil`
- `suspendReason`
- `listingCapOverride`
- `wantedCapOverride`
- `tierIndex`
- `mapState`
- `mapStateOwner`

## Remaining architectural recommendation

`users/{uid}` is becoming a dense aggregate. Long-term, high-churn or operational state should migrate to dedicated subcollections/documents rather than continuing to grow the root user document. The root should remain the canonical identity/profile projection source.
