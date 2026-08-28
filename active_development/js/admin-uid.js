/* HomeFinder ops UIDs — three separate roles, fair boundaries.
 *
 * ROLE SUMMARY (2026-08-13 arrangement)
 * --------------------------------------
 * Admin     — final approvals + ONLY role that can view sensitive KYC docs
 * Moderator — listing content (friendly / not scam) + payment reference truth
 * Staff     — customer service, support, report intake, order-reference review
 *
 * Keep these lists in sync with:
 *   - firestore.rules  (isAdmin / isModerator / isStaffRole)
 *   - functions/index.js (ADMIN_UIDS fallback)
 * Log every assignment change in CHANGES.txt.
 */

/** Legacy single-admin constant (kept for older imports). Prefer isAdminUid. */
import { normalizeCanonicalRole } from "./canonical-role.js";

export const ADMIN_UID = "IZN9EHQ9iTboWXoEgklJlWiwzz82";

/** Admin — KYC document view/approve + all final approvals (single live admin) */
export const ADMIN_UIDS = [
  "IZN9EHQ9iTboWXoEgklJlWiwzz82"
];

/** Moderator — listing content + payment reference checks */
export const MODERATOR_UIDS = [
  "kCEWpYhFv8bCSlbxStuYpc7r1If1"
];

/** Staff — customer service + order reference review + report intake */
export const STAFF_UIDS = [
  "aQsmw6Ca28eAze1frRi3ZBiCRf92"
];

// --- role checks ----------------------------------------------------------

export function isAdminUid(uid) {
  return ADMIN_UIDS.includes(uid);
}

export function isModeratorUid(uid) {
  return MODERATOR_UIDS.includes(uid);
}

export function isStaffRoleUid(uid) {
  return STAFF_UIDS.includes(uid);
}

/** Any ops account (admin OR moderator OR staff) */
export function isOpsUid(uid) {
  return isAdminUid(uid) || isModeratorUid(uid) || isStaffRoleUid(uid);
}

/**
 * Returns "admin" | "moderator" | "staff" | null
 * Used by page cores to gate tools and set body class / chip.
 */

/** Resolve an operations role from canonicalRole, with the bootstrap UID fallback. */
export function opsRoleForCanonicalRole(rawRole, uid = null) {
    const role = normalizeCanonicalRole(rawRole);
    if (role === "admin" || role === "moderator" || role === "staff") return role;
    return opsRoleForUid(uid);
}
\nexport function opsRoleForUid(uid) {
  if (isAdminUid(uid)) return "admin";
  if (isModeratorUid(uid)) return "moderator";
  if (isStaffRoleUid(uid)) return "staff";
  return null;
}

// --- backward-compatible aliases (old admin.html / core.js) ---------------
export const SUPER_ADMIN_UIDS = ADMIN_UIDS;
export function isSuperAdminUid(uid) { return isAdminUid(uid); }
export function staffRoleForUid(uid) {
  const r = opsRoleForUid(uid);
  if (r === "admin") return "super";   // legacy chip label mapping
  if (r === "moderator") return "moderator";
  if (r === "staff") return "staff";
  return null;
}
