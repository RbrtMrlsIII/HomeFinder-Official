/* Saved Wanted — owner/broker bookmarks of seeker wanted requests. */
import { user, db, functions } from "./core.js";
import { getRole } from "./role.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const toggleWantedSave = httpsCallable(functions, "toggleWantedSave");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

async function renderSavedWanted() {
  const root = document.getElementById("saved-wanted-root");
  if (!root || !user) return;
  root.innerHTML = `<p class="field-hint">Loading saved wanted requests…</p>`;
  try {
    const snap = await getDocs(collection(db, "users", user.uid, "savedWanted"));
    if (snap.empty) {
      root.innerHTML = `<div class="panel-empty"><i class="bx bx-bookmarks"></i><p>No saved wanted requests yet.</p></div>`;
      return;
    }

    const cards = [];
    for (const saved of snap.docs) {
      const wantedId = saved.id;
      const wanted = await getDoc(doc(db, "wantedListings", wantedId));
      if (!wanted.exists()) continue;
      const d = wanted.data() || {};
      cards.push({ id: wantedId, data: d });
    }

    if (!cards.length) {
      root.innerHTML = `<div class="panel-empty"><i class="bx bx-ghost"></i><p>Saved wanted requests no longer exist.</p></div>`;
      return;
    }

    root.innerHTML = cards.map(({id,d}) => `
      <article class="property-feed-card" data-id="${esc(id)}">
        <div class="property-card-thumbnail"><i class="bx bx-search-alt-2"></i></div>
        <div class="property-card-body">
          <div class="property-card-title-row">
            <h4>${esc(d.title || d.wantedTitle || "Wanted request")}</h4>
            <div class="property-card-address"><i class="bx bx-map"></i> ${esc(d.preferred_area || d.area || d.city || "Area not specified")}</div>
          </div>
          <div class="property-card-footer">
            <div class="property-price-display">${d.budgetMax != null ? `Up to ₱${Number(d.budgetMax).toLocaleString()}` : "Budget open"}</div>
            <button type="button" class="secondary-btn saved-wanted-unsave" data-id="${esc(id)}" style="padding:8px 14px;font-size:13px;">Unsave</button>
          </div>
        </div>
      </article>
    `).join("");

    root.querySelectorAll(".saved-wanted-unsave").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          const requestId = `wanted-unsave-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
          await toggleWantedSave({ wantedId: btn.dataset.id, action: "unsave", requestId });
          await renderSavedWanted();
        } catch (error) {
          console.error(error);
          alert("Couldn't remove this saved wanted request. Try again.");
          btn.disabled = false;
        }
      });
    });
  } catch (error) {
    console.error("Failed to load saved wanted:", error);
    root.innerHTML = `<div class="panel-empty"><i class="bx bx-error-circle"></i><p>Couldn't load saved wanted requests.</p></div>`;
  }
}

getRole().then(role => {
  if (role === "owner" || role === "broker") renderSavedWanted();
});
document.addEventListener("hf:tab-activated", e => {
  if (e.detail?.tab === "saved-wanted") renderSavedWanted();
});
