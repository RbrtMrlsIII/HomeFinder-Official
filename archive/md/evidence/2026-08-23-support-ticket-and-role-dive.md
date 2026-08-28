# HomeFinder — Support Ticket and Role-Application Dive

## Findings

### P0 — Ticket claim was not atomic
The staff UI used a read-then-update sequence. Two staff clients could race and both believe they had claimed the same ticket.

**Resolution:** claim now uses a Firestore transaction and the security rules require an unclaimed ticket to become assigned to the current authenticated ops UID.

### P0 — User could not reply in the ticket
The UI rendered staff replies but exposed no user reply control.

**Resolution:** users can append a user-authored message to the ticket thread until the ticket is resolved.

### P0 — Ticket updates were too broad
Any operations user could previously update the support ticket document without the assignment boundary being enforced by rules.

**Resolution:** rules distinguish claim, assigned-worker updates, upper-ops takeover, and user reply/consent paths.

### P1 — Escalation model did not match product intent
The old UI described a moderator-only transfer and required user consent for operations to join.

**Resolution:** staff transfers to moderator; moderator transfers to admin. Operational escalation does not require user consent. The user is informed by notification.

### P1 — Broker application and role were conflated
Broker license verification automatically rewrote `canonicalRole` to `broker`.

**Resolution:** broker applications now have an explicit `brokerApplication.status`. License verification records `approved` application state without silently rewriting `canonicalRole`. Normal user creation is restricted to `owner` or `seeker`.

### P1 — Supabase secret naming documentation mismatch
The operator playbook used `SUPABASE_SERVICE_ROLE_KEY`.

**Resolution:** operator instructions use `SERVICE_ROLE_KEY`; existing Edge Functions retain a compatibility fallback where present.

## Verification

- All 11 repository verification modules: PASS
- 146 JavaScript files syntax checked: PASS
- Support-ticket authority verification: PASS
- No change to canonical 3D model bytes
