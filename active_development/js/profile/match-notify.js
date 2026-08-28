/* listing match notification bridge: server-authoritative + deduplicated */
import { functions } from "./core.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const notifyListingMatches = httpsCallable(functions, "notifyListingMatches");

export async function notifyMatchesForListing(listing) {
    const listingId = String(listing?.id || "").trim();
    if (!listingId) return { delivered: 0, skipped: 0 };
    const result = await notifyListingMatches({ listingId });
    return result?.data || { delivered: 0, skipped: 0 };
}
