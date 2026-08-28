/* ==================================== */
/*  NOTIFICATIONS (realtime)           */
/* ==================================== */

import { user, db } from "./core.js";
import { app } from "../firebase.js";
import {
    collection, query, limit, onSnapshot, getDocs,
    doc, updateDoc
, deleteDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFunctions, httpsCallable }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const functions = getFunctions(app);
const confirmContractFn = httpsCallable(functions, "confirmContract");

// Genuine cross-user stored XSS, found reviewing this pass: item.message
// (and item.reason) come straight from Firestore and get inserted into
// innerHTML in renderItems() below. Most writers just compose a fixed
// string, but contract-chat.js's proposeContract() embeds a property's
// listing_title (owner-controlled free text, only type/length-checked
// server-side, not content-checked) directly into `message`, and that
// notification is delivered into the OTHER party's (the seeker's or
// broker's) notification bell -- so a malicious listing_title executes
// in a DIFFERENT user's session, not just the owner's own. Several
// other writers (support-tickets.js, support-ticket.js) have the same
// shape with a ticket subject, though those are self-XSS only (the
// message goes back to the same user who supplied the text).
//
// Fixed at this single render choke point rather than patching every
// message-composing call site individually -- itemLabel() below now
// escapes item.message/item.reason wherever they're substituted in,
// while the hardcoded fallback strings (which intentionally use
// <strong> for real formatting) stay as literal, trusted markup.
function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const bellBtn = document.getElementById("notif-btn") || document.getElementById("notif-bell-btn");
const dropdown = document.getElementById("notif-dropdown");
const badge = document.getElementById("notif-badge");
let emptyMsg = document.getElementById("notif-empty");
let list = document.getElementById("notif-list");
if (!list && dropdown) {
    list = document.createElement("div");
    list.id = "notif-list";
    list.className = "notif-list";
    list.setAttribute("data-asset", "profile-notif-list");
    dropdown.appendChild(list);
}
if (!emptyMsg && dropdown) {
    emptyMsg = document.createElement("p");
    emptyMsg.id = "notif-empty";
    emptyMsg.className = "notif-empty field-hint is-hidden";
    emptyMsg.textContent = "No notifications yet.";
    dropdown.appendChild(emptyMsg);
}

let _notifUnsub = null;
let _notifPaused = false;
let _lastUnread = 0;
let _browserPermAsked = false;

if (bellBtn && dropdown) {
    bellBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (dropdown.parentElement !== document.body) {
            document.body.appendChild(dropdown);
        }
        const rect = bellBtn.getBoundingClientRect();
        dropdown.style.setProperty("--profile-notif-top", `${Math.round(rect.bottom + 8)}px`);
        dropdown.style.setProperty("--profile-notif-right", `${Math.round(window.innerWidth - rect.right)}px`);
        dropdown.classList.add("profile-notif-anchored");
        dropdown.classList.toggle("active");
        maybeRequestBrowserPermission();
    });
    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });
}

function maybeRequestBrowserPermission() {
    if (_browserPermAsked || !("Notification" in window)) return;
    _browserPermAsked = true;
    if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
    }
}

function pushBrowserNotify(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") return;
    try {
        new Notification(title, { body, icon: "/assets/images/logo-homefinder.png" });
    } catch (_) {}
}

function notifIcon(type) {
    const t = type || "";
    if (t.startsWith("verification")) return "bx-shield-quarter";
    if (t.startsWith("boost")) return "bx-rocket";
    if (t.startsWith("subscription")) return "bx-crown";
    if (t.includes("contract")) return "bx-file";
    if (t === "listing_match") return itemStatusIcon(t);
    if (t === "commendation") return "bx-like";
    if (t === "report_update") return "bx-flag";
    if (t === "profile_cooldown") return "bx-time-five";
    if (t.includes("support")) return "bx-headphone";
    return "bx-bell";
}

function itemStatusIcon(type) {
    return type === "listing_match" ? "bx-map-pin" : "bx-bell";
}

function itemLabel(item) {
    const t = item.type || "";
    // Strip any HTML from stored messages, then escape — prevents visible <strong> tags
    const raw = item.message ? String(item.message).replace(/<[^>]+>/g, "") : "";
    const msg = raw ? escapeHtml(raw) : null;
    if (t === "verification_pending") return msg || "Your ID was submitted and is <strong>pending</strong> review.";
    if (t === "verification_approved") return msg || "Verification <strong>approved</strong>. Badge is active.";
    if (t === "verification_rejected") return msg || ("Verification <strong>rejected</strong>." + (item.reason ? ` ${escapeHtml(item.reason)}` : ""));
    if (t === "boost_order_pending") return msg || "Your boost order is <strong>pending</strong> verification (~12 hours).";
    if (t === "boost_order_approved") return msg || "Boost order <strong>approved</strong> — perks are active.";
    if (t === "boost_order_rejected") return msg || "Boost order was <strong>rejected</strong>.";
    if (t === "boost_activated") return msg || "Your Boost payment was verified and the Boost is active.";
    if (t === "boost_payment_received") return msg || "Your Boost payment was received by PayPal and is being verified.";
    if (t === "subscription_pending") return msg || "Your subscription was approved in PayPal and is being verified.";
    if (t === "subscription_activated") return msg || "Subscription active — your premium benefits are now enabled.";
    if (t === "subscription_payment_received") return msg || "Subscription payment received successfully.";
    if (t === "subscription_payment_failed") return msg || "Subscription payment failed. Resolve the issue to keep premium access active.";
    if (t === "subscription_cancelled") return msg || "Your subscription was cancelled.";
    if (t === "subscription_expired") return msg || "Your subscription has expired.";
    if (t === "subscription_suspended") return msg || "Your subscription is suspended until payment is resolved.";
    if (t === "contract_proposed") return msg || "New <strong>contract proposal</strong> — open Messages to respond.";
    if (t === "contract_accepted") return msg || "Your contract proposal was <strong>accepted</strong>.";
    if (t === "contract_rejected") return msg || "Your contract proposal was <strong>rejected</strong>.";
    if (t === "listing_match") return msg || "A new listing may match your wanted criteria.";
    if (t === "support_reply") return msg || "Support replied to your ticket.";
    if (t === "contract_confirm" || item.contractId) return msg || "Please confirm whether a contract completed.";
    return msg || "You have a new notification.";
}

function renderItems(allItems) {
    if (!badge || !list || !emptyMsg) return;
    const pinned = allItems.filter(i => i.pinned && i.status !== "resolved");
    let items = allItems.filter(i => !i.read && i.status !== "resolved" && !i.dismissed);
    // Always keep saved (pinned) notifications visible
    const seen = new Set(items.map(i => i.id));
    for (const p of pinned) {
        if (!seen.has(p.id)) { items.unshift(p); seen.add(p.id); }
    }
    if (!items.length) items = allItems.filter(i => !i.dismissed).slice(0, 12);

    const unread = allItems.filter(i => !i.read && i.status !== "resolved");
    if (unread.length === 0 && allItems.length === 0) {
        badge.classList.add("is-hidden"); badge.style.display = "none";
        emptyMsg.classList.remove("is-hidden"); 
        emptyMsg.textContent = "You're all caught up.";
        list.innerHTML = "";
        return;
    }

    if (unread.length) {
        badge.classList.remove("is-hidden"); badge.style.display = "flex";
        badge.textContent = unread.length > 9 ? "9+" : String(unread.length);
        if (unread.length > _lastUnread) {
            const newest = unread[0];
            pushBrowserNotify("HomeFinder", (newest.message || "New notification").replace(/<[^>]+>/g, ""));
        }
    } else {
        badge.classList.add("is-hidden"); badge.style.display = "none";
    }
    _lastUnread = unread.length;
    emptyMsg.classList.toggle("is-hidden", !!items.length); 

    list.innerHTML = items.map(item => {
        const isContract = item.type === "contract_confirm" || (!!item.contractId && !String(item.type || "").startsWith("verification") && !String(item.type || "").startsWith("boost_") && item.type !== "listing_match");
        const isStaleListingMatch = item.type === "listing_match" && item.status === "stale";
        const statusChip = item.status ? `<span class="notif-status notif-status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>` : "";
        const unreadCls = item.read ? "" : " is-unread";
        return `
        <article class="notif-item notif-item-card${unreadCls}" data-id="${item.id}">
            <div class="notif-item-top">
              <span class="notif-item-icon" aria-hidden="true"><i class="bx ${notifIcon(item.type)}"></i></span>
              <div class="notif-item-body">
                <p>${isStaleListingMatch ? `${itemLabel(item)} <span class="notif-stale-note">This listing is no longer available for discovery.</span>` : itemLabel(item)}</p>
                <div class="notif-item-meta">${statusChip || (item.pinned ? "Saved" : "HomeFinder")}</div>
              </div>
            </div>
            <div class="notif-item-actions">
              ${isContract ? `<button type="button" class="notif-btn-primary notif-confirm-btn" data-contract="${item.contractId || ""}">Confirm</button>` : ""}
              <button type="button" class="notif-star-btn ${item.pinned ? "is-starred" : ""}" data-id="${item.id}" title="${item.pinned ? "Unsave" : "Save"}" aria-label="${item.pinned ? "Unsave notification" : "Save notification"}">
                <i class="bx ${item.pinned ? "bxs-star" : "bx-star"}"></i> ${item.pinned ? "Saved" : "Save"}
              </button>
              <button type="button" class="notif-delete-btn" data-id="${item.id}" title="Delete" aria-label="Delete notification">
                <i class="bx bx-trash"></i> Dismiss
              </button>
            </div>
        </article>`;
    }).join("");

    list.querySelectorAll(".notif-confirm-btn").forEach(btn => {
        btn.onclick = async () => {
            try {
                await confirmContractFn({ contractId: btn.dataset.contract });
                await updateDoc(doc(db, "notifications", user.uid, "items", btn.closest(".notif-item").dataset.id), { read: true });
            } catch (e) { console.error(e); }
        };
    });
    list.querySelectorAll(".notif-delete-btn").forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            try {
                await deleteDoc(doc(db, "notifications", user.uid, "items", btn.dataset.id));
            } catch (err) {
                try {
                    await updateDoc(doc(db, "notifications", user.uid, "items", btn.dataset.id), { read: true, dismissed: true });
                } catch (e2) { console.warn("notif delete failed", e2); }
            }
        };
    });
    list.querySelectorAll(".notif-star-btn").forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const starred = btn.classList.contains("is-starred");
            try {
                await updateDoc(doc(db, "notifications", user.uid, "items", id), {
                    pinned: !starred,
                    read: true
                });
                btn.classList.toggle("is-starred", !starred);
                const icon = btn.querySelector("i");
                if (icon) icon.className = !starred ? "bx bxs-star" : "bx bx-star";
                btn.title = !starred ? "Unsave" : "Save";
            } catch (err) {
                console.warn("notif star failed", err);
            }
        };
    });
}

/** Auto-remove notifications older than 30 days (client-side cleanup). */
async function purgeOldNotifications(items) {
    if (!user?.uid) return;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const item of items) {
        const raw = item.createdAt;
        let t = 0;
        if (typeof raw === "string") t = Date.parse(raw) || 0;
        else if (raw?.toMillis) t = raw.toMillis();
        else if (raw?.seconds) t = raw.seconds * 1000;
        if (t && t < cutoff) {
            try { await deleteDoc(doc(db, "notifications", user.uid, "items", item.id)); } catch (_) {}
        }
    }
}


function startListening() {
    if (!user?.uid || _notifPaused) return;
    if (_notifUnsub) return;
    const col = collection(db, "notifications", user.uid, "items");
    const q = query(col, limit(40));
    _notifUnsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
        purgeOldNotifications(items).catch(() => {});
        renderItems(items.filter(i => !i.dismissed));
    }, async (err) => {
        console.warn("notif snapshot failed, one-shot load:", err);
        try {
            const snap = await getDocs(col);
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
            renderItems(items);
        } catch (e2) { console.warn(e2); }
    });
}

export function pauseNotificationListener() {
    _notifPaused = true;
    if (typeof _notifUnsub === "function") {
        try { _notifUnsub(); } catch (_) {}
        _notifUnsub = null;
    }
}

export function resumeNotificationListener() {
    _notifPaused = false;
    startListening();
}

window.__hfStartNotifs = startListening;

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") pauseNotificationListener();
    else resumeNotificationListener();
});
window.addEventListener("offline", pauseNotificationListener);
window.addEventListener("online", resumeNotificationListener);

startListening();
