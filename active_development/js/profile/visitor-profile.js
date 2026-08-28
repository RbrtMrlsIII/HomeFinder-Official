import { canonicalRoleFromData } from "../canonical-role.js";
/* HF-BUILD-2026-08-11-V13 | file: visitor-profile.js | DO NOT USE OLD CACHE PATH */
/* ==================================== */
/*  VISITOR PROFILE MODE               */
/* ==================================== */
/* profile.html?uid=OTHER — public portfolio view */

import { user, db } from "./core.js";
import { lockBodyScroll, unlockBodyScroll } from "./body-scroll-lock.js";
import {
    doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { listPropertyListingsForOwner } from "../collections.js";
import { filterIdsInRadius, getPinLngLat, getRadiusKm } from "../market-map.js";

const params = new URLSearchParams(location.search);
const visitUid = params.get("uid");

export const isVisiting = !!(visitUid && user?.uid && visitUid !== user.uid);
// Debug: if someone lands with ?uid= but equal to self, treat as own profile
if (visitUid && user?.uid && visitUid === user.uid) {
  // strip redundant query so we don't stay in weird state
  history.replaceState(null, "", "profile.html");
}
export const profileUid = isVisiting ? visitUid : user?.uid;

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function money(n) {
    if (n == null || n === "" || Number.isNaN(Number(n))) return null;
    return "₱" + Number(n).toLocaleString();
}

async function isBlockedEitherWay(a, b) {
    if (!a || !b) return false;
    try {
        if ((await getDoc(doc(db, "users", a, "blocked", b))).exists()) return true;
        if ((await getDoc(doc(db, "users", b, "blocked", a))).exists()) return true;
    } catch (_) {}
    return false;
}

function openModal({ title, bodyHTML, submitLabel = "Submit", onSubmit }) {
    let modal = document.getElementById("visitor-action-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "visitor-action-modal";
        modal.className = "visitor-modal";
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="visitor-modal-backdrop" data-close></div>
      <div class="visitor-modal-panel">
        <header class="visitor-modal-head">
          <h2>${escapeHtml(title)}</h2>
          <button type="button" class="visitor-modal-close" data-close>&times;</button>
        </header>
        <form id="visitor-action-form" class="visitor-modal-body">
          ${bodyHTML}
          <button type="submit" class="primary-btn visitor-submit">${escapeHtml(submitLabel)}</button>
        </form>
      </div>`;
    modal.classList.add("active");
    lockBodyScroll();
    const close = () => { modal.classList.remove("active"); unlockBodyScroll(); };
    modal.querySelectorAll("[data-close]").forEach(el => { el.onclick = close; });
    modal.querySelector("#visitor-action-form").onsubmit = async (e) => {
        e.preventDefault();
        const btn = modal.querySelector(".visitor-submit");
        if (btn?.disabled) return;
        btn.disabled = true;
        btn.textContent = "Sending…";
        try {
            await onSubmit(new FormData(e.target));
            close();
        } catch (err) {
            alert(err.message || "Could not submit.");
            btn.disabled = false;
            btn.textContent = submitLabel;
        }
    };
}

function spamKey(kind, targetUid) {
    return `hf_visitor_${kind}_${targetUid}`;
}
function canAct(kind, targetUid, cooldownMs = 12 * 60 * 60 * 1000) {
    try {
        const raw = localStorage.getItem(spamKey(kind, targetUid));
        if (!raw) return true;
        return Date.now() - Number(raw) > cooldownMs;
    } catch (_) { return true; }
}
function markActed(kind, targetUid) {
    try { localStorage.setItem(spamKey(kind, targetUid), String(Date.now())); } catch (_) {}
}

async function loadVisitorView() {
    if (!isVisiting || !visitUid) return;

    document.body.classList.add("visitor-mode");
    document.title = "Profile · HomeFinder";

    // Hide owner-only chrome / edit tools
    document.querySelectorAll(
        "#settings-btn, #settings-dropdown, #notif-btn, #notif-dropdown, " +
        ".avatar-edit, #boost-btn, #tier-chip, #header-tier-chip, " +
        "[data-tab='listing'], [data-tab='messages'], [data-tab='contracts'], " +
        "[data-tab='wanted'], [data-tab='saved'], [data-tab='saved-wanted'], " +
        "[data-tab='reviews'], " +
        "#panel-listing, #panel-messages, #panel-contracts, #panel-edit-fields, " +
        "#panel-wanted, #panel-saved, #panel-saved-wanted, #panel-reviews"
    ).forEach((el) => { if (el) el.style.display = "none"; });

    // Visitor: Portfolio only (no Property / listing tabs)
    document.querySelectorAll(".profile-tab").forEach((tab) => {
        const t = tab.dataset.tab;
        const allow = t === "perks";
        tab.style.display = allow ? "" : "none";
        if (t === "perks") {
            tab.innerHTML = `<i class='bx bx-user'></i> Portfolio`;
            tab.classList.add("active");
        }
    });
    document.querySelectorAll("#panel-properties-view, [data-tab='properties-view']").forEach((el) => {
        if (el) el.style.display = "none";
    });

    if (await isBlockedEitherWay(user.uid, visitUid)) {
        document.body.innerHTML = `
          <div class="visitor-blocked-page">
            <h2>Profile unavailable</h2>
            <p>You can’t view this profile because of a block.</p>
            <a class="primary-btn" href="market.html">Back to marketplace</a>
          </div>`;
        return;
    }

    let data = {};
    try {
        const snap = await getDoc(doc(db, "publicProfiles", visitUid));
        if (!snap.exists()) {
            document.body.innerHTML = `<div class="visitor-blocked-page"><h2>User not found</h2><a href="market.html">Back</a></div>`;
            return;
        }
        data = snap.data();
    } catch (err) {
        console.error(err);
        return;
    }

    const showBasic = data.searchable !== false;
    const showEmail = Boolean(data.publicEmail);
    const showPhone = Boolean(data.publicPhone);
    const role = canonicalRoleFromData(data, "seeker") || "seeker";

    const displayName = showBasic
        ? (`${data.firstName || ""} ${data.surname || data.lastName || ""}`.trim() || "HomeFinder user")
        : "Private profile";

    const nameEl = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");
    const typeEl = document.getElementById("profile-account-type");
    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) {
        const parts = [];
        if (showBasic && showEmail && data.publicEmail) parts.push(data.publicEmail);
        emailEl.textContent = parts.join(" · ") || (showBasic ? "Contact hidden by user" : "");
    }
    if (typeEl) typeEl.textContent = showBasic ? role.replace(/_/g, " ").toUpperCase() : "PRIVATE";

    if (showBasic && data.avatarUrl) {
        try {
            const { applyAvatarToDom } = await import("./avatar-picker.js");
            applyAvatarToDom?.(data.avatarUrl);
        } catch (_) {}
    }

    // Visitor action header: Report · Rate · Block
    injectVisitorActions(visitUid, displayName);
    paintVisitorHeaderBadges(data);
    if (role === "broker" || role === "agent") {
        try {
            const { bootBrokerAssistsVisitor } = await import("./broker-assists.js");
            await bootBrokerAssistsVisitor(visitUid);
        } catch (e) {
            console.warn("visitor assists", e);
        }
    }


    // Build public portfolio body inside perks panel
    const host = document.getElementById("panel-perks") || document.querySelector(".profile-panel");
    if (!host) return;

    // Clear gamified owner UI for visitors — replace with public sections
    host.innerHTML = "";
    host.classList.add("visitor-portfolio");

    // --- Details (privacy-aware) ---
    host.insertAdjacentHTML("beforeend", `
      <section class="visitor-section panel-card">
        <h3><i class="bx bx-id-card"></i> About</h3>
        <div class="visitor-about">
          <div><span class="lbl">Name</span><strong>${escapeHtml(displayName)}</strong></div>
          <div><span class="lbl">Role</span><strong>${showBasic ? escapeHtml(role) : "Hidden"}</strong></div>
          ${showBasic && showEmail && data.publicEmail ? `<div><span class="lbl">Email</span><strong>${escapeHtml(data.publicEmail)}</strong></div>` : ""}
          ${showBasic && showPhone && data.publicPhone ? `<div><span class="lbl">Phone</span><strong>${escapeHtml(data.publicPhone)}</strong></div>` : ""}
          ${showBasic && data.publicCity ? `<div><span class="lbl">City</span><strong>${escapeHtml(data.publicCity)}</strong></div>` : ""}
          <div class="visitor-badges-row" id="visitor-badges"></div>
        </div>
      </section>
    `);

    const badges = document.getElementById("visitor-badges");
    if (badges && showBasic) {
        const chips = [];
        if ((data.idVerification?.status === "verified" || data.idVerification?.status === "approved")) chips.push(`<span class="v-chip v-verified">Verified</span>`);
        if ((data.brokerLicense?.status === "verified" || data.brokerLicense?.status === "approved")) chips.push(`<span class="v-chip v-licensed">Licensed / PRC</span>`);
        const tier = data.tierIndex ?? 0;
        chips.push(`<span class="v-chip">Tier ${tier}</span>`);
        badges.innerHTML = chips.join("");
    }

    // --- Visitor guide (interactive, collapsible) ---
    host.insertAdjacentHTML("beforeend", buildVisitorGuideHtml());
    bindVisitorGuide();

    // --- Active listings (portfolio + optional radius relevance) ---
    const listSec = document.createElement("section");
    listSec.className = "visitor-section panel-card";
    listSec.id = "visitor-listings-section";
    listSec.innerHTML = `
      <div class="visitor-listings-head">
        <h3><i class="bx bx-building-house"></i> Active listings</h3>
        <p class="visitor-radius-chip field-hint" id="visitor-radius-chip" hidden></p>
      </div>
      <div class="visitor-feed-segments" id="visitor-listing-segments" hidden role="tablist">
        <button type="button" class="visitor-seg is-active" data-seg="near" role="tab" aria-selected="true">Near you</button>
        <button type="button" class="visitor-seg" data-seg="all" role="tab" aria-selected="false">All active</button>
      </div>
      <div id="visitor-listings-mount" class="visitor-card-grid"></div>`;
    host.appendChild(listSec);
    await fillListings(visitUid, role, listSec);

    // --- Wanted (boost 5 / package 5 gate for viewing others' wanted as broker/owner visitor context) ---
    // Rule: show wanted posts of the profile owner only if THEY have seeking boost 5
    // OR visitor is staff. Otherwise placeholder "Unlocks with Seeking Boost 5".
    const wantedSec = document.createElement("section");
    wantedSec.className = "visitor-section panel-card";
    wantedSec.innerHTML = `<h3><i class="bx bx-search-alt"></i> Wanted posts</h3><div id="visitor-wanted-mount"></div>`;
    host.appendChild(wantedSec);
    await fillWanted(visitUid, data, document.getElementById("visitor-wanted-mount"));

    // --- Ratings & reviews (horizontal) ---
    const revSec = document.createElement("section");
    revSec.className = "visitor-section panel-card";
    revSec.innerHTML = `<h3><i class="bx bx-star"></i> Ratings & reviews</h3>
      <div id="visitor-rating-summary" class="visitor-rating-summary"></div>
      <div id="visitor-reviews-rail" class="visitor-reviews-rail"></div>`;
    host.appendChild(revSec);
    await fillReviews(visitUid);
}


function paintVisitorHeaderBadges(data) {
    const host = document.getElementById("profile-badges");
    if (!host) return;
    const showBasic = data.searchable !== false;
    if (!showBasic) {
        host.innerHTML = "";
        return;
    }
    const role = canonicalRoleFromData(data, "seeker") || "seeker";
    const roleTitle = role === "owner" ? "Owner" : role === "broker" ? "Broker" : "Seeker";
    const roleIcon = role === "owner" ? "bx-home-alt" : role === "broker" ? "bx-briefcase" : "bx-user";
    const chips = [];
    chips.push(`<span class="trust-chip role-${role} hf-tip" data-tip="${roleTitle}" data-tip-desc="Account type">
      <i class="bx ${roleIcon}"></i><span class="trust-chip-label">${roleTitle}</span>
    </span>`);
    if (data.verifiedBadge === true) {
        chips.push(`<span class="trust-chip trust-verified hf-tip" data-tip="Verified ID" data-tip-desc="Staff-approved government ID">
          <i class="bx bx-check-shield"></i><span class="trust-chip-label">Verified</span>
        </span>`);
    }
    if (role === "broker" && data.licensedBadge === true) {
        chips.push(`<span class="trust-chip trust-licensed hf-tip" data-tip="Licensed" data-tip-desc="PRC license approved">
          <i class="bx bx-id-card"></i><span class="trust-chip-label">Licensed</span>
        </span>`);
    }
    host.innerHTML = chips.join("");
    host.classList.add("profile-trust-badges", "trust-chip-row");
}

function injectVisitorActions(targetUid, displayName) {
    let bar = document.getElementById("visitor-action-bar");
    if (!bar) {
        bar = document.createElement("div");
        bar.id = "visitor-action-bar";
        bar.className = "visitor-action-bar";
        const header = document.getElementById("profile-header") || document.body;
        header.appendChild(bar);
    }
    bar.innerHTML = `
      <div class="visitor-actions" role="group" aria-label="Profile actions">
        <button type="button" class="v-act v-act-message" data-v="message" title="Message"><i class="bx bx-message-rounded-dots"></i> <span class="v-label">Message</span></button>
        <button type="button" class="v-act v-act-report" data-v="report" title="Report user"><i class="bx bx-flag"></i> <span class="v-label">Report</span></button>
        <button type="button" class="v-act v-act-rate" data-v="rate" title="Rate user"><i class="bx bx-star"></i> <span class="v-label">Rate</span></button>
        <button type="button" class="v-act v-act-block" data-v="block" title="Block user"><i class="bx bx-block"></i> <span class="v-label">Block</span></button>
        <a class="v-act v-act-back" href="profile.html"><i class="bx bx-arrow-back"></i> <span class="v-label">My profile</span></a>
      </div>
    `;

            bar.querySelector('[data-v="message"]').onclick = () => {
        // Do not import messages.js on the visit shell (cache/parse issues + panel hidden).
        // Own profile bootMessages opens the P2P thread.
        try {
            sessionStorage.setItem("hf_pending_msg_uid", targetUid);
            sessionStorage.setItem("hf_open_messages", "1");
            window.location.href = "profile.html#messages";
        } catch (e) {
            alert("Could not open chat: " + (e.message || e));
        }
    };



    bar.querySelector('[data-v="report"]').onclick = () => {
        if (!canAct("report", targetUid)) {
            alert("You already sent a report for this user recently. Please wait before reporting again.");
            return;
        }
        openModal({
            title: "Report user",
            submitLabel: "Send report",
            bodyHTML: `
              <p class="field-hint">Reports go to staff. Misuse may affect your account.</p>
              <label>Reason
                <select name="reason" required>
                  <option value="">Select…</option>
                  <option value="hacking">Hacking / account takeover attempt</option>
                  <option value="fake_account">Fake account</option>
                  <option value="multiple_accounts">Multiple accounts abuse</option>
                  <option value="fake_details">Fake details / documents</option>
                  <option value="scam">Scam / fraud</option>
                  <option value="harassment">Harassment</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>Details (optional)
                <textarea name="details" rows="3" maxlength="800" placeholder="What happened?"></textarea>
              </label>
            `,
            onSubmit: async (fd) => {
                await addDoc(collection(db, "userReports"), {
                    reporterId: user.uid,
                    targetUid,
                    reason: fd.get("reason"),
                    details: String(fd.get("details") || "").slice(0, 800),
                    status: "pending",
                    createdAt: serverTimestamp()
                });
                markActed("report", targetUid);
                alert("Report submitted. Staff will review.");
            }
        });
    };

    bar.querySelector('[data-v="rate"]').onclick = () => {
        if (!canAct("rate", targetUid, 24 * 60 * 60 * 1000)) {
            alert("You already rated this user recently.");
            return;
        }
        openModal({
            title: `Rate ${displayName}`,
            submitLabel: "Submit rating",
            bodyHTML: `
              <label>Rating
                <select name="rating" required>
                  <option value="5">5 — Excellent</option>
                  <option value="4">4 — Good</option>
                  <option value="3">3 — Okay</option>
                  <option value="2">2 — Poor</option>
                  <option value="1">1 — Bad</option>
                </select>
              </label>
              <label>Comment (optional)
                <textarea name="comment" rows="3" maxlength="500" placeholder="Share a short experience…"></textarea>
              </label>
            `,
            onSubmit: async (fd) => {
                const rating = Number(fd.get("rating"));
                await addDoc(collection(db, "userRatings"), {
                    fromUid: user.uid,
                    toUid: targetUid,
                    rating,
                    comment: String(fd.get("comment") || "").slice(0, 500),
                    createdAt: serverTimestamp()
                });
                markActed("rate", targetUid);
                alert("Thanks for your rating.");
                fillReviews(targetUid);
            }
        });
    };

    bar.querySelector('[data-v="block"]').onclick = () => {
        const ok = confirm(
            `Block ${displayName}?\n\nYou won’t see each other’s profiles. You can only undo this from support/staff later.`
        );
        if (!ok) return;
        (async () => {
            try {
                await setDoc(doc(db, "users", user.uid, "blocked", targetUid), {
                    blockedAt: serverTimestamp(),
                    targetUid
                });
                alert("User blocked.");
                location.href = "market.html";
            } catch (e) {
                alert("Could not block: " + (e.message || e));
            }
        })();
    };
}

async function fillListings(uid, role, sectionEl) {
    const mount = document.getElementById("visitor-listings-mount");
    if (!mount) return;

    const pin = typeof getPinLngLat === "function" ? getPinLngLat() : null;
    const radiusKm = typeof getRadiusKm === "function" ? getRadiusKm() : null;
    const chip = document.getElementById("visitor-radius-chip");
    const segs = document.getElementById("visitor-listing-segments");

    try {
        const rows = await listPropertyListingsForOwner(db, uid, { collection, query, where, getDocs });
        let docs = rows.map((r) => ({ id: r.id, data: r.data, ...r.data }));
        docs = docs.filter((p) => {
            const st = String(p.status || "active").toLowerCase();
            return st === "active" || st === "listed" || st === "published" || st === "approved";
        });

        if (!docs.length) {
            if (role === "owner") {
                sectionEl.style.display = "none";
            } else {
                mount.innerHTML = `<p class="visitor-placeholder">No active listings on this profile yet.</p>`;
            }
            if (segs) segs.hidden = true;
            if (chip) chip.hidden = true;
            return;
        }

        sectionEl.style.display = "";

        /* Partition by visitor Market pin radius (relevance — not a security boundary) */
        const forRadius = docs.map((p) => ({ id: p.id, data: p }));
        const inIds = pin && typeof filterIdsInRadius === "function" ? filterIdsInRadius(forRadius) : null;
        const near = [];
        const far = [];
        const noCoords = [];
        for (const p of docs) {
            const lat = Number(p.lat ?? p.latitude ?? p.location?.lat);
            const lng = Number(p.lng ?? p.longitude ?? p.location?.lng);
            const has = Number.isFinite(lat) && Number.isFinite(lng);
            if (!pin || inIds === null) {
                far.push(p);
            } else if (!has) {
                noCoords.push({ ...p, _noMapPin: true });
            } else if (inIds.has(p.id)) {
                near.push(p);
            } else {
                far.push({ ...p, _outsideRadius: true });
            }
        }

        if (chip) {
            if (pin && radiusKm != null) {
                chip.hidden = false;
                chip.innerHTML = `<i class="bx bx-map-pin"></i> Using your Market pin · ~${Number(radiusKm).toFixed(1)} km radius`;
            } else {
                chip.hidden = false;
                chip.innerHTML = `<i class="bx bx-map-pin"></i> No Market pin yet — <a href="market.html">set one on Market</a> to highlight nearby listings`;
            }
        }

        const hasPin = !!(pin && inIds !== null);
        if (segs) {
            segs.hidden = !hasPin;
        }

        function cardHtml(p) {
            const price = p.per_bed_price
                ? `₱${Number(p.per_bed_price).toLocaleString()}/bed`
                : money(p.monthly_price)
                  ? `${money(p.monthly_price)}/mo`
                  : "";
            let badge = "";
            if (p._outsideRadius) {
                badge = `<span class="visitor-card-badge is-far">Outside your radius</span>`;
            } else if (p._noMapPin) {
                badge = `<span class="visitor-card-badge is-nocoords">No map pin</span>`;
            } else if (hasPin && near.some((n) => n.id === p.id)) {
                badge = `<span class="visitor-card-badge is-near">Near you</span>`;
            }
            return `<article class="visitor-listing-card${p._outsideRadius ? " is-far" : ""}${p._noMapPin ? " is-unlocated" : ""}">
              ${badge}
              <strong>${escapeHtml(p.listing_title || p.title || "Listing")}</strong>
              <div class="field-hint">${escapeHtml(p.address || p.city || "")}</div>
              <div class="field-hint">${price}</div>
              <a class="visitor-card-link" href="market.html">View on Market</a>
            </article>`;
        }

        function render(seg) {
            let list;
            if (!hasPin || seg === "all") {
                list = near.concat(noCoords).concat(far);
            } else {
                list = near.concat(noCoords); // soft-include unlocated in Near you
            }
            if (!list.length) {
                if (seg === "near" && hasPin) {
                    mount.innerHTML = `<p class="visitor-placeholder"><strong>None of their active listings are in your current radius</strong>
                      <span>Try <button type="button" class="linkish" data-visitor-seg="all">All active</button> or <a href="market.html">adjust your pin on Market</a>.</span></p>`;
                    mount.querySelector("[data-visitor-seg]")?.addEventListener("click", () => {
                        segs?.querySelector('[data-seg="all"]')?.click();
                    });
                } else {
                    mount.innerHTML = `<p class="visitor-placeholder">No active listings to show.</p>`;
                }
                return;
            }
            mount.innerHTML = list.map(cardHtml).join("");
        }

        let activeSeg = hasPin ? "near" : "all";
        try {
            const saved = sessionStorage.getItem("hf_visitor_listing_seg");
            if (saved === "near" || saved === "all") activeSeg = hasPin ? saved : "all";
        } catch (_) {}

        segs?.querySelectorAll(".visitor-seg").forEach((btn) => {
            const on = btn.getAttribute("data-seg") === activeSeg;
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
            btn.addEventListener("click", () => {
                activeSeg = btn.getAttribute("data-seg") || "all";
                try { sessionStorage.setItem("hf_visitor_listing_seg", activeSeg); } catch (_) {}
                segs.querySelectorAll(".visitor-seg").forEach((b) => {
                    const o = b.getAttribute("data-seg") === activeSeg;
                    b.classList.toggle("is-active", o);
                    b.setAttribute("aria-selected", o ? "true" : "false");
                });
                render(activeSeg);
            });
        });

        render(activeSeg);
    } catch (e) {
        console.warn("visitor listings", e);
        mount.innerHTML = `<p class="visitor-placeholder">Listings unavailable.</p>`;
    }
}

function buildVisitorGuideHtml() {
    let open = true;
    try {
        open = localStorage.getItem("hf_visitor_guide_open") !== "0";
    } catch (_) {}
    return `
      <section class="visitor-section panel-card visitor-guide" id="visitor-guide">
        <button type="button" class="visitor-guide-toggle" id="visitor-guide-toggle" aria-expanded="${open ? "true" : "false"}">
          <span><i class="bx bx-info-circle"></i> Visitor guide</span>
          <i class="bx ${open ? "bx-chevron-up" : "bx-chevron-down"}" id="visitor-guide-chevron"></i>
        </button>
        <div class="visitor-guide-body" id="visitor-guide-body" ${open ? "" : "hidden"}>
          <ol class="visitor-guide-steps">
            <li>You’re viewing <strong>someone else’s portfolio</strong> — not your edit tools.</li>
            <li>Only <strong>active</strong> listings appear here (closed/deleted stay private).</li>
            <li><strong>Near you</strong> uses your <a href="market.html">Market search pin</a> and tier radius — same discovery geometry as Market.</li>
            <li><strong>Message / Report / Rate / Block</strong> are above — Message is the primary action.</li>
            <li>Full map search and filters live on <a href="market.html">Market</a>, not on this profile.</li>
          </ol>
        </div>
      </section>`;
}

function bindVisitorGuide() {
    const btn = document.getElementById("visitor-guide-toggle");
    const body = document.getElementById("visitor-guide-body");
    const chev = document.getElementById("visitor-guide-chevron");
    if (!btn || !body) return;
    btn.addEventListener("click", () => {
        const open = body.hasAttribute("hidden");
        if (open) body.removeAttribute("hidden");
        else body.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        if (chev) {
            chev.classList.toggle("bx-chevron-up", open);
            chev.classList.toggle("bx-chevron-down", !open);
        }
        try { localStorage.setItem("hf_visitor_guide_open", open ? "1" : "0"); } catch (_) {}
    });
}

async function fillWanted(uid, userData, mount) {
    if (!mount) return;
    const boost = Number(
        userData.seekerBoostPackageId ||
        userData.activeSeekerBoost ||
        userData.boosts?.seekerPackageId ||
        0
    );
    const role = canonicalRoleFromData(userData) || "seeker";
    // Paywall removed (SoT): wanted posts not gated by boost package.
    const boostNote = "";
    try {
        let docs = [];
        try {
            const snap = await getDocs(query(collection(db, "wantedListings"), where("seekerId", "==", uid), limit(20)));
            docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch {
            try {
                const snap = await getDocs(query(collection(db, "wantedListings"), where("uid", "==", uid), limit(20)));
                docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (_) {}
        }
        if (!docs.length) {
            mount.innerHTML = `<p class="visitor-placeholder">No wanted posts yet.</p>`;
            return;
        }
        mount.innerHTML = `<div class="visitor-card-grid">${docs.map(w => `
          <article class="visitor-listing-card">
            <strong>${escapeHtml(w.title || "Wanted")}</strong>
            <div class="field-hint">${escapeHtml(w.area || w.location || "")}</div>
            <div class="field-hint">${w.budget ? "Budget " + money(w.budget) : ""}</div>
          </article>`).join("")}</div>`;
    } catch (_) {
        mount.innerHTML = `<p class="visitor-placeholder">Wanted posts unavailable.</p>`;
    }
}

async function fillReviews(uid) {
    const summary = document.getElementById("visitor-rating-summary");
    const rail = document.getElementById("visitor-reviews-rail");
    if (!rail) return;
    try {
        const snap = await getDocs(query(collection(db, "userRatings"), where("toUid", "==", uid), limit(40)));
        const rows = snap.docs.map(d => d.data());
        if (!rows.length) {
            if (summary) summary.textContent = "No ratings yet.";
            rail.innerHTML = `<p class="visitor-placeholder">Be the first to rate this user.</p>`;
            return;
        }
        const avg = rows.reduce((s, r) => s + Number(r.rating || 0), 0) / rows.length;
        if (summary) {
            summary.innerHTML = `<strong>${avg.toFixed(1)}</strong> · ${rows.length} rating${rows.length > 1 ? "s" : ""}`;
        }
        rail.innerHTML = rows.map(r => `
          <article class="visitor-review-card">
            <div class="stars">${"★".repeat(Math.round(Number(r.rating) || 0))}${"☆".repeat(5 - Math.round(Number(r.rating) || 0))}</div>
            <p>${escapeHtml(r.comment || "No comment")}</p>
          </article>
        `).join("");
    } catch (_) {
        if (summary) summary.textContent = "Ratings unavailable.";
        rail.innerHTML = "";
    }
}

loadVisitorView().catch((e) => {
  console.error("visitor profile failed", e);
  const host = document.getElementById("panel-perks");
  if (host) host.insertAdjacentHTML("afterbegin",
    `<div class="panel-card"><p>Could not load this profile: ${e.message || e}</p>
     <a href="profile.html">Back to my profile</a></div>`);
});