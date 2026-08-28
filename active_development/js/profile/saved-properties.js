/* ==================================== */
/*  SAVED PROPERTIES                    */
/* ==================================== */
/* Lists users/{uid}/favourites/{propertyId} bookmarks and resolves  */
/* each property doc for display. Settings "My Saved Properties" and */
/* the Saved tab both land here.                                     */

import { user, db } from "./core.js";
import { functions } from "../firebase.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getRole } from "./role.js";
import { collection, getDocs, doc, getDoc }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getPropertyListing } from "../collections.js";

function cardHTML(id, p){
    const price = p.per_bed_price
        ? `₱${Number(p.per_bed_price).toLocaleString()} <span>/bed</span>`
        : `₱${Number(p.monthly_price || 0).toLocaleString()} <span>/mo</span>`;

    return `
        <div class="property-feed-card" data-id="${id}">
            <div class="property-card-thumbnail">
                <span class="property-type-tag">${p.property_classification || p.category || "Listing"}</span>
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:32px;">
                    <i class="bx bx-image"></i>
                </div>
            </div>
            <div class="property-card-body">
                <div class="property-card-title-row">
                    <h4>${p.listing_title || "Untitled Listing"}</h4>
                    <div class="property-card-address"><i class="bx bx-map"></i> ${p.address || "No address provided"}</div>
                </div>
                <div class="property-card-footer">
                    <div class="property-price-display">${price}</div>
                    <div style="display:flex;gap:8px;">
                        <a class="primary-btn" href="market.html" style="padding:8px 14px;font-size:13px;">View</a>
                        <button type="button" class="secondary-btn unsave-btn" data-id="${id}" style="padding:8px 14px;font-size:13px;">Unsave</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderSaved(){
    const grid = document.getElementById("saved-properties-grid") || document.getElementById("saved-properties-root");
    if(!grid) return;

    grid.innerHTML = `<p class="field-hint">Loading saved listings…</p>`;

    try {
        const favSnap = await getDocs(collection(db, "users", user.uid, "favourites"));
        if(favSnap.empty){
            grid.innerHTML = `
                <div class="panel-empty" style="grid-column:1/-1;">
                    <i class='bx bx-heart'></i>
                    <p>No saved properties yet. Open the marketplace and tap Save on a listing.</p>
                    <a class="primary-btn" href="market.html" style="display:inline-block;margin-top:8px;">Browse Marketplace</a>
                </div>
            `;
            return;
        }

        const cards = [];
        for(const fav of favSnap.docs){
            const propertyId = fav.id;
            const propSnap = await getPropertyListing(db, propertyId, { getDoc, doc });
            if(!propSnap.exists()) continue;
            cards.push({ id: propertyId, data: propSnap.data() });
        }

        if(cards.length === 0){
            grid.innerHTML = `
                <div class="panel-empty" style="grid-column:1/-1;">
                    <i class='bx bx-ghost'></i>
                    <p>Saved items pointed at listings that no longer exist.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = cards.map(c => cardHTML(c.id, c.data)).join("");

        grid.querySelectorAll(".unsave-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                btn.disabled = true;
                try {
                    const requestId = `unsave-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                    const toggleListingSave = httpsCallable(functions, "toggleListingSave");
                    await toggleListingSave({ listingId: btn.dataset.id, action: "unsave", requestId });
                    await renderSaved();
                } catch(error){
                    console.error(error);
                    alert("Couldn't remove this favourite. Try again.");
                    btn.disabled = false;
                }
            });
        });
    } catch(error){
        console.error("Failed to load saved properties:", error);
        grid.innerHTML = `
            <div class="panel-empty" style="grid-column:1/-1;">
                <i class='bx bx-error-circle'></i>
                <p>Couldn't load saved properties.</p>
            </div>
        `;
    }
}

getRole().then(role => {
    if(role === "seeker" || role === "broker") renderSaved();
});

document.addEventListener("hf:tab-activated", (e) => {
    if(e.detail?.tab === "saved" || e.detail?.tab === "properties-view") renderSaved();
});

// Re-render when user lands on the tab via hash
if(["saved","properties-view"].includes(location.hash.replace("#",""))){
    getRole().then(role => {
        if(role === "seeker" || role === "broker") renderSaved();
    });
}
