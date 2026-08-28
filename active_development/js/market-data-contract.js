/**
 * HomeFinder Market — Patch 27 canonical read-model boundary.
 *
 * This module freezes the browser-facing read wiring for Market discovery.
 * It does not create a new Firestore collection and does not change security
 * authority. It only defines which canonical source feeds each Market view.
 *
 * Canonical sources:
 *   seeker -> propertyListings
 *   owner  -> wantedListings
 *   broker -> Broker HQ (Market does not load discovery records)
 *
 * View contract:
 *   filters/cards/map/detail -> the same normalized discovery records
 *   performance analytics    -> listingStats/{propertyId} when authorized
 *   raw listingActivity      -> never a public Market statistics source
 */
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { PROPERTY_LISTINGS, WANTED_LISTINGS } from "./collections.js";
import {
  normalizeMarketRecords,
  listingCoordinates,
  isMarketDiscoverable,
} from "./market-discovery-contract.js";

export const MARKET_READ_MODEL_VERSION = "27.0";

export const MARKET_SOURCES = Object.freeze({
  property: PROPERTY_LISTINGS,
  wanted: WANTED_LISTINGS,
  stats: "listingStats",
  activity: "listingActivity",
});

export const MARKET_ROLE_POOL = Object.freeze({
  seeker: "property",
  owner: "wanted",
  broker: "broker-hq",
  guest: "none",
});

export const MARKET_VIEW_WIRING = Object.freeze({
  filters: "normalized-discovery-records",
  cards: "normalized-discovery-records",
  mapPins: "normalized-discovery-records.marketData.coordinates",
  detail: "normalized-discovery-records",
  performanceStats: "listingStats/{propertyId} (authorized owner/admin reads only)",
  auditEvents: "server-authoritative only; not a Market read feed",
});

function sourceForKind(kind) {
  if (kind === "property") return MARKET_SOURCES.property;
  if (kind === "wanted") return MARKET_SOURCES.wanted;
  return null;
}

export function marketPoolForRole(role) {
  return MARKET_ROLE_POOL[String(role || "guest").toLowerCase()] || "none";
}

/**
 * Read one canonical Market inventory. Sorting is best-effort so a missing or
 * incompatible createdAt index cannot make the Market data contract fail.
 */
export async function readMarketInventory(db, role, firestore = {}) {
  const kind = marketPoolForRole(role);
  const collectionName = sourceForKind(kind);
  if (!collectionName) return { kind: "none", source: null, records: [] };

  const getDocsFn = firestore.getDocs || getDocs;
  const queryFn = firestore.query || query;
  const collectionFn = firestore.collection || collection;
  const orderByFn = firestore.orderBy || orderBy;

  let snap;
  try {
    snap = await getDocsFn(queryFn(
      collectionFn(db, collectionName),
      orderByFn("createdAt", "desc")
    ));
  } catch (_) {
    snap = await getDocsFn(collectionFn(db, collectionName));
  }

  const raw = snap.docs.map((s) => ({
    id: s.id,
    data: s.data() || {},
    _source: collectionName,
  }));

  return {
    kind,
    source: collectionName,
    records: normalizeMarketRecords(raw, kind),
  };
}

/** A stable map point used by both card/map consumers. */
export function marketCoordinates(item) {
  return item?.marketData?.coordinates || listingCoordinates(item?.data || item || {});
}

/** The canonical discoverability predicate exposed for contract tests. */
export function isMarketRecordReadable(item) {
  return isMarketDiscoverable(item);
}
