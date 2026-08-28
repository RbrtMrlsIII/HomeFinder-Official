import { lockBodyScroll, unlockBodyScroll } from "./body-scroll-lock.js";
/* Support tickets — create (left) + active list (right); thread-ready fields (SoT) */
import { user, db } from "./core.js";
import {
    collection, addDoc, query, where, orderBy, getDocs, limit, doc, updateDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showAlert } from "./ui-dialog.js";

function ensureModal() {
    let modal = document.getElementById("support-ticket-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "support-ticket-modal";
    modal.className = "law-modal";
    modal.innerHTML = `
      <div class="law-modal-backdrop" data-close></div>
      <div class="law-modal-panel support-ticket-panel support-ticket-split">
        <header class="law-modal-header">
          <div>
            <h2>Contact support</h2>
            <p class="law-modal-sub">Report on the left. Track open tickets on the right. Staff replies appear in the ticket thread.</p>
          </div>
          <button type="button" class="law-modal-close" data-close aria-label="Close">&times;</button>
        </header>
        <div class="support-ticket-body support-ticket-grid">
          <section class="support-ticket-col support-ticket-report" aria-label="New report">
            <h3 class="support-ticket-list-title">New report</h3>
            <form id="support-ticket-form" class="support-ticket-form">
              <div class="field-group">
                <label for="st-category">Category</label>
                <select id="st-category" required>
                  <option value="bug">Bug / glitch</option>
                  <option value="error">Error message</option>
                  <option value="payment">Payment / boost</option>
                  <option value="account">Account / verification</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="field-group">
                <label for="st-subject">Subject</label>
                <input type="text" id="st-subject" required maxlength="120" placeholder="Short summary">
              </div>
              <div class="field-group">
                <label for="st-body">Details</label>
                <textarea id="st-body" required rows="4" maxlength="2000" placeholder="What happened? Which page?"></textarea>
              </div>
              <button type="submit" class="primary-btn">Send to support</button>
              <p class="field-hint" id="st-status"></p>
            </form>
          </section>
          <section class="support-ticket-col support-ticket-list-wrap" aria-label="Your tickets">
            <h3 class="support-ticket-list-title">Active tickets</h3>
            <ul id="st-list" class="support-ticket-list"></ul>
            <div id="st-detail" class="support-ticket-detail" hidden>
              <button type="button" class="support-ticket-back" id="st-back">← Back to list</button>
              <h4 id="st-detail-subject"></h4>
              <p class="st-meta" id="st-detail-meta"></p>
              <div class="st-thread" id="st-detail-thread"></div>
            </div>
          </section>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-close]").forEach((el) => {
        el.onclick = () => {
            modal.classList.remove("active");
            document.body.classList.remove("modal-open");
            unlockBodyScroll();
        };
    });
    document.getElementById("support-ticket-form")?.addEventListener("submit", onSubmit);
    const stBack = document.getElementById("st-back");
    if (stBack) {
        stBack.onclick = () => {
            const detail = document.getElementById("st-detail");
            const list = document.getElementById("st-list");
            if (detail) detail.hidden = true;
            if (list) list.hidden = false;
        };
    }
    return modal;
}

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function loadMyTickets() {
    const list = document.getElementById("st-list");
    const detail = document.getElementById("st-detail");
    if (!list || !user) return;
    detail.hidden = true;
    list.hidden = false;
    list.innerHTML = `<li class="support-ticket-empty">Loading…</li>`;
    try {
        const q = query(
            collection(db, "supportTickets"),
            where("uid", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(20)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
            list.innerHTML = `<li class="support-ticket-empty">No tickets yet. File a report on the left.</li>`;
            return;
        }
        list.innerHTML = "";
        snap.forEach((docSnap) => {
            const t = docSnap.data();
            const status = String(t.status || "open").toLowerCase();
            const li = document.createElement("li");
            li.className = `support-ticket-item status-${status}`;
            li.dataset.id = docSnap.id;
            li.innerHTML = `
              <span class="st-status">${escapeHtml(status)}</span>
              <span class="st-subject">${escapeHtml(t.subject || "Ticket")}</span>
              <span class="st-cat">${escapeHtml(t.category || "")}</span>`;
            li.addEventListener("click", () => openTicketDetail(docSnap.id, t));
            list.appendChild(li);
        });
    } catch (err) {
        console.warn("support list", err);
        list.innerHTML = `<li class="support-ticket-empty">Could not load tickets. You can still create one.</li>`;
    }
}

function openTicketDetail(id, t) {
    const list = document.getElementById("st-list");
    const detail = document.getElementById("st-detail");
    list.hidden = true;
    detail.hidden = false;
    document.getElementById("st-detail-subject").textContent = t.subject || "Ticket";
    const claim = t.assignedTo ? "In progress with support" : (
        String(t.status || "").toLowerCase() === "escalated" ? "Escalated — waiting for moderator" : "In queue (unclaimed)"
    );
    document.getElementById("st-detail-meta").textContent =
        `${t.status || "open"} · ${claim} · ${t.category || ""} · ${t.createdAt || ""}`;
    const thread = document.getElementById("st-detail-thread");
    const msgs = Array.isArray(t.thread) ? t.thread : [];
    const body = t.body || t.details || "";
    let html = `<div class="st-msg st-msg-user"><strong>You</strong><p>${escapeHtml(body)}</p></div>`;
    msgs.forEach((m) => {
        const role = m.role === "staff" || m.role === "moderator" ? m.role : "user";
        html += `<div class="st-msg st-msg-${role}"><strong>${escapeHtml(m.byName || role)}</strong><p>${escapeHtml(m.text || "")}</p></div>`;
    });
    if (!msgs.length) {
        html += `<p class="support-ticket-empty">No staff reply yet. Typical response ~2 days.</p>`;
    }
    thread.innerHTML = html;
    const replyBtn = document.getElementById("st-user-reply-btn");
    if (replyBtn) {
        replyBtn.onclick = async () => {
            const ta = document.getElementById("st-user-reply");
            const statusEl = document.getElementById("st-user-reply-status");
            const text = (ta?.value || "").trim();
            if (!text) return;
            replyBtn.disabled = true;
            try {
                await updateDoc(doc(db, "supportTickets", id), {
                    thread: arrayUnion({
                        role: "user",
                        by: user.uid,
                        byName: "You",
                        text,
                        at: new Date().toISOString()
                    }),
                    // A user reply re-opens an ordinary ticket, but does not
                    // silently pull an escalated ticket back down into staff.
                    status: String(t.status || "").toLowerCase() === "escalated" ? "escalated" : "open",
                    updatedAt: new Date().toISOString()
                });
                statusEl.textContent = "Reply sent.";
                await loadMyTickets();
            } catch (e) {
                statusEl.textContent = e.message || "Could not send reply.";
                replyBtn.disabled = false;
            }
        };
    }

}

async function onSubmit(e) {
    e.preventDefault();
    const status = document.getElementById("st-status");
    if (!user) {
        showAlert("Sign in required", "Please log in to contact support.");
        return;
    }
    const category = document.getElementById("st-category").value;
    const subject = document.getElementById("st-subject").value.trim();
    const body = document.getElementById("st-body").value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.textContent = "Sending…";
    try {
        await addDoc(collection(db, "supportTickets"), {
            uid: user.uid,
            email: user.email || "",
            category,
            subject,
            body,
            status: "open",
            assignedTo: null,
            assignedRole: "staff",
            thread: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        status.textContent = "Sent. Track status under Active tickets.";
        e.target.reset();
        await loadMyTickets();
    } catch (err) {
        console.error(err);
        status.textContent = "Could not send. Try again.";
        showAlert("Support", err.message || "Failed to send ticket.");
    } finally {
        btn.disabled = false;
    }
}

export function openSupportTicketForm() {
    const modal = ensureModal();
    modal.classList.add("active");
    document.body.classList.add("modal-open");
    lockBodyScroll();
    loadMyTickets();
}

export function bootSupportTicketEntry() {
    document.querySelectorAll("[data-open-support-ticket]").forEach((el) => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            openSupportTicketForm();
        });
    });
}
