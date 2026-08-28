/* ================================ */
/*  RADIUS COOLDOWN                 */
/* ================================ */
/* Seeker/broker map relocation mechanic (see docs/                */
/* CONTRACT-TIER-SYSTEM.md §6). Reads/writes                        */
/* users/{uid}.mapState from Firestore -- the cooldown timestamp    */
/* lives server-side so it can't be reset by clearing local          */
/* storage. The client-side check here is for UX only (disabling    */
/* the "relocate" button, showing a countdown); the real            */
/* enforcement is the Firestore security rule -- see                */
/* firestore.rules. A rejected write here always means the rule     */
/* said no, not this file.                                           */

import { db, app } from "./firebase.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { doc, getDoc, setDoc, serverTimestamp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { cooldownHoursForTier, radiusForTier } from "./tiers.js";
const pinFunctions = getFunctions(app);
const relocateUserPinFn = httpsCallable(pinFunctions, "relocateUserPin");

/**
 * Reads the user's current map state and returns everything a map UI
 * needs to render: allowed radius (tier + boost aware), whether they're
 * currently allowed to relocate, and (if not) how much time is left.
 *
 * @param {string} uid
 * @param {number} tierIndex        0-4, from tiers.js's seekerTierForCategory/brokerTierForScore
 * @param {number} seekerPackageId  0–5 Seeking Boost package id
 */
export async function getMapState(uid, tierIndex, seekerPackageId = 0, stateField = "mapState"){
    const snap = await getDoc(doc(db, "users", uid));
    const mapState = snap.exists() ? ((snap.data()[stateField] || snap.data().mapState || {})) : {};

    const radiusKm = radiusForTier(tierIndex, seekerPackageId);
    const cooldownHours = cooldownHoursForTier(tierIndex, seekerPackageId);

    // Accept Firestore Timestamp, ISO string, or epoch ms
    let lastRelocatedAt = null;
    const rawLast = mapState.lastRelocatedAt;
    if (rawLast) {
        if (typeof rawLast.toDate === "function") lastRelocatedAt = rawLast.toDate();
        else if (typeof rawLast === "string" || typeof rawLast === "number") {
            const d = new Date(rawLast);
            if (!Number.isNaN(d.getTime())) lastRelocatedAt = d;
        }
    }

    let canRelocate = true;
    let cooldownRemainingMs = 0;
    const maxAttempts = 1 + Math.max(0, Number(tierIndex) || 0);
    const usedAttempts = Number(mapState.relocationAttempts || 0);
    const cooldownMs = Math.max(0, Number(cooldownHours) || 0) * 60 * 60 * 1000;

    if(lastRelocatedAt){
        const elapsedMs = Date.now() - lastRelocatedAt.getTime();
        if(elapsedMs >= 0 && elapsedMs < cooldownMs){
            canRelocate = false;
            // Cap so a bad timestamp can never show multi-year countdowns
            cooldownRemainingMs = Math.min(cooldownMs - elapsedMs, cooldownMs);
        } else if (elapsedMs < 0) {
            // Future timestamp (clock skew) — treat as full window only
            canRelocate = false;
            cooldownRemainingMs = cooldownMs;
        } else if (usedAttempts >= maxAttempts) {
            canRelocate = true;
        }
    } else {
        // Brand-new account: free first pin set (no prior cooldown)
        canRelocate = true;
    }

    return {
        radiusKm,
        cooldownHours,
        lastKnownCenter: mapState.lastKnownCenter || null,
        canRelocate,
        cooldownRemainingMs
    };
}

/**
 * Attempts to relocate the user's map center. Does a client-side
 * cooldown check first purely so the UI can fail fast without a round
 * trip -- but the write itself is what actually matters, and Firestore
 * will reject it if the security rule's own cooldown check disagrees
 * with this one (e.g. clock drift, or a stale read).
 *
 * @returns {{ success: boolean, reason?: string }}
 */
export async function attemptRelocate(uid, tierIndex, seekerPackageId, newCenter, stateField = "mapState"){
    try {
        const result = await relocateUserPinFn({
            pinId: stateField === "mapStateOwner" ? "supply-1" : "discovery-1",
            kind: stateField === "mapStateOwner" ? "supply" : "discovery",
            center: {lat:Number(newCenter?.lat),lng:Number(newCenter?.lng)}
        });
        return result?.data || {success:false,reason:"rejected"};
    } catch (error) {
        console.error("Authoritative relocate callable rejected:", error);
        return {success:false,reason:"rejected",error};
    }
}

/** Formats a countdown for display, e.g. "5h 12m remaining". */
export function formatCooldown(remainingMs){
    if(remainingMs <= 0) return "Ready";
    const totalMinutes = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if(hours === 0) return `${minutes}m remaining`;
    return `${hours}h ${minutes}m remaining`;
}
