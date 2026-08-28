/* Admin/Moderator wanted posts — wantedListings only (SoT).
 * Unverified submissions use status pending_approval; Approve → active. */

import { db } from "./core.js";
import {
    collection, getDocs, doc, updateDoc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const searchInput = document.getElementById("admin-wanted-search");
const searchBtn = document.getElementById("admin-wanted-search-btn");
const refreshBtn = document.getElementById("admin-wanted-refresh");
const filterEl = document.getElementById("admin-wanted-filter");
const resultsBody = document.getElementById("admin-wanted-results");
const resultsEmpty = document.getElementById("admin-wanted-empty");
const pendingCountEl = document.getElementById("admin-wanted-pending-count")
    || document.getElementById("wanted-pending-count");

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function statusOf(w) {
    return String(w.status || "active").toLowerCase();
}

async function notifySeeker(uid, payload) {
    if (!uid) return;
    try {
        await addDoc(collection(db, "notifications", uid, "items"), {
            ...payload,
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.warn("notify seeker", err);
    }
}

async function setWantedStatus(id, seekerId, nextStatus, title, reason) {
    const payload = {
        status: nextStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: "admin"
    };
    if (reason) payload.reviewReason = reason;
    await updateDoc(doc(db, "wantedListings", id), payload);

    if (nextStatus === "active") {
        await notifySeeker(seekerId, {
            type: "wanted_approved",
            title: "Wanted request approved",
            message: `“${title || "Your wanted request"}” is now live for matching owners/brokers.`,
            wantedId: id
        });
    } else if (nextStatus === "rejected") {
        await notifySeeker(seekerId, {
            type: "wanted_rejected",
            title: "Wanted request not approved",
            message: `“${title || "Your wanted request"}” was not approved.${reason ? "\n\nReason: " + reason : ""}`,
            wantedId: id,
            reason: reason || ""
        });
    }
}

async function runSearch() {
    if (!resultsBody) return;
    resultsBody.innerHTML = `<tr><td colspan="4" class="admin-loading">Loading…</td></tr>`;
    const term = (searchInput?.value || "").trim().toLowerCase();
    const filter = (filterEl?.value || "pending").toLowerCase();
    let docs = [];
    try {
        const snap = await getDocs(collection(db, "wantedListings"));
        docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        resultsBody.innerHTML = `<tr><td colspan="4">${escapeHtml(err.message || String(err))}</td></tr>`;
        return;
    }

    const pendingN = docs.filter(w => {
        const s = statusOf(w);
        return s === "pending_approval" || s === "pending";
    }).length;
    if (pendingCountEl) {
        pendingCountEl.textContent = String(pendingN);
        pendingCountEl.hidden = pendingN === 0;
    }

    if (filter === "pending") {
        docs = docs.filter(w => {
            const s = statusOf(w);
            return s === "pending_approval" || s === "pending";
        });
    } else if (filter === "active") {
        docs = docs.filter(w => statusOf(w) === "active");
    } else if (filter === "rejected") {
        docs = docs.filter(w => statusOf(w) === "rejected");
    }
    /* filter === "all" → no status filter */

    if (term) {
        docs = docs.filter(w => {
            const hay = `${w.id} ${w.title || ""} ${w.seekerId || w.uid || ""} ${w.address || ""} ${w.status || ""}`.toLowerCase();
            return hay.includes(term);
        });
    }

    if (!docs.length) {
        resultsBody.innerHTML = `<tr><td colspan="4" class="admin-empty-state">No wanted posts in this filter.</td></tr>`;
        if (resultsEmpty) resultsEmpty.hidden = false;
        return;
    }
    if (resultsEmpty) resultsEmpty.hidden = true;

    resultsBody.innerHTML = docs.slice(0, 200).map(w => {
        const st = statusOf(w);
        const pending = st === "pending_approval" || st === "pending";
        const actions = pending
            ? `<button type="button" class="admin-btn admin-btn-primary admin-btn-sm" data-approve="${escapeHtml(w.id)}" data-uid="${escapeHtml(w.seekerId || w.uid || "")}" data-title="${escapeHtml(w.title || "")}">Approve</button>
               <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" data-reject="${escapeHtml(w.id)}" data-uid="${escapeHtml(w.seekerId || w.uid || "")}" data-title="${escapeHtml(w.title || "")}">Reject</button>`
            : "—";
        return `
        <tr>
            <td>${escapeHtml(w.title || "—")}<div class="field-hint">${escapeHtml(w.address || "")}</div></td>
            <td class="admin-uid-cell">${escapeHtml(w.seekerId || w.uid || "—")}</td>
            <td><span class="admin-badge">${escapeHtml(st)}</span></td>
            <td>${actions}</td>
        </tr>`;
    }).join("");

    resultsBody.querySelectorAll("[data-approve]").forEach(btn => {
        btn.addEventListener("click", async () => {
            try {
                await setWantedStatus(btn.dataset.approve, btn.dataset.uid, "active", btn.dataset.title);
                runSearch();
            } catch (e) {
                alert("Approve failed: " + (e.message || e));
            }
        });
    });
    resultsBody.querySelectorAll("[data-reject]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const reason = window.prompt("Rejection reason (shown to user):", "Does not meet guidelines.");
            if (reason === null) return;
            try {
                await setWantedStatus(btn.dataset.reject, btn.dataset.uid, "rejected", btn.dataset.title, reason);
                runSearch();
            } catch (e) {
                alert("Reject failed: " + (e.message || e));
            }
        });
    });
}

searchBtn?.addEventListener("click", runSearch);
refreshBtn?.addEventListener("click", runSearch);
searchInput?.addEventListener("keydown", e => { if (e.key === "Enter") runSearch(); });
filterEl?.addEventListener("change", runSearch);
runSearch();
