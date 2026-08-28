/* Moderator/Admin properties — listing content verification
 * Decline REQUIRES a reason → owner notification (owner may reply; escalate = Admin)
 */
import { db } from "./core.js";
import {
    collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { adminPrompt, adminConfirm } from "./prompt.js";
import {
    listAllPropertyListings,
    updatePropertyListing,
} from "../collections.js";

const searchInput = document.getElementById("admin-property-search");
const searchBtn = document.getElementById("admin-property-search-btn");
const filterEl = document.getElementById("admin-property-filter");
const resultsBody = document.getElementById("admin-properties-results");
const resultsEmpty = document.getElementById("admin-properties-empty");
const pendingCountEl = document.getElementById("admin-properties-pending-count")
    || document.getElementById("properties-pending-count");

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function statusOf(p) {
    return String(p.status || p.approvalStatus || "active").toLowerCase();
}

async function notifyOwner(uid, payload) {
    if (!uid) return;
    try {
        await addDoc(collection(db, "notifications", uid, "items"), {
            ...payload,
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (err) {
        console.warn("notify owner", err);
    }
}

async function setListingStatus(propertyId, ownerId, nextStatus, title, reason) {
    const payload = {
        status: nextStatus,
        approvalStatus: nextStatus === "active" ? "approved" : nextStatus,
        reviewedAt: new Date().toISOString()
    };
    if (reason) {
        payload.reviewReason = reason;
        payload.declineReason = nextStatus === "rejected" ? reason : null;
    }
    /* SoT: write to collection that holds the doc (propertyListings preferred) */
    await updatePropertyListing(db, propertyId, payload, { doc, getDoc, updateDoc });

    if (nextStatus === "active") {
        await notifyOwner(ownerId, {
            type: "listing_approved",
            title: "Listing approved",
            message: `“${title || "Your listing"}” is now live on the marketplace.`,
            propertyId
        });
    } else if (nextStatus === "rejected") {
        await notifyOwner(ownerId, {
            type: "listing_rejected",
            title: "Listing not approved",
            message: `“${title || "Your listing"}” was not approved.\n\nReason: ${reason || "See HomeFinder guidelines."}\n\nYou may edit and resubmit, or reply to this notification if you believe this was a mistake (escalates to Admin).`,
            propertyId,
            reason: reason || "",
            canReply: true,
            escalateTo: "admin"
        });
    }
}

async function runSearch() {
    if (!resultsBody) return;
    resultsBody.innerHTML = `<tr><td colspan="7" class="admin-loading">Loading…</td></tr>`;
    const term = (searchInput?.value || "").trim().toLowerCase();
    const filter = (filterEl?.value || "pending").toLowerCase();
    let docs = [];
    try {
        const rows = await listAllPropertyListings(db, { collection, getDocs });
        docs = rows.map((r) => ({ id: r.id, ...r.data, _col: r.col }));
    } catch (err) {
        resultsBody.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message)}</td></tr>`;
        return;
    }

    const pendingN = docs.filter(p => {
        const s = statusOf(p);
        return s === "pending_approval" || s === "pending";
    }).length;
    if (pendingCountEl) {
        pendingCountEl.textContent = String(pendingN);
        pendingCountEl.hidden = pendingN === 0;
    }

    if (filter === "pending") {
        docs = docs.filter(p => {
            const s = statusOf(p);
            return s === "pending_approval" || s === "pending";
        });
    } else if (filter === "active") {
        docs = docs.filter(p => {
            const s = statusOf(p);
            return s === "active" || s === "listed" || s === "published" || s === "approved";
        });
    } else if (filter === "rejected") {
        docs = docs.filter(p => statusOf(p) === "rejected");
    }

    if (term) {
        docs = docs.filter(p => {
            const hay = `${p.id} ${p.title || ""} ${p.address || ""} ${p.ownerId || ""} ${p.property_classification || ""} ${statusOf(p)}`.toLowerCase();
            return hay.includes(term);
        });
    }

    if (!docs.length) {
        resultsBody.innerHTML = "";
        if (resultsEmpty) resultsEmpty.hidden = false;
        return;
    }
    if (resultsEmpty) resultsEmpty.hidden = true;

    resultsBody.innerHTML = docs.map(p => {
        const st = statusOf(p);
        const pending = st === "pending_approval" || st === "pending";
        return `<tr>
            <td><code class="u-font-size-0-75">${escapeHtml(p.id.slice(0, 8))}…</code></td>
            <td>${escapeHtml(p.title || "—")}</td>
            <td>${escapeHtml(p.address || p.city || "—")}</td>
            <td><code class="u-font-size-0-75">${escapeHtml((p.ownerId || "").slice(0, 8))}…</code></td>
            <td><span class="admin-badge admin-badge-${pending ? "pending" : st === "rejected" ? "rejected" : "verified"}">${escapeHtml(st)}</span></td>
            <td>${escapeHtml(p.property_classification || p.type || "—")}</td>
            <td class="admin-row-actions">
              ${pending ? `
               <button type="button" class="admin-btn admin-btn-primary admin-btn-sm admin-prop-approve" data-id="${escapeHtml(p.id)}" data-owner="${escapeHtml(p.ownerId || "")}" data-title="${escapeHtml(p.title || "")}">Approve</button>
               <button type="button" class="admin-btn admin-btn-danger admin-btn-sm admin-prop-reject" data-id="${escapeHtml(p.id)}" data-owner="${escapeHtml(p.ownerId || "")}" data-title="${escapeHtml(p.title || "")}">Decline</button>`
               : `<span class="field-hint">${escapeHtml(p.reviewReason || p.declineReason || "—")}</span>`}
            </td>
        </tr>`;
    }).join("");

    resultsBody.querySelectorAll(".admin-prop-approve").forEach(btn => {
        btn.addEventListener("click", async () => {
            const ok = await adminConfirm("Approve this listing? It will go live (or continue the publish path).", {
                title: "Approve listing", okText: "Approve"
            });
            if (!ok) return;
            btn.disabled = true;
            try {
                await setListingStatus(btn.dataset.id, btn.dataset.owner, "active", btn.dataset.title);
                await runSearch();
            } catch (err) {
                alert("Approve failed: " + (err.message || err));
                btn.disabled = false;
            }
        });
    });

    resultsBody.querySelectorAll(".admin-prop-reject").forEach(btn => {
        btn.addEventListener("click", async () => {
            const reason = await adminPrompt(
                "Decline reason (required — sent to the owner as a notification). Owner may reply; disputes escalate to Admin.",
                {
                    title: "Decline listing",
                    defaultValue: "",
                    okText: "Decline & notify",
                    required: true,
                    placeholder: "e.g. Suspected fake address / misleading photos / prohibited content…"
                }
            );
            if (reason == null) return;
            const trimmed = String(reason).trim();
            if (!trimmed) {
                alert("A reason is required to decline a listing.");
                return;
            }
            btn.disabled = true;
            try {
                await setListingStatus(btn.dataset.id, btn.dataset.owner, "rejected", btn.dataset.title, trimmed);
                await runSearch();
            } catch (err) {
                alert("Decline failed: " + (err.message || err));
                btn.disabled = false;
            }
        });
    });
}

searchBtn?.addEventListener("click", runSearch);
searchInput?.addEventListener("keydown", e => { if (e.key === "Enter") runSearch(); });
filterEl?.addEventListener("change", runSearch);
runSearch();
