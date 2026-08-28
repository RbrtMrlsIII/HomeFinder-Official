/* ==================================== */
/*  ADMIN — BOOST ORDERS               */
/* ==================================== */

import { db, staffRole } from "./core.js";
import {
    collection, getDocs, doc, updateDoc, setDoc, getDoc, addDoc,
    query, orderBy, limit, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { BOOST_DURATION_DAYS } from "../payment-config.js";
import { adminConfirm, adminPrompt } from "./prompt.js";

const queueEl = document.getElementById("admin-orders-queue");
const filterEl = document.getElementById("admin-orders-filter");
const refreshBtn = document.getElementById("admin-orders-refresh");
const countEl = document.getElementById("orders-pending-count");

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatPhp(n) {
    return "₱" + Number(n).toFixed(2);
}

async function loadOrders() {
    if (!queueEl) return;
    queueEl.innerHTML = `<p class="admin-loading">Loading orders…</p>`;
    const statusFilter = filterEl?.value || "pending";
    let snap;
    try {
        snap = await getDocs(query(collection(db, "boostOrders"), orderBy("createdAt", "desc"), limit(100)));
    } catch (err) {
        // Fallback without orderBy if index missing
        try {
            snap = await getDocs(collection(db, "boostOrders"));
        } catch (err2) {
            queueEl.innerHTML = `<p class="admin-empty-state">Could not load orders: ${escapeHtml(err2.message || err2)}</p>`;
            return;
        }
    }
    let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    if (statusFilter !== "all") {
        rows = rows.filter(r => (r.status || "pending") === statusFilter);
    }
    const pendingN = snap.docs.filter(d => (d.data().status || "pending") === "pending").length;
    if (countEl) {
        countEl.hidden = pendingN === 0;
        countEl.textContent = String(pendingN);
    }
    if (!rows.length) {
        queueEl.innerHTML = `<p class="admin-empty-state">No orders in this filter.</p>`;
        return;
    }
    queueEl.innerHTML = rows.map(o => `
      <article class="admin-order-card" data-id="${o.id}">
        <div class="admin-order-top">
          <div>
            <strong>${escapeHtml(o.productName || "Boost")}</strong>
            <span class="admin-badge admin-badge-${o.status === "approved" ? "verified" : o.status === "rejected" ? "rejected" : "pending"}">${escapeHtml(o.status || "pending")}</span>
          </div>
          <div class="admin-order-amount">${formatPhp(o.amountPhp || 0)}</div>
        </div>
        <div class="admin-order-meta">
          <div><span class="lbl">User</span> ${escapeHtml(o.email || o.uid)}</div>
          <div><span class="lbl">UID</span> <code>${escapeHtml(o.uid)}</code></div>
          <div><span class="lbl">Kind</span> ${escapeHtml(o.productKind)} ${o.packageId != null ? "#" + o.packageId : ""}</div>
          <div><span class="lbl">Method</span> ${escapeHtml(o.method)}</div>
          <div><span class="lbl">Reference</span> <strong>${escapeHtml(o.reference)}</strong></div>
          <div><span class="lbl">Payer</span> ${escapeHtml(o.payerName || "—")}</div>
          <div><span class="lbl">Submitted</span> ${escapeHtml(o.createdAt || "—")}</div>
          ${o.notes ? `<div><span class="lbl">Notes</span> ${escapeHtml(o.notes)}</div>` : ""}
        </div>
        ${(o.status || "pending") === "pending" && staffRole === "super" ? `
        <div class="admin-order-actions">
          <button type="button" class="admin-btn admin-btn-primary admin-order-approve" data-id="${o.id}">Approve &amp; apply boost</button>
          <button type="button" class="admin-btn admin-btn-ghost admin-order-reject" data-id="${o.id}">Reject</button>
        </div>` : ""}
      </article>
    `).join("");

    queueEl.querySelectorAll(".admin-order-approve").forEach(btn => {
        btn.onclick = () => approveOrder(btn.dataset.id);
    });
    queueEl.querySelectorAll(".admin-order-reject").forEach(btn => {
        btn.onclick = () => rejectOrder(btn.dataset.id);
    });
}


/** Mark related pending-order notifications as read (and optionally superseded). */
async function clearPendingOrderNotifs(uid, orderId) {
    try {
        const col = collection(db, "notifications", uid, "items");
        let snap;
        try {
            snap = await getDocs(query(col, where("orderId", "==", orderId)));
        } catch (_) {
            snap = await getDocs(col);
        }
        const tasks = [];
        snap.docs.forEach((d) => {
            const data = d.data() || {};
            const matchOrder = data.orderId === orderId;
            const matchPendingType = data.type === "boost_order_pending" && (!data.orderId || data.orderId === orderId);
            if (matchOrder || matchPendingType) {
                if (data.read !== true || data.status === "pending") {
                    tasks.push(updateDoc(d.ref, {
                        read: true,
                        status: data.type === "boost_order_pending" ? "resolved" : (data.status || "resolved"),
                        resolvedAt: new Date().toISOString()
                    }));
                }
            }
        });
        await Promise.all(tasks);
    } catch (e) {
        console.warn("clearPendingOrderNotifs", e);
    }
}

async function applyBoostFromOrder(order) {
    const uid = order.uid;
    const ref = doc(db, "boosts", uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    const expires = new Date();
    expires.setDate(expires.getDate() + (order.durationDays || BOOST_DURATION_DAYS || 30));
    const expiresAt = expires.toISOString();

    if (order.productKind === "seeker") {
        data.seeker = {
            active: true,
            package: Number(order.packageId) || 1,
            expiresAt
        };
    } else if (order.productKind === "owner") {
        data.owner = {
            active: true,
            package: Number(order.packageId) || 1,
            expiresAt
        };
    } else if (order.productKind === "extra") {
        const prev = data.extraListings || {};
        data.extraListings = {
            quantity: (Number(prev.quantity) || 0) + 1,
            expiresAt
        };
    }
    data.updatedAt = new Date().toISOString();
    data.updatedFromOrder = order.id || true;
    await setDoc(ref, data, { merge: true });
}

async function notifyUser(uid, message, type, extra = {}) {
    try {
        await addDoc(collection(db, "notifications", uid, "items"), {
            type,
            read: false,
            message,
            createdAt: new Date().toISOString(),
            ...extra
        });
    } catch (e) {
        console.warn("notify failed", e);
    }
}

async function approveOrder(id) {
    if (!(await adminConfirm("Approve this order and apply the boost to the user?", { title: "Approve order", okText: "Approve" }))) return;
    try {
        const oRef = doc(db, "boostOrders", id);
        const oSnap = await getDoc(oRef);
        if (!oSnap.exists()) return alert("Order not found");
        const order = { id, ...oSnap.data() };
        await applyBoostFromOrder(order);
        await updateDoc(oRef, {
            status: "approved",
            reviewedAt: new Date().toISOString(),
            reviewedBy: "admin"
        });
        await clearPendingOrderNotifs(order.uid, id);
        await notifyUser(
            order.uid,
            `Approved: ${order.productName} is now active on your account.`,
            "boost_order_approved",
            { orderId: id, status: "approved" }
        );
        alert("Boost applied and user notified.");
        loadOrders();
    } catch (err) {
        console.error(err);
        alert("Approve failed: " + (err.message || err));
    }
}

async function rejectOrder(id) {
    const reason = await adminPrompt("This reason is shown to the user in their notification.", {
        title: "Rejection reason",
        defaultValue: "Payment could not be verified. Please contact support.",
        placeholder: "Explain why the order was rejected…",
        okText: "Reject order"
    });
    if (reason === null) return;
    try {
        const oRef = doc(db, "boostOrders", id);
        const oSnap = await getDoc(oRef);
        if (!oSnap.exists()) return;
        const order = oSnap.data();
        await updateDoc(oRef, {
            status: "rejected",
            rejectReason: reason,
            reviewedAt: new Date().toISOString()
        });
        await clearPendingOrderNotifs(order.uid, id);
        await notifyUser(
            order.uid,
            `Order rejected: ${order.productName}. ${reason}`,
            "boost_order_rejected",
            { orderId: id, status: "rejected" }
        );
        loadOrders();
    } catch (err) {
        alert("Reject failed: " + (err.message || err));
    }
}

refreshBtn?.addEventListener("click", loadOrders);
filterEl?.addEventListener("change", loadOrders);
loadOrders();
