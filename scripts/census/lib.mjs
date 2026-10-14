// Read-only aggregate census of a Firestore database.
// Counts and dates only: no document field value is ever returned. The only calls are count()
// aggregations and one createdAt read per edge (oldest/newest), of which only the date is kept.

const ROLES = ['owner', 'seeker', 'broker', 'admin', 'moderator', 'staff'];
const ID_STATES = ['none', 'pending', 'approved', 'rejected'];
const SUBSCRIPTION_STATES = ['active', 'pending_verification', 'payment_failed', 'cancelled', 'suspended', 'expired'];
const CONTRACT_STATES = ['pending_confirmation', 'active', 'expired'];

export async function runCensus(db, { project = null, database = null, now = new Date() } = {}) {
  const notes = [];
  const note = (label, error) => notes.push(`${label}: ${String(error?.message || error).slice(0, 140)}`);

  const count = async (query, label) => {
    try { return (await query.count().get()).data().count; } catch (error) { note(label, error); return null; }
  };
  const edge = async (collection, direction, label) => {
    try {
      const snap = await db.collection(collection).orderBy('createdAt', direction).limit(1).get();
      if (snap.empty) return null;
      const raw = snap.docs[0].get('createdAt');
      const date = raw && typeof raw.toDate === 'function' ? raw.toDate() : new Date(raw);
      return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10); // the date only
    } catch (error) { note(label, error); return null; }
  };
  const where = (collection, field, value) => db.collection(collection).where(field, '==', value);
  const tally = async (collection, field, values, label) => {
    const out = {};
    for (const value of values) out[value] = await count(where(collection, field, value), `${label}.${value}`);
    return out;
  };

  const users = {
    total: await count(db.collection('users'), 'users.total'),
    byRole: await tally('users', 'canonicalRole', ROLES, 'users.byRole'),
    suspended: await count(where('users', 'suspended', true), 'users.suspended'),
    idVerification: await tally('users', 'idVerification.status', ID_STATES, 'users.idVerification'),
    subscription: await tally('users', 'subscription.status', SUBSCRIPTION_STATES, 'users.subscription'),
    oldestCreatedAt: await edge('users', 'asc', 'users.oldest'),
    newestCreatedAt: await edge('users', 'desc', 'users.newest')
  };
  const propertyListings = {
    total: await count(db.collection('propertyListings'), 'propertyListings.total'),
    oldestCreatedAt: await edge('propertyListings', 'asc', 'propertyListings.oldest'),
    newestCreatedAt: await edge('propertyListings', 'desc', 'propertyListings.newest')
  };
  const wantedListings = { total: await count(db.collection('wantedListings'), 'wantedListings.total') };
  const contracts = {
    total: await count(db.collection('contracts'), 'contracts.total'),
    byStatus: await tally('contracts', 'status', CONTRACT_STATES, 'contracts.byStatus')
  };
  const subscriptions = {
    entitlements: {
      total: await count(db.collection('subscriptionEntitlements'), 'entitlements.total'),
      active: await count(where('subscriptionEntitlements', 'active', true), 'entitlements.active'),
      activeFromPayPal: await count(where('subscriptionEntitlements', 'source', 'paypal').where('active', '==', true), 'entitlements.activeFromPayPal'),
      activeFromAdminSmokeTest: await count(where('subscriptionEntitlements', 'source', 'admin_smoke_test').where('active', '==', true), 'entitlements.activeFromAdminSmokeTest')
    },
    adminGrants: await count(db.collection('subscriptionAdminGrants'), 'adminGrants.total'),
    paypalBindings: await count(db.collection('paypalSubscriptions'), 'paypalBindings.total'),
    webhookEvents: {
      total: await count(db.collection('paypalWebhookEvents'), 'webhookEvents.total'),
      failed: await count(where('paypalWebhookEvents', 'status', 'failed'), 'webhookEvents.failed')
    }
  };
  const boostOrders = {
    total: await count(db.collection('boostOrders'), 'boostOrders.total'),
    pendingPayment: await count(where('boostOrders', 'status', 'pending_payment'), 'boostOrders.pendingPayment')
  };
  const publicProfiles = { total: await count(db.collection('publicProfiles'), 'publicProfiles.total') };

  return {
    census: { generatedAt: now.toISOString(), project, database, readOnly: true, contents: 'counts and dates only' },
    users, publicProfiles, propertyListings, wantedListings, contracts, subscriptions, boostOrders, notes
  };
}
