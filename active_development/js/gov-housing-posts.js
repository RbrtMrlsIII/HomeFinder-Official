/* F1a — govHousingPosts CRUD helpers (SoT §34)
 * Admin/staff free posts. Public surfaces consume published + not expired later.
 */
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const COLLECTION = "govHousingPosts";

export const SECTORS = [
  { id: "pagibig", label: "Pag-IBIG" },
  { id: "4ph", label: "4PH / DHSUD" },
  { id: "nha", label: "NHA" },
  { id: "other", label: "Other KSA" },
  { id: "partner", label: "Developer partner" }
];

export function defaultExpiresAt(days = 45) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isExpired(post, now = Date.now()) {
  if (!post) return true;
  if (post.status === "expired" || post.status === "taken_down") return true;
  if (!post.expiresAt) return true;
  const t = new Date(post.expiresAt).getTime();
  return Number.isFinite(t) ? t <= now : true;
}

export function isPublicVisible(post, now = Date.now()) {
  return post?.status === "published" && !isExpired(post, now);
}

function clean(payload) {
  const title = String(payload.title || "").trim().slice(0, 120);
  const sector = String(payload.sector || "other").trim();
  const imageUrl = String(payload.imageUrl || "").trim();
  const externalUrl = String(payload.externalUrl || "").trim();
  const locationText = String(payload.locationText || "").trim().slice(0, 120);
  const priceBand = String(payload.priceBand || "unknown").trim();
  const expiresAt = String(payload.expiresAt || defaultExpiresAt()).trim();
  const status = String(payload.status || "draft").trim();
  if (!title) throw new Error("Title required");
  if (!externalUrl) throw new Error("Details URL (government / official link) required");
  if (!imageUrl) throw new Error("Image URL required");
  if (!expiresAt) throw new Error("expiresAt required");
  const opsVerified = payload.opsVerified === true || payload.opsVerified === "true" || payload.opsVerified === "1";
  const partnerName = String(payload.partnerName || "").trim().slice(0, 80);
  return {
    title,
    sector: SECTORS.some((s) => s.id === sector) ? sector : "other",
    imageUrl,
    externalUrl,
    locationText,
    priceBand,
    expiresAt,
    status: ["draft", "published", "expired", "taken_down"].includes(status)
      ? status
      : "draft",
    disclaimerKey: SECTORS.some((s) => s.id === sector) ? sector : "other",
    opsVerified,
    partnerName,
    inventoryKind: sector === "partner" || opsVerified ? (opsVerified ? "partner_verified" : "partner") : "program"
  };
}

export async function listAllPosts(max = 80) {
  const snap = await getDocs(query(collection(db, COLLECTION), limit(max)));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) =>
    String(b.updatedAt || b.publishedAt || b.createdAt || "").localeCompare(
      String(a.updatedAt || a.publishedAt || a.createdAt || "")
    )
  );
  return rows;
}

export async function listPublishedPublic(max = 40) {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("status", "==", "published"), limit(max))
  );
  const now = Date.now();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => isPublicVisible(p, now));
}

export async function createPost(payload, uid) {
  const body = clean(payload);
  const ref = await addDoc(collection(db, COLLECTION), {
    ...body,
    createdBy: uid || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: body.status === "published" ? new Date().toISOString() : null,
    fee: 0,
    source: "admin"
  });
  return ref.id;
}

export async function updatePost(id, payload, uid) {
  if (!id) throw new Error("Missing id");
  const body = clean(payload);
  const patch = {
    ...body,
    updatedAt: new Date().toISOString(),
    updatedBy: uid || null
  };
  if (body.status === "published") {
    const prev = await getDoc(doc(db, COLLECTION, id));
    if (!prev.exists() || !prev.data().publishedAt) {
      patch.publishedAt = new Date().toISOString();
    }
  }
  await updateDoc(doc(db, COLLECTION, id), patch);
}

export async function setPostStatus(id, status, uid) {
  const st = String(status || "").trim();
  if (!["draft", "published", "expired", "taken_down"].includes(st)) {
    throw new Error("Invalid status");
  }
  const patch = {
    status: st,
    updatedAt: new Date().toISOString(),
    updatedBy: uid || null
  };
  if (st === "published") patch.publishedAt = new Date().toISOString();
  if (st === "expired") patch.expiredAt = new Date().toISOString();
  await updateDoc(doc(db, COLLECTION, id), patch);
}

export async function removePost(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Mark published posts past expiresAt as expired */
export async function expireOverduePosts(uid) {
  const rows = await listAllPosts(100);
  const now = Date.now();
  let n = 0;
  for (const p of rows) {
    if (p.status === "published" && isExpired(p, now)) {
      await setPostStatus(p.id, "expired", uid);
      n += 1;
    }
  }
  return n;
}
