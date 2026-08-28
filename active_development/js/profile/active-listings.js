/* ==================================== */
/*  ACTIVE LISTINGS                     */
/* ==================================== */
/* Renders "Your Active Listings" from real Firestore data, with */
/* a delete button per card. Re-renders automatically whenever a */
/* listing is created (see listing-form.js's hf:listing-created  */
/* event) or deleted.                                              */
/* Only queries Firestore for owner/broker (via ./role.js's       */
/* getRole()) -- a seeker never has listings, so skip the read     */
/* entirely rather than running it and rendering an empty state.  */

import { user, db } from "./core.js";
import { refreshPerks } from "./perks.js";
import { getRole } from "./role.js";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, getDoc }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    listPropertyListingsForOwner,
    updatePropertyListing,
    deletePropertyListing,
} from "../collections.js";
import { canManageListing, manageUnlockLabel } from "./listing-lock.js";

function propertyCardHTML(id, p){
    const price = p.per_bed_price
        ? `₱${Number(p.per_bed_price).toLocaleString()} <span>/bed</span>`
        : `₱${Number(p.monthly_price || p.sale_price || 0).toLocaleString()} <span>${p.sale_price && !p.monthly_price ? "" : "/mo"}</span>`;

    const statusRaw = String(p.status || "active").toLowerCase();
    let statusLabel = "Listed";
    let statusClass = "is-listed";
    if (statusRaw.includes("pending")) {
        statusLabel = "Pending approval";
        statusClass = "is-pending";
    } else if (statusRaw === "draft") {
        statusLabel = "Draft";
        statusClass = "is-draft";
    } else if (statusRaw === "active" || statusRaw === "listed" || statusRaw === "published" || statusRaw === "approved") {
        statusLabel = "Listed";
        statusClass = "is-listed";
    } else {
        statusLabel = statusRaw.replace(/_/g, " ");
    }

    const expiresAt = p.expiresAt || p.expires_at || p.listingExpiresAt || p.expiryDate || null;
    let expiryHtml = "";
    if (expiresAt) {
        try {
            const t = typeof expiresAt?.toDate === "function" ? expiresAt.toDate() : new Date(expiresAt);
            if (!Number.isNaN(t.getTime())) {
                const ms = t.getTime() - Date.now();
                const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
                const when = t.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
                if (ms <= 0) {
                    expiryHtml = `<span class="listing-card-expiry is-expired">Expired ${when}</span>`;
                } else {
                    expiryHtml = `<span class="listing-card-expiry">${days}d left · ends ${when}</span>`;
                }
            }
        } catch (_) {}
    } else if (p.createdAt) {
        try {
            const c = typeof p.createdAt?.toDate === "function" ? p.createdAt.toDate() : new Date(p.createdAt);
            if (!Number.isNaN(c.getTime())) {
                const end = new Date(c.getTime() + 30 * 24 * 60 * 60 * 1000);
                const ms = end.getTime() - Date.now();
                const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
                const when = end.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
                if (ms > 0) {
                    expiryHtml = `<span class="listing-card-expiry">~${days}d left · ~${when} (30-day window)</span>`;
                }
            }
        } catch (_) {}
    }

    const addr = typeof p.address === "string"
        ? p.address
        : (p.address && [p.address.street, p.address.city, p.address.province].filter(Boolean).join(", ")) || "No address provided";
    const pinOk = (p.lat != null && p.lng != null) || (p.location?.lat != null) || (p.pin?.lat != null) || (p.coordinates?.lat != null);
    const title = p.listing_title || p.title || "Untitled Listing";
    const deal = p.deal_type || p.dealType || p.contract_type || "";
    const type = p.property_classification || p.propertyType || "Listing";

    const details = [
        deal ? `<li><strong>Contract</strong> ${deal}</li>` : "",
        p.floor_area ? `<li><strong>Floor area</strong> ${p.floor_area}</li>` : "",
        p.number_of_beds ? `<li><strong>Beds</strong> ${p.number_of_beds}</li>` : "",
        pinOk ? `<li><strong>Map pin</strong> Set</li>` : `<li><strong>Map pin</strong> Missing</li>`,
        p.needs_broker_help || p.needsBrokerHelp ? `<li><strong>Broker help</strong> Requested</li>` : "",
    ].filter(Boolean).join("");

    return `
        <article class="property-feed-card listing-manage-card ${statusClass}${(p.needsBrokerHelp || p.needs_broker_help) ? " has-help-request" : ""}" data-id="${id}">
            <div class="property-card-thumbnail">
                <span class="property-type-tag">${type}</span>
                <span class="listing-status-pill ${statusClass}">${statusLabel}</span>
                ${(() => {
                    const src = p.coverImage || (Array.isArray(p.images) && p.images[0]) || p.imageUrl || "";
                    return src
                        ? `<img src="${src}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
                        : `<div class="listing-card-ph"><i class="bx bx-image"></i></div>`;
                })()}
            </div>
            <div class="property-card-body">
                <div class="property-card-title-row">
                    <h4>${title}</h4>
                    <div class="property-card-address"><i class="bx bx-map"></i> ${addr}</div>
                    ${expiryHtml}
                </div>
                <div class="property-metric-badges">
                    <span class="metric-pill">${price}</span>
                    ${p.floor_area ? `<span class="metric-pill"><i class="bx bx-ruler"></i> ${p.floor_area}</span>` : ""}
                    ${p.number_of_beds ? `<span class="metric-pill"><i class="bx bx-bed"></i> ${p.number_of_beds}</span>` : ""}
                </div>
                <details class="listing-card-reveal">
                    <summary>Details</summary>
                    <ul class="listing-card-details">${details || "<li>No extra fields</li>"}</ul>
                    <p class="field-hint">${manageUnlockLabel(p)}</p>
                </details>
                <div class="property-card-footer" style="flex-wrap:wrap;gap:8px;">
                    <button type="button" class="secondary-btn close-listing-btn" data-id="${id}"
                            ${canManageListing(p) ? "" : "disabled"}>
                        ${canManageListing(p) ? "Close listing" : "Locked 2 days"}
                    </button>
                    <button type="button" class="icon-btn delete-listing-btn" data-id="${id}"
                            ${canManageListing(p) ? "" : "disabled"}
                            aria-label="Delete listing"
                            style="border-radius:8px;width:36px;height:36px;border-color:var(--border-color);color:#F87171;opacity:${canManageListing(p) ? 1 : 0.4};">
                        <i class="bx bx-trash" style="font-size:16px;"></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}

async function renderOwnerListings(){
    const container = document.getElementById("listed-properties-scroll");
    if(!container) return;

    /* Canonical: propertyListings only. */
    const rows = await listPropertyListingsForOwner(db, user.uid, {
        collection, query, where, getDocs,
    });
    const open = rows.filter(({ data: p }) => {
        const s = String(p.status || "active").toLowerCase();
        return s !== "closed" && s !== "deleted";
    });

    if(!open.length){
        container.innerHTML = `
            <div class="panel-empty">
                <i class='bx bx-buildings'></i>
                <p>You haven't posted any listings yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    const byId = new Map(open.map((r) => [r.id, r]));
    open.forEach(({ id, data }) => {
        container.insertAdjacentHTML("beforeend", propertyCardHTML(id, data));
    });

    container.querySelectorAll(".close-listing-btn").forEach(btn=>{
        btn.addEventListener("click", async ()=>{
            const id = btn.dataset.id;
            const data = byId.get(id)?.data || {};
            if (!canManageListing(data)) {
                alert("Listings cannot be edited or closed for 2 days after posting. " + manageUnlockLabel(data));
                return;
            }
            if (!confirm("Close this listing? It will be hidden from the Market.")) return;
            try {
                await updatePropertyListing(db, id, { status: "closed", closedAt: new Date().toISOString() }, { doc, getDoc, updateDoc });
                renderOwnerListings();
            } catch (e) {
                alert("Could not close: " + (e.message || e));
            }
        });
    });

    container.querySelectorAll(".delete-listing-btn").forEach(btn=>{
        btn.addEventListener("click", async ()=>{
            const id = btn.dataset.id;
            const data = byId.get(id)?.data || {};
            if (!canManageListing(data)) {
                alert("Listings cannot be deleted for 2 days after posting. " + manageUnlockLabel(data));
                return;
            }
            if(!confirm("Delete this listing? This can't be undone.")) return;
            try {
                await deletePropertyListing(db, id, { doc, getDoc, deleteDoc });
                renderOwnerListings();
                refreshPerks();
            } catch (e) {
                alert("Could not delete: " + (e.message || e));
            }
        });
    });
}

// Only owners/brokers ever have listings -- skip the query for a
// seeker rather than running it and rendering an empty state.
getRole().then(role => {
    if(role === "owner" || role === "broker") renderOwnerListings();
});

document.addEventListener("hf:listing-created", renderOwnerListings);

/* pending_approval: show in owner list but not marketplace */
export function isListingPublic(p) {
    const s = String(p?.status || "active").toLowerCase();
    return s === "active" || s === "listed" || s === "published" || s === "approved";
}
