'use strict';
/*
 * Secretless emulator harness for HomeFinder payment-path smoke tests.
 *
 * Safety rails (they throw at load time):
 *  - Firestore must be a LOCAL emulator and the project must be demo-*.
 *  - No credential environment variables may be present.
 *  - Every PayPal HTTP call is answered by an in-process mock; any other
 *    network call is recorded and fails the run.
 */
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-homefinder-smoke';
if (!/^demo-/.test(PROJECT)) throw new Error(`Refusing to run: project "${PROJECT}" is not a demo- project.`);
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '';
if (!/^(127\.0\.0\.1|localhost):\d+$/.test(EMULATOR_HOST)) {
  throw new Error('Refusing to run: FIRESTORE_EMULATOR_HOST must be a local emulator. Run through `firebase emulators:exec`.');
}
for (const name of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'GOOGLE_CLOUD_CREDENTIALS']) {
  if (process.env[name]) throw new Error(`Refusing to run: ${name} is set. These tests never use credentials.`);
}
process.env.GCLOUD_PROJECT = PROJECT;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT;
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT });
process.env.NO_GCE_CHECK = 'true';
process.env.PAYPAL_SUBSCRIPTION_CLIENT_SECRET = 'smoke-not-a-real-secret';
process.env.PAYPAL_SUBSCRIPTION_WEBHOOK_ID = 'WH-SMOKE-NOT-REAL';

const FN_INDEX = path.join(__dirname, '..', '..', 'firebase', 'functions', 'index.js');
const source = fs.readFileSync(FN_INDEX, 'utf8');
const pick = (re, label) => {
  const m = source.match(re);
  if (!m) throw new Error(`Could not read ${label} from functions/index.js`);
  return m[1];
};
const PLAN_ID = pick(/const PAYPAL_SUBSCRIPTION_PLAN_ID = "([^"]+)"/, 'plan id');
const ADMIN_UID = pick(/const HOMEFINDER_ADMIN_UID = "([^"]+)"/, 'admin uid');

/* ---- PayPal network mock (the only network the code under test may use) ---- */
const mock = { verify: 'SUCCESS', failLookup: false, subscriptions: new Map(), calls: [], unmocked: [] };
global.fetch = async (url, init = {}) => {
  const u = String(url);
  mock.calls.push(`${init.method || 'GET'} ${u}`);
  const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  if (u === 'https://api-m.paypal.com/v1/oauth2/token') return reply(200, { access_token: 'smoke-token' });
  if (u === 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature') {
    return reply(200, { verification_status: mock.verify });
  }
  const m = u.match(/^https:\/\/api-m\.paypal\.com\/v1\/billing\/subscriptions\/([^/?]+)$/);
  if (m) {
    if (mock.failLookup) return reply(500, {});
    const s = mock.subscriptions.get(decodeURIComponent(m[1]));
    return s ? reply(200, s) : reply(404, {});
  }
  mock.unmocked.push(u);
  throw new Error(`UNMOCKED NETWORK CALL: ${u}`);
};

/* ---- the real code under test, on the local emulator ---- */
const fnReq = createRequire(FN_INDEX);
const admin = fnReq('firebase-admin');
const { getFirestore, Timestamp } = fnReq('firebase-admin/firestore');
const fns = require(FN_INDEX);
const db = getFirestore(admin.app(), 'homefinder');

/* ---- builders ---- */
const rid = () => crypto.randomBytes(5).toString('hex').toUpperCase();
const newUid = () => `smoke_u_${rid()}`;
const newSubId = () => `I-SMOKE${rid()}`;
const sub = (id, over = {}) => ({
  id,
  plan_id: PLAN_ID,
  status: 'ACTIVE',
  subscriber: { email_address: 'buyer@example.test', payer_id: `PAYER${rid()}` },
  billing_info: { next_billing_time: '2030-01-01T00:00:00Z' },
  ...over
});
const event = (type, subId, extra = {}) => ({ id: `WH-${rid()}`, event_type: type, resource: { id: subId, ...extra } });
const saleEvent = (subId) => ({
  id: `WH-${rid()}`,
  event_type: 'PAYMENT.SALE.COMPLETED',
  resource: { id: `SALE-${rid()}`, billing_agreement_id: subId }
});

/* ---- request / response doubles ---- */
function makeReq(evt, { method = 'POST', rawBody } = {}) {
  const raw = rawBody !== undefined ? rawBody : JSON.stringify(evt);
  const headers = {
    'paypal-auth-algo': 'SHA256withRSA',
    'paypal-cert-url': 'https://api.paypal.com/smoke-cert.pem',
    'paypal-transmission-id': `tx-${rid()}`,
    'paypal-transmission-sig': 'smoke-sig',
    'paypal-transmission-time': new Date().toISOString()
  };
  return { method, rawBody: Buffer.from(raw), body: evt, headers, get: (n) => headers[String(n).toLowerCase()] };
}
function makeRes() {
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  const res = {
    statusCode: 200, body: undefined, done,
    status(c) { res.statusCode = c; return res; },
    send(b) { res.body = b; resolve(res); return res; },
    end(b) { res.body = b; resolve(res); return res; },
    set() { return res; }, setHeader() { return res; }, getHeader() { return undefined; },
    on() { return res; }, once() { return res; }, emit() { return false; }, removeListener() { return res; }
  };
  return res;
}
async function deliver(evt, opts = {}) {
  mock.verify = opts.verify || 'SUCCESS';
  const res = makeRes();
  await Promise.all([Promise.resolve(fns.paypalSubscriptionWebhook(makeReq(evt, opts), res)), res.done]);
  return res;
}
const callable = (fn, uid, data, token = {}) => fn.run({ auth: uid ? { uid, token } : undefined, data });

/* ---- Firestore helpers (Admin SDK against the emulator) ---- */
const get = async (col, id) => { const s = await db.collection(col).doc(id).get(); return s.exists ? s.data() : null; };
const notifications = async (uid) => (await db.collection('notifications').doc(uid).collection('items').get()).docs.map((d) => d.data());
const seedUser = (uid, extra = {}) => db.collection('users').doc(uid).set({ canonicalRole: 'seeker', ...extra });
const seedMapping = (subId, uid) => db.collection('paypalSubscriptions').doc(subId)
  .set({ uid, planId: PLAN_ID, status: 'APPROVAL_PENDING', provider: 'paypal' });
const seedPayPalEntitlement = (uid, subscriptionId) => db.collection('subscriptionEntitlements').doc(uid).set({
  active: true, source: 'paypal', provider: 'paypal', planId: PLAN_ID, subscriptionId,
  endsAt: Timestamp.fromDate(new Date('2030-01-01T00:00:00Z'))
});
const assertNoUnmockedNetwork = (assert) => assert.deepEqual(mock.unmocked, [], 'code under test made an unmocked network call');
const gap = (issue, why) => ({ todo: `${issue}: ${why}` });

module.exports = {
  PLAN_ID, ADMIN_UID, mock, fns, db, Timestamp, newUid, newSubId, sub, event, saleEvent,
  deliver, callable, get, notifications, seedUser, seedMapping, seedPayPalEntitlement,
  assertNoUnmockedNetwork, gap, EMULATOR_HOST
};
