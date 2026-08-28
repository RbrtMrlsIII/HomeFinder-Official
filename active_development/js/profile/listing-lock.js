/* SoT: 48-hour management lock — per listing, not per account.
 * UI uses these helpers; Firestore rules enforce the same window. */

export const LISTING_LOCK_MS = 2 * 24 * 60 * 60 * 1000;

export function listingCreatedMs(data) {
  if (!data) return 0;
  if (data.createdAt?.toDate) return data.createdAt.toDate().getTime();
  if (data.createdAt?.seconds) return data.createdAt.seconds * 1000;
  if (typeof data.createdAt === "string") return Date.parse(data.createdAt) || 0;
  if (typeof data.createdAt === "number") return data.createdAt;
  return 0;
}

/** True when owner may edit/close/delete (after 48h from createdAt). */
export function canManageListing(data) {
  const created = listingCreatedMs(data);
  if (!created) return true; // missing timestamp — allow (legacy)
  return Date.now() >= created + LISTING_LOCK_MS;
}

export function manageUnlockLabel(data) {
  const created = listingCreatedMs(data);
  if (!created) return "Editable";
  const unlock = created + LISTING_LOCK_MS;
  const ms = unlock - Date.now();
  if (ms <= 0) return "Editable now";
  const h = Math.ceil(ms / 3600000);
  return h < 48 ? `Locked ~${h}h` : `Locked ~${Math.ceil(h / 24)}d`;
}
