// Subscription logic for the Supabase Edge bridge (Firebase <-> PayPal).
// Port of the Cloud Function subscription path, including the #28 fixes:
//  - the account is proven by custom_id (= uid) or an exact email match; no proof means no binding and no grant;
//  - a binding is created once and never re-pointed;
//  - a HomeFinder-plan event with no binding fails (non-2xx) so PayPal retries it;
//  - the webhook ledger is idempotent under concurrency (create-if-absent, then a precondition-guarded takeover).
import { SERVER_TIME, increment } from './firestore.mjs';

export const HOMEFINDER_PLAN_ID = 'P-4NX50080BD8317322NKDAODA';

export class BridgeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BridgeError';
    this.code = code;
  }
}

const SUBSCRIPTION_ID = /^I-[A-Z0-9]+$/i;
const EVENT_ID = /^[A-Za-z0-9._:-]{1,200}$/;
const STALE_PROCESSING_MS = 10 * 60 * 1000;

export const HANDLED_SUBSCRIPTION_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.EXPIRED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'PAYMENT.SALE.COMPLETED'
]);

const planOf = (deps) => deps.planId || HOMEFINDER_PLAN_ID;
const nowOf = (deps) => (deps.now ? deps.now() : new Date());

export async function createUserNotification(deps, uid, payload) {
  if (!uid) return;
  await deps.fs.add(`notifications/${uid}/items`, {
    ...payload,
    read: false,
    dismissed: false,
    createdAt: SERVER_TIME,
    source: payload.source || 'system'
  });
}

/** Same rule as the Cloud Function requireActiveUser: a suspended account is refused. */
export async function requireActiveUser(deps, uid) {
  if (!uid) throw new BridgeError('unauthenticated', 'Sign in required.');
  const snap = await deps.fs.get(`users/${uid}`);
  if (!snap) throw new BridgeError('not-found', 'User profile not found.');
  const data = snap.data || {};
  const until = data.suspendedUntil ? new Date(data.suspendedUntil) : null;
  if (data.suspended === true && (!until || until.getTime() > nowOf(deps).getTime())) {
    throw new BridgeError('permission-denied', 'Account is suspended.');
  }
  return data;
}

async function activateSubscriptionForUid(deps, uid, sub, eventType) {
  const now = nowOf(deps);
  const snap = await deps.fs.get(`users/${uid}`);
  const prior = (snap && snap.data && snap.data.subscription) || {};
  const nextBilling = sub.billing_info?.next_billing_time || prior.nextBillingAt || null;
  const planId = sub.plan_id || planOf(deps);
  // One atomic commit: the profile summary and the canonical entitlement change together.
  await deps.fs.mergeMany([
    {
      path: `users/${uid}`,
      data: {
        subscription: {
          status: 'active',
          provider: 'paypal',
          planId,
          subscriptionId: sub.id,
          initialSetupFeePhp: 499.99,
          freeMonths: 3,
          annualPhp: 4999.99,
          activatedAt: prior.activatedAt || SERVER_TIME,
          introductoryPeriodEndsAt: nextBilling,
          nextBillingAt: nextBilling,
          lastProviderEvent: eventType,
          lastProviderEventAt: now
        }
      }
    },
    {
      path: `subscriptionEntitlements/${uid}`,
      data: {
        active: true,
        source: 'paypal',
        provider: 'paypal',
        planId,
        subscriptionId: sub.id,
        startsAt: prior.activatedAt || now,
        endsAt: nextBilling ? new Date(nextBilling) : null,
        updatedAt: now,
        lastProviderEvent: eventType
      }
    }
  ]);
  await createUserNotification(deps, uid, {
    type: 'subscription_activated',
    message: 'Subscription active — ₱499.99 initial payment + 3 free months confirmed. Annual ₱4,999.99 billing begins after the introductory period.',
    source: 'paypal'
  });
}

async function deactivateSubscriptionEntitlement(deps, uid, eventType) {
  if (!uid) return;
  const now = nowOf(deps);
  await deps.fs.merge(`subscriptionEntitlements/${uid}`, {
    active: false,
    source: 'paypal',
    updatedAt: now,
    lastProviderEvent: eventType,
    endsAt: now
  });
}

const markUserSubscription = (deps, uid, status, type) => deps.fs.merge(`users/${uid}`, {
  subscription: { status, lastProviderEvent: type, lastProviderEventAt: SERVER_TIME }
});

/** Only HomeFinder's own plan needs a binding; other plans on the same PayPal app are ignored. */
async function classifySubscriptionPlan(deps, subscriptionId) {
  const id = String(subscriptionId || '').trim();
  if (!SUBSCRIPTION_ID.test(id)) return 'foreign';
  try {
    const sub = await deps.paypal.getSubscription(id);
    return sub.plan_id === planOf(deps) ? 'homefinder' : 'foreign';
  } catch (error) {
    if (/\(404\)/.test(String(error?.message || ''))) return 'foreign';
    throw error;
  }
}

/**
 * Records a PayPal subscription approval for a signed-in, active account.
 * identity: { uid, email } from a verified Firebase ID token.
 */
export async function recordApproval({ uid, email, subscriptionId }, deps) {
  if (!SUBSCRIPTION_ID.test(subscriptionId)) throw new BridgeError('invalid-argument', 'Invalid PayPal subscription ID.');

  const sub = await deps.paypal.getSubscription(subscriptionId);
  if (sub.plan_id !== planOf(deps)) throw new BridgeError('failed-precondition', 'Unexpected HomeFinder subscription plan.');

  const firebaseEmail = String(email || '').trim().toLowerCase();
  const paypalEmail = String(sub.subscriber?.email_address || '').trim().toLowerCase();
  const customId = String(sub.custom_id || '').trim();
  if (customId && customId !== uid) {
    throw new BridgeError('permission-denied', 'This PayPal subscription was created for a different HomeFinder account.');
  }
  const proofByCustomId = customId !== '' && customId === uid;
  const proofByEmail = !!firebaseEmail && !!paypalEmail && firebaseEmail === paypalEmail;
  if (!proofByCustomId && firebaseEmail && paypalEmail && !proofByEmail) {
    throw new BridgeError('permission-denied', 'The PayPal subscriber does not match the signed-in HomeFinder account.');
  }
  if (!proofByCustomId && !proofByEmail) {
    await createUserNotification(deps, uid, {
      type: 'subscription_pending',
      message: 'PayPal approved your subscription, but HomeFinder could not match it to this account automatically. Support will verify it before enabling premium benefits.',
      source: 'paypal'
    });
    return { status: 'pending_verification', subscriptionId };
  }

  // Bind once: an existing binding to another account is never re-pointed.
  const bindingPath = `paypalSubscriptions/${subscriptionId}`;
  const binding = {
    uid,
    planId: sub.plan_id,
    status: sub.status,
    provider: 'paypal',
    subscriberEmail: sub.subscriber?.email_address || null,
    paypalPayerId: sub.subscriber?.payer_id || null,
    lastVerifiedAt: SERVER_TIME
  };
  if (!(await deps.fs.createIfAbsent(bindingPath, binding))) {
    const existing = await deps.fs.get(bindingPath);
    const boundUid = existing?.data?.uid || null;
    if (boundUid && boundUid !== uid) {
      throw new BridgeError('already-exists', 'This PayPal subscription is already linked to another HomeFinder account.');
    }
    await deps.fs.merge(bindingPath, binding);
  }

  if (sub.status === 'ACTIVE') {
    await activateSubscriptionForUid(deps, uid, sub, 'BILLING.SUBSCRIPTION.ACTIVATED');
    return { status: 'active', subscriptionId };
  }
  await createUserNotification(deps, uid, {
    type: 'subscription_pending',
    message: 'PayPal approved your subscription. HomeFinder is verifying it before enabling premium benefits.',
    source: 'paypal'
  });
  return { status: 'pending_verification', subscriptionId };
}

/**
 * Idempotent ledger: the first delivery creates the entry atomically; a duplicate sees it and stops.
 * A failed or stale "processing" entry is taken over with an updateTime precondition, so two
 * concurrent retries cannot both win.
 */
async function acquireLedger(deps, eventId, eventType) {
  const path = `paypalWebhookEvents/${eventId}`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const created = await deps.fs.createIfAbsent(path, {
      eventType,
      status: 'processing',
      attemptCount: 1,
      receivedAt: SERVER_TIME,
      processingStartedAt: SERVER_TIME
    });
    if (created) return true;
    const snap = await deps.fs.get(path);
    if (!snap) continue;
    const { status, processingStartedAt } = snap.data;
    if (status === 'processed') return false;
    if (status === 'processing') {
      const started = processingStartedAt instanceof Date ? processingStartedAt.getTime() : 0;
      const stale = !started || nowOf(deps).getTime() - started > STALE_PROCESSING_MS;
      if (!stale) return false;
    }
    const tookOver = await deps.fs.updateIfUnchanged(path, {
      status: 'processing',
      attemptCount: increment(1),
      processingStartedAt: SERVER_TIME,
      lastRetryAt: SERVER_TIME
    }, snap.updateTime);
    if (tookOver) return true;
  }
  return false;
}

/** Returns { status, body }. headers is a Fetch API Headers object. */
export async function handleWebhook({ headers, rawBody }, deps) {
  let event = null;
  try {
    await deps.paypal.verifyWebhook(headers, rawBody);
    event = JSON.parse(rawBody);
    const eventId = String(event?.id || '');
    if (!EVENT_ID.test(eventId)) return { status: 400, body: 'Invalid event id' };

    if (!(await acquireLedger(deps, eventId, event.event_type || null))) return { status: 200, body: 'duplicate' };

    const resource = event.resource || {};
    const type = String(event.event_type || '');
    // Sale-style events carry their own id in resource.id and name the subscription in
    // billing_agreement_id; subscription events carry the subscription id in resource.id.
    const subscriptionId =
      resource.billing_agreement_id ||
      resource.supplementary_data?.related_ids?.subscription_id ||
      resource.id ||
      null;
    const binding = subscriptionId ? await deps.fs.get(`paypalSubscriptions/${subscriptionId}`) : null;
    const uid = binding?.data?.uid || null;

    // A HomeFinder subscription that is not bound yet must not be acknowledged: fail the
    // delivery so PayPal retries after the binding exists.
    if (!uid && subscriptionId && HANDLED_SUBSCRIPTION_EVENTS.has(type)) {
      if ((await classifySubscriptionPlan(deps, subscriptionId)) === 'homefinder') {
        throw new Error('HomeFinder subscription is not bound to an account yet; PayPal should retry.');
      }
    }

    if (uid && type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const sub = await deps.paypal.getSubscription(String(subscriptionId));
      if (sub.plan_id === planOf(deps)) await activateSubscriptionForUid(deps, uid, sub, type);
    } else if (uid && type === 'PAYMENT.SALE.COMPLETED') {
      await createUserNotification(deps, uid, { type: 'subscription_payment_received', message: 'Subscription payment received successfully by PayPal.', source: 'paypal' });
    } else if (uid && type === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
      // Grace-period semantics remain TBD: do not deactivate the entitlement from this event.
      await markUserSubscription(deps, uid, 'payment_failed', type);
      await createUserNotification(deps, uid, { type: 'subscription_payment_failed', source: 'paypal' });
    } else if (uid && type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      await deactivateSubscriptionEntitlement(deps, uid, type);
      await markUserSubscription(deps, uid, 'cancelled', type);
      await createUserNotification(deps, uid, { type: 'subscription_cancelled', source: 'paypal' });
    } else if (uid && type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      await deactivateSubscriptionEntitlement(deps, uid, type);
      await markUserSubscription(deps, uid, 'suspended', type);
      await createUserNotification(deps, uid, { type: 'subscription_suspended', source: 'paypal' });
    } else if (uid && type === 'BILLING.SUBSCRIPTION.EXPIRED') {
      await deactivateSubscriptionEntitlement(deps, uid, type);
      await markUserSubscription(deps, uid, 'expired', type);
      await createUserNotification(deps, uid, { type: 'subscription_expired', source: 'paypal' });
    }

    await deps.fs.merge(`paypalWebhookEvents/${eventId}`, { status: 'processed', processedAt: SERVER_TIME });
    return { status: 200, body: 'ok' };
  } catch (error) {
    console.error('paypal-webhook', error?.message || error);
    try {
      const eventId = String(event?.id || '');
      if (eventId && EVENT_ID.test(eventId)) {
        await deps.fs.merge(`paypalWebhookEvents/${eventId}`, {
          status: 'failed',
          lastError: String(error?.message || error),
          failedAt: SERVER_TIME
        });
      }
    } catch (ledgerError) {
      console.error('paypal-webhook failure ledger', ledgerError?.message || ledgerError);
    }
    return { status: 400, body: 'invalid webhook' };
  }
}
