/**
 * HomeFinder Broker HQ — Patch 28 canonical workspace read-model boundary.
 *
 * Browser consumers must treat this module as the read contract for Broker HQ.
 * It separates broker-owned inventory from broker-assisted work and keeps
 * private listingStats behind the authorized server projection.
 * No new Firestore collection is introduced.
 */
export const BROKER_HQ_READ_MODEL_VERSION = "28.0";

export const BROKER_HQ_SOURCES = Object.freeze({
  propertyInventory: "propertyListings",
  wantedInventory: "wantedListings",
  assistance: "assistanceRequests",
  stats: "listingStats",
  contracts: "contracts",
  discovery: "brokerHQDiscover",
  workspace: "brokerHQWorkspace",
});

export const BROKER_HQ_VIEW_WIRING = Object.freeze({
  ownedInventory: "brokerHQWorkspace.ownedInventory",
  assistedWork: "brokerHQWorkspace.assistedWork",
  analytics: "brokerHQWorkspace.analytics",
  discovery: "brokerHQDiscover.records",
  serviceRequests: "assistanceRequests (server-authorized / existing workflow)",
  mapPins: "mapStateOwner + existing pin contract",
});

export function normalizeBrokerWorkspace(data = {}) {
  const ownedInventory = Array.isArray(data.ownedInventory) ? data.ownedInventory : [];
  const assistedWork = Array.isArray(data.assistedWork) ? data.assistedWork : [];
  const analytics = data.analytics && typeof data.analytics === "object" ? data.analytics : {};
  return {
    version: String(data.version || BROKER_HQ_READ_MODEL_VERSION),
    ownedInventory,
    assistedWork,
    analytics,
    generatedAt: data.generatedAt || null,
  };
}

export function brokerInventorySource(record = {}) {
  return record.collection === "wantedListings" ? "wantedListings" : "propertyListings";
}

export function brokerWorkKind(record = {}) {
  if (record.kind === "assisted") return "assisted";
  return "owned";
}
