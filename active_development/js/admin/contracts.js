/* HF-BUILD-2026-08-11-V13 | file: contracts.js | DO NOT USE OLD CACHE PATH */
/* Admin contracts — investigation search */

import { db, staffRole } from "./core.js";
import {
    collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const searchInput = document.getElementById("admin-contract-search");
const statusFilter = document.getElementById("admin-contract-status");
const searchBtn = document.getElementById("admin-contract-search-btn");
const resultsBody = document.getElementById("admin-contracts-results");
const resultsEmpty = document.getElementById("admin-contracts-empty");

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function runSearch() {
    if (!resultsBody) return;
    resultsBody.innerHTML = `<tr><td colspan="6" class="admin-loading">Loading…</td></tr>`;
    const term = (searchInput?.value || "").trim().toLowerCase();
    const status = statusFilter?.value || "all";

    let docs = [];
    try {
        const snap = status === "all"
            ? await getDocs(collection(db, "contracts"))
            : await getDocs(query(collection(db, "contracts"), where("status", "==", status)));
        docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        resultsBody.innerHTML = `<tr><td colspan="6">Could not load contracts: ${escapeHtml(err.message)}</td></tr>`;
        return;
    }

    if (term) {
        docs = docs.filter(c => {
            const hay = `${c.id} ${c.seekerId || ""} ${c.ownerId || ""} ${c.brokerId || ""} ${c.propertyId || ""}`.toLowerCase();
            return hay.includes(term);
        });
    }

    if (!docs.length) {
        resultsBody.innerHTML = "";
        if (resultsEmpty) resultsEmpty.hidden = false;
        return;
    }
    if (resultsEmpty) resultsEmpty.hidden = true;

    resultsBody.innerHTML = docs.map(c => `
        <tr>
            <td class="admin-uid-cell">${escapeHtml(c.id)}</td>
            <td><span class="admin-badge admin-badge-pending">${escapeHtml(c.status || "—")}</span></td>
            <td>${escapeHtml(c.type || "—")}</td>
            <td class="admin-uid-cell">${escapeHtml(c.seekerId || "—")}</td>
            <td class="admin-uid-cell">${escapeHtml(c.ownerId || "—")}</td>
            <td class="admin-uid-cell">${escapeHtml(c.propertyId || "—")}</td>
        </tr>
    `).join("");
}

searchBtn?.addEventListener("click", runSearch);
searchInput?.addEventListener("keydown", e => { if (e.key === "Enter") runSearch(); });
statusFilter?.addEventListener("change", runSearch);
runSearch();
