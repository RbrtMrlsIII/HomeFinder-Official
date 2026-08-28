/* ==================================== */
/*  WANTED FORM                         */
/* ==================================== */
/* Seeker's "Post a Wanted Property" form. Mirrors listing-form.js's */
/* submit pattern (owner's Create Listing form) -- writes to a new    */
/* wantedListings/{id} collection, one doc per request.                */
/*                                                                      */
/* category is derived via ../tiers.js's categoryOf() from the same    */
/* classification taxonomy the listing form uses, so a wanted post     */
/* and a real listing are directly comparable later (Map Search /      */
/* the owner's future "Wanted Property" view will filter/match on it). */
/*                                                                      */
/* Doesn't call refreshPerks() -- unlike listing-form.js, posting a     */
/* wanted request doesn't affect anything on the Perks tab: seeker      */
/* tier progress is driven by completed contracts (Cloud Functions),    */
/* not by posting requests.                                             */

import { user, db } from "./core.js";
import { createWantedListingAuthoritative } from "../listing-create-gate.js";
import { categoryOf, wantedCapForSeekerBoost, resolveBoostPackageId, hasVerifiedId } from "../tiers.js";
import { getWantedPinLocation } from "./wanted-map.js";
import { canManageListing, manageUnlockLabel } from "./listing-lock.js";
import { wireAmenitiesBlock } from "./amenities-ui.js";
import { normalizeAmenityList } from "../listing-catalog.js";
import { collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc, serverTimestamp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Same escaping gap as owner match feed on market only; (which reads these
// same wantedListings docs for owners/brokers, and where this was a real
// stored-XSS risk). This file's own renders are lower severity since
// they only show the seeker their own posts, but title/address/
// classification are all free text the seeker just typed, so escape
// here too rather than rely on "it's just my own data."
function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* Optional admin.html-only cap: users/{uid}.wantedCapOverride. Unset
   (null/undefined) means unlimited, which is the historical behaviour --
   this app never had a wanted-post cap of its own, so a normal seeker
   is unaffected unless the admin console has explicitly set one on
   their account for testing. firestore.rules keeps this field out of
   onlyTouchesAllowedProfileFields(), so a seeker can never raise their
   own cap by writing to it directly. */
async function getWantedCapStatus() {
    // Admin override wins when set; otherwise base cap + Seeking Boost wantedBonus.
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const override = profileSnap.exists() ? profileSnap.data().wantedCapOverride : null;

    let packageId = 0;
    try {
        const boostSnap = await getDoc(doc(db, "boosts", user.uid));
        const seekerBoost = boostSnap.exists() ? boostSnap.data().seeker : null;
        packageId = resolveBoostPackageId(seekerBoost);
    } catch (e) {
        console.warn("Could not read seeker boost for wanted cap:", e);
    }

    const cap = override != null ? override : wantedCapForSeekerBoost(packageId);

    /* Count active + pending_approval toward cap (SoT trust gate) */
    const q = query(collection(db, "wantedListings"), where("seekerId", "==", user.uid));
    const snap = await getDocs(q);
    let activeCount = 0;
    snap.forEach((d) => {
        const s = String(d.data()?.status || "").toLowerCase();
        if (s === "active" || s === "pending_approval" || s === "pending") activeCount += 1;
    });
    return { capped: true, cap, activeCount, atCap: activeCount >= cap, packageId };
}

const createWantedForm = document.getElementById("create-wanted-form");

if(createWantedForm){
    wireAmenitiesBlock(document.getElementById("wanted-amenities-block"), {
        inputName: "preferred_amenities[]",
        summaryId: "wanted-amenities-selected-summary",
    });
    createWantedForm.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const formData = new FormData(createWantedForm);
        const classification = formData.get("wanted_classification");

        const budgetMin = Number(formData.get("budget_min"));
        const budgetMax = Number(formData.get("budget_max"));
        if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax)) {
            alert("Enter valid budget min and max (numbers).");
            return;
        }
        if(budgetMax < budgetMin){
            alert("Budget max can't be less than budget min.");
            return;
        }

        const submitBtn = createWantedForm.querySelector("button[type=submit]");
        if(submitBtn) submitBtn.disabled = true;

        try{
            const capStatus = await getWantedCapStatus();
            if(capStatus.capped && capStatus.atCap){
                alert(`You've reached your active wanted-post limit (${capStatus.cap}). Close or delete an existing request before posting another.`);
                return;
            }

            const pin = getWantedPinLocation();
            if (!pin || pin.lat == null || pin.lng == null) {
                alert("Set a wanted-area pin on the map first (Locate on map or click the map). This tells owners where you want a property.");
                return;
            }

            const profileSnap = await getDoc(doc(db, "users", user.uid));
            const profile = profileSnap.exists() ? profileSnap.data() : {};
            const verified = hasVerifiedId(profile);
            const status = verified ? "active" : "pending_approval";

            if (!verified) {
                const toastContainer = document.getElementById("toast-container");
                if (toastContainer) {
                    const toast = document.createElement("div");
                    toast.className = "toast info kyc-toast";
                    toast.innerHTML = `
                        <i class='bx bx-info-circle'></i>
                        <div>
                            <strong>Unverified poster</strong>
                            <p>Your wanted request will need admin approval before it appears on the Market. Verify your ID anytime for instant publish next time.</p>
                        </div>`;
                    toastContainer.appendChild(toast);
                    setTimeout(() => toast.remove(), 10000);
                }
            }

            const ok = confirm(
                verified
                    ? "Post this wanted request?\n\nFor 2 days after posting you cannot edit or delete it. After 2 days you can manage it from Your active wanted posts.\n\nContinue?"
                    : "Post this wanted request for admin approval?\n\nUnverified accounts: staff must approve before Market visibility.\nFor 2 days after posting you cannot edit or delete it.\n\nContinue?"
            );
            if (!ok) return;

            /* SoT §14: callable-first gate, client fallback */
            /* Preferred amenities (optional) — same catalog keys as List Property */
            const preferredAmenities = normalizeAmenityList([...document.querySelectorAll('#create-wanted-form input[name="preferred_amenities[]"]:checked')].map((el) => el.value));

            const result = await createWantedListingAuthoritative({
                seekerId: user.uid,
                title: formData.get("title"),
                classification,
                wanted_classification: classification,
                property_classification: classification,
                category: categoryOf(classification),
                budgetMin,
                budgetMax,
                address: formData.get("address"),
                moveInDate: formData.get("move_in_date") || null,
                notes: formData.get("notes") || "",
                status,
                approvalStatus: verified ? "approved" : "pending",
                publisherVerified: !!verified,
                preferredAmenities,
                amenities: preferredAmenities,
                lat: Number(pin.lat),
                lng: Number(pin.lng),
                location: { lat: Number(pin.lat), lng: Number(pin.lng) },
                editableAfter: Date.now() + 2 * 24 * 60 * 60 * 1000
            });

            createWantedForm.reset();
            document.dispatchEvent(new CustomEvent("hf:wanted-created"));
            const newId = result?.id || "";

            /* F: pending UX parity with List Property */
            try {
                await addDoc(collection(db, "notifications", user.uid, "items"), {
                    type: verified ? "wanted_published" : "wanted_pending_approval",
                    title: verified ? "Wanted request live" : "Wanted request pending approval",
                    message: verified
                        ? "Your wanted request is live on the Market for matching owners/brokers."
                        : "Your wanted request was submitted. Staff will review it before Market visibility. Verify your ID for faster publish next time.",
                    wantedId: newId || null,
                    read: false,
                    createdAt: serverTimestamp()
                });
            } catch (notifErr) {
                console.warn("wanted notif", notifErr);
            }

            if (verified) {
                alert(
                    `Wanted request published successfully!${newId ? "\nRequest ID: " + newId : ""}\n\nMatching owners and brokers can reach out. Open Market to review activity.`
                );
            } else {
                alert(
                    `Wanted request submitted for admin approval.${newId ? "\nRequest ID: " + newId : ""}\n\nUnverified posters need approval before Market visibility. Check your notification bell. Verify your ID to publish faster next time.`
                );
            }
        } catch(error){
            console.error("Failed to post wanted property request:", error);
            alert("Something went wrong posting your request. Please try again.");
        } finally{
            if(submitBtn) submitBtn.disabled = false;
        }
    });
}


async function renderMyActiveWanted() {
    const list = document.getElementById("my-active-wanted-list");
    if (!list || !user?.uid) return;
    try {
        const q = query(
            collection(db, "wantedListings"),
            where("seekerId", "==", user.uid)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
            list.innerHTML = `<p class="field-hint">No active wanted posts yet under your tier/boost cap.</p>`;
            return;
        }
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return tb - ta;
        });
        const visible = rows.filter((w) => {
            const s = String(w.status || "active").toLowerCase();
            return s === "active" || s === "pending_approval" || s === "pending";
        });
        if (!visible.length) {
            list.innerHTML = `<p class="field-hint">No active or pending wanted posts yet.</p>`;
            return;
        }
        list.innerHTML = visible.map(w => {
            const st = String(w.status || "active").toLowerCase();
            const stLabel = st === "pending_approval" || st === "pending" ? "Pending approval" : (st === "active" ? "Live" : st);
            return `
            <div class="property-feed-card" data-wanted-id="${w.id}">
                <div class="property-card-body" style="padding:12px;">
                    <h4 style="margin:0 0 4px;">${escapeHtml(w.title) || "Wanted request"}</h4>
                    <div class="property-card-address"><i class="bx bx-map"></i> ${escapeHtml(w.address) || "—"}</div>
                    <div class="property-card-price">₱${Number(w.budgetMin||0).toLocaleString()}–₱${Number(w.budgetMax||0).toLocaleString()}/mo</div>
                    <span class="metric-pill">${escapeHtml(w.classification || w.category || "")}</span>
                    <span class="metric-pill">${escapeHtml(stLabel)}</span>
                </div>
            </div>`;
        }).join("");
    } catch (e) {
        console.warn("my active wanted:", e);
        list.innerHTML = `<p class="field-hint">Could not load your wanted posts.</p>`;
    }
}

async function closeWanted(id, data) {
    if (!canManageListing(data)) {
        alert("This wanted post is locked for 2 days after posting. " + manageUnlockLabel(data));
        return;
    }
    if (!confirm("Close this wanted post? It will no longer appear to owners/brokers.")) return;
    await updateDoc(doc(db, "wantedListings", id), { status: "closed", closedAt: serverTimestamp() });
    renderMyActiveWanted();
}

const _origRender = renderMyActiveWanted;
renderMyActiveWanted = async function() {
    await _origRender();
    const list = document.getElementById("my-active-wanted-list");
    if (!list) return;
    // Re-fetch to attach manage buttons
    try {
        const snap = await getDocs(query(
            collection(db, "wantedListings"),
            where("seekerId", "==", user.uid)
        ));
        if (!snap.size) return;
        list.innerHTML = snap.docs.map(d => {
            const w = d.data();
            const manageable = canManageListing(w);
            return `<article class="wanted-manage-card" style="border:1px solid var(--border-color);border-radius:14px;padding:12px;margin-bottom:10px;">
              <strong>${escapeHtml(w.title) || escapeHtml(w.address) || "Wanted"}</strong>
              <div class="field-hint">${escapeHtml(w.address)} · ₱${w.budgetMin || 0}–${w.budgetMax || 0}</div>
              <div class="field-hint">${manageUnlockLabel(w)}</div>
              <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                <button type="button" class="secondary-btn wanted-close-btn" data-id="${d.id}" ${manageable ? "" : "disabled"} style="height:36px;padding:0 12px;font-size:13px;">
                  ${manageable ? "Close / remove" : "Locked 2 days"}
                </button>
              </div>
            </article>`;
        }).join("");
        list.querySelectorAll(".wanted-close-btn").forEach(btn => {
            btn.onclick = async () => {
                const docSnap = snap.docs.find(x => x.id === btn.dataset.id);
                await closeWanted(btn.dataset.id, docSnap?.data() || {});
            };
        });
    } catch (e) { console.warn(e); }
};

renderMyActiveWanted();
document.addEventListener("hf:wanted-created", renderMyActiveWanted);

