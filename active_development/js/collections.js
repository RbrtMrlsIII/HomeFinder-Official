/* Canonical collection names. The legacy `properties` collection is retired. */
export const PROPERTY_LISTINGS = "propertyListings";
export const WANTED_LISTINGS = "wantedListings";
export const CONTRACTS = "contracts";
export const SUPPORT_TICKETS = "supportTickets";

/** One canonical property listing by id. */
export async function getPropertyListing(db, id, { getDoc, doc }) {
  return getDoc(doc(db, PROPERTY_LISTINGS, id));
}

/** Canonical owner inventory. */
export async function listPropertyListingsForOwner(db, ownerId, fs) {
  const { collection, query, where, getDocs } = fs;
  const byId = new Map();
  for (const field of ["ownerId", "uid"]) {
    try {
      const snap = await getDocs(query(collection(db, PROPERTY_LISTINGS), where(field, "==", ownerId)));
      snap.forEach((d) => byId.set(d.id, { id: d.id, data: d.data() || {}, col: PROPERTY_LISTINGS }));
    } catch (e) {
      console.warn("listPropertyListingsForOwner", field, e?.message || e);
    }
  }
  return [...byId.values()];
}

/** Full canonical property inventory. */
export async function listAllPropertyListings(db, { collection, getDocs }) {
  const snap = await getDocs(collection(db, PROPERTY_LISTINGS));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() || {}, col: PROPERTY_LISTINGS }));
}

/** Update a canonical listing. */
export async function updatePropertyListing(db, id, patch, { doc, getDoc, updateDoc }) {
  const snap = await getPropertyListing(db, id, { getDoc, doc });
  if (!snap.exists()) throw new Error("Listing not found");
  await updateDoc(doc(db, PROPERTY_LISTINGS, id), patch);
  return PROPERTY_LISTINGS;
}

/** Delete a canonical listing. */
export async function deletePropertyListing(db, id, { doc, getDoc, deleteDoc }) {
  const snap = await getPropertyListing(db, id, { getDoc, doc });
  if (!snap.exists()) throw new Error("Listing not found");
  await deleteDoc(doc(db, PROPERTY_LISTINGS, id));
  return PROPERTY_LISTINGS;
}
