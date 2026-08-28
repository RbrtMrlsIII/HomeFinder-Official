/* HF-BUILD-2026-08-11-V13 | file: index.js | DO NOT USE OLD CACHE PATH */
/* ================================ */
/*  CLOUD FUNCTIONS                 */
/* ================================ */
/* Server-side half of docs/CONTRACT-TIER-SYSTEM.md. Nothing here    */
/* runs until this is deployed with `firebase deploy --only          */
/* functions` from a real Firebase project with the Blaze plan.     */
/* It cannot run inside a static-site preview.                       */
/*                                                                    */
/* CONFIRMATION IS IN-APP, NOT EMAIL: earlier draft of this file      */
/* used the Firebase "Trigger Email" extension + a signed link, but   */
/* that's dropped now -- see docs/CONTRACT-TIER-SYSTEM.md's "MERGE    */
/* NOTES" section. checkExpiredContracts below writes to a            */
/* notifications/{uid} collection instead of mail/, and confirmContract */
/* is now a signed-in callable function instead of an emailed link.   */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

const tiers = require("./tiers.js");
const { canonicalRoleForUser, normalizeCanonicalRole } = require("./canonical-authority.js");

const { defineSecret } = require("firebase-functions/params");
const paypalSubscriptionClientSecret = defineSecret("PAYPAL_SUBSCRIPTION_CLIENT_SECRET");
const paypalSubscriptionWebhookId = defineSecret("PAYPAL_SUBSCRIPTION_WEBHOOK_ID");
const PAYPAL_SUBSCRIPTION_CLIENT_ID = "BAA6Y8Yb5zT6fLFzVn9rppFPodYyjfzqbekfstZaii2zz4B6jb0EKlHp56JMkq52k4JAGzI2hZRyQQWRx4";
const PAYPAL_SUBSCRIPTION_PLAN_ID = "P-4NX50080BD8317322NKDAODA";

admin.initializeApp();
// MUST match the database name js/firebase.js's client connects to
// Named Firestore database: homefinder.
// admin.firestore() with no args always means the default database,
// which is a completely separate, empty database from the named one
// the app actually uses. Any function using `db` was silently reading/
// writing data the client-side app could never see, and vice versa.
const db = getFirestore(admin.app(), "homefinder");

const { publicProfileFromUserData } = require("./publicProfileProjection");

/**
 * Defense-in-depth account suspension guard. Firestore suspension is the
 * application state; Firebase Auth `disabled` is synchronized by the
 * trusted trigger below. This guard prevents an already-issued token from
 * continuing to use sensitive callable operations after suspension.
 */
async function requireActiveUser(request) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) throw new HttpsError("not-found", "User profile not found.");
  const data = snap.data() || {};
  const until = data.suspendedUntil
    ? new Date(typeof data.suspendedUntil.toDate === "function"
        ? data.suspendedUntil.toDate().toISOString()
        : data.suspendedUntil)
    : null;
  if (data.suspended === true && (!until || until.getTime() > Date.now())) {
    throw new HttpsError("permission-denied", "Account is suspended.");
  }
  return { uid, data };
}

function onCallActive(handler) {
  return onCall(async request => {
    await requireActiveUser(request);
    return handler(request);
  });
}

exports.checkPhoneAvailability = onCall(async (request) => {
  const digits = String(request.data?.phone || "").replace(/\D/g, "");
  if (!/^63\d{10}$/.test(digits)) {
    throw new HttpsError("invalid-argument", "Philippine mobile number must be exactly 12 digits (639XXXXXXXXX).");
  }
  const snap = await db.collection("phoneIndex").doc(digits).get();
  return { available: !snap.exists };
});

exports.claimVerifiedPhone = onCallActive(async request => {
  const uid = request.auth.uid;
  const phone = String(request.auth.token?.phone_number || "").replace(/\D/g, "");
  if (!/^63\d{10}$/.test(phone)) {
    throw new HttpsError("failed-precondition", "A verified Philippine Phone Auth identity is required.");
  }

  const ref = db.collection("phoneIndex").doc(phone);
  const userRef = db.collection("users").doc(uid);
  await db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists && existing.data()?.uid !== uid) {
      throw new HttpsError("already-exists", "This mobile number is already associated with another HomeFinder account.");
    }
    tx.set(ref, {
      uid,
      phone,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    tx.set(userRef, {
      phone,
      phoneDigits: phone,
      phoneVerified: true,
      phoneVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  return { verified: true, phone };
});

exports.getConversationPeerProfile = onCallActive(async (request) => {
  const uid = request.auth?.uid;
  const peerUid = String(request.data?.peerUid || "").trim();
  const conversationId = String(request.data?.conversationId || "").trim();
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  if (!peerUid || !conversationId || peerUid === uid) {
    throw new HttpsError("invalid-argument", "Valid conversation and peer are required.");
  }

  const convo = await db.collection("conversations").doc(conversationId).get();
  if (!convo.exists) throw new HttpsError("not-found", "Conversation not found.");
  const participantIds = Array.isArray(convo.data()?.participantIds) ? convo.data().participantIds : [];
  if (!participantIds.includes(uid) || !participantIds.includes(peerUid)) {
    throw new HttpsError("permission-denied", "You are not a participant in this conversation.");
  }

  const peer = await db.collection("users").doc(peerUid).get();
  if (!peer.exists) throw new HttpsError("not-found", "Profile not found.");
  const data = peer.data() || {};
  const verificationStatus = String(data.idVerification?.status || "").toLowerCase();
  return {
    uid: peerUid,
    firstName: data.firstName || "",
    surname: data.surname || data.lastName || "",
    canonicalRole: normalizeCanonicalRole(data.canonicalRole || data.accountType || data.role) || null,
    avatarUrl: data.avatarUrl || "",
    verifiedBadge: verificationStatus === "verified" || verificationStatus === "approved" || data.verified === true,
    hideOnline: data.privacy?.hideOnlineStatus === true,
    lastActiveAt: data.lastActiveAt || null,
  };
});

exports.syncPublicProfile = onDocumentWritten({ document: "users/{uid}", database: "homefinder" }, async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after;
  const ref = db.collection("publicProfiles").doc(uid);
  if (!after || !after.exists) {
    await ref.delete().catch(() => {});
    return;
  }
  const data = publicProfileFromUserData(after.data() || {});
  if (!data.searchable) {
    await ref.set({ uid, searchable: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: false });
    return;
  }
  await ref.set({ uid, ...data }, { merge: false });
});

/* -------- tier update helper (runs inside a transaction) -------- */

async function applyTierUpdate(transaction, {
    role, uid, category, propertyId, outcome, monthsSustained,
    satisfaction, isRentToOwn, classification, contractType
}){
    const tierRef = db.collection("users").doc(uid).collection("tier").doc(role);
    const tierSnap = await transaction.get(tierRef);
    const data = tierSnap.exists ? tierSnap.data() : {};

    const type = contractType || (isRentToOwn ? "rent_to_own" : "rent");
    const monthsPaid = Math.max(0, Number(monthsSustained) || 0);
    const yearsOwned = monthsPaid / 12;
    const gained = tiers.contractPoints({
        classification: classification || "",
        type,
        monthsPaid,
        outcome,
        yearsOwned
    });

    if(role === "seeker"){
        const perCategory = { ...(data.byCategory || {}) };
        const current = perCategory[category] || 0;
        // Cancelled contracts still credit months paid only (no sale/RTO success bonus path for pure cancel).
        perCategory[category] = current + gained;

        const tierIndexByCategory = {};
        let highestIndex = 0;
        let totalPoints = 0;
        for(const cat of tiers.CATEGORIES){
            const pts = perCategory[cat] || 0;
            totalPoints += pts;
            const idx = tiers.seekerTierIndex(pts);
            tierIndexByCategory[cat] = idx;
            highestIndex = Math.max(highestIndex, idx);
        }

        transaction.set(tierRef, {
            byCategory: perCategory,
            tierIndexByCategory,
            totalPoints,
            highestIndex,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    if(role === "owner"){
        const totalPoints = (data.totalPoints || 0) + gained;
        const completedContracts = (data.completedContracts || 0) + (outcome === "completed" ? 1 : 0);
        const satisfactionSum = (data.satisfactionSum || 0) + (satisfaction || 0);
        const satisfactionCount = (data.satisfactionCount || 0) + (satisfaction != null ? 1 : 0);
        const avgSatisfaction = satisfactionCount > 0 ? satisfactionSum / satisfactionCount : 0;
        const highestIndex = tiers.ownerTierIndex(completedContracts, avgSatisfaction, totalPoints);

        transaction.set(tierRef, {
            totalPoints,
            completedContracts, satisfactionSum, satisfactionCount,
            highestIndex,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    if(role === "broker"){
        const byProperty = { ...(data.byProperty || {}) };
        const propertyEntry = { ...(byProperty[propertyId] || {}) };

        propertyEntry.points = (propertyEntry.points || 0) + gained;
        propertyEntry.satisfiedClosures = (propertyEntry.satisfiedClosures || 0)
            + (outcome === "completed" ? 1 : 0);
        propertyEntry.rentToOwnRescues = propertyEntry.rentToOwnRescues || 0;

        byProperty[propertyId] = propertyEntry;

        const { satisfiedClosures, rentToOwnRescues, totalPoints } = tiers.aggregateBrokerScore(byProperty);
        const highestIndex = tiers.brokerTierIndex(satisfiedClosures, rentToOwnRescues, totalPoints);

        transaction.set(tierRef, {
            byProperty,
            satisfiedClosures, rentToOwnRescues,
            totalPoints,
            highestIndex,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
}


async function createUserNotification(uid, payload) {
  if (!uid) return;
  await db.collection("notifications").doc(uid).collection("items").add({
    ...payload,
    read: false,
    dismissed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    source: payload.source || "system"
  });
}

function validPinCenter(center) {
  const lat = Number(center?.lat), lng = Number(center?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 4 && lat <= 21 && lng >= 116 && lng <= 127
    ? {lat, lng} : null;
}

function normalizePackageIds(line) {
  const ids = new Set();
  const raw = line || {};
  const map = raw.packages || raw.activePackages || null;
  if (map && typeof map === "object") {
    for (const [key, value] of Object.entries(map)) {
      const id = Number(key);
      if (!Number.isInteger(id) || id < 1 || id > 5) continue;
      if (value === true || (value && typeof value === "object" && tiers.resolveBoostPackageId(value) === id)) ids.add(id);
    }
  }
  return [...ids].sort((a,b)=>a-b);
}

function pinEntitlementFor(role, tierIndex, boostDoc) {
  const seekerIds = normalizePackageIds(boostDoc?.seeker);
  const ownerIds = normalizePackageIds(boostDoc?.owner);
  const r = String(role || "seeker");
  // One designated server capacity formula. Keep index.js from drifting
  // away from the canonical server tier engine as pin rules evolve.
  const capacity = tiers.maxPinsForAccount({
    role: r,
    tierIndex,
    seekerActivePackageIds: seekerIds,
    ownerActivePackageIds: ownerIds
  });
  return {
    capacity,
    seekerIds,
    ownerIds,
    tier3Bonus: Number(tierIndex) >= 3 ? 1 : 0
  };
}

function pinSlotAllowed(role, pinId, ent) {
  const id = String(pinId || "");
  if (role === "seeker" && !(id === "discovery-1" || id === "tier-3-pin" || id.startsWith("seeker-"))) return false;
  if (role === "owner" && !(id === "supply-1" || id === "tier-3-pin" || id.startsWith("owner-"))) return false;
  if (role === "broker" && !(
    id === "discovery-1" || id === "supply-1" || id === "tier-3-pin" ||
    id.startsWith("seeker-") || id.startsWith("owner-")
  )) return false;
  if (id.startsWith("seeker-") || id.startsWith("owner-")) {
    const [line, raw] = id.split("-");
    const pkg = Number(raw);
    if (![3,4,5].includes(pkg)) return false;
    return line === "seeker" ? ent.seekerIds.includes(pkg) : ent.ownerIds.includes(pkg);
  }
  if (id === "tier-3-pin") return ent.tier3Bonus === 1;
  return id === "discovery-1" || id === "supply-1";
}

function pinCooldownHours(role, tierIndex, boostDoc) {
  const line = role === "owner" ? boostDoc?.owner : boostDoc?.seeker;
  const packageId = tiers.resolveBoostPackageId(line);
  const base = [72,48,24,12,6,3][Math.max(0, Math.min(5, Number(tierIndex)||0))] ?? 72;
  const reduce = [0,0,6,12,18,24][Math.max(0, Math.min(5, packageId))] ?? 0;
  return Math.max(1, base - reduce);
}

function monthsBetween(start, end){
    const ms = end.getTime() - start.getTime();
    return ms / (1000 * 60 * 60 * 24 * 30.44); // avg month length
}

/* ================================================================
   1. checkExpiredContracts
   Daily. Flips "active" contracts past their expectedEndDate into
   "pending_confirmation" and writes an in-app notification for each
   party -- no email, per the merge decision (see docs/
   CONTRACT-TIER-SYSTEM.md's "MERGE NOTES"). The notification bell UI
   (js/profile/notifications.js) reads notifications/{uid}/items.
   ================================================================ */

exports.checkExpiredContracts = onSchedule("every 24 hours", async () => {
    const now = admin.firestore.Timestamp.now();

    const expired = await db.collection("contracts")
        .where("status", "==", "active")
        .where("expectedEndDate", "<=", now)
        .get();

    const batch = db.batch();

    for(const docSnap of expired.docs){
        const contract = docSnap.data();
        const contractId = docSnap.id;

        batch.update(docSnap.ref, {
            status: "pending_confirmation",
            pendingConfirmationSince: admin.firestore.FieldValue.serverTimestamp(),
            confirmations: {}
        });

        const parties = [
            { uid: contract.seekerId, role: "seeker" },
            { uid: contract.ownerId, role: "owner" }
        ];
        if(contract.brokerId){
            parties.push({ uid: contract.brokerId, role: "broker" });
        }

        for(const party of parties){
            const notifRef = db.collection("notifications").doc(party.uid)
                .collection("items").doc(); // auto-id
            batch.set(notifRef, {
                type: "confirm_contract",
                contractId,
                propertyId: contract.propertyId,
                role: party.role,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    await batch.commit();
    console.log(`checkExpiredContracts: flipped ${expired.size} contract(s) to pending_confirmation`);
});


/* Wanted saves mirror property favourites: owner/broker discovery may
 * bookmark a wanted request, while the request author cannot bookmark
 * their own request. Writes remain server-authoritative and idempotent.
 */
const WANTED_SAVE_ACTIONS = new Set(["save", "unsave"]);

exports.toggleWantedSave = onCallActive(async (request) => {
    const actorUid = request.auth?.uid;
    if (!actorUid) throw new HttpsError("unauthenticated", "Must be signed in.");

    const wantedId = String(request.data?.wantedId || "").trim();
    const action = String(request.data?.action || "").trim().toLowerCase();
    const requestId = cleanActivityRequestId(request.data?.requestId);
    if (!wantedId || !WANTED_SAVE_ACTIONS.has(action) || !requestId) {
        throw new HttpsError("invalid-argument", "wantedId, action and a stable requestId are required.");
    }

    const wantedRef = db.collection("wantedListings").doc(wantedId);
    const savedRef = db.collection("users").doc(actorUid).collection("savedWanted").doc(wantedId);
    const userRef = db.collection("users").doc(actorUid);

    return db.runTransaction(async transaction => {
        const [wantedSnap, savedSnap, userSnap] = await Promise.all([
            transaction.get(wantedRef),
            transaction.get(savedRef),
            transaction.get(userRef)
        ]);

        if (!wantedSnap.exists) throw new HttpsError("not-found", "Wanted listing not found.");
        const wanted = wantedSnap.data() || {};
        const status = String(wanted.status || "active").toLowerCase();
        const authorId = String(wanted.seekerId || wanted.uid || wanted.userId || "");
        if (!authorId || status !== "active" || wanted.deleted === true || wanted.hidden === true) {
            throw new HttpsError("failed-precondition", "Wanted listing is not publicly discoverable.");
        }
        if (authorId === actorUid) {
            throw new HttpsError("failed-precondition", "You cannot save your own wanted request.");
        }

        const role = normalizeCanonicalRole(userSnap.data()?.canonicalRole || userSnap.data()?.accountType || userSnap.data()?.role) || "seeker";
        if (!new Set(["owner", "broker"]).has(role)) {
            throw new HttpsError("permission-denied", "Only owner and broker accounts can save wanted listings.");
        }

        const currentlySaved = savedSnap.exists;
        const shouldBeSaved = action === "save";
        if (currentlySaved === shouldBeSaved) {
            return { success: true, noop: true, action, saved: currentlySaved };
        }

        if (shouldBeSaved) {
            transaction.set(savedRef, {
                wantedId,
                authorId,
                savedBy: actorUid,
                savedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            transaction.delete(savedRef);
        }

        return { success: true, action, saved: shouldBeSaved };
    });
});

/* ================================================================
   2. resolvePendingConfirmations
   Daily. Closes out contracts whose confirmation window has passed
   -- completed if BOTH seeker and owner confirmed, cancelled
   otherwise (never a tier deduction either way -- see §5.2).
   ================================================================ */

exports.resolvePendingConfirmations = onSchedule("every 24 hours", async () => {
    const cutoff = admin.firestore.Timestamp.fromMillis(
        Date.now() - CONFIRMATION_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    const pending = await db.collection("contracts")
        .where("status", "==", "pending_confirmation")
        .where("pendingConfirmationSince", "<=", cutoff)
        .get();

    for(const docSnap of pending.docs){
        const contract = docSnap.data();
        const confirmations = contract.confirmations || {};
        const bothConfirmed = !!confirmations.seeker && !!confirmations.owner;
        const outcome = bothConfirmed ? "completed" : "cancelled";

        const startDate = contract.startDate.toDate();
        const monthsSustained = monthsBetween(startDate, new Date());
        const isRentToOwn = contract.type === "rent_to_own";

        await db.runTransaction(async (transaction) => {
            const pointArgs = {
                category: contract.category,
                propertyId: contract.propertyId,
                outcome,
                monthsSustained,
                isRentToOwn,
                classification: contract.classification || contract.property_classification || "",
                contractType: contract.type || (isRentToOwn ? "rent_to_own" : "rent")
            };
            await applyTierUpdate(transaction, {
                role: "seeker", uid: contract.seekerId, ...pointArgs
            });
            await applyTierUpdate(transaction, {
                role: "owner", uid: contract.ownerId,
                satisfaction: contract.satisfactionRating, ...pointArgs
            });
            if(contract.brokerId){
                await applyTierUpdate(transaction, {
                    role: "broker", uid: contract.brokerId, ...pointArgs
                });
            }

            transaction.update(docSnap.ref, {
                status: outcome,
                durationPointsAwarded: tiers.durationPoints(monthsSustained),
                resolvedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Public-safe aggregate only -- the actual contract stays
            // access-restricted to its parties (see firestore.rules).
            // Owners/brokers can see THAT a user has cancellations,
            // never the private reason behind any one of them (§5.2).
            if(outcome === "cancelled"){
                transaction.set(db.collection("users").doc(contract.seekerId), {
                    cancelledContractCount: admin.firestore.FieldValue.increment(1)
                }, { merge: true });
            }
        });
    }

    console.log(`resolvePendingConfirmations: resolved ${pending.size} contract(s)`);
});

/* ================================================================
   3. confirmContract (callable, in-app)
   Called from js/profile/notifications.js when a signed-in user taps
   "Confirm" on a pending-confirmation notification. Auth-gated by
   Firebase Auth itself (request.auth.uid) -- no token/secret needed
   since the user is already signed into the app, unlike the emailed-
   link version this replaces (see docs/CONTRACT-TIER-SYSTEM.md's
   "MERGE NOTES").
   ================================================================ */


/* ================================================================
   Broker HQ — authorized discovery projection
   50 km is the hard maximum service-radius cap. The active service pin
   may choose a preferred radius at or below that cap.
   ================================================================ */
const brokerHQProjection = require("./brokerHQDiscoveryProjection.js");

exports.setBrokerServiceRadius = onCallActive(async (request) => {
    const uid = request.auth?.uid;
    if(!uid) throw new HttpsError("unauthenticated", "Sign-in required.");

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const user = userSnap.exists ? (userSnap.data() || {}) : {};
    const role = normalizeCanonicalRole(user.canonicalRole || user.accountType || user.role || request.auth?.token?.canonicalRole || request.auth?.token?.accountType) || "seeker";
    if(role !== "broker" && role !== "agent") {
        throw new HttpsError("permission-denied", "Broker service radius is broker-only.");
    }

    const pinId = String(request.data?.pinId || "supply-1");
    const pin = user?.pins?.[pinId] || {};
    const center = pin.center || user?.mapStateOwner?.lastKnownCenter;
    if(!center || !Number.isFinite(Number(center.lat)) || !Number.isFinite(Number(center.lng))) {
        throw new HttpsError("failed-precondition", "Set the service pin before choosing its radius.");
    }

    const tierSnap = await db.collection("users").doc(uid).collection("tier").doc("broker").get();
    const tierIndex = Number(tierSnap.data()?.highestIndex ?? tierSnap.data()?.index ?? 0) || 0;
    const boostSnap = await db.collection("boosts").doc(uid).get();
    const boost = boostSnap.exists ? (boostSnap.data() || {}) : {};
    const ent = pinEntitlementFor("broker", tierIndex, boost);
    if (!pinSlotAllowed("broker", pinId, ent)) {
        throw new HttpsError("permission-denied", "Pin slot is not currently entitled.");
    }

    const radiusKm = brokerHQProjection.normalizeBrokerHQRadius(request.data?.radiusKm);
    const payload = {
        preferredRadiusKm: radiusKm,
        radiusMaxKm: brokerHQProjection.BROKER_HQ_MAX_RADIUS_KM
    };
    await db.runTransaction(async tx => {
        const freshSnap = await tx.get(userRef);
        const fresh = freshSnap.exists ? (freshSnap.data() || {}) : {};
        const currentPins = {...(fresh.pins || {})};
        const currentPin = {...(currentPins[pinId] || {})};
        currentPin.preferredRadiusKm = radiusKm;
        currentPin.radiusMaxKm = brokerHQProjection.BROKER_HQ_MAX_RADIUS_KM;
        currentPins[pinId] = currentPin;

        const write = { pins: currentPins };
        if(pinId === "supply-1") {
            write.mapStateOwner = {
                ...(fresh.mapStateOwner || {}),
                ...payload
            };
        }
        tx.set(userRef, write, {merge:true});
    });

    return {
        success: true,
        pinId,
        preferredRadiusKm: radiusKm,
        maxRadiusKm: brokerHQProjection.BROKER_HQ_MAX_RADIUS_KM
    };
});

exports.brokerHQDiscover = onCallActive(async (request) => {
    const uid = request.auth?.uid;
    if(!uid) throw new HttpsError("unauthenticated", "Sign-in required.");

    const userSnap = await db.collection("users").doc(uid).get();
    const user = userSnap.exists ? (userSnap.data() || {}) : {};
    const role = normalizeCanonicalRole(user.canonicalRole || user.accountType || user.role || request.auth?.token?.canonicalRole || request.auth?.token?.accountType) || "seeker";
    if(role !== "broker" && role !== "agent"){
        throw new HttpsError("permission-denied", "Broker HQ discovery is broker-only.");
    }

    const requestId = String(request.data?.requestId || "");
    const userMapStateOwner = user?.mapStateOwner || {};
    const pinId = String(request.data?.pinId || "supply-1");
    const pinRecord = (user?.pins && user.pins[pinId]) || {};
    const storedCenter = pinRecord.center || userMapStateOwner.lastKnownCenter;
    const lat = Number(storedCenter?.lat);
    const lng = Number(storedCenter?.lng);
    if(!brokerHQProjection.validateBrokerHQPin({lat, lng})){
        throw new HttpsError("failed-precondition", "A stored Broker HQ service pin is required.");
    }

    const origin = { lat, lng };
    const selectedRadius = pinRecord.preferredRadiusKm ?? userMapStateOwner.preferredRadiusKm;
    const radiusKm = brokerHQProjection.normalizeBrokerHQRadius(selectedRadius);
    const requestedType = brokerHQProjection.normalizeDiscoveryType(request.data?.discoveryType || "all");
    const collections = brokerHQProjection.canonicalCollectionForDiscoveryType(requestedType);
    const records = [];

    for(const collectionName of collections){
        // Projection is intentionally bounded. Interactive filtering remains client-side.
        const snap = await db.collection(collectionName).limit(250).get();
        snap.forEach((docSnap) => {
            const record = brokerHQProjection.project(docSnap, collectionName, origin, uid);
            if(record && record.distanceKm <= radiusKm){
                if(requestedType === "propertyHelp" && !(record.marketKind === "property" && record.help)) return;
                if(requestedType === "wantedHelp" && !(record.marketKind === "wanted" && record.help)) return;
                if(requestedType === "property" && record.marketKind !== "property") return;
                if(requestedType === "wanted" && record.marketKind !== "wanted") return;
                records.push(record);
            }
        });
    }

    records.sort((a,b) => a.distanceKm - b.distanceKm);
    return {
        requestId,
        pinId,
        radiusKm,
        maxRadiusKm: brokerHQProjection.BROKER_HQ_MAX_RADIUS_KM,
        radiusSource: "broker_hq_preferred_pin_radius",
        radiusBoostApplied: false,
        subscriptionRadiusApplied: false,
        records: records.slice(0, 400),
        generatedAt: new Date().toISOString()
    };
});

/* ================================================================
   Patch 17 — Authoritative contract lifecycle
   ----------------------------------------------------------------
   Contract proposal/agreement/activation is server-authoritative.
   Normal clients never write contracts directly. The callable path
   validates canonical listing ownership, party identity and the
   agreement transition, then atomically records the qualifying
   listing_match event + listingStats.matches increment.
   Broker-assist rooms are deliberately excluded from listing-match
   statistics because assistance success is a different product event.
   ================================================================ */

const CONTRACT_STATUSES = new Set(["proposed", "active", "declined", "rejected", "completed", "finished", "closed", "cancelled"]);
const CONTRACT_ROLES = new Set(["seeker", "owner", "broker"]);

function normalizeContractRole(uid, contract) {
    if (contract.seekerId === uid) return "seeker";
    if (contract.ownerId === uid) return "owner";
    if (contract.brokerId === uid) return "broker";
    return null;
}

function contractPartyIds(contract) {
    return [contract.seekerId, contract.ownerId, contract.brokerId].filter(Boolean);
}

function contractRequiresListingMatch(contract) {
    return String(contract.type || contract.dealType || "").toLowerCase() !== "broker_assist"
        && !contract.assistanceRequestId
        && typeof contract.propertyId === "string"
        && contract.propertyId !== ""
        && typeof contract.seekerId === "string"
        && contract.seekerId !== ""
        && typeof contract.ownerId === "string"
        && contract.ownerId !== ""
        && contract.seekerId !== contract.ownerId;
}

function contractBothRequiredPartiesAgreed(contract, agreements) {
    const seekerOk = !contract.seekerId || agreements.seeker === true;
    const ownerOk = !contract.ownerId || agreements.owner === true;
    return seekerOk && ownerOk;
}

const LISTING_POINT_CAP_PER_DAY = 50;
const LISTING_POINT_VALUE = 5;

function utcDayKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function dailyPointsRef(uid, dayKey) {
    return db.collection("pointsDaily").doc(`${uid}__${dayKey}`);
}

function listingPointCategory(collectionName) {
    return collectionName === "wantedListings" ? "wanted" : "property";
}

function listingPointEvent(collectionName) {
    return collectionName === "wantedListings" ? "wanted_published" : "listing_published";
}

async function awardPublishedListingPointsInTransaction(transaction, { uid, listingId, collectionName, profile, event, points = LISTING_POINT_VALUE, source }) {
    if (!uid || !listingId || !profile) return false;
    const category = listingPointCategory(collectionName);
    const eventKey = `${category}_listing_${listingId}`;
    const ledgerRef = db.collection("pointsLedger").doc(
        `${uid}__${eventKey}`.replace(/[\/#]/g, "_").slice(0, 700)
    );
    const dayKey = utcDayKey();
    const dailyRef = dailyPointsRef(uid, dayKey);
    const userRef = db.collection("users").doc(uid);

    const ledgerSnap = await transaction.get(ledgerRef);
    if (ledgerSnap.exists) return false;

    const dailySnap = await transaction.get(dailyRef);
    const daily = dailySnap.exists ? (dailySnap.data() || {}) : {};
    const propertyPoints = Number(daily.propertyPoints || 0);
    const wantedPoints = Number(daily.wantedPoints || 0);
    const usedForCategory = category === "wanted" ? wantedPoints : propertyPoints;

    // Property points are owner+broker earnings. Wanted points are seeker+broker earnings.
    const role = normalizeCanonicalRole(profile.canonicalRole || profile.accountType || profile.role) || "seeker";
    const allowed = category === "property"
        ? ["owner", "broker"].includes(role)
        : ["seeker", "broker"].includes(role);
    if (!allowed || usedForCategory + points > LISTING_POINT_CAP_PER_DAY) return false;

    transaction.create(ledgerRef, {
        uid,
        event: event || listingPointEvent(collectionName),
        points,
        eventKey,
        meta: {
            listingId,
            collection: collectionName,
            category,
            role
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dayKey,
        source: source || "listing_publication"
    });

    transaction.set(dailyRef, {
        uid,
        dayKey,
        propertyPoints: propertyPoints + (category === "property" ? points : 0),
        wantedPoints: wantedPoints + (category === "wanted" ? points : 0),
        totalPoints: propertyPoints + wantedPoints + points,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const pointIncrement = points === 5
        ? admin.firestore.FieldValue.increment(5)
        : admin.firestore.FieldValue.increment(points);
    transaction.set(userRef, {
        organicPoints: pointIncrement,
        pointsUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return true;
}

async function awardListingPublishedInTransaction(transaction, uid, propertyId, profile) {
    return awardPublishedListingPointsInTransaction(transaction, {
        uid,
        listingId: propertyId,
        collectionName: "propertyListings",
        profile,
        event: "listing_published",
        points: 5,
        source: "listing_creation"
    });
}

function becameActive(before, after) {
    const beforeStatus = String(before?.status || before?.approvalStatus || "").toLowerCase();
    const afterStatus = String(after?.status || after?.approvalStatus || "").toLowerCase();
    return afterStatus === "active" && beforeStatus !== "active";
}

exports.awardPropertyListingPublicationPoints = onDocumentWritten(
    { document: "propertyListings/{propertyId}", database: "homefinder" },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!after || !becameActive(before, after)) return null;
        const uid = String(after.ownerId || "");
        if (!uid) return null;
        await db.runTransaction(async transaction => {
            const userSnap = await transaction.get(db.collection("users").doc(uid));
            const profile = userSnap.exists ? userSnap.data() : {};
            await awardPublishedListingPointsInTransaction(transaction, {
                uid, listingId: event.params.propertyId, collectionName: "propertyListings",
                profile, event: "listing_published", points: 5, source: "property_listing_activation"
            });
        });
        return null;
    }
);

exports.awardWantedListingPublicationPoints = onDocumentWritten(
    { document: "wantedListings/{wantedId}", database: "homefinder" },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!after || !becameActive(before, after)) return null;
        const uid = String(after.seekerId || after.uid || "");
        if (!uid) return null;
        await db.runTransaction(async transaction => {
            const userSnap = await transaction.get(db.collection("users").doc(uid));
            const profile = userSnap.exists ? userSnap.data() : {};
            await awardPublishedListingPointsInTransaction(transaction, {
                uid, listingId: event.params.wantedId, collectionName: "wantedListings",
                profile, event: "wanted_published", points: 5, source: "wanted_listing_activation"
            });
        });
        return null;
    }
);

async function awardContractMadeInTransaction(transaction, uid, contractId, contract) {
    if (!uid) return;
    const eventKey = `contract_active_${contractId}_${uid}`;
    const ledgerRef = db.collection("pointsLedger").doc(
        `${uid}__${eventKey}`.replace(/[\/#]/g, "_").slice(0, 700)
    );
    const userRef = db.collection("users").doc(uid);
    const [ledgerSnap, userSnap] = await Promise.all([
        transaction.get(ledgerRef),
        transaction.get(userRef)
    ]);
    if (ledgerSnap.exists) return;

    transaction.create(ledgerRef, {
        uid,
        event: "contract_made",
        points: 20,
        eventKey,
        meta: { contractId, propertyId: contract.propertyId || null },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dayKey: new Date().toISOString().slice(0, 10),
        source: "contract_activation"
    });

    const current = userSnap.exists ? Number(userSnap.data()?.organicPoints || 0) : 0;
    transaction.set(userRef, {
        organicPoints: current + 20,
        pointsUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

exports.createContract = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) throw new HttpsError("unauthenticated", "Must be signed in.");

    const data = request.data || {};
    const propertyId = String(data.propertyId || "").trim();
    const seekerId = String(data.seekerId || "").trim();
    const ownerId = String(data.ownerId || "").trim();
    const brokerId = data.brokerId ? String(data.brokerId).trim() : null;
    const type = String(data.type || data.dealType || "rent").trim();
    const isAssist = type === "broker_assist" || !!data.assistanceRequestId;

    if (!propertyId || !seekerId && !ownerId) {
        throw new HttpsError("invalid-argument", "A property and at least one contract party are required.");
    }
    if (seekerId && ownerId && seekerId === ownerId) {
        throw new HttpsError("invalid-argument", "Seeker and owner must be different accounts.");
    }
    if (!CONTRACT_STATUSES.has("proposed")) throw new HttpsError("internal", "Contract status configuration error.");

    const callerIsParty = [seekerId, ownerId, brokerId].filter(Boolean).includes(callerUid);
    if (!callerIsParty) throw new HttpsError("permission-denied", "You must be a party to the contract you create.");

    const listingRef = db.collection("propertyListings").doc(propertyId);
    let listingSnap = null;
    if (!isAssist || data.propertyId) {
        listingSnap = await listingRef.get();
        if (!listingSnap.exists && !isAssist) {
            throw new HttpsError("not-found", "Canonical property listing not found.");
        }
    }

    if (listingSnap?.exists) {
        const listing = listingSnap.data() || {};
        const listingOwner = String(listing.ownerId || "");
        if (ownerId && listingOwner && ownerId !== listingOwner) {
            throw new HttpsError("failed-precondition", "Contract owner does not match the canonical listing owner.");
        }
        if (!isAssist && String(listing.status || "active").toLowerCase() !== "active") {
            throw new HttpsError("failed-precondition", "Only an active canonical listing may start a normal contract.");
        }
    }

    if (!isAssist && (!seekerId || !ownerId)) {
        throw new HttpsError("invalid-argument", "Normal property contracts require both seeker and owner.");
    }
    if (isAssist && !brokerId) {
        throw new HttpsError("invalid-argument", "Broker-assist contracts require a broker party.");
    }
    if (isAssist && brokerId !== callerUid) {
        throw new HttpsError("permission-denied", "Only the assisting broker may open a broker-assist contract room.");
    }

    const contractId = String(data.contractId || db.collection("contracts").doc().id);
    const ref = db.collection("contracts").doc(contractId);
    const existing = await ref.get();
    if (existing.exists) {
        const existingData = existing.data() || {};
        if (contractPartyIds(existingData).includes(callerUid)) return { success: true, contractId, duplicate: true };
        throw new HttpsError("already-exists", "That contract id is already in use.");
    }

    const callerRole = normalizeContractRole(callerUid, { seekerId, ownerId, brokerId });
    const agreements = {
        seeker: !seekerId || callerRole === "seeker",
        owner: !ownerId || callerRole === "owner",
        broker: !brokerId || callerRole === "broker"
    };

    const payload = {
        propertyId,
        propertyTitle: String(data.propertyTitle || ""),
        seekerId,
        ownerId,
        brokerId,
        assistanceRequestId: data.assistanceRequestId ? String(data.assistanceRequestId) : null,
        status: "proposed",
        agreements,
        proposedBy: callerUid,
        conversationId: data.conversationId ? String(data.conversationId) : null,
        dealType: String(data.dealType || type),
        type,
        amount: data.amount ?? null,
        currency: String(data.currency || "PHP"),
        startDate: data.startDate || null,
        notes: String(data.notes || ""),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        activatedAt: null,
        matchRecordedAt: null
    };

    await ref.create(payload);

    const notifyUids = contractPartyIds(payload).filter(uid => uid !== callerUid);
    for (const uid of notifyUids) {
        await createUserNotification(uid, {
            type: "contract_proposed",
            message: `New contract proposal on ${payload.propertyTitle || "a property"}. Open Contracts to respond.`,
            contractId,
            conversationId: payload.conversationId,
            source: "contract_create"
        });
    }

    return { success: true, contractId, status: "proposed" };
});

exports.agreeContract = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    const contractId = String(request.data?.contractId || "").trim();
    if (!callerUid) throw new HttpsError("unauthenticated", "Must be signed in.");
    if (!contractId) throw new HttpsError("invalid-argument", "Missing contractId.");

    const contractRef = db.collection("contracts").doc(contractId);
    const matchEventRef = db.collection("listingActivity").doc(listingActivityEventId(`listing_match:contract:${contractId}`));

    return db.runTransaction(async transaction => {
        const contractSnap = await transaction.get(contractRef);
        if (!contractSnap.exists) throw new HttpsError("not-found", "Contract not found.");
        const contract = contractSnap.data() || {};
        const role = normalizeContractRole(callerUid, contract);
        if (!role || !CONTRACT_ROLES.has(role)) throw new HttpsError("permission-denied", "You are not a party to this contract.");
        if (contract.status !== "proposed") {
            return { success: true, contractId, status: contract.status, noop: true };
        }

        const agreements = { seeker: false, owner: false, broker: false, ...(contract.agreements || {}) };
        agreements[role] = true;
        const becomesActive = contractBothRequiredPartiesAgreed(contract, agreements);

        let matchRecorded = false;
        let statsRef = null;
        let statsSnap = null;
        let listingSnap = null;
        if (becomesActive && contractRequiresListingMatch(contract)) {
            const listingRef = db.collection("propertyListings").doc(contract.propertyId);
            statsRef = db.collection("listingStats").doc(contract.propertyId);
            [listingSnap, statsSnap] = await Promise.all([
                transaction.get(listingRef),
                transaction.get(statsRef)
            ]);
            if (!listingSnap.exists) throw new HttpsError("not-found", "Canonical property listing not found.");
            const listing = listingSnap.data() || {};
            if (String(listing.ownerId || "") !== String(contract.ownerId || "")) {
                throw new HttpsError("failed-precondition", "Contract owner no longer matches the canonical listing owner.");
            }
            if (String(listing.status || "active").toLowerCase() !== "active" || listing.deleted === true || listing.hidden === true) {
                throw new HttpsError("failed-precondition", "Listing is no longer publicly active.");
            }

            const eventSnap = await transaction.get(matchEventRef);
            if (!eventSnap.exists) {
                const ownerBoostSnap = await transaction.get(db.collection("boosts").doc(contract.ownerId));
                const tierSnap = await transaction.get(db.collection("users").doc(contract.ownerId).collection("tier").doc("owner"));
                const boost = ownerBoostSnap.exists ? (ownerBoostSnap.data()?.owner || {}) : {};
                const tier = tierSnap.exists ? (tierSnap.data() || {}) : {};
                const current = statsSnap?.exists ? (statsSnap.data() || {}) : {};
                transaction.create(matchEventRef, {
                    eventKey: `listing_match:contract:${contractId}`,
                    eventType: "listing_match",
                    listingId: contract.propertyId,
                    contractId,
                    ownerId: contract.ownerId,
                    actorUid: callerUid,
                    source: "contract_activation",
                    occurredAt: admin.firestore.FieldValue.serverTimestamp(),
                    activeBoostSnapshot: boostSnapshot(boost),
                    ownerTierSnapshot: { highestIndex: Number(tier.highestIndex || tier.index || 0) || 0 }
                });
                transaction.set(statsRef, {
                    listingId: contract.propertyId,
                    ownerId: contract.ownerId,
                    matches: Number(current.matches || 0) + 1,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                matchRecorded = true;
            }
        }

        transaction.update(contractRef, {
            agreements,
            status: becomesActive ? "active" : "proposed",
            activatedAt: becomesActive ? admin.firestore.FieldValue.serverTimestamp() : (contract.activatedAt || null),
            matchRecordedAt: becomesActive && matchRecorded ? admin.firestore.FieldValue.serverTimestamp() : (contract.matchRecordedAt || null),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastAgreedBy: callerUid
        });

        if (becomesActive) {
            for (const uid of contractPartyIds(contract)) {
                await awardContractMadeInTransaction(transaction, uid, contractId, contract);
            }
        }

        return { success: true, contractId, status: becomesActive ? "active" : "proposed", matchRecorded };
    });
});

exports.declineContract = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    const contractId = String(request.data?.contractId || "").trim();
    if (!callerUid) throw new HttpsError("unauthenticated", "Must be signed in.");
    if (!contractId) throw new HttpsError("invalid-argument", "Missing contractId.");
    const ref = db.collection("contracts").doc(contractId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Contract not found.");
    const contract = snap.data() || {};
    if (!normalizeContractRole(callerUid, contract)) throw new HttpsError("permission-denied", "You are not a party to this contract.");
    if (contract.status !== "proposed") throw new HttpsError("failed-precondition", "Only proposed contracts can be declined.");
    await ref.update({ status: "declined", declinedBy: callerUid, declinedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true, contractId, status: "declined" };
});

exports.renewContract = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    const contractId = String(request.data?.contractId || "").trim();
    if (!callerUid) throw new HttpsError("unauthenticated", "Must be signed in.");
    const snap = await db.collection("contracts").doc(contractId).get();
    if (!snap.exists) throw new HttpsError("not-found", "Contract not found.");
    const contract = snap.data() || {};
    if (!normalizeContractRole(callerUid, contract)) throw new HttpsError("permission-denied", "You are not a party to this contract.");
    if (!["completed", "finished"].includes(contract.status)) throw new HttpsError("failed-precondition", "Only finished contracts can be renewed.");
    const cid = db.collection("contracts").doc().id;
    const agreements = { seeker: false, owner: false, broker: false };
    const role = normalizeContractRole(callerUid, contract);
    if (role) agreements[role] = true;
    const payload = {
        ...contract,
        id: cid,
        status: "proposed",
        agreements,
        proposedBy: callerUid,
        renewedFrom: contractId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        activatedAt: null,
        matchRecordedAt: null,
        respondedBy: null
    };
    delete payload.resolvedAt;
    delete payload.durationPointsAwarded;
    await db.collection("contracts").doc(cid).create(payload);
    return { success: true, contractId: cid, status: "proposed" };
});

exports.hideContract = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    const contractId = String(request.data?.contractId || "").trim();
    if (!callerUid) throw new HttpsError("unauthenticated", "Must be signed in.");
    if (!contractId) throw new HttpsError("invalid-argument", "Missing contractId.");
    const ref = db.collection("contracts").doc(contractId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Contract not found.");
    const contract = snap.data() || {};
    if (!normalizeContractRole(callerUid, contract)) throw new HttpsError("permission-denied", "You are not a party to this contract.");
    const hiddenFor = Array.isArray(contract.hiddenFor) ? [...contract.hiddenFor] : [];
    if (!hiddenFor.includes(callerUid)) hiddenFor.push(callerUid);
    await ref.update({ hiddenFor, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true, contractId, hidden: true };
});

exports.markAssistanceSuccessful = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    const requestId = String(request.data?.requestId || "").trim();
    const contractId = String(request.data?.contractId || "").trim();
    if (!callerUid) throw new HttpsError("unauthenticated", "Must be signed in.");
    if (!requestId) throw new HttpsError("invalid-argument", "Missing assistance request.");

    const reqRef = db.collection("assistanceRequests").doc(requestId);
    const contractRef = contractId ? db.collection("contracts").doc(contractId) : null;
    const ledgerRef = db.collection("pointsLedger").doc(`${callerUid}__assist_${requestId}`);
    const userRef = db.collection("users").doc(callerUid);

    return db.runTransaction(async transaction => {
        const reqSnap = await transaction.get(reqRef);
        if (!reqSnap.exists) throw new HttpsError("not-found", "Assistance request not found.");
        const req = reqSnap.data() || {};
        if (req.claimedBy !== callerUid && req.posterId !== callerUid) {
            throw new HttpsError("permission-denied", "You are not authorized to complete this assistance request.");
        }
        if (req.status === "successful_assist") return { success: true, requestId, duplicate: true };

        let contract = null;
        if (contractRef) {
            const contractSnap = await transaction.get(contractRef);
            if (!contractSnap.exists) throw new HttpsError("not-found", "Linked contract not found.");
            contract = contractSnap.data() || {};
            if (contract.brokerId !== callerUid) throw new HttpsError("permission-denied", "Only the assisting broker can complete this assistance.");
        }

        const ledgerSnap = await transaction.get(ledgerRef);
        const userSnap = await transaction.get(userRef);
        transaction.update(reqRef, {
            status: "successful_assist",
            successfulAt: admin.firestore.FieldValue.serverTimestamp(),
            successfulBy: callerUid,
            contractId: contractId || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        if (contractRef) transaction.update(contractRef, {
            assistOutcome: "successful_assist",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        if (!ledgerSnap.exists) {
            const current = userSnap.exists ? Number(userSnap.data()?.organicPoints || 0) : 0;
            transaction.create(ledgerRef, {
                uid: callerUid,
                event: "successful_assist",
                points: 50,
                eventKey: `assist_${requestId}`,
                meta: { requestId, contractId: contractId || null },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                dayKey: new Date().toISOString().slice(0, 10),
                source: "assistance_completion"
            });
            transaction.set(userRef, {
                organicPoints: current + 50,
                pointsUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        return { success: true, requestId, contractId: contractId || null };
    });
});

exports.confirmContract = onCallActive(async (request) => {
    const { contractId } = request.data;
    const callerUid = request.auth?.uid;

    if(!callerUid){
        throw new Error("Must be signed in.");
    }
    if(!contractId){
        throw new Error("Missing contractId.");
    }

    const contractRef = db.collection("contracts").doc(contractId);
    const contractSnap = await contractRef.get();

    if(!contractSnap.exists || contractSnap.data().status !== "pending_confirmation"){
        throw new Error("This contract is no longer awaiting confirmation.");
    }

    const contract = contractSnap.data();
    let role;
    if(contract.seekerId === callerUid) role = "seeker";
    else if(contract.ownerId === callerUid) role = "owner";
    else if(contract.brokerId === callerUid) role = "broker";
    else throw new Error("You aren't a party on this contract.");

    await contractRef.update({
        [`confirmations.${role}`]: true
    });

    // clear the notification(s) this confirmation was responding to
    const notifItems = await db.collection("notifications").doc(callerUid)
        .collection("items")
        .where("contractId", "==", contractId)
        .where("read", "==", false)
        .get();
    const batch = db.batch();
    notifItems.forEach(doc => batch.update(doc.ref, { read: true }));
    await batch.commit();

    return { success: true, role };
});

/* ================================================================
   4. markRentToOwnRescue (callable, broker-only)
   Manual action -- a broker successfully mediates a rent-to-own
   contract that was heading toward cancellation back to completion.
   This is the "if they fix the issue" big tier bonus from §4.3 /
   §5.2. Not automatic; a broker (or an admin reviewing the case)
   triggers this explicitly, since "successfully resolved" isn't
   something a timer can detect on its own.
   ================================================================ */

/* ================================================================
   Listing schema validation (F-20, Flagged_bugs.md)
   The createListing callable below re-derives the cap server-side
   (fixing F-04), but previously accepted the client's `listing`
   payload almost as-is -- only ownerId/createdAt were stripped. A
   malformed or malicious payload could still land in `properties`
   with the right ownerId but garbage everywhere else. This mirrors
   the enum/field values actually rendered on the create-listing form
   (profile.html) and js/tiers.js's CATEGORY_OF_CLASSIFICATION, so it
   stays a source-of-truth check rather than a second copy of the
   list to drift out of sync -- classification validity is checked
   via tiers.categoryOf() itself, not a duplicated enum here.
   ================================================================ */

const PROXIMITY_VALUES = ["under_5mins", "5_15mins", "15_30mins", "over_30mins"];
const FLOOD_VALUES = ["safe", "low", "prone"];
const TRAFFIC_VALUES = ["predictable", "moderate_rush", "heavy_bottleneck"];
const BEDS_VALUES = ["1", "2", "4", "6_plus"];
const BATHROOMS_VALUES = ["1_private", "1_shared", "2_plus"];
const ISP_VALUES = ["pldt", "globe", "converge", "dito"];
const UTILITY_VALUES = ["wifi", "water", "electricity", "condo_dues"];
const AMENITY_VALUES = [
    "aircon", "loft_bed", "study_desk", "private_bathroom", "water_heater",
    "kitchenette", "balcony", "guard_cctv", "biometric", "generator",
    "laundry", "submeter", "elevator", "coworking", "roofdeck", "gym",
    "pool", "courier_lockers", "pet_friendly", "car_parking", "scooter_rack"
];

function isFiniteNumber(v){
    const n = Number(v);
    return v !== "" && v !== null && v !== undefined && Number.isFinite(n);
}

function isArrayOf(value, allowed){
    if(value === undefined) return true; // optional field, nothing to check
    if(!Array.isArray(value)) return false;
    return value.every(v => allowed.includes(v));
}

/**
 * Validates a listing payload before it's written to Firestore.
 * Returns { ok: true } or { ok: false, reason: "..." } -- never
 * throws itself, so the caller decides how to surface the failure.
 */
function validateListingShape(listing){
    // required keys -- mirrors the `required` attributes on the
    // create-listing form (profile.html). listing_title/address are
    // NOT required there, so they aren't required here either.
    const required = [
        "property_classification", "floor_area", "number_of_beds",
        "number_of_bathrooms", "flood_history",
        "proximity_government_services", "proximity_malls_entertainmemts",
        "proximity_schools", "proximity_public_transportations",
        "commute_traffic_indicators"
    ];
    for(const key of required){
        if(listing[key] === undefined || listing[key] === null || listing[key] === ""){
            return { ok: false, reason: `Missing required field: ${key}` };
        }
    }

    if(!tiers.categoryOf(listing.property_classification)){
        return { ok: false, reason: "Invalid property_classification." };
    }

    if(!isFiniteNumber(listing.floor_area) || Number(listing.floor_area) < 5 || Number(listing.floor_area) > 500){
        return { ok: false, reason: "floor_area must be a number between 5 and 500 sqm." };
    }

    if(!BEDS_VALUES.includes(listing.number_of_beds)){
        return { ok: false, reason: "Invalid number_of_beds." };
    }
    if(!BATHROOMS_VALUES.includes(listing.number_of_bathrooms)){
        return { ok: false, reason: "Invalid number_of_bathrooms." };
    }
    if(!FLOOD_VALUES.includes(listing.flood_history)){
        return { ok: false, reason: "Invalid flood_history." };
    }
    if(!TRAFFIC_VALUES.includes(listing.commute_traffic_indicators)){
        return { ok: false, reason: "Invalid commute_traffic_indicators." };
    }
    for(const field of ["proximity_government_services", "proximity_malls_entertainmemts", "proximity_schools", "proximity_public_transportations"]){
        if(!PROXIMITY_VALUES.includes(listing[field])){
            return { ok: false, reason: `Invalid ${field}.` };
        }
    }

    // exactly one price field, matching the client's either/or rule
    // (listing-form.js) -- but re-checked here since the client check
    // is fail-fast UX only, not enforcement.
    const hasMonthly = listing.monthly_price !== undefined && listing.monthly_price !== "";
    const hasPerBed = listing.per_bed_price !== undefined && listing.per_bed_price !== "";
    if(!hasMonthly && !hasPerBed){
        return { ok: false, reason: "Provide a monthly_price or per_bed_price." };
    }
    if(hasMonthly && (!isFiniteNumber(listing.monthly_price) || Number(listing.monthly_price) < 0)){
        return { ok: false, reason: "monthly_price must be a non-negative number." };
    }
    if(hasPerBed && (!isFiniteNumber(listing.per_bed_price) || Number(listing.per_bed_price) < 0)){
        return { ok: false, reason: "per_bed_price must be a non-negative number." };
    }

    if(!isArrayOf(listing.amenities, AMENITY_VALUES)){
        return { ok: false, reason: "Invalid amenities." };
    }
    if(!isArrayOf(listing.utilities, UTILITY_VALUES)){
        return { ok: false, reason: "Invalid utilities." };
    }
    if(!isArrayOf(listing.isp_providers, ISP_VALUES)){
        return { ok: false, reason: "Invalid isp_providers." };
    }

    // optional free-text fields -- type + length sanity only, no enum
    if(listing.listing_title !== undefined && (typeof listing.listing_title !== "string" || listing.listing_title.length > 200)){
        return { ok: false, reason: "listing_title must be a string under 200 characters." };
    }
    if(listing.address !== undefined && (typeof listing.address !== "string" || listing.address.length > 300)){
        return { ok: false, reason: "address must be a string under 300 characters." };
    }

    // lat/lng, if present, must be real coordinates roughly within the
    // Philippines (per the app's Nominatim geocoding bias in
    // js/profile/listing-form.js) -- catches garbage or swapped values
    // without being so strict it rejects legitimate edge-of-country pins.
    if(listing.lat !== undefined || listing.lng !== undefined){
        const lat = Number(listing.lat), lng = Number(listing.lng);
        if(!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 4 || lat > 21 || lng < 116 || lng > 127){
            return { ok: false, reason: "lat/lng must be valid coordinates within the Philippines." };
        }
    }

    return { ok: true };
}


/* ================================================================
   Listing activity + stats (Patch 14)
   ----------------------------------------------------------------
   One server-authoritative path for measurable property-listing events.
   Ordinary clients never write listingActivity/listingStats directly.
   ================================================================ */

const LISTING_ACTIVITY_TYPES = new Set(["listing_view", "listing_inquiry", "listing_impression"]);
const LISTING_STAT_FIELDS = Object.freeze({
    listing_view: "views",
    listing_inquiry: "inquiries",
    listing_impression: "impressions"
});

function cleanActivityRequestId(value) {
    const id = String(value || "").trim();
    return /^[A-Za-z0-9_-]{8,120}$/.test(id) ? id : null;
}

function listingActivityEventId(eventKey) {
    const crypto = require("node:crypto");
    return crypto.createHash("sha256").update(eventKey).digest("hex");
}

function boostSnapshot(ownerBoost = {}) {
    const packageId = tiers.resolveBoostPackageId(ownerBoost);
    return {
        active: packageId > 0,
        packageId,
        expiresAt: ownerBoost.expiresAt || null
    };
}


/* Patch 28 — Broker HQ workspace projection.
 * Server-authorized separation of broker-owned inventory, broker-assisted work,
 * and operational analytics. Uses existing collections only; no new schema.
 */
exports.brokerHQWorkspace = onCallActive(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign-in required.");
    const userSnap = await db.collection("users").doc(uid).get();
    const user = userSnap.exists ? (userSnap.data() || {}) : {};
    const role = normalizeCanonicalRole(user.canonicalRole || user.accountType || user.role) || "seeker";
    if (role !== "broker" && role !== "agent") {
        throw new HttpsError("permission-denied", "Broker HQ workspace is broker-only.");
    }

    const ownedInventory = [];
    const seenOwned = new Set();
    const own = async (collectionName, ownerFields) => {
        for (const field of ownerFields) {
            try {
                const snap = await db.collection(collectionName).where(field, "==", uid).limit(250).get();
                snap.forEach((docSnap) => {
                    if (seenOwned.has(`${collectionName}:${docSnap.id}`)) return;
                    seenOwned.add(`${collectionName}:${docSnap.id}`);
                    const d = docSnap.data() || {};
                    const coords = brokerHQProjection.coords ? brokerHQProjection.coords(d) : null;
                    ownedInventory.push({
                        id: docSnap.id,
                        collection: collectionName,
                        kind: collectionName === "wantedListings" ? "wanted" : "property",
                        title: d.listing_title || d.title || d.wantedTitle || d.name || "Listing",
                        type: String(d.property_classification || d.propertyType || d.wanted_classification || d.classification || d.type || ""),
                        status: String(d.status || d.approvalStatus || d.visibilityStatus || "active"),
                        coordinates: coords,
                        expiresAt: d.expiresAt || d.expiryAt || d.listingExpiresAt || null
                    });
                });
            } catch (e) { console.warn("brokerHQWorkspace own", collectionName, field, e.message || e); }
        }
    };
    await own("propertyListings", ["ownerId", "uid", "createdBy"]);
    await own("wantedListings", ["seekerId", "uid", "createdBy", "userId"]);

    const assistedWork = [];
    const seenAssisted = new Set();
    try {
        const snap = await db.collection("assistanceRequests").where("claimedBy", "==", uid).limit(100).get();
        snap.forEach((docSnap) => {
            const d = docSnap.data() || {};
            const listingId = d.listingId || d.propertyId || d.wantedId || null;
            assistedWork.push({
                id: String(listingId || docSnap.id),
                requestId: docSnap.id,
                collection: d.wantedId ? "wantedListings" : "propertyListings",
                kind: "assisted",
                requestStatus: String(d.status || "open"),
                title: String(d.title || d.summary || d.type || "Assistance request"),
                coordinates: brokerHQProjection.coords ? brokerHQProjection.coords(d) : null
            });
            seenAssisted.add(docSnap.id);
        });
    } catch (e) { console.warn("brokerHQWorkspace assistance", e.message || e); }

    // Contract-linked broker work is an operational projection only; it never
    // grants private listing analytics to a broker who is not the owner.
    try {
        const snap = await db.collection("contracts").where("brokerId", "==", uid).limit(100).get();
        snap.forEach((docSnap) => {
            const d = docSnap.data() || {};
            const id = String(d.propertyId || d.listingId || docSnap.id);
            if (!assistedWork.some((r) => String(r.id) === id && r.requestId === (d.assistanceRequestId || r.requestId))) {
                assistedWork.push({ id, requestId: d.assistanceRequestId || null, collection: "propertyListings", kind: "assisted", requestStatus: String(d.status || "contract"), title: "Broker contract", coordinates: null });
            }
        });
    } catch (e) { console.warn("brokerHQWorkspace contracts", e.message || e); }

    const ownedPropertyStats = [];
    for (const item of ownedInventory.filter((r) => r.collection === "propertyListings").slice(0, 100)) {
        try {
            const st = await db.collection("listingStats").doc(item.id).get();
            if (st.exists) {
                const d = st.data() || {};
                ownedPropertyStats.push({ id: item.id, views: Number(d.views || 0), inquiries: Number(d.inquiries || 0), impressions: Number(d.impressions || 0), matches: Number(d.matches || 0) });
            }
        } catch (e) { console.warn("brokerHQWorkspace stats", item.id, e.message || e); }
    }

    const analytics = {
        ownedPropertyListings: ownedInventory.filter((r) => r.collection === "propertyListings").length,
        ownedWantedListings: ownedInventory.filter((r) => r.collection === "wantedListings").length,
        activeAssists: assistedWork.filter((r) => ["claimed", "in_progress", "contract"].includes(r.requestStatus)).length,
        ownedPropertyStats
    };

    return {
        version: "28.0",
        requestId: String(request.data?.requestId || ""),
        ownedInventory,
        assistedWork,
        analytics,
        generatedAt: new Date().toISOString()
    };
});

exports.recordListingActivity = onCallActive(async (request) => {
    const actorUid = request.auth?.uid;
    if (!actorUid) throw new HttpsError("unauthenticated", "Must be signed in.");

    const listingId = String(request.data?.listingId || "").trim();
    const eventType = String(request.data?.eventType || "listing_view").trim();
    const requestId = cleanActivityRequestId(request.data?.requestId);
    const sessionId = cleanActivityRequestId(request.data?.sessionId);
    if (!listingId || !LISTING_ACTIVITY_TYPES.has(eventType) || !requestId) {
        throw new HttpsError("invalid-argument", "listingId, eventType and a stable requestId are required.");
    }
    if (eventType === "listing_impression" && !sessionId) {
        throw new HttpsError("invalid-argument", "A stable discovery sessionId is required for listing impressions.");
    }

    // Impressions are deliberately scoped to one signed-in seeker + listing +
    // discovery session. This prevents a noisy observer, card rerender, or
    // repeated callback from becoming a new demand event.
    const dedupeKey = eventType === "listing_impression" ? sessionId : requestId;
    const eventKey = `${eventType}:${listingId}:${actorUid}:${dedupeKey}`;
    const eventRef = db.collection("listingActivity").doc(listingActivityEventId(eventKey));
    const listingRef = db.collection("propertyListings").doc(listingId);
    const statsRef = db.collection("listingStats").doc(listingId);

    return db.runTransaction(async transaction => {
        const listingSnap = await transaction.get(listingRef);
        if (!listingSnap.exists) throw new HttpsError("not-found", "Listing not found.");
        const listing = listingSnap.data() || {};
        const status = String(listing.status || "active").toLowerCase();
        const ownerId = String(listing.ownerId || "");
        if (!ownerId || status !== "active" || listing.deleted === true || listing.hidden === true) {
            throw new HttpsError("failed-precondition", "Listing is not publicly discoverable.");
        }

        // Owners do not generate their own public listing activity. This
        // applies to both views and explicit listing inquiries so the
        // aggregate remains a measure of outside demand.
        if (ownerId === actorUid) return { success: true, recorded: false, reason: eventType === "listing_inquiry" ? "self_inquiry" : "self_view" };

        // Patch 18: an inquiry is an explicit Market Contact action. It is
        // never inferred from a P2P message and never creates a second
        // inquiry collection. The canonical listing identity is always
        // propertyListings/{listingId}.
        if (eventType === "listing_inquiry" && request.data?.source !== "market_contact") {
            throw new HttpsError("invalid-argument", "Listing inquiries must originate from the Market Contact action.");
        }

        // Patch 19: an impression is a presentation signal, not a detail
        // view. Only the Market property-card presentation may create one.
        // Marker visibility and wanted cards intentionally do not count.
        if (eventType === "listing_impression" && request.data?.source !== "market_card_impression") {
            throw new HttpsError("invalid-argument", "Listing impressions must originate from the Market property-card presentation.");
        }

        const ownerBoostDocRef = db.collection("boosts").doc(ownerId);
        const tierRef = db.collection("users").doc(ownerId).collection("tier").doc("owner");
        const [activitySnap, statsSnap, ownerBoostSnap, tierSnap] = await Promise.all([
            transaction.get(eventRef),
            transaction.get(statsRef),
            transaction.get(ownerBoostDocRef),
            transaction.get(tierRef)
        ]);

        if (activitySnap.exists) return { success: true, recorded: false, duplicate: true };

        const boost = ownerBoostSnap.exists ? (ownerBoostSnap.data()?.owner || {}) : {};
        const tier = tierSnap.exists ? tierSnap.data() || {} : {};
        const field = LISTING_STAT_FIELDS[eventType];
        const current = statsSnap.exists ? statsSnap.data() || {} : {};

        transaction.create(eventRef, {
            eventKey,
            eventType,
            listingId,
            ownerId,
            actorUid,
            // Patch 14 source remains `market_card_open` for detail views;
            // Patch 18 uses `market_contact` for explicit inquiries; Patch 19
            // uses `market_card_impression` for qualifying card visibility.
            source: eventType === "listing_inquiry"
                ? "market_contact"
                : eventType === "listing_impression"
                    ? "market_card_impression"
                    : "market_card_open",
            ...(eventType === "listing_impression" ? { discoverySessionId: sessionId } : {}),
            occurredAt: admin.firestore.FieldValue.serverTimestamp(),
            activeBoostSnapshot: boostSnapshot(boost),
            ownerTierSnapshot: {
                highestIndex: Number(tier.highestIndex || tier.index || 0) || 0
            }
        });

        transaction.set(statsRef, {
            listingId,
            ownerId,
            [field]: Number(current[field] || 0) + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true, recorded: true, eventType, listingId };
    });
});

/* ================================================================
   5. createListing (callable, replaces direct client addDoc)
   Fixes F-04 (Flagged_bugs.md): the listing cap was only checked in
   the browser (js/profile/perks.js getOwnerListingCapStatus), while
   firestore.rules let any signed-in user create a `properties` doc
   with their own ownerId -- so the cap was trivially bypassable by
   calling Firestore directly. `firestore.rules` now denies direct
   client `create` on `properties` (see §CREATE-VIA-FUNCTION comment
   there); this callable is the only path in. It re-derives the same
   cap formula as js/tiers.js (kept in ./tiers.js) from server-read
   data instead of trusting anything the client sends about its own
   quota, then writes with the Admin SDK (which bypasses rules).
   NOTE: field-shape validation (F-20) lives in validateListingShape()
   above -- required keys, enum values, and numeric price/size types
   are all checked there before this ever reaches Firestore.
   ================================================================ */


/* ================================================================
   Listing saves (Patch 15)
   ----------------------------------------------------------------
   The canonical relationship remains users/{uid}/favourites/{listingId}.
   This callable is the only client-facing mutation path so the current
   save state and historical listing activity cannot drift apart.
   ================================================================ */

const LISTING_SAVE_ACTIONS = new Set(["save", "unsave"]);

exports.toggleListingSave = onCallActive(async (request) => {
    const actorUid = request.auth?.uid;
    if (!actorUid) throw new HttpsError("unauthenticated", "Must be signed in.");

    const listingId = String(request.data?.listingId || "").trim();
    const action = String(request.data?.action || "").trim().toLowerCase();
    const requestId = cleanActivityRequestId(request.data?.requestId);
    if (!listingId || !LISTING_SAVE_ACTIONS.has(action) || !requestId) {
        throw new HttpsError("invalid-argument", "listingId, action and a stable requestId are required.");
    }

    const listingRef = db.collection("propertyListings").doc(listingId);
    const favouriteRef = db.collection("users").doc(actorUid).collection("favourites").doc(listingId);
    const eventKey = `listing_${action}:${listingId}:${actorUid}:${requestId}`;
    const eventRef = db.collection("listingActivity").doc(listingActivityEventId(eventKey));
    const statsRef = db.collection("listingStats").doc(listingId);
    const userRef = db.collection("users").doc(actorUid);

    return db.runTransaction(async transaction => {
        const [listingSnap, favouriteSnap, eventSnap, statsSnap, userSnap] = await Promise.all([
            transaction.get(listingRef),
            transaction.get(favouriteRef),
            transaction.get(eventRef),
            transaction.get(statsRef),
            transaction.get(userRef)
        ]);

        if (!listingSnap.exists) throw new HttpsError("not-found", "Listing not found.");
        const listing = listingSnap.data() || {};
        const status = String(listing.status || "active").toLowerCase();
        const ownerId = String(listing.ownerId || "");
        if (!ownerId || status !== "active" || listing.deleted === true || listing.hidden === true) {
            throw new HttpsError("failed-precondition", "Listing is not publicly discoverable.");
        }
        if (ownerId === actorUid) {
            throw new HttpsError("failed-precondition", "Listing owners cannot save their own listing.");
        }

        const role = normalizeCanonicalRole(userSnap.data()?.canonicalRole || userSnap.data()?.accountType || userSnap.data()?.role) || "seeker";
        if (!new Set(["seeker", "broker"]).has(role)) {
            throw new HttpsError("permission-denied", "Only seeker and broker accounts can save property listings.");
        }

        if (eventSnap.exists) return { success: true, recorded: false, duplicate: true, action };

        const currentlySaved = favouriteSnap.exists;
        const shouldBeSaved = action === "save";
        if (currentlySaved === shouldBeSaved) {
            return { success: true, recorded: false, noop: true, action, saved: currentlySaved };
        }

        if (shouldBeSaved) {
            transaction.set(favouriteRef, {
                propertyId: listingId,
                ownerId,
                savedBy: actorUid,
                savedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            transaction.delete(favouriteRef);
        }

        const boostDocRef = db.collection("boosts").doc(ownerId);
        const tierRef = db.collection("users").doc(ownerId).collection("tier").doc("owner");
        const [ownerBoostSnap, tierSnap] = await Promise.all([
            transaction.get(boostDocRef),
            transaction.get(tierRef)
        ]);
        const boost = ownerBoostSnap.exists ? (ownerBoostSnap.data()?.owner || {}) : {};
        const tier = tierSnap.exists ? tierSnap.data() || {} : {};
        const current = statsSnap.exists ? statsSnap.data() || {} : {};
        const currentSaves = Math.max(0, Number(current.saves || 0));

        transaction.create(eventRef, {
            eventKey,
            eventType: `listing_${action}`,
            listingId,
            ownerId,
            actorUid,
            source: "listing_save_control",
            occurredAt: admin.firestore.FieldValue.serverTimestamp(),
            activeBoostSnapshot: boostSnapshot(boost),
            ownerTierSnapshot: { highestIndex: Number(tier.highestIndex || tier.index || 0) || 0 }
        });

        transaction.set(statsRef, {
            listingId,
            ownerId,
            saves: shouldBeSaved ? currentSaves + 1 : Math.max(0, currentSaves - 1),
            saveActions: Number(current.saveActions || 0) + 1,
            ...(shouldBeSaved ? {} : { unsaveActions: Number(current.unsaveActions || 0) + 1 }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true, recorded: true, action, saved: shouldBeSaved, listingId };
    });
});


function validateWantedListingShape(wanted){
    const required = ["title", "classification", "budgetMin", "budgetMax", "address", "lat", "lng"];
    for(const key of required){
        if(wanted[key] === undefined || wanted[key] === null || wanted[key] === ""){
            return { ok: false, reason: `Missing required field: ${key}` };
        }
    }
    if(!tiers.categoryOf(wanted.classification)){
        return { ok: false, reason: "Invalid classification." };
    }
    const min = Number(wanted.budgetMin);
    const max = Number(wanted.budgetMax);
    if(!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min){
        return { ok: false, reason: "budgetMin/budgetMax must be valid non-negative numbers with max >= min." };
    }
    if(typeof wanted.title !== "string" || wanted.title.length > 200){
        return { ok: false, reason: "title must be a string under 200 characters." };
    }
    if(typeof wanted.address !== "string" || wanted.address.length > 300){
        return { ok: false, reason: "address must be a string under 300 characters." };
    }
    const lat = Number(wanted.lat), lng = Number(wanted.lng);
    if(!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 4 || lat > 21 || lng < 116 || lng > 127){
        return { ok: false, reason: "lat/lng must be valid coordinates within the Philippines." };
    }
    if(wanted.preferredAmenities !== undefined && !Array.isArray(wanted.preferredAmenities)){
        return { ok: false, reason: "preferredAmenities must be an array when supplied." };
    }
    return { ok: true };
}

exports.createWantedListing = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    if(!callerUid){
        throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const wanted = { ...(request.data?.wanted || {}) };
    delete wanted.seekerId;
    delete wanted.createdAt;
    delete wanted.status;
    delete wanted.approvalStatus;
    delete wanted.publisherVerified;
    delete wanted.editableAfter;

    const validation = validateWantedListingShape(wanted);
    if(!validation.ok){
        throw new HttpsError("invalid-argument", validation.reason);
    }

    const userSnap = await db.collection("users").doc(callerUid).get();
    const profile = userSnap.exists ? (userSnap.data() || {}) : {};
    if(!["seeker", "broker"].includes(normalizeCanonicalRole(profile.canonicalRole || profile.accountType || profile.role) || "seeker")){
        throw new HttpsError("permission-denied", "Only seekers or brokers can create Wanted listings.");
    }

    const boostSnap = await db.collection("boosts").doc(callerUid).get();
    const seekerBoost = boostSnap.exists ? (boostSnap.data()?.seeker || null) : null;
    const boostPackageId = tiers.resolveBoostPackageId(seekerBoost);
    const baseCap = tiers.wantedCapForSeekerBoost(boostPackageId);
    const override = profile.wantedCapOverride;
    const wantedCap = Number.isFinite(Number(override)) ? Number(override) : baseCap;

    const existingSnap = await db.collection("wantedListings")
        .where("seekerId", "==", callerUid)
        .get();
    const activeCount = existingSnap.docs.reduce((count, snap) => {
        const status = String(snap.data()?.status || "").toLowerCase();
        return count + (["active", "pending_approval", "pending"].includes(status) ? 1 : 0);
    }, 0);
    if(activeCount >= wantedCap){
        throw new HttpsError("resource-exhausted", `Wanted listing capacity reached (${activeCount}/${wantedCap}).`);
    }

    const verified = tiers.hasVerifiedId(profile);
    const status = verified ? "active" : "pending_approval";
    const docRef = await db.collection("wantedListings").add({
        ...wanted,
        seekerId: callerUid,
        category: tiers.categoryOf(wanted.classification),
        status,
        approvalStatus: verified ? "approved" : "pending",
        publisherVerified: verified,
        budgetMin: Number(wanted.budgetMin),
        budgetMax: Number(wanted.budgetMax),
        lat,
        lng,
        location: { lat, lng },
        editableAfter: admin.firestore.Timestamp.fromMillis(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
        success: true,
        id: docRef.id,
        status,
        activeCount: activeCount + 1,
        wantedCap
    };
});


/**
 * Radius-aware listing-match notification delivery.
 *
 * Discovery radius is a filter only. A listing remains canonical inventory;
 * this callable only creates a notification when the listing is inside the
 * recipient's current authoritative radius and deal-type preferences match.
 *
 * Dedupe is server-side and stable per recipient + listing. The immutable
 * listingActivity event is the delivery ledger; the notification document
 * is a projection. Re-running the callable cannot create another notice for
 * the same listing/recipient pair.
 */
exports.notifyListingMatches = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    const listingId = String(request.data?.listingId || "").trim();
    if (!callerUid) throw new HttpsError("unauthenticated", "Must be signed in.");
    if (!listingId) throw new HttpsError("invalid-argument", "listingId is required.");

    const listingRef = db.collection("propertyListings").doc(listingId);
    const listingSnap = await listingRef.get();
    if (!listingSnap.exists) throw new HttpsError("not-found", "Listing not found.");
    const listing = listingSnap.data() || {};
    if (String(listing.ownerId || "") !== String(callerUid)) {
        throw new HttpsError("permission-denied", "Only the listing owner can request match notification delivery.");
    }
    if (String(listing.status || "active").toLowerCase() !== "active" || listing.deleted === true || listing.hidden === true) {
        throw new HttpsError("failed-precondition", "Listing is not publicly active.");
    }
    const lat = Number(listing.lat), lng = Number(listing.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { delivered: 0, skipped: 0 };

    const usersSnap = await db.collection("users").limit(150).get();
    let delivered = 0;
    let skipped = 0;
    const dealTypes = Array.isArray(listing.deal_types) ? listing.deal_types : [];

    function distanceKm(aLat, aLng, bLat, bLng){
        const toRad = d => d * Math.PI / 180;
        const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
        const x = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLng/2)**2;
        return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1-x)));
    }

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const user = userDoc.data() || {};
        const role = normalizeCanonicalRole(user.canonicalRole || user.accountType || user.role) || "seeker";
        if ((role !== "seeker" && role !== "broker") || uid === callerUid) { skipped++; continue; }

        const boostSnap = await db.collection("boosts").doc(uid).get();
        const boost = boostSnap.exists ? (boostSnap.data() || {}) : {};
        const seekerPackageId = tiers.resolveBoostPackageId(boost.seeker);
        if (seekerPackageId < 3) { skipped++; continue; }

        const tierSnap = await db.collection("users").doc(uid).collection("tier").doc(role === "broker" ? "broker" : "seeker").get();
        const tierIndex = tierSnap.exists ? Number(tierSnap.data()?.highestIndex || tierSnap.data()?.index || 0) || 0 : 0;
        const service = role === "broker" ? (user.mapStateOwner || {}) : (user.mapState || {});
        const center = service.lastKnownCenter;
        if (!center || !Number.isFinite(Number(center.lat)) || !Number.isFinite(Number(center.lng))) { skipped++; continue; }

        const radiusKm = role === "broker"
            ? Math.min(50, Math.max(0.5, Number(service.preferredRadiusKm) || 50))
            : tiers.radiusForTier(tierIndex, seekerPackageId);
        const dist = distanceKm(Number(center.lat), Number(center.lng), lat, lng);
        if (dist > radiusKm) { skipped++; continue; }
        if (dealTypes.length && Array.isArray(user.preferredDealTypes) && user.preferredDealTypes.length &&
            !dealTypes.some(t => user.preferredDealTypes.includes(t))) { skipped++; continue; }

        const eventKey = `listing_match_notice:${uid}:${listingId}`;
        const eventRef = db.collection("listingActivity").doc(listingActivityEventId(eventKey));
        const notificationRef = db.collection("notifications").doc(uid).collection("items").doc(eventRef.id);
        const already = await db.runTransaction(async transaction => {
            const eventSnap = await transaction.get(eventRef);
            if (eventSnap.exists) return true;
            transaction.create(eventRef, {
                eventKey,
                eventType: "listing_match_notice",
                listingId,
                recipientUid: uid,
                actorUid: callerUid,
                radiusKm,
                distanceKm: dist,
                occurredAt: admin.firestore.FieldValue.serverTimestamp()
            });
            transaction.create(notificationRef, {
                type: "listing_match",
                message: `New listing near you: ${listing.listing_title || "Property"} (${dist.toFixed(1)} km)`,
                propertyId: listingId,
                read: false,
                dismissed: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                source: "listing_match_authority"
            });
            return false;
        });
        if (already) skipped++; else delivered++;
    }
    return { delivered, skipped };
});


/**
 * Foundation Repair 12 — stale match-notification lifecycle.
 * Match notifications are historical projections. When their canonical
 * listing stops being publicly active, keep the notice for history but mark
 * it stale/non-actionable. Do not delete it or mutate the listing itself.
 */
async function markListingMatchNotificationsStale(listingId, reason) {
    const snap = await db.collectionGroup("items")
        .where("type", "==", "listing_match")
        .where("propertyId", "==", listingId)
        .limit(500)
        .get();
    if (snap.empty) return 0;
    const now = admin.firestore.FieldValue.serverTimestamp();
    let count = 0;
    let batch = db.batch();
    let batchCount = 0;
    for (const docSnap of snap.docs) {
        const data = docSnap.data() || {};
        if (data.status === "stale" || data.stale === true) continue;
        batch.update(docSnap.ref, {
            status: "stale",
            stale: true,
            actionable: false,
            staleReason: reason || "listing_inactive",
            staleAt: now
        });
        batchCount++;
        count++;
        if (batchCount === 450) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
        }
    }
    if (batchCount) await batch.commit();
    return count;
}

exports.syncListingMatchNotificationState = onDocumentWritten(
    { document: "propertyListings/{propertyId}", database: "homefinder" },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        const beforeActive = String(before?.status || "").toLowerCase() === "active" && before?.deleted !== true && before?.hidden !== true;
        const afterActive = !!after && String(after?.status || "").toLowerCase() === "active" && after?.deleted !== true && after?.hidden !== true;
        if (!beforeActive || afterActive) return null;
        await markListingMatchNotificationsStale(event.params.propertyId, after ? "listing_inactive" : "listing_deleted");
        return null;
    }
);

exports.createListing = onCallActive(async (request) => {
    const callerUid = request.auth?.uid;
    if(!callerUid){
        throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const listing = { ...(request.data?.listing || {}) };
    // Never trust these from the client -- they decide who owns the
    // slot being spent and when it was created.
    delete listing.ownerId;
    delete listing.createdAt;

    const validation = validateListingShape(listing);
    if(!validation.ok){
        throw new HttpsError("invalid-argument", validation.reason);
    }

    // FormData on the client sends every field as a string;
    // validateListingShape() only checks that these parse as numbers,
    // it doesn't change their type. Coerce here so the stored type is
    // consistent regardless of what actually called this function.
    for(const field of ["floor_area", "monthly_price", "per_bed_price"]){
        if(listing[field] !== undefined && listing[field] !== ""){
            listing[field] = Number(listing[field]);
        }
    }

    /* Quota counts canonical propertyListings only. */
    const [boostSnap, userSnap, propCanonSnap, subscriptionEntitlementSnap] = await Promise.all([
        db.collection("boosts").doc(callerUid).get(),
        db.collection("users").doc(callerUid).get(),
        db.collection("propertyListings").where("ownerId", "==", callerUid).count().get(),
        db.collection("subscriptionEntitlements").doc(callerUid).get(),
    ]);
    const boostDoc = boostSnap.exists ? boostSnap.data() : {};
    const profile = userSnap.exists ? userSnap.data() : {};
    const existingListingCount =
        (propCanonSnap.data().count || 0);

    // Same eligibility shape as js/profile/listing-form.js's
    // canCreateFirstListing()/hasBrokerLicense() call -- verified ID
    // is only re-checked before a user's FIRST listing (once you have
    // one, you were already vetted for it); a broker's license,
    // unlike the ID check, is required on every listing, not just the
    // first -- mirrors the client's unconditional
    // `if(role==="broker" && !hasBrokerLicense(profile))` check.
    if(existingListingCount === 0 && !tiers.hasVerifiedId(profile)){
        throw new HttpsError(
            "permission-denied",
            "Submit a valid government ID before your first listing."
        );
    }
    // B-240816: accountType (owner/broker) was never checked here at all --
    // a seeker calling this callable directly could create a Property
    // listing. SoT Appendix B: only Owner/Broker may create Property.
    if(!["owner", "broker"].includes(normalizeCanonicalRole(profile.canonicalRole || profile.accountType || profile.role))){
        throw new HttpsError(
            "permission-denied",
            "Only property owners or brokers can create a Property listing."
        );
    }
    if(normalizeCanonicalRole(profile.canonicalRole || profile.accountType || profile.role) === "broker" && !tiers.hasBrokerLicense(profile)){
        throw new HttpsError(
            "permission-denied",
            "Brokers must submit a verified PRC license or broker certificate before listing."
        );
    }

    const packageId = tiers.resolveBoostPackageId(boostDoc.owner);
    const tierSnap = await db.collection("users").doc(callerUid).collection("tier").doc(normalizeCanonicalRole(profile.canonicalRole || profile.accountType || profile.role) || "owner").get();
    const tierIndex = Number(tierSnap.data()?.highestIndex ?? tierSnap.data()?.index ?? 0) || 0;
    const subscriptionEntitlement = subscriptionEntitlementSnap.exists ? subscriptionEntitlementSnap.data() : null;

    // Image capacity is a server-side entitlement, not merely a browser hint.
    // Keep the product hard ceiling at 10 while deriving the lower limit from
    // the same tier + Listing Boost catalog used by Profile/Perks.
    const maxImagesPerListing = Math.min(10, tiers.totalImagesPerListing(tierIndex, packageId));
    if (listing.images !== undefined) {
        if (!Array.isArray(listing.images)) {
            throw new HttpsError("invalid-argument", "images must be an array when supplied.");
        }
        if (listing.images.length > maxImagesPerListing) {
            throw new HttpsError(
                "resource-exhausted",
                `Image capacity reached (${listing.images.length}/${maxImagesPerListing}).`
            );
        }
    }
    if (listing.imagePaths !== undefined) {
        if (!Array.isArray(listing.imagePaths)) {
            throw new HttpsError("invalid-argument", "imagePaths must be an array when supplied.");
        }
        if (listing.imagePaths.length > maxImagesPerListing) {
            throw new HttpsError(
                "resource-exhausted",
                `Image path capacity reached (${listing.imagePaths.length}/${maxImagesPerListing}).`
            );
        }
    }

    let listingCap = tiers.totalListingCap(packageId, boostDoc.extraListings, tierIndex, subscriptionEntitlement);

    const override = userSnap.exists ? userSnap.data().listingCapOverride : null;
    if(override != null) listingCap = override;

    // A successful/active contract continues consuming the same canonical
    // listing unit; it is not a second listing-cap charge. Counting both
    // listing docs and active contracts double-charged the same inventory.
    const slotsUsed = existingListingCount;

    if (Number.isFinite(listingCap) && slotsUsed >= listingCap){
        throw new HttpsError(
            "resource-exhausted",
            `Listing capacity reached (${slotsUsed}/${listingCap}). Free a slot or buy a Listing Boost / Extra Listing Slot.`
        );
    }

    /* Sweep 3: new property inventory writes go to canonical propertyListings only. */
    const docRef = db.collection("propertyListings").doc();
    const storedStatus = listing.status || "pending_approval";
    await db.runTransaction(async transaction => {
        transaction.create(docRef, {
            ...listing,
            ownerId: callerUid,
            status: storedStatus,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        if (storedStatus === "active") {
            await awardListingPublishedInTransaction(transaction, callerUid, docRef.id, profile);
        }
    });

    return { success: true, id: docRef.id, slotsUsed: slotsUsed + 1, listingCap };
});

exports.markRentToOwnRescue = onCallActive(async (request) => {
    const { contractId } = request.data;
    const callerUid = request.auth?.uid;

    if(!callerUid){
        throw new Error("Must be signed in.");
    }

    const contractRef = db.collection("contracts").doc(contractId);
    const contractSnap = await contractRef.get();

    if(!contractSnap.exists){
        throw new Error("Contract not found.");
    }

    const contract = contractSnap.data();

    if(contract.brokerId !== callerUid){
        throw new Error("Only the broker attached to this contract can mark a rescue.");
    }
    if(contract.type !== "rent_to_own"){
        throw new Error("Rescue only applies to rent_to_own contracts.");
    }
    if(contract.status !== "pending_confirmation" && contract.status !== "active"){
        throw new Error("This contract isn't in a rescuable state.");
    }

    await db.runTransaction(async (transaction) => {
        const tierRef = db.collection("users").doc(callerUid).collection("tier").doc("broker");
        const tierSnap = await transaction.get(tierRef);
        const data = tierSnap.exists ? tierSnap.data() : {};

        const byProperty = { ...(data.byProperty || {}) };
        const propertyEntry = { ...(byProperty[contract.propertyId] || {}) };
        propertyEntry.satisfiedClosures = propertyEntry.satisfiedClosures || 0;
        propertyEntry.rentToOwnRescues = (propertyEntry.rentToOwnRescues || 0) + 1;
        byProperty[contract.propertyId] = propertyEntry;

        const { satisfiedClosures, rentToOwnRescues } = tiers.aggregateBrokerScore(byProperty);
        const highestIndex = tiers.brokerTierIndex(satisfiedClosures, rentToOwnRescues);

        transaction.set(tierRef, {
            byProperty,
            satisfiedClosures, rentToOwnRescues,
            highestIndex,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        transaction.update(contractRef, {
            status: "completed",
            rescueByBrokerId: callerUid,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    return { success: true };
});


/* ------------------------------------------------------------------ */
/*  getKycSignedUrl — staff-only short-lived KYC image URL             */
/*  firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY           */
/* ------------------------------------------------------------------ */
const supabaseServiceKey = defineSecret("SUPABASE_SERVICE_ROLE_KEY");

exports.getKycSignedUrl = onCall(
  { secrets: [supabaseServiceKey] },
  async (request) => {
    await requireActiveUser(request);
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    // KYC signed URL is admin-only. The authorization decision is canonicalRole,
    // with the explicitly documented bootstrap admin UID as emergency authority.
    const canonicalRole = await canonicalRoleForUser(db, request.auth.uid);
    const bootstrapAdminUids = ["IZN9EHQ9iTboWXoEgklJlWiwzz82"];
    const isAdminCaller = canonicalRole === "admin" || bootstrapAdminUids.includes(request.auth.uid);
    if (!isAdminCaller) {
      throw new HttpsError("permission-denied", "Admin only — KYC documents are restricted.");
    }

    const targetUid = String(request.data?.uid || "").trim();
    const kind = request.data?.kind === "broker" ? "broker" : "id";
    if (!targetUid) throw new HttpsError("invalid-argument", "uid required");

    const userSnap = await db.collection("users").doc(targetUid).get();
    if (!userSnap.exists) throw new HttpsError("not-found", "User not found");
    const u = userSnap.data();
    const payload = kind === "broker" ? (u.brokerLicense || {}) : (u.idVerification || {});
    const storagePath = payload.storagePath || payload.path || null;
    if (!storagePath) {
      throw new HttpsError("not-found", "No KYC file path. User may need to resubmit.");
    }

    const supabaseUrl = process.env.SUPABASE_URL || "https://hdeqixswsscyvmziinxt.supabase.co";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseServiceKey.value();
    if (!serviceKey) {
      throw new HttpsError("failed-precondition", "SUPABASE_SERVICE_ROLE_KEY not configured.");
    }

    const expiresIn = 60 * 15;
    const signRes = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/kyc-documents/${encodeURI(storagePath)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn }),
      }
    );
    const body = await signRes.json().catch(() => ({}));
    if (!signRes.ok) {
      console.error("supabase sign", signRes.status, body);
      throw new HttpsError("internal", body.message || body.error || "Could not sign KYC URL");
    }
    const signedPath = body.signedURL || body.signedUrl || body.data?.signedUrl;
    if (!signedPath) throw new HttpsError("internal", "Empty signed URL from Supabase");
    const full = signedPath.startsWith("http")
      ? signedPath
      : `${supabaseUrl}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
    return { url: full, expiresIn, path: storagePath, kind };
  }
);


/* ================================================================
   R7 — AUTHORITATIVE GENERAL PIN MUTATIONS
   ================================================================ */

exports.relocateUserPin = onCallActive(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to move a pin.");
  const center = validPinCenter(request.data?.center);
  if (!center) throw new HttpsError("invalid-argument", "Invalid Philippine pin coordinates.");

  const pinId = String(request.data?.pinId || "");
  const kind = request.data?.kind === "supply" ? "supply" : "discovery";
  const userRef = db.collection("users").doc(uid);
  const [userSnap, boostSnap] = await Promise.all([userRef.get(), db.collection("boosts").doc(uid).get()]);
  const user = userSnap.exists ? userSnap.data() : {};
  const boost = boostSnap.exists ? boostSnap.data() : {};
  const role = normalizeCanonicalRole(user.canonicalRole || user.accountType || user.role) || "seeker";
  if (!["seeker","owner","broker"].includes(role)) throw new HttpsError("failed-precondition", "Invalid account role.");

  if (role === "seeker" && kind !== "discovery") throw new HttpsError("invalid-argument", "Seekers use discovery pins.");
  if (role === "owner" && kind !== "supply") throw new HttpsError("invalid-argument", "Owners use supply pins.");

  const tierSnap = await db.collection("users").doc(uid).collection("tier").doc(role).get();
  const tierIndex = Number(tierSnap.data()?.highestIndex ?? tierSnap.data()?.index ?? 0) || 0;
  const ent = pinEntitlementFor(role, tierIndex, boost);
  if (!pinSlotAllowed(role, pinId, ent)) throw new HttpsError("permission-denied", "Pin slot is not currently entitled.");

  const cooldownH = pinCooldownHours(role === "owner" ? "owner" : "seeker", tierIndex, boost);
  const nowMs = Date.now();
  const next = new Date(nowMs + cooldownH * 3600000);

  // Foundation Repair 09: cooldown validation and relocation are one
  // atomic server transaction. Prevent two concurrent calls from both
  // observing an expired cooldown and moving the same pin.
  let result = null;
  await db.runTransaction(async tx => {
    const freshSnap = await tx.get(userRef);
    const fresh = freshSnap.exists ? freshSnap.data() : {};
    const pinMap = {...(fresh.pins || {})};
    const previous = pinMap[pinId] || {};
    let last = previous.lastRelocatedAt || null;
    if (!last && pinId === "discovery-1") last = fresh.mapState?.lastRelocatedAt || null;
    if (!last && pinId === "supply-1") last = fresh.mapStateOwner?.lastRelocatedAt || null;

    const lastMs = last?.toMillis ? last.toMillis() : (last ? new Date(last).getTime() : NaN);
    const nextMs = Number.isFinite(lastMs) ? lastMs + cooldownH * 3600000 : 0;
    if (nextMs && nowMs < nextMs) {
      result = {
        success: false,
        reason: "cooldown",
        cooldownRemainingMs: nextMs - nowMs,
        nextRelocationAt: new Date(nextMs).toISOString()
      };
      return;
    }

    const payload = {
      kind, center,
      label: previous.label || (pinId === "supply-1" ? "Supply pin" : "Search pin"),
      entitlementKey: previous.entitlementKey || pinId,
      lastRelocatedAt: admin.firestore.FieldValue.serverTimestamp(),
      nextRelocationAt: admin.firestore.Timestamp.fromDate(next)
    };
    const write = { [`pins.${pinId}`]: payload, activePinId: pinId };

    if (pinId === "discovery-1") {
      write.mapState = {...(fresh.mapState||{}), lastRelocatedAt:admin.firestore.FieldValue.serverTimestamp(), lastKnownCenter:center, relocationAttempts:Number(fresh.mapState?.relocationAttempts||0)+1, maxRelocationAttempts:1+Math.max(0,tierIndex)};
    } else if (pinId === "supply-1") {
      write.mapStateOwner = {...(fresh.mapStateOwner||{}), lastRelocatedAt:admin.firestore.FieldValue.serverTimestamp(), lastKnownCenter:center, relocationAttempts:Number(fresh.mapStateOwner?.relocationAttempts||0)+1, maxRelocationAttempts:1+Math.max(0,tierIndex)};
    }

    tx.set(userRef, write, {merge:true});
    result = {success:true, pinId, cooldownHours:cooldownH, nextRelocationAt:next.toISOString(), capacity:ent.capacity};
  });

  return result || {success:false, reason:"no-op"};
});

exports.getPinEntitlement = onCallActive(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to inspect pin entitlement.");
  const [userSnap, boostSnap] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("boosts").doc(uid).get()
  ]);
  const user = userSnap.exists ? userSnap.data() : {};
  const boost = boostSnap.exists ? boostSnap.data() : {};
  const role = normalizeCanonicalRole(user.canonicalRole || user.accountType || user.role) || "seeker";
  const tierSnap = await db.collection("users").doc(uid).collection("tier").doc(role).get();
  const tierIndex = Number(tierSnap.data()?.highestIndex ?? tierSnap.data()?.index ?? 0) || 0;
  const ent = pinEntitlementFor(role, tierIndex, boost);
  return {role, tierIndex, capacity:ent.capacity, seekerPackageIds:ent.seekerIds, ownerPackageIds:ent.ownerIds, basePins:role==="broker"?2:1, tier3Bonus:tierIndex>=3?1:0};
});

/*
 * ---------------------------------------------------------------------------
 * PayPal subscription verification + webhook
 * ---------------------------------------------------------------------------
 * Required Firebase secrets:
 *   PAYPAL_SUBSCRIPTION_CLIENT_SECRET
 *   PAYPAL_SUBSCRIPTION_WEBHOOK_ID
 *
 * The webhook ID is obtained from the PayPal application's webhook
 * registration. It is not the client ID.
 * ---------------------------------------------------------------------------
 */

async function paypalAccessToken() {
  const secret = paypalSubscriptionClientSecret.value();
  if (!secret) throw new Error("PAYPAL_SUBSCRIPTION_CLIENT_SECRET is not configured.");
  const auth = Buffer.from(`${PAYPAL_SUBSCRIPTION_CLIENT_ID}:${secret}`).toString("base64");
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method:"POST",
    headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/x-www-form-urlencoded"},
    body:"grant_type=client_credentials"
  });
  const body = await res.json().catch(()=>({}));
  if (!res.ok || !body.access_token) throw new Error(`PayPal OAuth failed (${res.status}).`);
  return body.access_token;
}

async function getPayPalSubscription(subscriptionId) {
  const token = await paypalAccessToken();
  const normalizedId = String(subscriptionId || "").trim();
  if (!/^I-[A-Z0-9]+$/i.test(normalizedId)) throw new Error("Invalid PayPal subscription ID.");
  const res = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${encodeURIComponent(normalizedId)}`, {
    headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}
  });
  const body = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(`PayPal subscription lookup failed (${res.status}).`);
  if (String(body.id || "") !== normalizedId) throw new Error("PayPal subscription identity mismatch.");
  return body;
}

async function verifyPayPalWebhook(req, rawBody) {
  const webhookId = paypalSubscriptionWebhookId.value();
  if (!webhookId) throw new Error("PAYPAL_SUBSCRIPTION_WEBHOOK_ID is not configured.");
  const token = await paypalAccessToken();
  const payload = {
    auth_algo:req.get("paypal-auth-algo"),
    cert_url:req.get("paypal-cert-url"),
    transmission_id:req.get("paypal-transmission-id"),
    transmission_sig:req.get("paypal-transmission-sig"),
    transmission_time:req.get("paypal-transmission-time"),
    webhook_id:webhookId,
    webhook_event:JSON.parse(rawBody)
  };
  const res = await fetch("https://api-m.paypal.com/v1/notifications/verify-webhook-signature", {
    method:"POST",
    headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });
  const body = await res.json().catch(()=>({}));
  if (!res.ok || body.verification_status !== "SUCCESS") throw new Error(`PayPal webhook verification failed (${res.status}).`);
}

async function activateSubscriptionForUid(uid, sub, eventType) {
  const now = admin.firestore.Timestamp.now();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  const prior = snap.exists ? (snap.data().subscription || {}) : {};
  const nextBilling = sub.billing_info?.next_billing_time || prior.nextBillingAt || null;

  const entitlementRef = db.collection("subscriptionEntitlements").doc(uid);
  await db.runTransaction(async tx => {
    tx.set(ref, {
      subscription:{
        status:"active",
        provider:"paypal",
        planId:sub.plan_id || PAYPAL_SUBSCRIPTION_PLAN_ID,
        subscriptionId:sub.id,
        initialSetupFeePhp:499.99,
        freeMonths:3,
        annualPhp:4999.99,
        activatedAt:prior.activatedAt || admin.firestore.FieldValue.serverTimestamp(),
        introductoryPeriodEndsAt:nextBilling,
        nextBillingAt:nextBilling,
        lastProviderEvent:eventType,
        lastProviderEventAt:now
      }
    }, {merge:true});
    tx.set(entitlementRef, {
      active:true,
      source:"paypal",
      provider:"paypal",
      planId:sub.plan_id || PAYPAL_SUBSCRIPTION_PLAN_ID,
      subscriptionId:sub.id,
      startsAt:prior.activatedAt || now,
      endsAt:nextBilling ? admin.firestore.Timestamp.fromDate(new Date(nextBilling)) : null,
      updatedAt:now,
      lastProviderEvent:eventType
    }, {merge:true});
  });

  await createUserNotification(uid,{
    type:"subscription_activated",
    message:"Subscription active — ₱499.99 initial payment + 3 free months confirmed. Annual ₱4,999.99 billing begins after the introductory period.",
    source:"paypal"
  });
}



/* ---------------------------------------------------------------------------
 * Account suspension authority
 * --------------------------------------------------------------------------- */
exports.syncUserSuspension = onDocumentWritten(
  { document: "users/{uid}", database: "homefinder" },
  async event => {
    const uid = event.params.uid;
    const after = event.data?.after;
    if (!after || !after.exists) return;
    const data = after.data() || {};
    const suspended = data.suspended === true;
    const until = data.suspendedUntil
      ? new Date(typeof data.suspendedUntil.toDate === "function"
          ? data.suspendedUntil.toDate().toISOString()
          : data.suspendedUntil)
      : null;
    const activeSuspension = suspended && (!until || until.getTime() > Date.now());
    await admin.auth().updateUser(uid, { disabled: activeSuspension });
  }
);

exports.reconcileExpiredSuspensions = onSchedule("every 15 minutes", async () => {
  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection("users")
    .where("suspended", "==", true)
    .where("suspendedUntil", "<=", now)
    .limit(500)
    .get();

  let restored = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    if (!data.suspendedUntil) continue;
    await docSnap.ref.set({
      suspended: false,
      suspendedUntil: null,
      suspensionUpdatedAt: now,
      suspensionReconciledAt: now
    }, { merge: true });
    try {
      await admin.auth().updateUser(docSnap.id, { disabled: false });
      restored += 1;
    } catch (error) {
      console.error("reconcileExpiredSuspensions auth restore failed", docSnap.id, error);
    }
  }
  console.log(`reconcileExpiredSuspensions: restored ${restored}/${snap.size}`);
  return null;
});

function requireOperationsAdmin(request) {
  if (request.auth?.uid !== HOMEFINDER_ADMIN_UID) {
    throw new HttpsError("permission-denied", "HomeFinder Admin authority required.");
  }
}

exports.setUserSuspension = onCallActive(async request => {
  requireOperationsAdmin(request);
  const uid = String(request.data?.uid || "").trim();
  const suspend = request.data?.suspend === true;
  if (!uid) throw new HttpsError("invalid-argument", "Target user UID is required.");
  if (uid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Admin cannot suspend the current admin identity.");
  }
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Target user does not exist.");

  const days = Math.min(3650, Math.max(1, Math.floor(Number(request.data?.days) || 7)));
  const reason = String(request.data?.reason || "Policy review").trim().slice(0, 500);
  const now = admin.firestore.Timestamp.now();
  const until = suspend
    ? admin.firestore.Timestamp.fromMillis(now.toMillis() + days * 24 * 60 * 60 * 1000)
    : null;

  await ref.set({
    suspended: suspend,
    suspendedUntil: until,
    suspendReason: suspend ? reason : null,
    suspensionUpdatedAt: now,
    suspensionUpdatedBy: request.auth.uid
  }, { merge: true });

  return {
    status: suspend ? "suspended" : "active",
    uid,
    suspendedUntil: until ? until.toDate().toISOString() : null
  };
});

/* ---------------------------------------------------------------------------
 * Admin subscription smoke-test grants (Patch 25)
 * ---------------------------------------------------------------------------
 * These grants are deliberately NOT PayPal transactions. They live in their
 * own document and feed a canonical entitlement record for feature smoke
 * tests. Only the hard-coded HomeFinder Admin may call these functions.
 * ---------------------------------------------------------------------------
 */
const HOMEFINDER_ADMIN_UID = "IZN9EHQ9iTboWXoEgklJlWiwzz82";
const ADMIN_SUBSCRIPTION_PLAN_ID = PAYPAL_SUBSCRIPTION_PLAN_ID;

function requireHomeFinderAdmin(request) {
  if (request.auth?.uid !== HOMEFINDER_ADMIN_UID) {
    throw new HttpsError("permission-denied", "HomeFinder Admin authority required.");
  }
}

exports.grantAdminSubscription = onCallActive(async request => {
  requireHomeFinderAdmin(request);
  const uid = String(request.data?.uid || "").trim();
  const reason = String(request.data?.reason || "").trim();
  const days = Math.floor(Number(request.data?.days));
  if (!uid) throw new HttpsError("invalid-argument", "Target user UID is required.");
  if (!reason) throw new HttpsError("invalid-argument", "A smoke-test grant reason is required.");
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    throw new HttpsError("invalid-argument", "Grant duration must be 1–3650 days.");
  }
  const targetRef = db.collection("users").doc(uid);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new HttpsError("not-found", "Target user does not exist.");

  const now = admin.firestore.Timestamp.now();
  const ends = admin.firestore.Timestamp.fromMillis(now.toMillis() + days * 24 * 60 * 60 * 1000);
  const grant = {
    active: true,
    source: "admin_smoke_test",
    planId: ADMIN_SUBSCRIPTION_PLAN_ID,
    grantedBy: request.auth.uid,
    grantedAt: now,
    startsAt: now,
    endsAt: ends,
    reason,
    lastAction: "grant"
  };
  const grantRef = db.collection("subscriptionAdminGrants").doc(uid);
  const entitlementRef = db.collection("subscriptionEntitlements").doc(uid);
  const auditRef = db.collection("adminSubscriptionAudit").doc();

  await db.runTransaction(async tx => {
    tx.set(grantRef, grant, {merge:true});
    tx.set(entitlementRef, {
      active: true,
      source: "admin_smoke_test",
      planId: ADMIN_SUBSCRIPTION_PLAN_ID,
      startsAt: now,
      endsAt: ends,
      grantedBy: request.auth.uid,
      grantReason: reason,
      updatedAt: now
    }, {merge:true});
    tx.set(auditRef, {
      action: "grant",
      targetUid: uid,
      actorUid: request.auth.uid,
      planId: ADMIN_SUBSCRIPTION_PLAN_ID,
      startsAt: now,
      endsAt: ends,
      reason,
      createdAt: now
    });
  });

  await createUserNotification(uid, {
    type: "subscription_admin_grant",
    message: `HomeFinder Admin granted a smoke-test subscription entitlement for ${days} day${days === 1 ? "" : "s"}.`,
    source: "admin"
  });
  return {status:"granted", uid, planId:ADMIN_SUBSCRIPTION_PLAN_ID, startsAt:now.toDate().toISOString(), endsAt:ends.toDate().toISOString()};
});

exports.revokeAdminSubscription = onCallActive(async request => {
  requireHomeFinderAdmin(request);
  const uid = String(request.data?.uid || "").trim();
  const reason = String(request.data?.reason || "").trim();
  if (!uid) throw new HttpsError("invalid-argument", "Target user UID is required.");
  if (!reason) throw new HttpsError("invalid-argument", "A revoke reason is required.");

  const now = admin.firestore.Timestamp.now();
  const grantRef = db.collection("subscriptionAdminGrants").doc(uid);
  const entitlementRef = db.collection("subscriptionEntitlements").doc(uid);
  const auditRef = db.collection("adminSubscriptionAudit").doc();
  const grantSnap = await grantRef.get();
  const previous = grantSnap.exists ? grantSnap.data() : {};

  await db.runTransaction(async tx => {
    tx.set(grantRef, {
      active:false,
      source:"admin_smoke_test",
      lastAction:"revoke",
      revokedBy:request.auth.uid,
      revokedAt:now,
      revokeReason:reason,
      updatedAt:now
    }, {merge:true});
    tx.set(entitlementRef, {
      active:false,
      source:"admin_smoke_test",
      planId:previous.planId || ADMIN_SUBSCRIPTION_PLAN_ID,
      revokedAt:now,
      revokedBy:request.auth.uid,
      revokeReason:reason,
      updatedAt:now
    }, {merge:true});
    tx.set(auditRef, {
      action:"revoke",
      targetUid:uid,
      actorUid:request.auth.uid,
      planId:previous.planId || ADMIN_SUBSCRIPTION_PLAN_ID,
      previousStartsAt:previous.startsAt || null,
      previousEndsAt:previous.endsAt || null,
      reason,
      createdAt:now
    });
  });

  await createUserNotification(uid, {type:"subscription_admin_revoke", message:"Your HomeFinder smoke-test subscription entitlement was revoked by Admin.", source:"admin"});
  return {status:"revoked", uid};
});

exports.recordSubscriptionApproval = onCall(
  {secrets:[paypalSubscriptionClientSecret]},
  async request => {
    await requireActiveUser(request);
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated","Sign in before subscribing.");
    const subscriptionId = String(request.data?.subscriptionId || "");
    if (!/^I-[A-Z0-9]+$/i.test(subscriptionId)) throw new HttpsError("invalid-argument","Invalid PayPal subscription ID.");

    const sub = await getPayPalSubscription(subscriptionId);
    if (sub.plan_id !== PAYPAL_SUBSCRIPTION_PLAN_ID) throw new HttpsError("failed-precondition","Unexpected HomeFinder subscription plan.");

    // A subscription ID alone must not be enough to attach another user's
    // PayPal subscription to the current Firebase account. When both sides
    // expose an email, require an exact case-insensitive match. If PayPal does
    // not expose an email, keep the subscription pending for webhook/provider
    // verification rather than granting from the browser callback.
    const firebaseEmail = String(request.auth.token?.email || request.auth.email || "").trim().toLowerCase();
    const paypalEmail = String(sub.subscriber?.email_address || "").trim().toLowerCase();
    if (firebaseEmail && paypalEmail && firebaseEmail !== paypalEmail) {
      throw new HttpsError("permission-denied","The PayPal subscriber does not match the signed-in HomeFinder account.");
    }

    await db.collection("paypalSubscriptions").doc(subscriptionId).set({
      uid, planId:sub.plan_id, status:sub.status, provider:"paypal",
      subscriberEmail:sub.subscriber?.email_address || null,
      paypalPayerId:sub.subscriber?.payer_id || null,
      lastVerifiedAt:admin.firestore.FieldValue.serverTimestamp()
    }, {merge:true});

    if (sub.status === "ACTIVE") {
      await activateSubscriptionForUid(uid, sub, "BILLING.SUBSCRIPTION.ACTIVATED");
      return {status:"active",subscriptionId};
    }

    await createUserNotification(uid,{
      type:"subscription_pending",
      message:"PayPal approved your subscription. HomeFinder is verifying it before enabling premium benefits.",
      source:"paypal"
    });
    return {status:"pending_verification",subscriptionId};
  }
);

async function deactivateSubscriptionEntitlement(uid, eventType) {
  if (!uid) return;
  const now = admin.firestore.Timestamp.now();
  await db.collection("subscriptionEntitlements").doc(uid).set({
    active:false,
    source:"paypal",
    updatedAt:now,
    lastProviderEvent:eventType,
    endsAt:now
  }, {merge:true});
}

exports.paypalSubscriptionWebhook = onRequest(
  {secrets:[paypalSubscriptionClientSecret,paypalSubscriptionWebhookId]},
  async (req,res) => {
    if (req.method !== "POST") { res.status(405).send("POST only"); return; }
    let event = null;
    try {
      const rawBody = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body || {});
      await verifyPayPalWebhook(req, rawBody);
      event = JSON.parse(rawBody);
      const eventId = String(event.id || "");
      if (!eventId || !/^[A-Za-z0-9._:-]{1,200}$/.test(eventId)) { res.status(400).send("Invalid event id"); return; }

      const eventRef = db.collection("paypalWebhookEvents").doc(eventId);
      let shouldProcess = false;
      await db.runTransaction(async transaction => {
        const snap = await transaction.get(eventRef);
        if (!snap.exists) {
          transaction.create(eventRef, {
            eventType:event.event_type || null,
            status:"processing",
            attemptCount:1,
            receivedAt:admin.firestore.FieldValue.serverTimestamp()
          });
          shouldProcess = true;
          return;
        }
        const state = snap.data()?.status;
        if (state === "processed") return;
        if (state === "processing") {
          const startedAt = snap.data()?.processingStartedAt;
          const startedMillis = startedAt?.toMillis ? startedAt.toMillis() : 0;
          const stale = !startedMillis || (Date.now() - startedMillis) > (10 * 60 * 1000);
          if (!stale) return;
        }
        transaction.set(eventRef, {
          status:"processing",
          attemptCount:admin.firestore.FieldValue.increment(1),
          processingStartedAt:admin.firestore.FieldValue.serverTimestamp(),
          lastRetryAt:admin.firestore.FieldValue.serverTimestamp()
        }, {merge:true});
        shouldProcess = true;
      });
      if (!shouldProcess) { res.status(200).send("duplicate"); return; }

      const resource = event.resource || {};
      const subscriptionId =
        resource.id ||
        resource.billing_agreement_id ||
        resource.supplementary_data?.related_ids?.subscription_id ||
        null;
      const mapping = subscriptionId ? await db.collection("paypalSubscriptions").doc(String(subscriptionId)).get() : null;
      const uid = mapping?.exists ? mapping.data()?.uid : null;
      const type = String(event.event_type || "");

      if (uid && type === "BILLING.SUBSCRIPTION.ACTIVATED") {
        const sub = await getPayPalSubscription(String(subscriptionId));
        if (sub.plan_id === PAYPAL_SUBSCRIPTION_PLAN_ID) await activateSubscriptionForUid(uid, sub, type);
      } else if (uid && type === "PAYMENT.SALE.COMPLETED") {
        await createUserNotification(uid,{type:"subscription_payment_received",message:"Subscription payment received successfully by PayPal.",source:"paypal"});
      } else if (uid && type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED") {
        // Grace-period semantics remain TBD; do not deactivate the canonical
        // entitlement from a payment-failed event until that policy is decided.
        await db.collection("users").doc(uid).set({subscription:{status:"payment_failed",lastProviderEvent:type,lastProviderEventAt:admin.firestore.FieldValue.serverTimestamp()}},{merge:true});
        await createUserNotification(uid,{type:"subscription_payment_failed",source:"paypal"});
      } else if (uid && type === "BILLING.SUBSCRIPTION.CANCELLED") {
        await deactivateSubscriptionEntitlement(uid, type);
        await db.collection("users").doc(uid).set({subscription:{status:"cancelled",lastProviderEvent:type,lastProviderEventAt:admin.firestore.FieldValue.serverTimestamp()}},{merge:true});
        await createUserNotification(uid,{type:"subscription_cancelled",source:"paypal"});
      } else if (uid && type === "BILLING.SUBSCRIPTION.SUSPENDED") {
        await deactivateSubscriptionEntitlement(uid, type);
        await db.collection("users").doc(uid).set({subscription:{status:"suspended",lastProviderEvent:type,lastProviderEventAt:admin.firestore.FieldValue.serverTimestamp()}},{merge:true});
        await createUserNotification(uid,{type:"subscription_suspended",source:"paypal"});
      } else if (uid && type === "BILLING.SUBSCRIPTION.EXPIRED") {
        await deactivateSubscriptionEntitlement(uid, type);
        await db.collection("users").doc(uid).set({subscription:{status:"expired",lastProviderEvent:type,lastProviderEventAt:admin.firestore.FieldValue.serverTimestamp()}},{merge:true});
        await createUserNotification(uid,{type:"subscription_expired",source:"paypal"});
      }
      await eventRef.set({
        status:"processed",
        processedAt:admin.firestore.FieldValue.serverTimestamp()
      }, {merge:true});
      res.status(200).send("ok");
    } catch (error) {
      console.error("paypalSubscriptionWebhook", error);
      try {
        const eventId = typeof event !== "undefined" ? String(event?.id || "") : "";
        if (eventId) {
          await db.collection("paypalWebhookEvents").doc(eventId).set({
            status:"failed",
            lastError:String(error?.message || error),
            failedAt:admin.firestore.FieldValue.serverTimestamp()
          }, {merge:true});
        }
      } catch (ledgerError) {
        console.error("paypalWebhookEvents failure ledger", ledgerError);
      }
      res.status(400).send("invalid webhook");
    }
  }
);

/** Quota reset reminder — 3 days before UTC month boundary (SoT §3 / §4).
 *  Window: when remaining time to next month is between 2 and 3 days,
 *  notify each publisher/wanted author once per calendar month.
 *  Requires Blaze for scheduled functions in production.
 */
exports.notifyQuotaResetSoon = onSchedule("every 24 hours", async () => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const end = new Date(Date.UTC(year, month + 1, 1));
    const msLeft = end.getTime() - now.getTime();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const twoDays = 2 * 24 * 60 * 60 * 1000;

    if (msLeft > threeDays || msLeft < twoDays) {
        console.log("notifyQuotaResetSoon: outside window", { msLeft, monthKey });
        return null;
    }

    const uids = new Set();

    // Active / pending listings → owners who consume listing quota
    const listingSnap = await db.collection("propertyListings")
        .where("status", "in", ["active", "pending_approval", "pending"])
        .limit(500)
        .get();
    for (const docSnap of listingSnap.docs) {
        const d = docSnap.data() || {};
        const uid = d.ownerId || d.uid || d.userId;
        if (uid) uids.add(String(uid));
    }

    // Wanted posts — canonical collection
    try {
        const wantedSnap = await db.collection("wantedListings")
            .where("status", "in", ["active", "pending_approval", "pending"])
            .limit(500)
            .get();
        for (const docSnap of wantedSnap.docs) {
            const d = docSnap.data() || {};
            const uid = d.uid || d.seekerId || d.userId || d.ownerId;
            if (uid) uids.add(String(uid));
        }
    } catch (err) {
        console.warn("notifyQuotaResetSoon: wanted query skipped", err.message || err);
    }

    let written = 0;
    let skipped = 0;

    for (const uid of uids) {
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();
        const prev = userSnap.exists ? (userSnap.data().quotaResetNotifiedMonth || null) : null;
        if (prev === monthKey) {
            skipped += 1;
            continue;
        }

        const notifRef = db.collection("notifications").doc(uid)
            .collection("items").doc();
        const message =
            "Your monthly listing / wanted quota resets in about 3 days. " +
            "Publish or renew what you need before the new month, or slots refresh automatically.";

        await notifRef.set({
            type: "quota_reset_soon",
            message,
            read: false,
            monthKey,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await userRef.set(
            { quotaResetNotifiedMonth: monthKey },
            { merge: true }
        );
        written += 1;
    }

    console.log("notifyQuotaResetSoon: done", {
        monthKey,
        candidates: uids.size,
        written,
        skipped
    });
    return null;
});
