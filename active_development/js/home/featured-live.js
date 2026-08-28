/* Home Featured Properties — live active listings from canonical propertyListings. */
import { db } from "../firebase.js";
import { authReady } from "../session.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function isActive(data) {
  const s = String(data?.status || data?.approvalStatus || "active").toLowerCase();
  return s === "active" || s === "published" || s === "approved";
}

function cardHtml(id, data) {
  const title = data.title || data.listing_title || data.propertyType || "Property";
  const loc = data.city || data.location || data.address || "";
  const price =
    data.monthly_price != null
      ? `₱${Number(data.monthly_price).toLocaleString()}/month`
      : data.per_bed_price != null
        ? `₱${Number(data.per_bed_price).toLocaleString()}/bed`
        : "";
  const img =
    (Array.isArray(data.images) && data.images[0]) ||
    data.coverUrl ||
    data.imageUrl ||
    "";
  const href = `market.html#listing-${id}`;
  return `
      <article class="property-card" data-listing-id="${id}">
        ${img ? `<img src="${img}" alt="" loading="lazy">` : `<div class="property-card-ph" aria-hidden="true"></div>`}
        <div class="card-content">
          <h3>${escape(title)}</h3>
          <p>${escape(loc)}</p>
          <strong>${escape(price)}</strong>
          <a class="primary-btn" href="${href}">View Details</a>
        </div>
      </article>`;
}

function escape(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function ingest(name, out, seen) {
  try {
    let snap;
    try {
      snap = await getDocs(
        query(
          collection(db, name),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(6)
        )
      );
    } catch {
      snap = await getDocs(query(collection(db, name), limit(24)));
    }
    snap.forEach((d) => {
      if (seen.has(d.id)) return;
      const data = d.data();
      if (!isActive(data)) return;
      seen.add(d.id);
      out.push([d.id, data]);
    });
  } catch (err) {
    console.warn("featured-live ingest", name, err?.code || err?.message || err);
  }
}

async function loadFeatured() {
  const user = await authReady.catch(() => null);
  if (!user) return; // keep sample cards for guests (D3)

  const container = document.querySelector("#properties .property-container");
  if (!container) return;
  try {
    const seen = new Set();
    const items = [];
    await ingest("propertyListings", items, seen);
    if (!items.length) return;
    container.innerHTML = items
      .slice(0, 6)
      .map(([id, data]) => cardHtml(id, data))
      .join("");
  } catch (err) {
    console.warn("featured-live", err);
  }
}

loadFeatured();
