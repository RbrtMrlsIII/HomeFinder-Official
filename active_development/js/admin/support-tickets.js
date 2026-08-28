/* Staff / Admin — support tickets (Option A: open pool + claim) */
import { db, staffRole, user } from "./core.js";
import {
    collection, query, where, getDocs, doc, updateDoc, addDoc, runTransaction, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
        console.warn("support ticket notify failed", e);
    }
}

const listEl = document.getElementById("staff-support-body")
    || document.getElementById("admin-support-list")
    || document.getElementById("admin-support-results");
const filterEl = document.getElementById("admin-support-filter")
    || document.getElementById("admin-support-status");
const refreshBtn = document.getElementById("admin-support-refresh");
const countEl = document.getElementById("support-tab-count");
const emptyEl = document.getElementById("admin-support-empty");
const isTableBody = listEl && listEl.tagName === "TBODY";

const myUid = () => user?.uid || "";
const roleNorm = () => {
    const r = String(staffRole || "").toLowerCase();
    if (r === "super" || r === "admin") return "admin";
    if (r === "moderator") return "moderator";
    return "staff";
};

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Pool visible to this ops role */
function inMyPool(t) {
    const ar = String(t.assignedRole || "staff").toLowerCase();
    const st = String(t.status || "open").toLowerCase();
    if (st === "resolved" || st === "closed") return true; // still list when filter allows
    const me = roleNorm();
    if (me === "admin") return true;
    if (me === "moderator") return ar === "moderator" || st === "escalated";
    // staff: staff pool only (not escalated away)
    return ar === "staff" && st !== "escalated";
}

function isUnclaimed(t) {
    return !t.assignedTo;
}

function isMine(t) {
    return t.assignedTo && t.assignedTo === myUid();
}

function canWork(t) {
    if (isMine(t)) return true;
    return false;
}

function canClaim(t) {
    if (!isUnclaimed(t)) return false;
    const pool = String(t.assignedRole || "staff").toLowerCase();
    const me = roleNorm();
    return pool === me && (me === "staff" || me === "moderator" || me === "admin");
}

function statusLabel(t) {
    const s = String(t.status || "open").toLowerCase();
    if (s === "pending") return "open";
    return s;
}

async function load() {
    if (!listEl) {
        console.warn("support-tickets: no list container found");
        return;
    }
    if (isTableBody) {
        listEl.innerHTML = `<tr><td colspan="6" class="admin-loading">Loading tickets…</td></tr>`;
    } else {
        listEl.innerHTML = `<p class="admin-loading">Loading tickets…</p>`;
    }
    if (emptyEl) emptyEl.hidden = true;

    let rows = [];
    try {
        const me = roleNorm();
        const ticketQuery = me === "admin"
            ? collection(db, "supportTickets")
            : query(collection(db, "supportTickets"), where("assignedRole", "==", me));
        const snap = await getDocs(ticketQuery);
        rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        listEl.innerHTML = isTableBody
            ? `<tr><td colspan="6" class="admin-empty-state">${escapeHtml(e.message)}</td></tr>`
            : `<p class="admin-empty-state">${escapeHtml(e.message)}</p>`;
        return;
    }

    rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    const f = (filterEl?.value || "open").toLowerCase();
    if (f !== "all") {
        const want = (f === "open" || f === "pending")
            ? ["open", "pending"]
            : (f === "escalated" ? ["escalated"] : [f]);
        rows = rows.filter(r => want.includes(String(r.status || "open").toLowerCase()));
    }

    // Role pool filter (admin sees all)
    rows = rows.filter(inMyPool);

    try {
        const all = roleNorm() === "admin"
            ? await getDocs(collection(db, "supportTickets"))
            : await getDocs(query(collection(db, "supportTickets"), where("assignedRole", "==", roleNorm())));
        const n = all.docs.filter(d => {
            const s = String(d.data().status || "open").toLowerCase();
            return s === "open" || s === "pending" || s === "escalated";
        }).length;
        if (countEl) countEl.textContent = String(n);
    } catch (_) { /* ignore */ }

    if (!rows.length) {
        if (emptyEl) {
            emptyEl.hidden = false;
            listEl.innerHTML = isTableBody ? "" : "";
        } else {
            listEl.innerHTML = isTableBody
                ? `<tr><td colspan="6" class="admin-empty-state">No tickets match.</td></tr>`
                : `<p class="admin-empty-state">No tickets match.</p>`;
        }
        return;
    }
    if (emptyEl) emptyEl.hidden = true;

    if (isTableBody) {
        listEl.innerHTML = rows.map(t => {
            const claim = canClaim(t)
                ? `<button type="button" class="admin-btn admin-btn-sm" data-claim="${t.id}">Claim</button>`
                : (isMine(t) ? `<span class="admin-badge">Yours</span>` : `<span class="admin-verify-meta">${isUnclaimed(t) ? "Waiting for " + escapeHtml(String(t.assignedRole || "staff")) : "Claimed"}</span>`);
            return `<tr data-ticket-id="${t.id}">
              <td>${escapeHtml(String(t.createdAt || "").slice(0, 16))}</td>
              <td class="admin-uid-cell">${escapeHtml(t.uid || t.email || "—")}</td>
              <td>${escapeHtml(t.subject || "Ticket")}</td>
              <td>${escapeHtml(statusLabel(t))}${t.assignedTo ? ` · ${isMine(t) ? "you" : "claimed"}` : " · unclaimed"}</td>
              <td>${claim}</td>
            </tr>`;
        }).join("");
    } else {
        listEl.innerHTML = rows.map(t => {
            const st = statusLabel(t);
            const mine = isMine(t);
            const unclaimed = isUnclaimed(t);
            const work = canWork(t);
            const claimBtn = canClaim(t)
                ? `<button type="button" class="admin-btn admin-btn-primary admin-btn-sm" data-claim="${t.id}">Claim ticket</button>`
                : (mine
                    ? `<span class="admin-badge admin-badge-verified">Claimed by you</span>`
                    : `<span class="admin-verify-meta">${unclaimed ? "Waiting for " + escapeHtml(String(t.assignedRole || "staff")) : "Claimed by " + escapeHtml(String(t.assignedTo).slice(0, 8)) + "…"}</span>`);
            const actions = work ? `
              <div class="admin-support-reply">
                <textarea data-reply-text="${t.id}" rows="2" placeholder="Reply to user…" class="admin-reply-text"></textarea>
                <div class="admin-support-actions">
                  <button type="button" class="admin-btn admin-btn-sm" data-reply="${t.id}">Send reply</button>
                  <button type="button" class="admin-btn admin-btn-success admin-btn-sm" data-resolve="${t.id}">Resolve</button>
                  ${roleNorm() === "staff" || roleNorm() === "moderator"
                    ? `<button type="button" class="admin-btn admin-btn-sm" data-transfer="${t.id}">Transfer to upper ops</button>`
                    : ""}
                  ${mine ? `<button type="button" class="admin-btn admin-btn-ghost admin-btn-sm" data-release="${t.id}">Release claim</button>` : ""}
                </div>
              </div>` : (t.staffReply
                ? `<p class="admin-verify-meta"><strong>Last reply:</strong> ${escapeHtml(t.staffReply)}</p>`
                : `<p class="admin-verify-meta">Claim this ticket to reply.</p>`);

            const thread = Array.isArray(t.thread) ? t.thread : [];
            const threadHtml = thread.length
                ? `<div class="st-thread-admin">${thread.map(m =>
                    `<div class="st-msg"><strong>${escapeHtml(m.byName || m.role || "")}</strong>
                     <p>${escapeHtml(m.text || "")}</p></div>`).join("")}</div>`
                : "";

            return `<article class="admin-order-card" data-ticket-id="${t.id}">
        <div class="admin-order-top">
          <strong>${escapeHtml(t.subject || "Ticket")}</strong>
          <span class="admin-badge admin-badge-${st === "resolved" ? "verified" : "pending"}">${escapeHtml(st)}</span>
        </div>
        <div class="admin-verify-meta">
          ${escapeHtml(t.category || "")} · ${escapeHtml(t.email || "")}<br>
          UID: <code class="admin-uid-cell">${escapeHtml(t.uid || "")}</code><br>
          ${escapeHtml(t.createdAt || "")} · pool: ${escapeHtml(t.assignedRole || "staff")}
          
        </div>
        <p class="admin-ticket-body">${escapeHtml(t.body || t.message || t.description || t.details || "(no message)")}</p>
        ${threadHtml}
        <div class="admin-claim-row">${claimBtn}</div>
        ${st !== "resolved" ? actions : ""}
      </article>`;
        }).join("");
    }

    // --- Claim ---
    listEl.querySelectorAll("[data-claim]").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.claim;
            const ticket = rows.find(r => r.id === id);
            if (ticket?.assignedTo && ticket.assignedTo !== myUid()) {
                alert("Already claimed by another ops user. Refresh the list.");
                return;
            }
            btn.disabled = true;
            try {
                await runTransaction(db, async (tx) => {
                    const ref = doc(db, "supportTickets", id);
                    const snap = await tx.get(ref);
                    if (!snap.exists()) throw new Error("Ticket no longer exists.");
                    const current = snap.data();
                    if (current.assignedTo) throw new Error("Already claimed by another ops user.");
                    const me = roleNorm();
                    const pool = String(current.assignedRole || "staff");
                    if (pool !== me) throw new Error(`Ticket is in the ${pool} pool; ${me} cannot claim it.`);
                    tx.update(ref, {
                        assignedTo: myUid(),
                        assignedRole: me,
                        claimedAt: new Date().toISOString(),
                        staffReadAt: new Date().toISOString(),
                        staffReadBy: myUid(),
                        updatedAt: new Date().toISOString()
                    });
                });
                await load();
            } catch (e) {
                alert("Claim failed: " + (e.message || e));
                btn.disabled = false;
            }
        };
    });

    // --- Release ---
    listEl.querySelectorAll("[data-release]").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Release this claim back to the open pool?")) return;
            btn.disabled = true;
            try {
                await updateDoc(doc(db, "supportTickets", btn.dataset.release), {
                    assignedTo: null,
                    updatedAt: new Date().toISOString()
                });
                await load();
            } catch (e) {
                alert("Release failed: " + (e.message || e));
                btn.disabled = false;
            }
        };
    });

    // --- Reply ---
    listEl.querySelectorAll("[data-reply]").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.reply;
            const ticket = rows.find(r => r.id === id);
            if (!canWork(ticket)) {
                alert("Claim this ticket before replying.");
                return;
            }
            const ta = listEl.querySelector(`[data-reply-text="${id}"]`);
            const text = (ta?.value || "").trim();
            if (!text) { alert("Write a reply first."); return; }
            btn.disabled = true;
            try {
                await updateDoc(doc(db, "supportTickets", id), {
                    staffReply: text,
                    thread: arrayUnion({
                        role: roleNorm() === "moderator" ? "moderator" : "staff",
                        by: myUid(),
                        byName: roleNorm(),
                        text,
                        at: new Date().toISOString()
                    }),
                    repliedBy: myUid(),
                    repliedAt: new Date().toISOString(),
                    status: statusLabel(ticket) === "escalated" ? "escalated" : "open",
                    updatedAt: new Date().toISOString()
                });
                if (ticket?.uid) {
                    await notifyUser(
                        ticket.uid,
                        `Support replied on "${ticket.subject || "your ticket"}": ${text.slice(0, 180)}`,
                        "support_ticket_reply",
                        { ticketId: id }
                    );
                }
                alert("Reply sent — user will get a notification.");
                await load();
            } catch (e) {
                alert("Reply failed: " + (e.message || e));
                btn.disabled = false;
            }
        };
    });

    // --- Resolve ---
    listEl.querySelectorAll("[data-resolve]").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.resolve;
            const ticket = rows.find(r => r.id === id);
            if (!canWork(ticket) && roleNorm() !== "admin") {
                alert("Claim this ticket before resolving.");
                return;
            }
            if (!confirm("Mark this ticket resolved?")) return;
            btn.disabled = true;
            try {
                await updateDoc(doc(db, "supportTickets", id), {
                    status: "resolved",
                    resolvedBy: myUid(),
                    resolvedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                if (ticket?.uid) {
                    await notifyUser(
                        ticket.uid,
                        `Your support ticket "${ticket.subject || "your request"}" has been resolved.`,
                        "support_ticket_resolved",
                        { ticketId: id }
                    );
                }
                await load();
            } catch (e) {
                alert("Resolve failed: " + (e.message || e));
                btn.disabled = false;
            }
        };
    });

    // --- Transfer to upper operations ---
    listEl.querySelectorAll("[data-transfer]").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.transfer;
            const ticket = rows.find(r => r.id === id);
            if (!canWork(ticket) && roleNorm() !== "admin") {
                alert("Claim this ticket before transferring.");
                return;
            }
            const me = roleNorm();
                const target = me === "staff" ? "moderator" : (me === "moderator" ? "admin" : "admin");
                if (!confirm(`Transfer to the ${target} pool? Claim will be cleared so ${target} can claim it.`)) return;
                btn.disabled = true;
                try {
                    await updateDoc(doc(db, "supportTickets", id), {
                        assignedRole: target,
                        assignedTo: null,
                        status: "escalated",
                        transferredAt: new Date().toISOString(),
                        transferredBy: myUid(),
                        updatedAt: new Date().toISOString()
                    });
                if (ticket?.uid) {
                    await notifyUser(
                        ticket.uid,
                        `Your ticket "${ticket.subject || "support request"}" was escalated to ${target}.`,
                        "support_ticket_escalated",
                        { ticketId: id }
                    );
                }
                alert(`In ${target} pool (unclaimed).`);
                await load();
            } catch (e) {
                alert("Transfer failed: " + (e.message || e));
                btn.disabled = false;
            }
        };
    });
}

filterEl?.addEventListener("change", load);
refreshBtn?.addEventListener("click", load);
load();
