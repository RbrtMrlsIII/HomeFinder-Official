# Evidence — secretless emulator smoke (2026-10-04)

**Grade:** emulator-proven (real handlers and rules, local Firestore emulator, PayPal HTTP mocked).
**Not** live-proven: nothing here touches a real Firebase project, PayPal, or Supabase.
No credential was used or created. Owner decision: no Firebase service-account key in CI.

## Method

`active_development/tests/emulator/` loads the real `functions/index.js` and calls the real
exports (`paypalSubscriptionWebhook`, `recordSubscriptionApproval`, `grantAdminSubscription`,
`revokeAdminSubscription`) against the local Firestore emulator (named database `homefinder`).
The real `firestore.rules` are loaded into the emulator for the rules tests. PayPal's three HTTP
endpoints are answered by an in-process mock; any other network call fails the run.

Safety rails, each exercised on 2026-10-04: refuses to start without a local emulator host,
with a non-`demo-` project, or with `GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_SERVICE_ACCOUNT_JSON` set.

## Result

40 tests · **31 pass · 0 fail · 9 `GAP:` todo** · about 12 s on one CPU.

Proven: signature failure writes nothing; ACTIVATED activates once and ledgers the event; wrong-plan
events grant nothing; processed duplicates are inert; CANCELLED / SUSPENDED / EXPIRED deactivate;
PAYMENT.FAILED flags without deactivating; lookup failure ledgers `failed` and a retry succeeds;
approval rejects unauthenticated, suspended, malformed, wrong-plan and email-mismatch callers;
grants are admin-only, validated, audited and notified; revoke audits; the payment collections are
server-write-only and owner/admin-read as intended; owners cannot write `subscription` or an admin
role onto their profile.

## Known gaps (strict assertions kept; flagged `todo`)

| Gap | Severity | Issue |
|---|---|---|
| A bound subscription can be re-pointed by a second account | High | #28 |
| No-email accounts / PayPal-no-email subscriptions activate by id alone | High | #28 |
| Every client self-create of `users/{uid}` is denied by the repo rules | High (if deployed) | #29 |
| Event arriving before its binding is acknowledged and lost | Medium | #28 |
| Duplicate during `processing` is processed twice | Medium | #28 |
| Admin grant overwrites a live PayPal entitlement | Medium | #28 |
| Admin revoke deactivates a live PayPal entitlement | Medium | #28 |
| `PAYMENT.SALE.COMPLETED` never notifies (sale id used as subscription id) | Low | #28 |

## Limits

The emulator proves logic and rules text, not deployment: the live rules, live Functions, PayPal
signature behavior, and the Supabase Edge bridge remain unproven (#23, #15, #21).

## Reproduce

See `active_development/tests/emulator/README.md`. In CI: workflow `emulator-smoke.yml` (no secrets).
