/* SoT §14 — single client gate for listing creation (Spark-safe).
 * Prefer createListing / createWantedListing callables when Functions work.
 * Fallback: validated client write to canonical collections (rules still enforce owner/seeker).
 * Never write to the retired properties collection.
 */
import { db, functions } from "./firebase.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function stripNonFirestore(obj) {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (v === undefined) {
      delete out[k];
      continue;
    }
    if (typeof File !== "undefined" && v instanceof File) {
      delete out[k];
      continue;
    }
    if (typeof Blob !== "undefined" && v instanceof Blob) {
      delete out[k];
      continue;
    }
    if (
      Array.isArray(v) &&
      v.some(
        (x) =>
          (typeof File !== "undefined" && x instanceof File) ||
          (typeof Blob !== "undefined" && x instanceof Blob)
      )
    ) {
      out[k] = v.filter(
        (x) =>
          !(typeof File !== "undefined" && x instanceof File) &&
          !(typeof Blob !== "undefined" && x instanceof Blob)
      );
    }
  }
  return out;
}

/**
 * @param {object} listing - payload (must include ownerId)
 * @returns {Promise<{ id: string, via: "callable"|"client" }>}
 */
export async function createPropertyListingAuthoritative(listing) {
  const payload = stripNonFirestore({
    ...listing,
    featuredByMod: false,
    featuredUntil: null,
  });
  if (!payload.ownerId) throw new Error("ownerId required");
  /* D: never persist client ISO createdAt — serverTimestamp on write */
  delete payload.createdAt;

  // 1) Callable first (SoT §14) when Functions are live
  try {
    const createListing = httpsCallable(functions, "createListing");
    const result = await createListing({ listing: payload });
    const id = result?.data?.id || result?.data?.propertyId;
    if (id) return { id, via: "callable" };
  } catch (fnErr) {
    console.warn("createListing callable unavailable — Spark/client gate:", fnErr?.code || fnErr);
  }

  // 2) Validated client write to canonical propertyListings
  const ref = await addDoc(collection(db, "propertyListings"), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  return { id: ref.id, via: "client" };
}

/**
 * @param {object} wanted - payload (must include seekerId)
 */
export async function createWantedListingAuthoritative(wanted) {
  const payload = stripNonFirestore({ ...wanted });
  if (!payload.seekerId) throw new Error("seekerId required");
  delete payload.createdAt;

  try {
    const createWanted = httpsCallable(functions, "createWantedListing");
    const result = await createWanted({ wanted: payload });
    const id = result?.data?.id || result?.data?.wantedId;
    if (id) return { id, via: "callable" };
  } catch (fnErr) {
    console.warn("createWantedListing callable unavailable — Spark/client gate:", fnErr?.code || fnErr);
  }

  const ref = await addDoc(collection(db, "wantedListings"), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, via: "client" };
}
