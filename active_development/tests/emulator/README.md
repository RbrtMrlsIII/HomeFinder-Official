# Emulator smoke tests (secretless)

Exercises the PayPal webhook, `recordSubscriptionApproval`, the admin smoke-test
grants, and the payment-collection security rules **against the local Firestore
emulator**. No credentials are used or accepted:

- the harness refuses to start unless Firestore is a local emulator and the project is `demo-*`;
- it refuses to start if `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_JSON` is set;
- every PayPal HTTP call is answered by an in-process mock, and any other network call fails the run.

It runs the real `functions/index.js` handlers; only PayPal's HTTP API is mocked.

## Run

Needs Node 20, Java 17, and firebase-tools 13.

```sh
(cd ../../firebase/functions && npm install)
npm install
npx firebase-tools@13 emulators:exec --only firestore --project demo-homefinder-smoke \
  --config firebase.emulator.json --non-interactive "npm test"
```

## Reading the output

A test titled `GAP:` is a **known defect** that is already flagged in an Issue. It keeps its
strict assertion and is marked `todo`, so it is reported but does not fail the run. When the
defect is fixed, delete the `h.gap(...)` argument and the test becomes a normal regression test.
A `characterization:` test records current behavior that is not yet a decision.

The Supabase Edge bridge (#15) must pass this same suite, with the same oracle, before the
Cloud Function webhook is retired.
