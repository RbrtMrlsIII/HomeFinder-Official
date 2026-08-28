/* Portfolio assets on Perks — active property + wanted listings (not contracts). */
import { user, db } from "./core.js";
import { canManageListing, manageUnlockLabel } from "./listing-lock.js";
import { getRole } from "./role.js";
import {
  collection, query, where, getDocs, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const propMount = document.getElementById("portfolio-property-list");
const wantMount = document.getElementById("portfolio-wanted-list");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadProperties() {
  if (!propMount || !user) return;
  propMount.innerHTML = `<p class="field-hint">Loading properties…</p>`;
  const items = [];
  for (const colName of ["propertyListings"]) {
    try {
      const q = query(
        collection(db, colName),
        where("ownerId", "==", user.uid),
        limit(20)
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const x = d.data() || {};
        if (x.status === "closed" || x.status === "deleted") return;
        items.push({ id: d.id, ...x, _col: colName });
      });
    } catch (e) {
      console.warn(colName, e);
    }
  }
  if (!items.length) {
    propMount.innerHTML = `<p class="field-hint">No active property listings yet. Use <strong>List Property</strong> to post one.</p>`;
    return;
  }
  propMount.innerHTML = `<ul class="portfolio-asset-list">${items.map((x) => {
    const title = x.title || x.address || "Property";
    const st = x.status || "active";
    const lock = canManageListing(x) ? "Manage OK" : manageUnlockLabel(x);
    return `<li class="portfolio-asset-row"><strong>${esc(title)}</strong> <span class="field-hint">${esc(st)}</span> <span class="field-hint">${esc(lock)}</span></li>`;
  }).join("")}</ul>`;
}

async function loadWanted() {
  if (!wantMount || !user) return;
  wantMount.innerHTML = `<p class="field-hint">Loading wanted…</p>`;
  try {
    const q = query(
      collection(db, "wantedListings"),
      where("seekerId", "==", user.uid),
      limit(20)
    );
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((d) => {
      const x = d.data() || {};
      if (x.status === "closed" || x.status === "deleted") return;
      items.push({ id: d.id, ...x });
    });
    if (!items.length) {
      wantMount.innerHTML = `<p class="field-hint">No active wanted posts. Use <strong>Wanted</strong> to post one.</p>`;
      return;
    }
    wantMount.innerHTML = `<ul class="portfolio-asset-list">${items.map((x) => {
      const title = x.title || "Wanted request";
      const st = x.status || "active";
      const lock = canManageListing(x) ? "Manage OK" : manageUnlockLabel(x);
      return `<li class="portfolio-asset-row"><strong>${esc(title)}</strong> <span class="field-hint">${esc(st)}</span> <span class="field-hint">${esc(lock)}</span></li>`;
    }).join("")}</ul>`;
  } catch (e) {
    console.warn(e);
    wantMount.innerHTML = `<p class="field-hint">Could not load wanted posts.</p>`;
  }
}

export async function refreshPortfolioAssets() {
  const role = (await getRole().catch(() => "seeker")) || "seeker";
  if (propMount) {
    propMount.hidden = !(role === "owner" || role === "broker");
    if (!propMount.hidden) await loadProperties();
    else propMount.innerHTML = "";
  }
  if (wantMount) {
    wantMount.hidden = !(role === "seeker" || role === "broker");
    if (!wantMount.hidden) await loadWanted();
    else wantMount.innerHTML = "";
  }
}

refreshPortfolioAssets().catch(console.warn);
document.addEventListener("hf:tab", (e) => {
  if (e.detail?.tab === "perks") refreshPortfolioAssets();
});
