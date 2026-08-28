/* ==================================== */
/*  WANTED POSTS SUMMARY                */
/* ==================================== */
/* Own active wanted posts for seeker OR broker.
   Rules:
   - First 2 days after post → locked (no edit / delete)
   - After lock → Manage (edit title & budget) + Delete
*/

import { user, db } from "./core.js";
import { getRole } from "./role.js";
import { showConfirm, showAlert, showPrompt } from "./ui-dialog.js";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LOCK_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

function formatBudget(min, max){
    const fmt = n => `₱${Number(n || 0).toLocaleString()}`;
    if(min && max) return `${fmt(min)} – ${fmt(max)} <span>/mo</span>`;
    if(max) return `Up to ${fmt(max)} <span>/mo</span>`;
    if(min) return `From ${fmt(min)} <span>/mo</span>`;
    return "Budget not set";
}

function getCreatedMs(w){
    if(!w?.createdAt) return 0;
    if(typeof w.createdAt.toDate === "function") return w.createdAt.toDate().getTime();
    return new Date(w.createdAt).getTime() || 0;
}

function lockRemaining(createdMs){
    return Math.max(0, LOCK_MS - (Date.now() - createdMs));
}

function formatLockRemaining(ms){
    if(ms <= 0) return "";
    const hours = Math.ceil(ms / (60 * 60 * 1000));
    if(hours < 24) return `${hours}h left`;
    return `${Math.ceil(hours / 24)}d left`;
}

function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function wantedCardHTML(id, w){
    const createdMs = getCreatedMs(w);
    const remaining = lockRemaining(createdMs);
    const isLocked = remaining > 0;
    const lockLabel = isLocked ? formatLockRemaining(remaining) : "";

    return `
        <div class="property-feed-card" data-id="${id}">
            <div class="property-card-thumbnail">
                <span class="property-type-tag">${escapeHtml(w.classification || "Wanted")}</span>
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:32px;">
                    <i class="bx bx-search-alt"></i>
                </div>
            </div>
            <div class="property-card-body">
                <div class="property-card-title-row">
                    <h4>${escapeHtml(w.title || "Untitled Request")}</h4>
                    <div class="property-card-address"><i class="bx bx-map"></i> ${escapeHtml(w.address || "No preferred area given")}</div>
                </div>
                <div class="property-metric-badges">
                    <span class="metric-pill"><i class="bx bx-circle"></i> ${escapeHtml(w.status || "active")}</span>
                    ${w.moveInDate ? `<span class="metric-pill"><i class="bx bx-calendar"></i> ${escapeHtml(w.moveInDate)}</span>` : ""}
                    ${isLocked ? `<span class="metric-pill" style="background:rgba(154,107,31,0.15);color:#9A6B1F;"><i class="bx bx-lock-alt"></i> Locked ${lockLabel}</span>` : ""}
                </div>
                <div class="property-card-footer" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                    <div class="property-price-display">${formatBudget(w.budgetMin, w.budgetMax)}</div>
                    <div class="wanted-manage-actions" style="display:flex;gap:6px;">
                        <button type="button" class="icon-btn manage-wanted-btn" data-id="${id}" data-locked="${isLocked ? "1" : "0"}"
                                title="${isLocked ? "Locked for 2 days after posting" : "Edit this request"}"
                                style="border-radius:8px;width:36px;height:36px;border:1px solid var(--border-color);color:var(--text-secondary);">
                            <i class="bx bx-edit-alt" style="font-size:16px;"></i>
                        </button>
                        <button type="button" class="icon-btn delete-wanted-btn" data-id="${id}" data-locked="${isLocked ? "1" : "0"}"
                                title="${isLocked ? "Can delete after 2-day lock" : "Delete request"}"
                                style="border-radius:8px;width:36px;height:36px;border:1px solid var(--border-color);color:#F87171;${isLocked ? "opacity:0.45;" : ""}">
                            <i class="bx bx-trash" style="font-size:16px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function editWantedPost(id, current){
    const newTitle = await showPrompt("Update the title of this wanted request:", {
        title: "Edit title",
        defaultValue: current.title || "",
        okText: "Next",
        placeholder: "e.g. Looking for a condo near BGC"
    });
    if(newTitle === null) return; // cancelled

    const budgetStr = await showPrompt("Update monthly budget range as min-max (e.g. 8000-15000):", {
        title: "Edit budget",
        defaultValue: `${current.budgetMin || 0}-${current.budgetMax || 0}`,
        okText: "Save",
        placeholder: "min-max"
    });
    if(budgetStr === null) return;

    let budgetMin = Number(current.budgetMin) || 0;
    let budgetMax = Number(current.budgetMax) || 0;
    const m = String(budgetStr).replace(/\s/g, "").match(/^(\d+)-(\d+)$/);
    if(m){
        budgetMin = Number(m[1]);
        budgetMax = Number(m[2]);
        if(budgetMax < budgetMin){
            await showAlert("Budget max can't be less than min.", { title: "Invalid budget" });
            return;
        }
    } else if(budgetStr.trim()){
        await showAlert("Please use the format min-max, e.g. 8000-15000.", { title: "Invalid format" });
        return;
    }

    const ok = await showConfirm(
        `Save changes?\n\nTitle: ${newTitle || "(unchanged)"}\nBudget: ₱${budgetMin.toLocaleString()} – ₱${budgetMax.toLocaleString()}`,
        { title: "Confirm edit", okText: "Save" }
    );
    if(!ok) return;

    await updateDoc(doc(db, "wantedListings", id), {
        title: (newTitle || current.title || "").trim() || current.title,
        budgetMin,
        budgetMax
    });
    await showAlert("Wanted request updated.", { title: "Saved" });
    renderWantedPosts();
}

async function renderWantedPosts(){
    const container = document.getElementById("wanted-posts-scroll");
    if(!container) return;

    const q = query(collection(db, "wantedListings"), where("seekerId", "==", user.uid));
    const snap = await getDocs(q);

    if(snap.empty){
        container.innerHTML = `
            <div class="panel-empty">
                <i class='bx bx-search-alt'></i>
                <p>You haven't posted a wanted request yet.</p>
            </div>
        `;
        return;
    }

    const byId = {};
    container.innerHTML = "";
    snap.forEach(docSnap => {
        byId[docSnap.id] = docSnap.data();
        container.insertAdjacentHTML("beforeend", wantedCardHTML(docSnap.id, docSnap.data()));
    });

    container.querySelectorAll(".delete-wanted-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            if(btn.dataset.locked === "1"){
                await showAlert(
                    "This wanted post is locked for 2 days after posting. You can delete or edit it once the lock expires.",
                    { title: "Locked" }
                );
                return;
            }
            const ok = await showConfirm(
                "Delete this wanted request? This can't be undone.",
                { title: "Delete request", okText: "Delete" }
            );
            if(!ok) return;
            await deleteDoc(doc(db, "wantedListings", btn.dataset.id));
            renderWantedPosts();
        });
    });

    container.querySelectorAll(".manage-wanted-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            if(btn.dataset.locked === "1"){
                await showAlert(
                    "This post is locked for the first 2 days. After the lock ends you can edit the title & budget or delete it.",
                    { title: "Manage locked" }
                );
                return;
            }
            const data = byId[btn.dataset.id];
            if(!data) return;
            await editWantedPost(btn.dataset.id, data);
        });
    });
}

getRole().then(role => {
    if(role === "seeker" || role === "broker") renderWantedPosts();
});

document.addEventListener("hf:wanted-created", renderWantedPosts);
