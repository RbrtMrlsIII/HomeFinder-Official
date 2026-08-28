/* ==================================== */
/*  REPORTS QUEUE (listings + users)   */
/* ==================================== */

import { db } from "./core.js";
import {
    collection, getDocs, doc, updateDoc, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { adminPrompt, adminConfirm } from "./prompt.js";

const body = document.getElementById("admin-reports-results");
const empty = document.getElementById("admin-reports-empty");
const searchInput = document.getElementById("admin-report-search");
const statusFilter = document.getElementById("admin-report-status");
const refreshBtn = document.getElementById("admin-report-refresh");
const countEl = document.getElementById("reports-open-count");

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function targetLabel(r) {
    const type = r.targetType || (r.propertyId ? "listing" : "user");
    if (type === "user") return `User <code>${escapeHtml(r.targetId || "—")}</code>`;
    return `Listing <code>${escapeHtml(r.targetId || r.propertyId || "—")}</code>`;
}

async function notifyUser(uid, message, extra = {}) {
    if (!uid) return;
    try {
        await addDoc(collection(db, "notifications", uid, "items"), {
            type: "report_update",
            message,
            read: false,
            createdAt: new Date().toISOString(),
            ...extra
        });
    } catch (e) {
        console.warn("notify failed", e);
    }
}

async function loadReports() {
    if (!body) return;
    body.innerHTML = `<tr><td colspan="6" class="admin-loading">Loading…</td></tr>`;

    let docs = [];
    try {
        const snap = await getDocs(collection(db, "reports"));
        docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        body.innerHTML = "";
        if (empty) {
            empty.hidden = false;
            empty.textContent = "Could not load reports: " + (e.message || e);
        }
        return;
    }

    const status = statusFilter?.value || "open";
    const term = (searchInput?.value || "").trim().toLowerCase();

    const openCount = docs.filter(r => (r.status || "open") === "open").length;
    if (countEl) {
        if (openCount > 0) {
            countEl.hidden = false;
            countEl.textContent = String(openCount);
        } else {
            countEl.hidden = true;
        }
    }
    const tabCount = document.getElementById('reports-tab-count');
    if (tabCount) {
        if (openCount > 0) { tabCount.hidden = false; tabCount.textContent = String(openCount); }
        else tabCount.hidden = true;
    }

    docs = docs.filter(r => {
        if (status !== "all" && (r.status || "open") !== status) return false;
        if (!term) return true;
        const hay = `${r.targetId || ""} ${r.propertyId || ""} ${r.ownerId || ""} ${r.reason || ""} ${r.details || ""} ${r.reporterId || ""} ${r.targetType || ""}`.toLowerCase();
        return hay.includes(term);
    });

    // Newest first
    docs.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    if (!docs.length) {
        body.innerHTML = "";
        if (empty) { empty.hidden = false; empty.textContent = "No reports match."; }
        return;
    }
    if (empty) empty.hidden = true;

    body.innerHTML = docs.map(r => {
        const st = r.status || "open";
        const type = r.targetType || (r.propertyId ? "listing" : "user");
        return `
        <tr data-id="${escapeHtml(r.id)}">
            <td><span class="admin-badge">${escapeHtml(type)}</span><div style="margin-top:4px;">${targetLabel(r)}</div></td>
            <td>
                <strong>${escapeHtml(r.reason || "—")}</strong>
                ${r.details ? `<div class="field-hint" style="margin:4px 0 0;max-width:240px;">${escapeHtml(r.details)}</div>` : ""}
            </td>
            <td class="admin-uid-cell">${escapeHtml(r.reporterId || "—")}</td>
            <td><span class="admin-badge admin-badge-${st === "resolved" ? "verified" : st === "dismissed" ? "rejected" : "pending"}">${escapeHtml(st)}</span></td>
            <td class="admin-uid-cell" style="font-size:11px;">${escapeHtml((r.createdAt || "").slice(0, 19))}</td>
            <td style="white-space:nowrap;">
                ${st === "open" ? `
                  <button type="button" class="admin-btn admin-btn-primary admin-report-resolve" data-id="${escapeHtml(r.id)}" data-reporter="${escapeHtml(r.reporterId || "")}" data-target="${escapeHtml(r.targetId || r.propertyId || "")}" data-type="${escapeHtml(type)}">Resolve</button>
                  <button type="button" class="admin-btn admin-report-dismiss" data-id="${escapeHtml(r.id)}" data-reporter="${escapeHtml(r.reporterId || "")}">Dismiss</button>
                ` : `<span class="field-hint">—</span>`}
            </td>
        </tr>`;
    }).join("");

    body.querySelectorAll(".admin-report-resolve").forEach(btn => {
        btn.onclick = async () => {
            const note = await adminPrompt(
                "Resolution note (required). Sent to BOTH the reporter and the reported user. Staff may continue talking with the reported user.",
                {
                    title: "Resolve report",
                    defaultValue: "Reviewed. Thank you for the report.",
                    okText: "Resolve & notify both",
                    required: true
                }
            );
            if (note == null) return;
            if (!String(note).trim()) { alert("A reason/note is required."); return; }
            try {
                await updateDoc(doc(db, "reports", btn.dataset.id), {
                    status: "resolved",
                    resolvedAt: new Date().toISOString(),
                    resolutionNote: note
                });
                await notifyUser(btn.dataset.reporter,
                    `Your report was resolved.\n\nStaff note: ${note}`,
                    { reportId: btn.dataset.id, targetType: btn.dataset.type, targetId: btn.dataset.target });
                if (btn.dataset.target) {
                    await notifyUser(btn.dataset.target,
                        `A report about you was reviewed and resolved.\n\nStaff note: ${note}\n\nYou may reply if you need clarification. Staff can continue the conversation.`,
                        { reportId: btn.dataset.id, canReply: true });
                }
                loadReports();
            } catch (e) {
                alert("Could not resolve: " + (e.message || e));
            }
        };
    });

    body.querySelectorAll(".admin-report-dismiss").forEach(btn => {
        btn.onclick = async () => {
            const note = await adminPrompt(
                "Decline / dismiss reason (required). Sent to BOTH the reporter and the reported user.",
                {
                    title: "Dismiss report",
                    defaultValue: "",
                    placeholder: "e.g. Not enough evidence / outside policy scope…",
                    okText: "Dismiss & notify both",
                    required: true
                }
            );
            if (note == null) return;
            if (!String(note).trim()) { alert("A reason is required."); return; }
            try {
                await updateDoc(doc(db, "reports", btn.dataset.id), {
                    status: "dismissed",
                    resolvedAt: new Date().toISOString(),
                    resolutionNote: note
                });
                await notifyUser(btn.dataset.reporter,
                    `Your report was reviewed and closed.\n\nReason: ${note}`,
                    { reportId: btn.dataset.id });
                if (btn.dataset.target) {
                    await notifyUser(btn.dataset.target,
                        `A report about you was reviewed and closed without further action.\n\nReason: ${note}\n\nYou may reply if you need clarification.`,
                        { reportId: btn.dataset.id, canReply: true });
                }
                loadReports();
            } catch (e) {
                alert("Could not dismiss: " + (e.message || e));
            }
        };
    });
}

refreshBtn?.addEventListener("click", loadReports);
searchInput?.addEventListener("keydown", e => { if (e.key === "Enter") loadReports(); });
statusFilter?.addEventListener("change", loadReports);
loadReports();
