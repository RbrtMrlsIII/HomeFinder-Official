/**
 * Broker HQ authorized discovery projection.
 * 50 km is the hard maximum service-radius cap. Brokers may choose a
 * preferred radius at or below this cap for the active service pin.
 */
const BROKER_HQ_MAX_RADIUS_KM = 50;
const BROKER_HQ_MIN_RADIUS_KM = 0.5;

function normalizeBrokerHQRadius(radiusKm) {
  const requested = Number(radiusKm);
  if (!Number.isFinite(requested)) return BROKER_HQ_MAX_RADIUS_KM;
  return Math.min(
    BROKER_HQ_MAX_RADIUS_KM,
    Math.max(BROKER_HQ_MIN_RADIUS_KM, requested)
  );
}
const CANONICAL_COLLECTIONS = Object.freeze({
  PROPERTY: "propertyListings",
  WANTED: "wantedListings",
});
const DISCOVERY_TYPES = Object.freeze(["property","propertyHelp","wanted","wantedHelp"]);

function normalizeDiscoveryType(type) {
  const value = String(type || "all");
  if (value === "all") return "all";
  if (!DISCOVERY_TYPES.includes(value)) throw new Error("invalid-discovery-type");
  return value;
}
function canonicalCollectionForDiscoveryType(type) {
  const t = normalizeDiscoveryType(type);
  if (t === "all") return [CANONICAL_COLLECTIONS.PROPERTY, CANONICAL_COLLECTIONS.WANTED];
  return [t.startsWith("wanted") ? CANONICAL_COLLECTIONS.WANTED : CANONICAL_COLLECTIONS.PROPERTY];
}
function coords(d = {}) {
  const lat = Number(d.lat ?? d.latitude ?? d.location?.lat ?? d.geo?.lat);
  const lng = Number(d.lng ?? d.longitude ?? d.location?.lng ?? d.geo?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}
function validateBrokerHQPin(pin = {}) {
  const lat = Number(pin.lat), lng = Number(pin.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
}
function distanceKm(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat-a.lat)*rad, dLng = (b.lng-a.lng)*rad;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.min(1, Math.sqrt(h)));
}
function publicActive(d = {}) {
  const status = String(d.status ?? d.approvalStatus ?? d.visibilityStatus ?? "active").toLowerCase();
  if (["pending_approval","pending","rejected","draft","hidden","closed","deleted","archived","expired"].includes(status)) return false;
  return d.deleted !== true && d.isDeleted !== true && d.hidden !== true && d.isHidden !== true;
}
function helpRequested(d = {}) {
  return d.needHelp === true || d.need_help === true || d.brokerHelpRequested === true;
}
function firstImage(d = {}) {
  const list = Array.isArray(d.images) ? d.images : [];
  const first = list.find(Boolean);
  if (typeof first === "string") return first;
  if (first && typeof first === "object") return first.url || first.src || first.downloadURL || "";
  return d.coverImage || d.coverUrl || d.imageUrl || d.photoUrl || "";
}
function isDiscoverableDocument(d = {}) {
  const visibility = String(
    d.visibility ?? d.visibilityStatus ?? d.listingVisibility ?? "public"
  ).toLowerCase();
  if (["private", "hidden", "unlisted", "draft", "deleted", "archived", "expired", "rejected"].includes(visibility)) return false;
  return publicActive(d);
}

function project(docSnap, collectionName, origin, uid) {
  const d = docSnap.data() || {};
  const c = coords(d);
  if (!c || !isDiscoverableDocument(d)) return null;
  const owner = d.ownerId ?? d.ownerID ?? d.userId ?? d.createdBy ?? null;
  const seeker = d.seekerId ?? d.seekerID ?? d.userId ?? d.createdBy ?? null;
  if ((owner && String(owner) === String(uid)) || (seeker && String(seeker) === String(uid))) return null;
  const kind = collectionName === CANONICAL_COLLECTIONS.WANTED ? "wanted" : "property";
  const type = kind === "wanted"
    ? d.wanted_classification ?? d.classification ?? d.category ?? d.type ?? ""
    : d.property_classification ?? d.propertyType ?? d.classification ?? d.type ?? "";
  const priceMin = Number(kind === "wanted" ? (d.budget_min ?? d.budgetMin ?? d.minBudget) : (d.price_min ?? d.priceMin ?? d.monthly_price ?? d.per_bed_price ?? d.price ?? d.amount));
  const priceMax = Number(kind === "wanted" ? (d.budget_max ?? d.budgetMax ?? d.maxBudget ?? d.budget) : (d.price_max ?? d.priceMax ?? d.monthly_price ?? d.per_bed_price ?? d.price ?? d.amount));
  const amenities = kind === "wanted"
    ? (d.preferredAmenities ?? d.preferred_amenities ?? d.amenities ?? d.amenity ?? [])
    : (d.amenities ?? d.amenity ?? d.features ?? []);
  return {
    id: docSnap.id,
    collection: collectionName,
    marketKind: kind,
    help: helpRequested(d),
    title: d.listing_title ?? d.title ?? d.wantedTitle ?? d.name ?? "Listing",
    type: String(type || ""),
    description: String(d.description ?? d.notes ?? d.summary ?? ""),
    priceMin: Number.isFinite(priceMin) ? priceMin : null,
    priceMax: Number.isFinite(priceMax) ? priceMax : null,
    amenities: Array.isArray(amenities) ? amenities.map(String) : [],
    image: firstImage(d),
    coordinates: c,
    distanceKm: Math.round(distanceKm(origin, c)*10)/10,
    expiresAt: d.expiresAt ?? d.expiryAt ?? d.listingExpiresAt ?? null
  };
}
module.exports = {
  BROKER_HQ_MAX_RADIUS_KM,
  BROKER_HQ_MIN_RADIUS_KM,
  normalizeBrokerHQRadius,
  CANONICAL_COLLECTIONS,
  DISCOVERY_TYPES,
  normalizeDiscoveryType,
  canonicalCollectionForDiscoveryType,
  isDiscoverableDocument,
  validateBrokerHQPin,
  coords,
  project,
};
