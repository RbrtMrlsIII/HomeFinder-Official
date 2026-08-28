import { canonicalRoleFromData } from "../canonical-role.js";
/* HF-BUILD-2026-08-11-V13 | file: users.js | DO NOT USE OLD CACHE PATH */
/* ==================================== */
/*  ADMIN USERS                        */
/* ==================================== */
/* Search users/{uid}, then manage one at a time: directly overwrite   */
/* their tier/{role} doc, their boosts/{uid} doc, and two admin-only   */
/* capacity-override fields on their profile doc -- all three normally */
/* Cloud-Function-write-only or backend-only, bypassed here per        */
/* firestore.rules' isAdmin() (see that file's header comment).        */
/*                                                                       */
/* Tier writes reproduce the EXACT shape functions/index.js's           */
/* applyTierUpdate() writes (byCategory/tierIndexByCategory/            */
/* highestIndex for seeker, etc.) using the same js/tiers.js math, so   */
/* a hand-edited tier doc looks identical to one a real contract        */
/* completion would have produced -- nothing downstream (perks.js,      */
/* Market's "Featured" ranking and radius lookups) can tell the    */
/* difference. */

import { db, functions, staffRole } from "./core.js";
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
// setDoc used by quick tools
import {
    CATEGORIES, seekerTierForCategory, ownerTierForScore,
    aggregateBrokerScore, brokerTierForScore,
    SEEKER_BOOST_PACKAGES, OWNER_BOOST_PACKAGES
} from "../tiers.js";

const searchInput = document.getElementById("admin-user-search");
const roleFilter = document.getElementById("admin-user-role-filter");
const kycFilter = document.getElementById("admin-user-kyc-filter");
const searchBtn = document.getElementById("admin-user-search-btn");
const resultsBody = document.getElementById("admin-users-results");
const resultsEmpty = document.getElementById("admin-users-empty");
const editorEl = document.getElementById("admin-user-editor");

const CATEGORY_LABELS = { bedspace: "Bedspace", residential: "Residential", commercial: "Commercial", industrial: "Industrial" };
const ROLE_LABELS = { seeker: "Seeker", owner: "Owner", broker: "Property Broker" };

let currentUsers = [];

async function runSearch() {
    resultsBody.innerHTML = `<tr><td colspan="8" class="admin-loading">Loading…</td></tr>`;
    const role = roleFilter.value;
    const term = searchInput.value.trim().toLowerCase();

    const base = collection(db, "users");
    // Was missing a try/catch entirely -- a permission-denied or
    // network failure here just left "Loading…" on screen forever
    // with no visible error (the promise rejection went nowhere).
    // Surfacing it explicitly makes a real problem (e.g. firestore
    // rules not yet deployed -- see Flagged_bugs.md) obvious in the
    // UI instead of only in the console.
    let snap;
    const roleNorm = (role || "all").toLowerCase();
    try {
        // Always load a broad set, then filter client-side.
        // Role casing in Firestore (seeker vs Seeker) and email search
        // both fail if we rely only on a strict accountType where-query.
        snap = await getDocs(base);
    } catch (err) {
        console.error("Admin user search failed:", err);
        resultsBody.innerHTML = `<tr><td colspan="8" class="admin-loading">Couldn't load users -- ${escapeHtml(err.message || "see console")}. Confirm Firestore database is "homefinder" and rules allow staff reads.</td></tr>`;
        return;
    }

    currentUsers = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => {
            const uRole = canonicalRoleFromData(u) || "";
            if (roleNorm && roleNorm !== "all" && uRole !== roleNorm) return false;
            if (term) {
                const idRef = (u.idVerification && (u.idVerification.idNumber || u.idVerification.reference || "")) || "";
                const lic = (u.brokerLicense && (u.brokerLicense.licenseNumber || u.brokerLicense.reference || "")) || "";
                const hay = `${u.firstName || ""} ${u.surname || ""} ${u.email || ""} ${u.uid || u.id || ""} ${u.phone || ""} ${u.accountType || ""} ${idRef} ${lic}`.toLowerCase();
                if (!term.split(/\s+/).every(tok => hay.includes(tok))) return false;
            }
            const kyc = (kycFilter && kycFilter.value) || "all";
            const st = String((u.idVerification && u.idVerification.status) || "none").toLowerCase();
            if (kyc !== "all") {
                if (kyc === "none" && st && st !== "none" && st !== "") return false;
                if (kyc !== "none" && st !== kyc.toLowerCase()) return false;
            }
            return true;
        });

    renderResults();
}

function kycBadge(obj) {
    const s = (obj && obj.status) || "—";
    if (s === "verified") return `<span class="admin-badge admin-badge-verified">verified</span>`;
    if (s === "pending") return `<span class="admin-badge admin-badge-pending">pending</span>`;
    if (s === "rejected") return `<span class="admin-badge admin-badge-rejected">rejected</span>`;
    return `<span class="admin-badge">—</span>`;
}

function renderResults() {
    if (!resultsBody) return;
    if (!currentUsers.length) {
        resultsBody.innerHTML = `<tr><td colspan="8" class="admin-loading" style="padding:24px;text-align:center;color:#5B4030;">
          <strong>No users matched.</strong><br>
          Clear the search box, set filters to “All”, then tap <em>Search</em> again.<br>
          <span style="font-size:12px;opacity:.8;">If this stays empty, check Firestore rules allow staff reads on <code>users</code>.</span>
        </td></tr>`;
        if (resultsEmpty) resultsEmpty.hidden = false;
        // Mobile card fallback empty
        const cards = document.getElementById("admin-users-cards");
        if (cards) cards.innerHTML = `<p class="admin-empty-state">No users matched your filters.</p>`;
        return;
    }
    resultsBody.innerHTML = "";
    if (resultsEmpty) resultsEmpty.hidden = true;

    currentUsers.forEach(u => {
        const tr = document.createElement("tr");
        const manageLabel = staffRole === "super" ? "Manage" : "View";
        const verifiedBits = [];
        if (u.idVerification && u.idVerification.status === "verified") verifiedBits.push("ID");
        if (u.brokerLicense && u.brokerLicense.status === "verified") verifiedBits.push("License");
        const verifiedHtml = verifiedBits.length
            ? `<span class="admin-badge admin-badge-verified">${escapeHtml(verifiedBits.join(" · "))}</span>`
            : kycBadge(u.idVerification);
        tr.innerHTML = `
            <td>${escapeHtml(`${u.firstName || ""} ${u.surname || ""}`.trim() || "—")}${u.suspended ? ` <span class="admin-badge admin-badge-rejected">suspended</span>` : ""}</td>
            <td>${escapeHtml(u.email || "—")}</td>
            <td><span class="admin-badge admin-badge-${u.accountType || "seeker"}">${ROLE_LABELS[u.accountType] || u.accountType || "seeker"}</span></td>
            <td>${verifiedHtml}</td>
            <td class="admin-uid-cell" title="${escapeHtml(u.uid || "")}">${escapeHtml((u.uid || "—").slice(0, 12))}${(u.uid && u.uid.length > 12) ? "…" : ""}</td>
            <td><button type="button" class="admin-btn admin-btn-ghost admin-btn-sm admin-manage-btn" data-uid="${u.uid}">${manageLabel}</button></td>
        `;
        resultsBody.appendChild(tr);
    });

    resultsBody.querySelectorAll(".admin-manage-btn").forEach(btn => {
        btn.addEventListener("click", () => openEditor(btn.dataset.uid));
    });

    // Mobile card list (visible under 720px via CSS)
    let cards = document.getElementById("admin-users-cards");
    if (!cards) {
        const wrap = resultsBody.closest(".admin-excel-wrap");
        if (wrap) {
            cards = document.createElement("div");
            cards.id = "admin-users-cards";
            cards.className = "admin-users-cards";
            wrap.appendChild(cards);
        }
    }
    if (cards) {
        cards.innerHTML = currentUsers.map(u => {
            const name = escapeHtml(`${u.firstName || ""} ${u.surname || ""}`.trim() || "—");
            const role = ROLE_LABELS[u.accountType] || u.accountType || "seeker";
            return `<article class="admin-user-card">
              <div class="admin-user-card-top">
                <strong>${name}</strong>
                <span class="admin-badge admin-badge-${u.accountType || "seeker"}">${escapeHtml(role)}</span>
              </div>
              <div class="admin-user-card-meta">${escapeHtml(u.email || "—")}</div>
              <div class="admin-user-card-meta">${escapeHtml(u.phone || "—")}</div>
              <div class="admin-user-card-meta">KYC: ${(u.idVerification && u.idVerification.status) || "none"}</div>
              <button type="button" class="admin-btn admin-btn-ghost admin-btn-sm admin-manage-btn" data-uid="${u.uid}">Manage</button>
            </article>`;
        }).join("");
        cards.querySelectorAll(".admin-manage-btn").forEach(btn => {
            btn.addEventListener("click", () => openEditor(btn.dataset.uid));
        });
    }
}

/** Push an in-app notification to the managed user about staff changes. */
async function notifyUser(uid, message, type = "admin_adjustment") {
    try {
        await addDoc(collection(db, "notifications", uid, "items"), {
            type,
            message,
            read: false,
            createdAt: serverTimestamp(),
            source: "admin"
        });
    } catch (err) {
        console.warn("notifyUser failed", uid, err);
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* -------- editor -------- */


function moderatorKycView(uid, profile, role) {
    const idv = profile.idVerification || {};
    const brk = profile.brokerLicense || {};
    return `
      <div class="admin-editor-section">
        <h3><i class='bx bx-id-card'></i> Verification (read-only for moderators)</h3>
        <p class="field-hint">Approve/reject from the <strong>Verifications</strong> tab. Tier &amp; boost edits require Super Admin.</p>
        <div class="admin-editor-grid">
          <div><strong>User</strong><br>${escapeHtml((profile.firstName||"")+" "+(profile.surname||""))}<br><code>${escapeHtml(uid)}</code></div>
          <div><strong>Role</strong><br>${escapeHtml(role)}</div>
          <div><strong>Government ID</strong><br>${escapeHtml(idv.status||"none")} · ${escapeHtml(idv.idType||"—")}</div>
          <div><strong>Broker license</strong><br>${escapeHtml(brk.status||"none")} · ${escapeHtml(brk.licenseType||"—")} ${escapeHtml(brk.licenseNumber||"")}</div>
        </div>
        <button type="button" class="admin-btn admin-btn-ghost" id="admin-editor-close">Close</button>
      </div>`;
}

async function openEditor(uid) {
    // Patch 23: only Admin receives the full Manage editor. Lower Ops roles
    // must never fall through into the write-capable editor.
    if (staffRole !== "super") {
        const profileSnap = await getDoc(doc(db, "users", uid));
        if (!profileSnap.exists()) { alert("That profile doc no longer exists."); return; }
        const profile = profileSnap.data();
        editorEl.innerHTML = moderatorKycView(uid, profile, canonicalRoleFromData(profile, "seeker") || "seeker");
        editorEl.classList.remove("is-hidden"); editorEl.classList.add("is-visible");
        editorEl.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }

    const profileSnap = await getDoc(doc(db, "users", uid));
    if (!profileSnap.exists()) { alert("That profile doc no longer exists."); return; }
    const profile = profileSnap.data();
    const role = ["seeker", "owner", "broker"].includes(canonicalRoleFromData(profile)) ? canonicalRoleFromData(profile) : "admin";

    const tierSnap = await getDoc(doc(db, "users", uid, "tier", role));
    const tierData = tierSnap.exists() ? tierSnap.data() : {};

    const boostSnap = await getDoc(doc(db, "boosts", uid));
    const boostData = boostSnap.exists() ? boostSnap.data() : {};

    if (staffRole === "moderator") {
        editorEl.innerHTML = moderatorKycView(uid, profile, role);
    } else {
        editorEl.innerHTML = editorTemplate(uid, profile, role, tierData, boostData);
    }
    editorEl.classList.remove("is-hidden"); editorEl.classList.add("is-visible");
    editorEl.scrollIntoView({ behavior: "smooth", block: "start" });

    if (role !== "admin") {
        wireTierForm(uid, role, tierData);
        wireSaveTier(uid, role);
        wireCapacityForm(uid, role, profile);
    }
    wireBoostForm(uid, role, boostData);
    if (role !== "admin" && staffRole === "super") await wireSubscriptionGrant(uid);
    // Patch 23: this was the missing wire-up that made the restored editor
    // appear to work while its Profile > Save button did nothing.
    wireSaveProfile(uid);
}

function editorTemplate(uid, profile, role, tierData, boostData) {
    return `
        <div class="panel-card admin-editor-card">
            <div class="admin-editor-header">
                <div>
                    <h3>${escapeHtml(`${profile.firstName || ""} ${profile.surname || ""}`.trim() || "Unnamed user")}</h3>
                    <p class="admin-editor-sub">${escapeHtml(profile.email || "")} · <span class="admin-badge admin-badge-${role}">${ROLE_LABELS[role]}</span> · <code>${uid}</code></p>
                </div>
                <button class="secondary-btn" id="admin-editor-close">Close</button>
            </div>

            <section class="admin-editor-section">
                <h4>Profile</h4>
                <div class="admin-profile-grid">
                  <div class="field-group">
                    <label>First name</label>
                    <input type="text" id="admin-edit-firstName" value="${escapeHtml(profile.firstName || "")}">
                  </div>
                  <div class="field-group">
                    <label>Surname</label>
                    <input type="text" id="admin-edit-surname" value="${escapeHtml(profile.surname || "")}">
                  </div>
                  <div class="field-group">
                    <label>Phone</label>
                    <input type="text" id="admin-edit-phone" value="${escapeHtml(profile.phone || "")}">
                  </div>
                </div>
                <button type="button" class="primary-btn" id="admin-save-profile">Save profile</button>
                <span class="admin-save-status" id="admin-profile-status"></span>
            </section>

            ${role !== "admin" ? `<section class="admin-editor-section">
                <h4>Tier editor <span class="admin-editor-hint">— writes users/${uid}/tier/${role}</span></h4>
                <div id="admin-tier-fields"></div>
                <button class="primary-btn" id="admin-save-tier">Save tier</button>
                <span class="admin-save-status" id="admin-tier-status"></span>
            </section>` : `<section class="admin-editor-section"><h4>Tier editor</h4><p class="field-hint">Admin accounts do not receive seeker, owner, or broker tier progression.</p></section>`}

            ${role !== "admin" && staffRole === "super" ? `<section class="admin-editor-section">
                <h4>Subscription smoke-test grant</h4>
                <p class="admin-tool-help">Admin grants are <strong>not PayPal transactions</strong>. They create a separate smoke-test entitlement and audit record for this exact user.</p>
                <div id="admin-subscription-state" class="field-hint">Reading persisted entitlement state…</div>
                <div class="admin-profile-grid" style="margin-top:10px;">
                  <div class="field-group"><label>Grant duration (days)</label><input type="number" min="1" max="3650" step="1" id="admin-subscription-days" value="30"></div>
                  <div class="field-group"><label>Reason (required)</label><input type="text" id="admin-subscription-reason" placeholder="Smoke-test premium entitlement"></div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                  <button type="button" class="admin-btn" id="admin-grant-subscription">Grant subscription</button>
                  <button type="button" class="admin-btn admin-btn-ghost" id="admin-revoke-subscription">Revoke admin grant</button>
                </div>
                <span class="admin-save-status" id="admin-subscription-status"></span>
            </section>` : ""}

            <section class="admin-editor-section">
                <h4>Boost editor <span class="admin-editor-hint">— writes to Firestore boosts/${uid}</span></h4>
                <div id="admin-boost-fields"></div>
                ${Object.keys(boostCatalogForRole(role)).length ? `<button class="primary-btn" id="admin-save-boost">Save boost</button>` : ""}
                <span class="admin-save-status" id="admin-boost-status"></span>
                <div id="admin-boost-db-state" class="field-hint" style="margin-top:10px;">Reading persisted database state…</div>
            </section>

            ${role !== "admin" ? `<section class="admin-editor-section">
                <h4>Capacity &amp; quick tools</h4>
                <p class="admin-tool-help">Clear numbers only. Blank = remove override. Changes save to the user doc or boosts doc as noted.</p>
                <div id="admin-capacity-fields"></div>
                <button class="primary-btn" id="admin-save-capacity">Save capacity</button>
                <span class="admin-save-status" id="admin-capacity-status"></span>
                <div class="admin-quick-tools" id="admin-quick-tools">
                  <h4>Quick actions</h4>
                  <div class="admin-quick-grid">
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="plus-listing">+1 listing attempt</button>
                    <p class="admin-tool-help" style="margin:0 0 8px;font-size:13px;line-height:1.45;color:var(--text-secondary, #cfc6b8);">
                      <strong>Tier &amp; capacity tools</strong> — each button writes immediately and notifies the user.
                    </p>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="plus-wanted" title="Adds +1 to wanted listing attempts for this user">+1 Wanted attempt</button>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="plus-tier" title="Raises tier progress by one level (points threshold)">+1 Tier level</button>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="set-tier-0" title="Reset tier progress to Tier 0">Set Tier 0</button>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="set-tier-2" title="Jump tier progress to Tier 2 threshold">Set Tier 2</button>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="set-tier-3" title="Jump tier progress to Tier 3 threshold">Set Tier 3</button>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="extra-slot" title="Permanent +1 listing capacity override slot">+1 Listing slot</button>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="reset-cooldown" title="Clears map pin relocation cooldown">Reset pin cooldown</button>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="reset-password">Email password reset</button>
                  </div>
                  <div class="admin-suspend-row" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:end;">
                    <div class="field-group" style="margin:0;flex:1;min-width:120px;">
                      <label>Suspend for (days)</label>
                      <input type="number" id="admin-suspend-days" min="1" step="1" value="7" style="width:100%;">
                    </div>
                    <div class="field-group" style="margin:0;flex:2;min-width:160px;">
                      <label>Reason</label>
                      <input type="text" id="admin-suspend-reason" placeholder="Optional reason" style="width:100%;">
                    </div>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="suspend" style="border-color:#B3543F;color:#B3543F;">Suspend</button>
                    <button type="button" class="admin-btn admin-btn-ghost" data-quick="unsuspend">Lift suspension</button>
                  </div>
                  <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border-color,#E2D8C7);">
                    <button type="button" class="admin-btn" data-quick="delete-user" style="background:#B3543F;color:#fff;border:none;">Delete user profile</button>
                    <span class="field-hint">Removes users/{uid} only. Auth account may still exist.</span>
                  </div>
                  <p class="field-hint" id="admin-quick-status"></p>
                </div>
            </section>` : `<section class="admin-editor-section"><h4>Admin quick tools</h4><p class="field-hint">Capacity, tier, and user-role boosts are intentionally scoped to customer roles. Use Profile to edit the Admin account itself.</p></section>`}
        </div>
    `;
}

document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "admin-editor-close") {
        editorEl.classList.add("is-hidden"); editorEl.classList.remove("is-visible");
        editorEl.innerHTML = "";
    }
});

/* -------- tier -------- */

function wireTierForm(uid, role, tierData) {
    const container = document.getElementById("admin-tier-fields");

    if (role === "seeker") {
        const byCategory = tierData.byCategory || {};
        container.innerHTML = CATEGORIES.map(cat => `
            <div class="field-group admin-inline-field">
                <label>${CATEGORY_LABELS[cat]} — completed contracts</label>
                <input type="number" min="0" step="1" id="admin-tier-cat-${cat}" value="${byCategory[cat] || 0}">
            </div>
        `).join("");
    } else if (role === "owner") {
        container.innerHTML = `
            <div class="field-group admin-inline-field">
                <label>Completed contracts</label>
                <input type="number" min="0" step="1" id="admin-tier-completed" value="${tierData.completedContracts || 0}">
            </div>
            <div class="field-group admin-inline-field">
                <label>Satisfaction sum (Σ of all ratings, 0-5 each)</label>
                <input type="number" min="0" step="0.5" id="admin-tier-satsum" value="${tierData.satisfactionSum || 0}">
            </div>
            <div class="field-group admin-inline-field">
                <label>Satisfaction count (# of ratings)</label>
                <input type="number" min="0" step="1" id="admin-tier-satcount" value="${tierData.satisfactionCount || 0}">
            </div>
        `;
    } else {
        const byProperty = tierData.byProperty || {};
        const rows = Object.entries(byProperty).length ? Object.entries(byProperty) : [["", {}]];
        container.innerHTML = `
            <p class="field-hint">One row per propertyId. Leave the Property ID blank to skip a row.</p>
            <div id="admin-broker-rows">
                ${rows.map(([pid, entry]) => brokerRow(pid, entry)).join("")}
            </div>
            <button type="button" class="secondary-btn" id="admin-add-broker-row" style="margin-top:8px;">+ Add property row</button>
        `;
        document.getElementById("admin-add-broker-row").addEventListener("click", () => {
            document.getElementById("admin-broker-rows").insertAdjacentHTML("beforeend", brokerRow("", {}));
        });
    }
}

function brokerRow(propertyId, entry) {
    return `
        <div class="admin-broker-row">
            <input type="text" placeholder="Property ID" class="admin-broker-pid" value="${escapeHtml(propertyId)}">
            <input type="number" min="0" step="1" placeholder="Satisfied closures" class="admin-broker-closures" value="${entry.satisfiedClosures || 0}">
            <input type="number" min="0" step="1" placeholder="Rent-to-own rescues" class="admin-broker-rescues" value="${entry.rentToOwnRescues || 0}">
        </div>
    `;
}

function wireSaveTier(uid, role) {
    document.getElementById("admin-save-tier").addEventListener("click", async () => {
        const statusEl = document.getElementById("admin-tier-status");
        statusEl.textContent = "Saving…";
        try {
            let payload;
            if (role === "seeker") {
                const byCategory = {};
                CATEGORIES.forEach(cat => {
                    byCategory[cat] = Number(document.getElementById(`admin-tier-cat-${cat}`).value) || 0;
                });
                const tierIndexByCategory = {};
                let highestIndex = 0;
                CATEGORIES.forEach(cat => {
                    const idx = seekerTierForCategory(byCategory[cat]).index;
                    tierIndexByCategory[cat] = idx;
                    highestIndex = Math.max(highestIndex, idx);
                });
                payload = { byCategory, tierIndexByCategory, highestIndex };
            } else if (role === "owner") {
                const completedContracts = Number(document.getElementById("admin-tier-completed").value) || 0;
                const satisfactionSum = Number(document.getElementById("admin-tier-satsum").value) || 0;
                const satisfactionCount = Number(document.getElementById("admin-tier-satcount").value) || 0;
                const avgSatisfaction = satisfactionCount > 0 ? satisfactionSum / satisfactionCount : 0;
                const highestIndex = ownerTierForScore(completedContracts, avgSatisfaction).index;
                payload = { completedContracts, satisfactionSum, satisfactionCount, highestIndex };
            } else {
                const byProperty = {};
                document.querySelectorAll("#admin-broker-rows .admin-broker-row").forEach(row => {
                    const pid = row.querySelector(".admin-broker-pid").value.trim();
                    if (!pid) return;
                    byProperty[pid] = {
                        satisfiedClosures: Number(row.querySelector(".admin-broker-closures").value) || 0,
                        rentToOwnRescues: Number(row.querySelector(".admin-broker-rescues").value) || 0
                    };
                });
                const { satisfiedClosures, rentToOwnRescues } = aggregateBrokerScore(byProperty);
                const highestIndex = brokerTierForScore(satisfiedClosures, rentToOwnRescues).index;
                payload = { byProperty, satisfiedClosures, rentToOwnRescues, highestIndex };
            }

            await setDoc(doc(db, "users", uid, "tier", role), { ...payload, adminAdjustedAt: new Date().toISOString() });
            await notifyUser(uid, `Admin updated your ${role} tier (index ${payload.highestIndex ?? "—"}). Check Perks for the new rank.`);
            statusEl.textContent = "Saved ✓";
        } catch (err) {
            console.error("Failed to save tier:", err);
            statusEl.textContent = "Failed — see console.";
        }
        setTimeout(() => { statusEl.textContent = ""; }, 3000);
    });
}

/* -------- subscription smoke-test grant -------- */
async function wireSubscriptionGrant(uid) {
    const stateEl = document.getElementById("admin-subscription-state");
    const statusEl = document.getElementById("admin-subscription-status");
    const grantBtn = document.getElementById("admin-grant-subscription");
    const revokeBtn = document.getElementById("admin-revoke-subscription");
    if (!grantBtn || !revokeBtn) return;

    async function refresh() {
        try {
            const [grantSnap, entitlementSnap] = await Promise.all([
                getDoc(doc(db, "subscriptionAdminGrants", uid)),
                getDoc(doc(db, "subscriptionEntitlements", uid))
            ]);
            const grant = grantSnap.exists() ? grantSnap.data() : null;
            const ent = entitlementSnap.exists() ? entitlementSnap.data() : null;
            const active = Boolean(grant?.active && ent?.active);
            const ends = grant?.endsAt?.toDate ? grant.endsAt.toDate().toLocaleString() : (grant?.endsAt || "—");
            stateEl.innerHTML = `<strong>Entitlement:</strong> ${active ? "ACTIVE" : "INACTIVE"} · <strong>source:</strong> ${escapeHtml(String(ent?.source || "—"))} · <strong>ends:</strong> ${escapeHtml(String(ends))}`;
        } catch (err) {
            stateEl.textContent = `Could not read entitlement state: ${err.message || err}`;
        }
    }

    grantBtn.addEventListener("click", async () => {
        const days = Number(document.getElementById("admin-subscription-days")?.value || 0);
        const reason = String(document.getElementById("admin-subscription-reason")?.value || "").trim();
        if (!Number.isInteger(days) || days < 1 || days > 3650 || !reason) {
            statusEl.textContent = "Enter a valid duration (1–3650 days) and reason.";
            return;
        }
        statusEl.textContent = "Granting and verifying…";
        grantBtn.disabled = true;
        try {
            const fn = httpsCallable(functions, "grantAdminSubscription");
            const result = await fn({uid, days, reason});
            const grantSnap = await getDoc(doc(db, "subscriptionAdminGrants", uid));
            const entSnap = await getDoc(doc(db, "subscriptionEntitlements", uid));
            if (!grantSnap.exists() || !entSnap.exists() || entSnap.data()?.active !== true || entSnap.data()?.source !== "admin_smoke_test") {
                throw new Error("Firestore readback did not confirm the admin entitlement.");
            }
            statusEl.textContent = `Granted & Firestore verified ✓ (${result.data?.endsAt ? new Date(result.data.endsAt).toLocaleDateString() : "active"})`;
            await refresh();
        } catch (err) {
            console.error("Admin subscription grant failed:", err);
            statusEl.textContent = `Grant failed: ${err.message || err}`;
        } finally { grantBtn.disabled = false; }
    });

    revokeBtn.addEventListener("click", async () => {
        const reason = String(document.getElementById("admin-subscription-reason")?.value || "").trim();
        if (!reason) { statusEl.textContent = "Enter a reason before revoking."; return; }
        statusEl.textContent = "Revoking and verifying…";
        revokeBtn.disabled = true;
        try {
            const fn = httpsCallable(functions, "revokeAdminSubscription");
            await fn({uid, reason});
            const entSnap = await getDoc(doc(db, "subscriptionEntitlements", uid));
            if (!entSnap.exists() || entSnap.data()?.active !== false || entSnap.data()?.source !== "admin_smoke_test") {
                throw new Error("Firestore readback did not confirm the admin entitlement was revoked.");
            }
            statusEl.textContent = "Admin grant revoked & Firestore verified ✓";
            await refresh();
        } catch (err) {
            console.error("Admin subscription revoke failed:", err);
            statusEl.textContent = `Revoke failed: ${err.message || err}`;
        } finally { revokeBtn.disabled = false; }
    });
    await refresh();
}

/* -------- boost -------- */

function boostCatalogForRole(role) {
    if (role === "seeker") return { seeker: SEEKER_BOOST_PACKAGES };
    if (role === "owner") return { owner: OWNER_BOOST_PACKAGES };
    if (role === "broker") return { seeker: SEEKER_BOOST_PACKAGES, owner: OWNER_BOOST_PACKAGES };
    return {};
}

function boostEntrySummary(role, entry) {
    if (!entry || !entry.active) return `${role}: inactive`;
    const pkg = Number(entry.package) || 0;
    const catalog = role === "seeker" ? SEEKER_BOOST_PACKAGES : OWNER_BOOST_PACKAGES;
    const p = catalog[pkg] || catalog[0];
    return `${role}: ${p.name} (#${pkg}) · active`;
}

async function refreshBoostDbState(uid) {
    const stateEl = document.getElementById("admin-boost-db-state");
    if (!stateEl) return;
    try {
        const snap = await getDoc(doc(db, "boosts", uid));
        const data = snap.exists() ? snap.data() : {};
        const roles = ["seeker", "owner"].filter(r => data[r] || r === "seeker" && data[r] || r === "owner" && data[r]);
        const summaries = roles.length
            ? roles.map(r => escapeHtml(boostEntrySummary(r, data[r]))).join(" · ")
            : "No seeker/owner boost document entries persisted.";
        stateEl.innerHTML = `<strong>Firestore verified:</strong> boosts/${escapeHtml(uid)} · ${summaries}`;
    } catch (err) {
        stateEl.textContent = `Database readback failed: ${err.message || err}`;
    }
}

function renderBoostEditor(role, boostData) {
    const container = document.getElementById("admin-boost-fields");
    if (!container) return;
    const catalogs = boostCatalogForRole(role);
    const roles = Object.keys(catalogs);
    if (!roles.length) {
        container.innerHTML = `<p class="field-hint">This account role has no boost catalog. Boost controls are intentionally unavailable.</p>`;
        return;
    }
    container.innerHTML = roles.map(boostRole => {
        const entry = boostData[boostRole] || {};
        const catalog = catalogs[boostRole];
        const currentPkg = (typeof entry.package === "number" && Number.isInteger(entry.package))
            ? entry.package
            : 0;
        const label = boostRole === "seeker" ? "Seeking Boost" : "Listing Boost";
        const effect = boostRole === "seeker" ? "radius + wanted capacity" : "listing capacity";
        return `<div class="admin-boost-row" data-boost-role="${boostRole}" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border-color,#E2D8C7);">
            <label><input type="checkbox" class="admin-boost-active" data-role="${boostRole}" ${entry.active ? "checked" : ""}> ${label} active</label>
            <div class="field-group admin-inline-field">
                <label>${label} package (${effect})</label>
                <select class="admin-boost-package" data-role="${boostRole}">
                    ${Object.values(catalog).map(pkg => `<option value="${pkg.id}" ${currentPkg === pkg.id ? "selected" : ""}>${pkg.name}${pkg.id ? ` — PHP ${pkg.pricePhp.toFixed(2)}` : ""}</option>`).join("")}
                </select>
            </div>
        </div>`;
    }).join("");
}

function wireBoostForm(uid, role, boostData) {
    renderBoostEditor(role, boostData);
    refreshBoostDbState(uid);
    const btn = document.getElementById("admin-save-boost");
    if (!btn) return;
    btn.addEventListener("click", async () => {
        const statusEl = document.getElementById("admin-boost-status");
        if (statusEl) statusEl.textContent = "Saving to Firestore…";
        try {
            const catalogs = boostCatalogForRole(role);
            const payload = {};
            for (const boostRole of Object.keys(catalogs)) {
                const activeEl = document.querySelector(`.admin-boost-active[data-role="${boostRole}"]`);
                const packageEl = document.querySelector(`.admin-boost-package[data-role="${boostRole}"]`);
                if (!activeEl || !packageEl) continue;
                payload[boostRole] = { active: activeEl.checked, package: Number(packageEl.value) || 0 };
            }
            if (!Object.keys(payload).length) {
                if (statusEl) statusEl.textContent = "No boost is eligible for this role.";
                return;
            }
            await setDoc(doc(db, "boosts", uid), { ...payload, adminAdjustedAt: new Date().toISOString(), adminAdjustedBy: "admin" }, { merge: true });

            // Critical Patch 24 contract: read the exact same document back and
            // verify the selected user's persisted state before reporting success.
            const verifySnap = await getDoc(doc(db, "boosts", uid));
            if (!verifySnap.exists()) throw new Error(`Firestore readback missing boosts/${uid}`);
            const persisted = verifySnap.data();
            for (const boostRole of Object.keys(payload)) {
                const got = persisted[boostRole] || {};
                if (Boolean(got.active) !== Boolean(payload[boostRole].active) || Number(got.package) !== Number(payload[boostRole].package)) {
                    throw new Error(`Firestore readback mismatch for ${boostRole}`);
                }
            }
            for (const [boostRole, entry] of Object.entries(payload)) {
                await notifyUser(uid, `Admin granted/updated your ${boostRole} boost: package ${entry.package}, active ${entry.active}.`);
            }
            if (statusEl) statusEl.textContent = "Saved & Firestore verified ✓";
            await refreshBoostDbState(uid);
        } catch (err) {
            console.error("Failed to save boost:", err);
            if (statusEl) statusEl.textContent = "Failed — database was not verified.";
        }
        setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 4000);
    });
}


/* -------- capacity overrides -------- */

function wireCapacityForm(uid, role, profile) {
    const container = document.getElementById("admin-capacity-fields");

    if (role === "owner") {
        container.innerHTML = `
            <div class="field-group admin-inline-field">
                <label>Listing cap override <span class="field-hint">(blank = use boost-based default)</span></label>
                <input type="number" min="0" step="1" id="admin-cap-listing" value="${profile.listingCapOverride ?? ""}" placeholder="e.g. 10">
            </div>
        `;
    } else if (role === "seeker") {
        container.innerHTML = `
            <div class="field-group admin-inline-field">
                <label>Active wanted-post cap override <span class="field-hint">(blank = unlimited, the app default)</span></label>
                <input type="number" min="0" step="1" id="admin-cap-wanted" value="${profile.wantedCapOverride ?? ""}" placeholder="e.g. 5">
            </div>
        `;
    } else {
        // Brokers: both listing + wanted overrides available
        container.innerHTML = `
            <div class="field-group">
                <label for="admin-cap-listing">Listing capacity override</label>
                <input type="number" min="0" step="1" id="admin-cap-listing" value="${profile.listingCapOverride ?? ""}" placeholder="e.g. 5">
            </div>
            <div class="field-group">
                <label for="admin-cap-wanted">Wanted capacity override</label>
                <input type="number" min="0" step="1" id="admin-cap-wanted" value="${profile.wantedCapOverride ?? ""}" placeholder="e.g. 3">
            </div>
        `;
    }
    wireSaveCapacity(uid, role);
    wireQuickTools(uid, profile);
}

function wireSaveCapacity(uid, role) {
    document.getElementById("admin-save-capacity").addEventListener("click", async () => {
        const statusEl = document.getElementById("admin-capacity-status");
        statusEl.textContent = "Saving…";
        try {
            const payload = {};
            const listingEl = document.getElementById("admin-cap-listing");
            const wantedEl = document.getElementById("admin-cap-wanted");
            if (listingEl) {
                const raw = listingEl.value.trim();
                payload.listingCapOverride = raw === "" ? null : Number(raw);
            }
            if (wantedEl) {
                const raw = wantedEl.value.trim();
                payload.wantedCapOverride = raw === "" ? null : Number(raw);
            }
            if (!Object.keys(payload).length) {
                statusEl.textContent = "Nothing to save";
                return;
            }
            await updateDoc(doc(db, "users", uid), payload);
            const bits = [];
            if (payload.listingCapOverride != null) bits.push(`listing cap ${payload.listingCapOverride}`);
            if (payload.wantedCapOverride != null) bits.push(`wanted cap ${payload.wantedCapOverride}`);
            if (bits.length) await notifyUser(uid, `Staff updated your capacity: ${bits.join(", ")}.`);
            statusEl.textContent = "Saved ✓";
        } catch (err) {
            console.error("Failed to save capacity override:", err);
            statusEl.textContent = "Failed — see console.";
        }
        setTimeout(() => { statusEl.textContent = ""; }, 3000);
    });
}


async function runQuickAction(uid, action, profile) {
    const status = document.getElementById("admin-quick-status");
    if (status) status.textContent = "Working…";
    try {
        if (action === "plus-listing") {
            const cur = Number(profile.listingCapOverride) || 0;
            const next = Math.max(cur, 1) + 1;
            await updateDoc(doc(db, "users", uid), { listingCapOverride: next });
            profile.listingCapOverride = next;
            const input = document.getElementById("admin-cap-listing");
            if (input) input.value = String(next);
            await notifyUser(uid, `Staff increased your listing attempt cap to ${next}.`);
            if (status) status.textContent = `Listing override → ${next}`;
        } else if (action === "plus-wanted") {
            const cur = Number(profile.wantedCapOverride) || 0;
            const next = Math.max(cur, 1) + 1;
            await updateDoc(doc(db, "users", uid), { wantedCapOverride: next });
            profile.wantedCapOverride = next;
            const input = document.getElementById("admin-cap-wanted");
            if (input) input.value = String(next);
            await notifyUser(uid, `Staff increased your wanted-post cap to ${next}.`);
            if (status) status.textContent = `Wanted override → ${next}`;
        } else if (action === "set-tier-0" || action === "set-tier-2" || action === "set-tier-3") {
            const thresholds = { "set-tier-0": 0, "set-tier-2": 400, "set-tier-3": 4000 };
            const target = thresholds[action] ?? 0;
            const tierRole = role === "broker" ? "broker" : role;
            const tierRef = doc(db, "users", uid, "tier", tierRole);
            const snap = await getDoc(tierRef);
            const prev = snap.exists() ? snap.data() : {};
            const hi = target <= 0 ? 0 : target < 400 ? 1 : target < 4000 ? 2 : target < 8000 ? 3 : target < 10000 ? 4 : 5;
            await setDoc(tierRef, { ...prev, totalPoints: target, highestIndex: hi, adminAdjustedAt: new Date().toISOString() }, { merge: true });
            await notifyUser(uid, `Staff set your tier progress to ${target} points (Tier ${hi}).`);
            if (status) status.textContent = `Tier set → ${target} pts (T${hi})`;
        } else if (action === "plus-tier") {
            const role = canonicalRoleFromData(profile, "seeker") || "seeker";
            const tierRole = role === "broker" ? "broker" : role;
            const tierRef = doc(db, "users", uid, "tier", tierRole);
            const snap = await getDoc(tierRef);
            const prev = snap.exists() ? snap.data() : {};
            const pts = Number(prev.totalPoints) || 0;
            const thresholds = [0, 20, 400, 4000, 8000, 10000];
            let target = pts + 20;
            for (const t of thresholds) {
                if (pts < t) { target = t; break; }
            }
            let hi = 0;
            for (let i = 0; i < thresholds.length; i++) {
                if (target >= thresholds[i]) hi = i;
            }
            await setDoc(tierRef, { ...prev, totalPoints: target, highestIndex: hi, adminAdjustedAt: new Date().toISOString() }, { merge: true });
            await notifyUser(uid, `Staff adjusted your tier progress to ${target} points (Tier ${hi}).`);
            if (status) status.textContent = `Tier points → ${target} (was ${pts})`;
        } else if (action === "extra-slot") {
            const bref = doc(db, "boosts", uid);
            const bsnap = await getDoc(bref);
            const b = bsnap.exists() ? bsnap.data() : {};
            const prev = b.extraListings || {};
            const qty = (Number(prev.quantity) || 0) + 1;
            const expires = new Date();
            expires.setDate(expires.getDate() + 30);
            await setDoc(bref, {
                extraListings: { quantity: qty, expiresAt: expires.toISOString(), active: true },
                updatedAt: new Date().toISOString()
            }, { merge: true });
            await notifyUser(uid, `Staff granted +1 extra listing slot (${qty} total, 30 days).`);
            if (status) status.textContent = `Extra listing slots → ${qty}`;
        } else if (action === "reset-cooldown") {
            await updateDoc(doc(db, "users", uid), {
                "mapState.lastRelocatedAt": null
            });
            await notifyUser(uid, "Staff reset your map pin relocation cooldown. You can move your search pin again.");
            if (status) status.textContent = "Pin cooldown cleared";
        } else if (action === "reset-password") {
            const email = profile.email;
            if (!email) throw new Error("User has no email on profile");
            const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            const { auth } = await import("../firebase.js");
            await sendPasswordResetEmail(auth, email);
            await notifyUser(uid, "Staff triggered a password reset email for your account.");
            if (status) status.textContent = `Password reset email sent to ${email}`;
        } else if (action === "suspend") {
            const days = Math.max(1, Number(document.getElementById("admin-suspend-days")?.value) || 7);
            const reason = (document.getElementById("admin-suspend-reason")?.value || "").trim() || "Policy review";
            const setUserSuspension = httpsCallable(functions, "setUserSuspension");
            const result = await setUserSuspension({ uid, suspend: true, days, reason });
            const until = result?.data?.suspendedUntil ? new Date(result.data.suspendedUntil) : new Date(Date.now() + days * 86400000);
            await notifyUser(uid, `Your account is suspended until ${until.toLocaleDateString()} — ${reason}. Contact support if you believe this is a mistake.`, "account_suspension");
            if (status) status.textContent = `Suspended ${days} day(s) until ${until.toLocaleDateString()}`;
        } else if (action === "unsuspend") {
            const setUserSuspension = httpsCallable(functions, "setUserSuspension");
            await setUserSuspension({ uid, suspend: false });
            await notifyUser(uid, "Staff lifted your account suspension. You can use HomeFinder normally again.", "account_suspension");
            if (status) status.textContent = "Suspension lifted";
        } else if (action === "delete-user") {
            const ok = confirm("Permanently delete this user PROFILE document? This cannot be undone. Auth login may still exist.");
            if (!ok) { if (status) status.textContent = "Cancelled"; return; }
            await notifyUser(uid, "Staff removed your profile data from HomeFinder.", "account_deleted");
            await deleteDoc(doc(db, "users", uid));
            if (status) status.textContent = "Profile deleted";
            if (editorEl) { editorEl.classList.add("is-hidden"); editorEl.classList.remove("is-visible"); editorEl.innerHTML = ""; }
            runSearch();
        }
    } catch (err) {
        console.error(err);
        if (status) status.textContent = "Failed: " + (err.message || err);
    }
}

function wireSaveProfile(uid) {
    const btn = document.getElementById("admin-save-profile");
    if (!btn) return;
    btn.addEventListener("click", async () => {
        const statusEl = document.getElementById("admin-profile-status");
        if (statusEl) statusEl.textContent = "Saving…";
        try {
            const firstName = (document.getElementById("admin-edit-firstName")?.value || "").trim();
            const surname = (document.getElementById("admin-edit-surname")?.value || "").trim();
            const phone = (document.getElementById("admin-edit-phone")?.value || "").trim();
            await updateDoc(doc(db, "users", uid), { firstName, surname, phone });
            await notifyUser(uid, `Admin updated your profile name/phone${firstName || surname ? ` (${firstName} ${surname})`.trim() : ""}.`);
            if (statusEl) statusEl.textContent = "Saved ✓";
            runSearch();
        } catch (err) {
            console.error(err);
            if (statusEl) statusEl.textContent = "Failed — see console.";
        }
        setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
    });
}

function wireQuickTools(uid, profile) {
    document.querySelectorAll("#admin-quick-tools [data-quick]").forEach(btn => {
        btn.onclick = () => runQuickAction(uid, btn.dataset.quick, profile);
    });
}

searchBtn?.addEventListener("click", (e) => { e.preventDefault(); runSearch(); });
searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); runSearch(); } });
document.getElementById("admin-user-role-filter")?.addEventListener("change", runSearch);
// Always load once when Users tab is shown
document.addEventListener("click", (e) => {
    const tab = e.target?.closest?.("[data-tab]");
    if (tab?.dataset?.tab === "users") setTimeout(runSearch, 50);
});
runSearch();
