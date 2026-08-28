/* ==================================== */
/*  ONGOING CONTRACTS (profile)        */
/* ==================================== */

import { user, db, functions } from "./core.js";
import { getRole } from "./role.js";
import {
    collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const mount = document.getElementById("ongoing-contracts-list");
const wrap = document.getElementById("ongoing-contracts-section");

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function money(n) {
    if (n == null || n === "") return "—";
    return "₱" + Number(n).toLocaleString();
}

function statusClass(st) {
    if (st === "active" || st === "completed") return "verified";
    if (st === "rejected" || st === "cancelled") return "rejected";
    return "pending";
}

function cardHTML(c) {
    const st = c.status || "active";
    const typeLabel = (c.type || "contract").replace(/_/g, " ");
    const confirm = c.confirmations || {};
    const needsConfirm = st === "pending_confirmation";
    return `
    <article class="ongoing-contract-card" data-id="${escapeHtml(c.id)}">
      <div class="occ-top">
        <strong style="text-transform:capitalize;">${escapeHtml(typeLabel)}</strong>
        <span class="admin-badge admin-badge-${statusClass(st)}">${escapeHtml(st)}</span>
      </div>
      <div class="occ-meta">
        ${c.classification ? escapeHtml(c.classification) + " · " : ""}
        ${money(c.amount)}<span style="opacity:.7">/term</span>
        ${c.securityDeposit ? ` · deposit ${money(c.securityDeposit)}` : ""}
        ${c.downpayment ? ` · down ${money(c.downpayment)}` : ""}
      </div>
      <div class="occ-meta">
        Start: ${escapeHtml(c.startDate || "—")}
        ${c.propertyId ? ` · Property <code>${escapeHtml(String(c.propertyId).slice(0, 10))}…</code>` : ""}
      </div>
      ${c.notes ? `<div class="occ-meta" style="opacity:.85;">${escapeHtml(c.notes)}</div>` : ""}
      ${needsConfirm ? `
        <div class="occ-actions" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="primary-btn occ-confirm-btn" data-cid="${escapeHtml(c.id)}" style="height:36px;padding:0 14px;font-size:13px;">
            Confirm completed
          </button>
          <span class="field-hint" style="margin:0;align-self:center;">Seeker: ${confirm.seeker ? "✓" : "…"} · Owner: ${confirm.owner ? "✓" : "…"}</span>
        </div>` : ""}
    </article>`;
}

async function loadOngoing() {
    if (!mount || !user?.uid) return;
    const role = await getRole();
    const field = role === "owner" ? "ownerId"
        : role === "broker" ? "brokerId"
        : "seekerId";

    let docs = [];
    try {
        try {
            for (const st of ["active", "pending_confirmation", "proposed"]) {
                const q = query(
                    collection(db, "contracts"),
                    where(field, "==", user.uid),
                    where("status", "==", st)
                );
                const snap = await getDocs(q);
                snap.docs.forEach(d => {
                    if (!docs.find(x => x.id === d.id)) docs.push({ id: d.id, ...d.data() });
                });
            }
        } catch {
            const snap = await getDocs(query(collection(db, "contracts"), where(field, "==", user.uid)));
            docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .filter(c => ["active", "pending_confirmation", "proposed"].includes(c.status));
        }
    } catch (err) {
        console.warn("ongoing contracts:", err);
        mount.innerHTML = `<p class="field-hint">Could not load contracts yet.</p>`;
        return;
    }

    if (wrap) wrap.style.display = "";

    if (!docs.length) {
        mount.innerHTML = `<p class="field-hint">No ongoing contracts. When a chat proposal is accepted, the active deal appears here and holds 1 listing slot.</p>`;
        return;
    }

    const order = { pending_confirmation: 0, proposed: 1, active: 2 };
    docs.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
    mount.innerHTML = docs.map(cardHTML).join("");

    mount.querySelectorAll(".occ-confirm-btn").forEach(btn => {
        btn.onclick = async () => {
            btn.disabled = true;
            try {
                const fn = httpsCallable(functions, "confirmContract");
                await fn({ contractId: btn.dataset.cid });
                alert("Confirmation recorded. When both sides confirm (or the window ends), the contract can complete and count toward tier points.");
                loadOngoing();
            } catch (e) {
                console.error(e);
                alert("Could not confirm: " + (e.message || e));
                btn.disabled = false;
            }
        };
    });
}

loadOngoing();
document.addEventListener("hf:listing-created", loadOngoing);
document.addEventListener("hf:contract-updated", loadOngoing);
