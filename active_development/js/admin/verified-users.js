/* ==================================== */
/*  ADMIN — VERIFIED USERS DIRECTORY   */
/* ==================================== */

import { db } from "./core.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listEl = document.getElementById("admin-verified-list");
const searchEl = document.getElementById("admin-verified-search");
const roleEl = document.getElementById("admin-verified-role");
const refreshBtn = document.getElementById("admin-verified-refresh");

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const ID_LABELS = {
    passport: "Passport", national_id: "National ID (PhilSys)", umid: "UMID",
    sss: "SSS", philhealth: "PhilHealth", nbi: "NBI", postal: "Postal ID",
    prc: "PRC", drivers_license: "Driver’s license", driver_license: "Driver’s license"
};

let cache = [];

async function load() {
    if (!listEl) return;
    listEl.innerHTML = `<p class="admin-loading">Loading verified users…</p>`;
    try {
        const snap = await getDocs(collection(db, "users"));
        cache = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => {
            const idOk = (u.idVerification?.status) === "verified";
            const prcOk = (u.brokerLicense?.status) === "verified";
            return idOk || prcOk;
        });
        render();
    } catch (e) {
        listEl.innerHTML = `<p class="admin-empty-state">${escapeHtml(e.message || e)}</p>`;
    }
}

function render() {
    if (!listEl) return;
    const q = (searchEl?.value || "").trim().toLowerCase();
    const role = roleEl?.value || "all";
    let rows = cache.filter(u => {
        if (role !== "all" && (u.accountType || "") !== role) return false;
        if (!q) return true;
        const hay = `${u.firstName||""} ${u.surname||""} ${u.email||""} ${u.uid} ${u.idVerification?.idNumber||""} ${u.brokerLicense?.licenseNumber||""}`.toLowerCase();
        return hay.includes(q);
    });
    rows.sort((a, b) => `${a.firstName||""}`.localeCompare(`${b.firstName||""}`));
    if (!rows.length) {
        listEl.innerHTML = `<p class="admin-empty-state">No verified users match.</p>`;
        return;
    }
    listEl.innerHTML = rows.map(u => {
        const idv = u.idVerification || {};
        const brk = u.brokerLicense || {};
        return `
        <article class="admin-verify-card">
          <div class="admin-verify-head">
            <strong>${escapeHtml(`${u.firstName||""} ${u.surname||""}`.trim() || "—")}</strong>
            <span class="admin-badge admin-badge-${u.accountType||"seeker"}">${escapeHtml(u.accountType||"—")}</span>
          </div>
          <div class="admin-verify-meta">
            ${escapeHtml(u.email||"")}<br>
            <code class="admin-uid-cell">${escapeHtml(u.uid)}</code>
          </div>
          <div class="admin-verified-details">
            ${idv.status === "verified" ? `
              <div class="admin-verified-chip">
                <span class="admin-badge admin-badge-verified">ID verified</span>
                <div><strong>Type:</strong> ${escapeHtml(ID_LABELS[idv.idType] || idv.idType || "—")}</div>
                <div><strong>Number:</strong> ${escapeHtml(idv.idNumber || "—")}</div>
              </div>` : ""}
            ${brk.status === "verified" ? `
              <div class="admin-verified-chip">
                <span class="admin-badge admin-badge-verified">PRC verified</span>
                <div><strong>License type:</strong> ${escapeHtml(brk.licenseType || "prc_license")}</div>
                <div><strong>Number:</strong> ${escapeHtml(brk.licenseNumber || "—")}</div>
              </div>` : ""}
          </div>
        </article>`;
    }).join("");
}

searchEl?.addEventListener("input", render);
roleEl?.addEventListener("change", render);
refreshBtn?.addEventListener("click", load);
load();
