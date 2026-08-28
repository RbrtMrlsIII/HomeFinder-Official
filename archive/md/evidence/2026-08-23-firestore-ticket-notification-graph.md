# HomeFinder — Firestore Ticket / Notification / Operations Graph Audit

Date: 2026-08-23

## Scope

Traced the executable graph for:

- `supportTickets`
- `notifications/{uid}/items`
- `users/{uid}`
- operations role resolution
- staff/moderator/admin ticket pools
- support conversation thread
- ticket claim/transfer/resolve
- broker application state

## Canonical graph

```text
Firebase Auth UID
      |
      v
users/{uid}
      |
      +--> canonicalRole
      |
      +--> brokerApplication.status
      |
      v
supportTickets/{ticketId}
      |
      +--> uid
      +--> assignedRole
      +--> assignedTo
      +--> status
      +--> thread[]
      |
      +--> notifications/{uid}/items/{itemId}
```

## Ticket pools

```text
new ticket
  |
  v
assignedRole = staff
assignedTo = null
  |
  +--> staff claim atomically
  |
  +--> staff transfer -> moderator
                         |
                         +--> moderator claim
                         |
                         +--> moderator transfer -> admin
                                                     |
                                                     +--> admin claim
```

The user remains the ticket owner throughout the transfer.

## Security boundaries verified

- Ticket creation is self-only and starts in the staff pool.
- Staff can only claim an unclaimed `staff` ticket.
- Moderator can only claim an unclaimed `moderator` ticket.
- Admin can only claim an unclaimed `admin` ticket.
- A claimed ticket is writable by its current assignee.
- Staff-to-moderator and moderator-to-admin transfers clear the assignee.
- A user can append only their own thread message.
- A user reply cannot move an escalated ticket back into the staff pool.
- `opsJoinConsent` is no longer an authority field.
- Staff queue reads are restricted to `assignedRole=staff`.
- Moderator queue reads are restricted to `assignedRole=moderator`.
- Admin may read all tickets.
- Support alerts subscribe to the role's pool instead of the whole collection.

## Notification findings

The notification document is a per-user projection:

```text
notifications/{uid}/items/{itemId}
```

Owner mutation is restricted to:

```text
read
dismissed
pinned
```

Generic cross-user client notification creation was narrowed. Contract proposal notifications are allowed only when the caller and recipient are both parties to the referenced canonical contract.

The notification UI escapes stored messages before rendering.

## Broker application finding

Broker application state was previously conflated with role promotion.

Current target:

```text
brokerApplication.status = pending|under_review|approved|rejected
                    |
                    X
                    |
canonicalRole
```

Approval no longer automatically writes `canonicalRole = broker`.

## Remaining architectural P1

`supportTickets.thread` is currently an array on the ticket document. This is acceptable for the current bounded implementation but has a Firestore document-size and concurrency ceiling.

Future canonical structure:

```text
supportTickets/{ticketId}
supportTickets/{ticketId}/messages/{messageId}
```

Migration should wait until the authority model is stable.

## Verification evidence

- Support ticket authority verification: PASS
- Broker application authority verification: PASS
- 146 JavaScript files syntax check: PASS, 0 failures
