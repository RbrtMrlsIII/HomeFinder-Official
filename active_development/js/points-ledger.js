/* Phase 8 — Organic points ledger (SoT §28)
 * Prefer Cloud Functions on Blaze; on Spark we still write an append-only
 * ledger + organicPoints with idempotency keys so grants are not free-form.
 */
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/** SoT §28 amounts */
export const POINTS = {
  LISTING_PUBLISHED: 5,
  WANTED_PUBLISHED: 5,
  WANTED_REVEAL: 0.08,
  CONTRACT_MADE: 20,
  MONTHLY_RENEW: 30,
  SUCCESSFUL_ASSIST: 50
};

export const WANTED_REVEAL_DAILY_CAP = 20; // events per UTC day
export const LISTING_POINT_DAILY_CAP = 50; // property points/day or wanted points/day; brokers may earn both categories

function utcDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function ledgerId(uid, eventKey) {
  // Firestore doc ids: avoid slashes
  return `${uid}__${String(eventKey).replace(/[\/#]/g, "_")}`.slice(0, 700);
}

/**
 * Historical browser award API retained for traceability only.
 * Point mutations moved to trusted Cloud Functions in Foundation Repair 02.
 */
export async function awardOrganicPoints() {
  return { ok: false, reason: "backend_authority_required" };
}

/** Historical browser award APIs are retained only for traceability; trusted Functions own mutations. */
export async function awardWantedReveal() {
  return { ok: false, reason: "backend_authority_required" };
}

export async function awardListingPublished() {
  return { ok: false, reason: "backend_authority_required" };
}

export async function awardContractMade() {
  return { ok: false, reason: "backend_authority_required" };
}

export async function awardMonthlyRenew() {
  return { ok: false, reason: "backend_authority_required" };
}

export async function awardSuccessfulAssist() {
  return { ok: false, reason: "backend_authority_required" };
}

/** Today's reveal progress for Perks UX */
export async function getWantedRevealProgress(uid) {
  if (!uid) return { used: 0, cap: WANTED_REVEAL_DAILY_CAP, pointsToday: 0 };
  const day = utcDayKey();
  let used = 0;
  try {
    const qy = query(
      collection(db, "pointsLedger"),
      where("uid", "==", uid),
      where("event", "==", "wanted_reveal"),
      where("dayKey", "==", day),
      limit(30)
    );
    const snap = await getDocs(qy);
    used = snap.size;
  } catch (_) {}
  return {
    used,
    cap: WANTED_REVEAL_DAILY_CAP,
    pointsToday: Number((used * POINTS.WANTED_REVEAL).toFixed(2))
  };
}

export async function getOrganicPointsTotal(uid) {
  if (!uid) return 0;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return Number(snap.data().organicPoints) || 0;
  } catch (_) {}
  return 0;
}
