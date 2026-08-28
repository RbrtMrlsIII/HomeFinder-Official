/**
 * HomeFinder Market — Patch 03 canonical discovery data contract.
 *
 * This module is the single normalization boundary between Firestore listing
 * documents and the Market discovery engine.
 *
 * Rules:
 * - Market consumes only canonical propertyListings / wantedListings.
 * - Guests receive no live discovery records.
 * - Market roles: seeker -> propertyListings; owner -> wantedListings; broker -> Broker HQ.
 * - Broker HQ is the broker management, dual-inventory, assistance, and Need Help discovery surface.
 * - Only public/active records with usable coordinates are discoverable.
 * - Amenities are token-normalized through listing-catalog.js.
 * - Structured price/budget ranges are normalized without changing source data.
 */
import { normalizeAmenityList } from "./listing-catalog.js";

const BLOCKED_STATUS = new Set([
  "pending_approval", "pending", "rejected", "draft",
  "hidden", "closed", "deleted", "archived", "expired"
]);

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function isMarketPublic(data = {}) {
  const status = String(
    data.status ?? data.approvalStatus ?? data.visibilityStatus ?? "active"
  ).trim().toLowerCase();
  if (BLOCKED_STATUS.has(status)) return false;
  if (data.deleted === true || data.isDeleted === true) return false;
  if (data.hidden === true || data.isHidden === true) return false;
  return true;
}

export function listingCoordinates(data = {}) {
  const lat = num(data.lat ?? data.latitude ?? data.location?.lat);
  const lng = num(data.lng ?? data.longitude ?? data.location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function normalizePropertyMarketRecord(item) {
  const d = item?.data || {};
  return {
    ...item,
    marketKind: "property",
    marketData: {
      id: item.id,
      title: d.listing_title ?? d.title ?? null,
      type: d.property_classification ?? d.propertyType ?? d.classification ?? d.type ?? null,
      description: d.description ?? d.notes ?? d.summary ?? "",
      priceMin: num(d.price_min ?? d.priceMin ?? d.monthly_price ?? d.per_bed_price ?? d.price ?? d.amount),
      priceMax: num(d.price_max ?? d.priceMax ?? d.monthly_price ?? d.per_bed_price ?? d.price ?? d.amount),
      amenities: normalizeAmenityList(d.amenities ?? d.amenity ?? d.features ?? []),
      coordinates: listingCoordinates(d),
      ownerId: d.ownerId ?? d.ownerID ?? d.userId ?? null,
      needHelp: d.needHelp === true || d.need_help === true || d.brokerHelpRequested === true
    }
  };
}

export function normalizeWantedMarketRecord(item) {
  const d = item?.data || {};
  return {
    ...item,
    marketKind: "wanted",
    marketData: {
      id: item.id,
      title: d.title ?? d.wantedTitle ?? d.listing_title ?? null,
      type: d.wanted_classification ?? d.classification ?? d.category ?? null,
      description: d.description ?? d.notes ?? d.summary ?? "",
      priceMin: num(d.budget_min ?? d.budgetMin ?? d.minBudget),
      priceMax: num(d.budget_max ?? d.budgetMax ?? d.maxBudget ?? d.budget),
      amenities: normalizeAmenityList(
        d.preferredAmenities ?? d.preferred_amenities ?? d.amenities ?? d.amenity ?? []
      ),
      coordinates: listingCoordinates(d),
      seekerId: d.seekerId ?? d.seekerID ?? d.userId ?? null,
      needHelp: d.needHelp === true || d.need_help === true || d.brokerHelpRequested === true
    }
  };
}

/**
 * A record must be public and geolocated to enter the Market discovery set.
 * This intentionally leaves ownership/capacity/Need Help enforcement to their
 * authoritative creation/security contracts; Market never creates or consumes
 * a second listing collection.
 */
export function isMarketDiscoverable(item) {
  const d = item?.data || {};
  return isMarketPublic(d) && !!listingCoordinates(d);
}

export function normalizeMarketRecords(items, kind) {
  const normalizer = kind === "property"
    ? normalizePropertyMarketRecord
    : normalizeWantedMarketRecord;
  return items.filter(isMarketDiscoverable).map(normalizer);
}
