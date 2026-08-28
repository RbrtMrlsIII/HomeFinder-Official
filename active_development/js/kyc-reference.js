/* ==================================== */
/*  KYC REFERENCE NORMALIZATION         */
/* ==================================== */
/* Shared by js/profile/kyc-form.js (claims a reference number on      */
/* submit) and js/admin/kyc-registry.js (the admin search/manual-entry */
/* dashboard) so both sides always compute the SAME Firestore doc ID   */
/* for the same real-world ID number -- that's the entire mechanism    */
/* duplicate detection relies on. If these two files ever normalize    */
/* differently, "ABC-123" and "abc123" would silently become two       */
/* different reservations instead of colliding, and the whole point of */
/* this system (one government ID = one account, enforced by           */
/* firestore.rules, not just admin vigilance) quietly stops working.   */

/**
 * Strips everything but letters/digits and uppercases. Government ID
 * and PRC numbers are typed inconsistently (dashes, spaces, mixed
 * case) across different people's submissions of the exact same
 * document -- this makes "123-456-789", "123 456 789", and
 * "123456789" all resolve to one claim instead of three.
 */
export function normalizeReferenceNumber(raw) {
    return String(raw || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}

/**
 * Firestore doc IDs can't contain "/" and shouldn't rely on characters
 * that need escaping -- idType is already a safe slug (see
 * ACCEPTED_ID_LABELS keys in tiers.js), so this is just idType +
 * normalized number joined by "_", which also keeps two different ID
 * TYPES that happen to share a numbering scheme from colliding with
 * each other.
 */
export function kycReferenceIndexId(idType, referenceNumber) {
    const type = String(idType || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const num = normalizeReferenceNumber(referenceNumber);
    if (!type || !num) return null;
    return `${type}_${num}`;
}
