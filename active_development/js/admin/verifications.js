import { canonicalRoleFromData } from "../canonical-role.js";
import { SUPABASE_FUNCTIONS_BASE_URL } from "../supabase.js";
/* ==================================== */
/*  VERIFICATION QUEUE                 */
/* ==================================== */
/* Admin-only KYC document access and review; staff/moderator do not receive sensitive-document access. */
/* PRC / certificate. Manual LERIS check is the security model.        */

import { db, user, staffRole } from "./core.js";
// getKycSignedUrl is a Cloud Function (functions/index.js) that needs
// the Blaze plan to deploy -- this project is still on Spark. Calling
// it here instead: a Supabase Edge Function (supabase/functions/
// get-kyc-signed-url/) that does the EXACT same thing (verify staff,
// mint a 15-min signed URL using the service_role key server-side)
// but runs on Supabase's own free tier, unrelated to Firebase billing.
// getKycSignedUrlFn below is a drop-in replacement with the same
// shape ({ data: { url, expiresIn, path, kind } }) -- if Blaze ever
// gets enabled, swap this back to the httpsCallable version; nothing
// else in this file needs to change.
const KYC_SIGNED_URL_ENDPOINT = `${SUPABASE_FUNCTIONS_BASE_URL}/get-kyc-signed-url`;
async function getKycSignedUrlFn({ uid, kind }) {
    const idToken = await user.getIdToken();
    const res = await fetch(KYC_SIGNED_URL_ENDPOINT, {
        method: "POST",
        headers: { "Authorization": `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid, kind })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || body.error || `Signed URL request failed (${res.status})`);
    return { data: body };
}
import {
    collection, getDocs, doc, updateDoc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ACCEPTED_ID_LABELS as _ID_LABELS } from "../tiers.js";
import { adminPrompt, adminConfirm } from "./prompt.js";

const ACCEPTED_ID_LABELS = _ID_LABELS || {};

const queueEl = document.getElementById("admin-verify-queue");
const filterEl = document.getElementById("admin-verify-filter");
const typeEl = document.getElementById("admin-verify-type");
const refreshBtn = document.getElementById("admin-verify-refresh");
const countEl = document.getElementById("verify-pending-count");

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function statusBadge(status) {
    const s = status || "none";
    const cls = s === "verified" ? "verified" : s === "rejected" ? "rejected" : s === "pending" ? "pending" : "pending";
    return `<span class="admin-badge admin-badge-${cls}">${escapeHtml(s)}</span>`;
}

async function loadQueue() {
    if (!queueEl) return;
    queueEl.innerHTML = `<p class="admin-loading">Loading queue…</p>`;

    const statusFilter = filterEl?.value || "pending";
    const typeFilter = typeEl?.value || "all";

    let snap;
    try {
        snap = await getDocs(collection(db, "users"));
    } catch (err) {
        console.error(err);
        queueEl.innerHTML = `<p class="admin-empty-state">Could not load users (permissions or network).<br><small>${String(err.message || err)}</small></p>`;
        return;
    }
    const items = [];

    snap.docs.forEach(d => {
        const u = { uid: d.id, ...d.data() };
        const idv = u.idVerification || null;
        const brk = u.brokerLicense || null;

        if (typeFilter === "all" || typeFilter === "id") {
            if (idv && idv.status) {
                if (statusFilter === "all" || idv.status === statusFilter) {
                    items.push({ kind: "id", user: u, payload: idv });
                }
            }
        }
        if (typeFilter === "all" || typeFilter === "broker") {
            if (brk && brk.status) {
                if (statusFilter === "all" || brk.status === statusFilter) {
                    items.push({ kind: "broker", user: u, payload: brk });
                }
            }
        }
    });

    // Pending first
    items.sort((a, b) => {
        const pa = a.payload.status === "pending" ? 0 : 1;
        const pb = b.payload.status === "pending" ? 0 : 1;
        return pa - pb;
    });

    const pendingCount = items.filter(i => i.payload.status === "pending").length;
    if (countEl) {
        if (pendingCount > 0) {
            countEl.hidden = false;
            countEl.textContent = String(pendingCount);
        } else {
            countEl.hidden = true;
        }
    }

    if (!items.length) {
        queueEl.innerHTML = `<p class="admin-empty-state">No verification submissions match this filter. Users submit ID / PRC from profile (status: pending).</p>`;
        return;
    }

    queueEl.innerHTML = "";
    items.forEach(item => {
        const u = item.user;
        const p = item.payload;
        const name = `${u.firstName || ""} ${u.surname || ""}`.trim() || "—";
        const card = document.createElement("article");
        card.className = "admin-verify-card";

        const kindLabel = item.kind === "id" ? "Government ID" : "Broker PRC / Certificate";
        const typeLabel = item.kind === "id"
            ? (ACCEPTED_ID_LABELS[p.idType] || p.idType || "—")
            : (p.licenseType || "prc_license");

        const canWrite = staffRole === "super";

        card.innerHTML = `
            <div>
                <h4>${escapeHtml(name)} ${statusBadge(p.status)}</h4>
                <div class="admin-verify-meta">
                    <strong>${escapeHtml(kindLabel)}</strong> · ${escapeHtml(typeLabel)}<br>
                    Role: ${escapeHtml(canonicalRoleFromData(u) || "—")} · ${escapeHtml(u.email || "")}<br>
                    UID: <code>${escapeHtml(u.uid)}</code><br>
                    ${p.licenseNumber ? `License #: <strong>${escapeHtml(p.licenseNumber)}</strong><br>` : ""}
                    ${p.fullName || p.full_name ? `Name on ID: <strong>${escapeHtml(p.fullName || p.full_name)}</strong><br>` : (item.kind === "id" ? `<span class="admin-warn-text">Name on ID: not on file</span><br>` : "")}
                    ${p.dateOfBirth || p.date_of_birth || p.dob ? `DOB: <strong>${escapeHtml(p.dateOfBirth || p.date_of_birth || p.dob)}</strong><br>` : (item.kind === "id" ? `<span class="admin-warn-text">DOB: not on file</span><br>` : "")}
                    ${p.idNumber ? `ID #: <strong>${escapeHtml(p.idNumber)}</strong><br>` : ""}
                    ${p.notes ? `Notes: ${escapeHtml(p.notes)}<br>` : ""}
                    ${p.submittedAt ? `Submitted: ${escapeHtml(String(p.submittedAt))} <br>` : ""}
                </div>
                ${p.storagePath || p.documentUrl ? `
                  <div class="admin-kyc-preview-wrap" data-uid="${escapeHtml(u.uid)}" data-kind="${item.kind}">
                    <button type="button" class="admin-btn admin-btn-primary admin-btn-sm admin-kyc-view-btn">
                      <i class="bx bx-show"></i> View document (signed, 15 min)
                    </button>
                    <div class="admin-kyc-preview-slot"></div>
                  </div>` : `<p class="field-hint">No file on file — ask user to resubmit.</p>`}
                ${p.documentUrl ? `<p class="admin-verify-meta"><a href="${escapeHtml(p.documentUrl)}" target="_blank" rel="noopener">Open document</a></p>` : ""}
                <p class="admin-verify-meta" style="margin-top:8px;">
                    Verify against official records (PRC LERIS for brokers:
                    <a href="https://verification.prc.gov.ph/" target="_blank" rel="noopener">verification.prc.gov.ph</a>).
                </p>
            </div>
            <div class="admin-verify-actions">
                ${canWrite && p.status === "pending" ? `
                    <button type="button" class="admin-btn admin-btn-success admin-btn-sm" data-act="verify" data-uid="${escapeHtml(u.uid)}" data-kind="${item.kind}">Approve</button>
                    <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" data-act="reject" data-uid="${escapeHtml(u.uid)}" data-kind="${item.kind}">Reject</button>
                ` : canWrite ? `
                    <button type="button" class="admin-btn admin-btn-ghost admin-btn-sm" data-act="reset" data-uid="${escapeHtml(u.uid)}" data-kind="${item.kind}">Reset to pending</button>
                ` : `<span class="field-hint">Read only</span>`}
            </div>
        `;
        queueEl.appendChild(card);
    });

    
    queueEl.querySelectorAll(".admin-kyc-view-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const wrap = btn.closest(".admin-kyc-preview-wrap");
            const slot = wrap?.querySelector(".admin-kyc-preview-slot");
            const uid = wrap?.dataset.uid;
            const kind = wrap?.dataset.kind || "id";
            if (!uid) return;
            btn.disabled = true;
            const prev = btn.innerHTML;
            btn.textContent = "Signing…";
            try {
                const res = await getKycSignedUrlFn({ uid, kind });
                const url = res.data?.url;
                if (!url) throw new Error("No URL returned");
                if (slot) {
                    slot.innerHTML = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="admin-btn admin-btn-ghost admin-btn-sm">Open in new tab</a>
                      <img class="admin-verify-preview" src="${escapeHtml(url)}" alt="KYC document" style="margin-top:8px;max-width:100%;border-radius:8px;">`;
                }
            } catch (e) {
                console.error(e);
                alert("Could not open document: " + (e.message || e.code || e));
            } finally {
                btn.disabled = false;
                btn.innerHTML = prev;
            }
        });
    });

    queueEl.querySelectorAll("[data-act]").forEach(btn => {
        btn.addEventListener("click", () => handleAction(btn.dataset.act, btn.dataset.uid, btn.dataset.kind));
    });
}

async function handleAction(act, uid, kind) {
    if (staffRole !== "super") {
        alert("You do not have permission to change verification status.");
        return;
    }
    const field = kind === "id" ? "idVerification" : "brokerLicense";
    let status = "pending";
    if (act === "verify") status = "verified";
    if (act === "reject") status = "rejected";

    let note = "";
    if (act === "reject") {
        const entered = await adminPrompt("Optional note shown to the user.", {
            title: "Rejection reason",
            defaultValue: "",
            placeholder: "e.g. ID photo is blurry — please resubmit a clearer image",
            okText: "Reject"
        });
        if (entered === null) return;
        note = entered;
    }

    try {
        const ref = doc(db, "users", uid);
        const patch = {
            [field]: {
                status,
                reviewedBy: user.uid,
                reviewedAt: serverTimestamp(),
                reviewNote: note
            }
        };
        // merge carefully: read-modify-write to keep idType / licenseNumber
        const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        const snap = await getDoc(ref);
        const prev = snap.exists() ? (snap.data()[field] || {}) : {};
        if (kind === "id" && status === "verified") {
            const nm = prev.fullName || prev.full_name || "";
            const dob = prev.dateOfBirth || prev.date_of_birth || prev.dob || "";
            if (!String(nm).trim() || !String(dob).trim()) {
                const go = await adminConfirm(
                    "This ID record has no full name and/or date of birth on file (often an older submit). Approve anyway? Prefer asking the user to resubmit with name + DOB.",
                    { title: "Missing name / DOB", okText: "Approve anyway", cancelText: "Cancel" }
                );
                if (!go) return;
            }
        }
        const fieldPatch = {
                ...prev,
                status,
                reviewedBy: user.uid,
                reviewedAt: new Date().toISOString(),
                reviewNote: note || prev.reviewNote || ""
            };
        const updatePayload = { [field]: fieldPatch };
        if (kind !== "id") {
            updatePayload.brokerLicense = fieldPatch;
        }
        // Broker is an application/verification phase, not an automatic
        // canonicalRole promotion. Approval records the application outcome;
        // role authority remains a separate decision.
        if (kind !== "id") {
            updatePayload.brokerApplication = {
                status: status,
                reviewedAt: new Date().toISOString(),
                reviewedBy: user?.uid || "admin"
            };
        }
        await updateDoc(ref, updatePayload);
        // Notify the user (pending is set at submit time; approve/reject here)
        try {
            const notifType = status === "verified" ? "verification_approved"
                : status === "rejected" ? "verification_rejected"
                : "verification_pending";
            await addDoc(collection(db, "notifications", uid, "items"), {
                type: notifType,
                read: false,
                kind: kind,
                message: status === "verified"
                    ? (kind === "broker"
                        ? "Your PRC / broker license was approved. You are now a Broker with the Licensed badge."
                        : "Your government ID was approved. Your Verified badge is active.")
                    : status === "rejected"
                    ? (note ? `Verification rejected: ${note}` : "Verification was rejected. Please resubmit clearer documents.")
                    : "Your verification is pending administrator review.",
                reason: note || "",
                createdAt: new Date().toISOString()
            });
        } catch (notifErr) {
            console.warn("Could not write verification notification:", notifErr);
        }
        await loadQueue();
    } catch (err) {
        console.error(err);
        alert("Could not update verification: " + (err.message || err));
    }
}

refreshBtn?.addEventListener("click", loadQueue);
filterEl?.addEventListener("change", loadQueue);
typeEl?.addEventListener("change", loadQueue);

loadQueue();
