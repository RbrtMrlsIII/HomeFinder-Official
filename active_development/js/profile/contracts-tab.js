/* Contracts tab — dual-agree cards, ongoing, finished, renew, review (SoT D4) */
import { user, db } from "./core.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { functions } from "../firebase.js";
import {
    collection, query, where, getDocs, doc, getDoc, limit,
    updateDoc, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { CONTRACTS, PROPERTY_LISTINGS, PROPERTY_LISTINGS_LEGACY } from "../collections.js";

const ongoingEl = () => document.getElementById("contracts-ongoing");
const finishedEl = () => document.getElementById("contracts-finished");

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function money(n) {
    if (n == null || n === "") return "—";
    return "₱" + Number(n).toLocaleString();
}

function partyRole(c) {
    if (!user) return null;
    if (c.seekerId === user.uid) return "seeker";
    if (c.ownerId === user.uid) return "owner";
    if (c.brokerId === user.uid) return "broker";
    return null;
}

function bothAgreed(c) {
    const a = c.agreements || {};
    const seekerOk = !c.seekerId || !!a.seeker;
    const ownerOk = !c.ownerId || !!a.owner;
    return !!(seekerOk && ownerOk);
}

function myAgreed(c) {
    const role = partyRole(c);
    if (!role) return false;
    const a = c.agreements || {};
    if (role === "broker") return !!(a.broker || a.seeker);
    return !!a[role];
}

async function loadPropertyTitle(propertyId) {
    if (!propertyId) return "Property";
    try {
        let snap = await getDoc(doc(db, PROPERTY_LISTINGS, propertyId));
        if (!snap.exists()) snap = await getDoc(doc(db, PROPERTY_LISTINGS_LEGACY, propertyId));
        if (snap.exists()) {
            const d = snap.data();
            return d.listing_title || d.title || d.propertyType || "Property";
        }
    } catch (_) {}
    return "Property";
}

function cardHTML(c, { finished = false } = {}) {
    const st = c.status || "proposed";
    const title = c.propertyTitle || c.propertyId || "Property";
    const role = partyRole(c);
    const agreements = c.agreements || {};
    const agreeLine = `Seeker ${agreements.seeker ? "✓" : "…"} · Owner ${agreements.owner ? "✓" : "…"}` + (c.brokerId ? ` · Broker ${agreements.broker ? "✓" : "…"}` : "");
    let actions = "";

    if (!finished && st === "proposed") {
        if (!myAgreed(c)) {
            actions += `<button type="button" class="primary-btn ct-agree" data-id="${c.id}">Agree</button>`;
        }
        actions += `<button type="button" class="secondary-btn ct-decline" data-id="${c.id}">Decline</button>`;
    }
    if (!finished && st === "active") {
        actions += `<span class="field-hint">Active until ${escapeHtml(c.endDate || c.expectedEndDate || "—")}</span>`;
    }
    if (!finished && role === "broker" && c.assistanceRequestId && c.assistOutcome !== "successful_assist") {
        actions += `<button type="button" class="primary-btn ct-assist-success" data-id="${c.id}" data-assist="${escapeHtml(c.assistanceRequestId)}">Mark assist complete</button>`;
    }
    if (finished || st === "completed" || st === "finished") {
        actions += `<button type="button" class="primary-btn ct-renew" data-id="${c.id}">Renew</button>`;
        actions += `<button type="button" class="secondary-btn ct-review" data-id="${c.id}" data-property="${escapeHtml(c.propertyId || "")}">Review / rate</button>`;
        actions += `<button type="button" class="secondary-btn ct-delete" data-id="${c.id}">Remove</button>`;
    }
    if (st === "rejected" || st === "declined" || st === "closed") {
        actions += `<button type="button" class="secondary-btn ct-delete" data-id="${c.id}">Remove</button>`;
        actions += `<span class="field-hint">Closed — auto-clears in 30 days</span>`;
    }

    return `
    <article class="contract-card panel-card" data-id="${escapeHtml(c.id)}">
      <div class="contract-card-top">
        <strong>${escapeHtml(title)}</strong>
        <span class="admin-badge admin-badge-${st === "active" ? "verified" : "pending"}">${escapeHtml(st)}</span>
      </div>
      <div class="contract-card-meta">
        ${(c.dealType || c.type || "rent").replace(/_/g, " ")} · ${money(c.amount)}
        ${c.startDate ? ` · start ${escapeHtml(c.startDate)}` : ""}
      </div>
      <div class="contract-card-meta">${agreeLine}</div>
      ${c.notes ? `<p class="contract-card-notes">${escapeHtml(c.notes)}</p>` : ""}
      <div class="contract-card-actions">${actions}</div>
    </article>`;
}

async function fetchMyContracts() {
    if (!user) return [];
    const uid = user.uid;
    const out = new Map();
    for (const field of ["seekerId", "ownerId", "brokerId"]) {
        try {
            const snap = await getDocs(query(collection(db, CONTRACTS), where(field, "==", uid)));
            snap.forEach(d => out.set(d.id, { id: d.id, ...d.data() }));
        } catch (e) {
            console.warn("contracts query", field, e);
        }
    }
    return [...out.values()];
}

function isFinished(c) {
    const st = String(c.status || "").toLowerCase();
    return ["completed", "finished", "expired"].includes(st);
}

function isClosed(c) {
    const st = String(c.status || "").toLowerCase();
    return ["rejected", "declined", "closed", "cancelled"].includes(st);
}

function isOngoing(c) {
    const st = String(c.status || "").toLowerCase();
    return ["proposed", "active", "pending_confirmation"].includes(st);
}

async function render() {
    const onEl = ongoingEl();
    const finEl = finishedEl();
    if (!onEl || !finEl || !user) return;

    onEl.innerHTML = `<p class="field-hint">Loading…</p>`;
    finEl.innerHTML = `<p class="field-hint">Loading…</p>`;

    let rows = await fetchMyContracts();
    // hydrate titles
    for (const c of rows) {
        if (!c.propertyTitle && c.propertyId) {
            c.propertyTitle = await loadPropertyTitle(c.propertyId);
        }
    }
    rows.sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));

    const ongoing = rows.filter(isOngoing);
    const finished = rows.filter(c => isFinished(c) || isClosed(c));

    onEl.innerHTML = ongoing.length
        ? ongoing.map(c => cardHTML(c)).join("")
        : `<div class="panel-empty"><i class='bx bx-file'></i><p>No ongoing contracts. Contact an approved listing from the Market.</p></div>`;

    finEl.innerHTML = finished.length
        ? finished.map(c => cardHTML(c, { finished: true })).join("")
        : `<div class="panel-empty"><i class='bx bx-check-circle'></i><p>No finished contracts yet.</p></div>`;

    wireActions(onEl);
    wireActions(finEl);
}

function wireActions(root) {
    root.querySelectorAll(".ct-agree").forEach(btn => {
        btn.onclick = async () => {
            btn.disabled = true;
            try {
                await agreeContract(btn.dataset.id);
                await render();
            } catch (e) {
                alert(e.message || e);
                btn.disabled = false;
            }
        };
    });
    root.querySelectorAll(".ct-decline").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Decline this contract? It will close and can be removed after 30 days.")) return;
            btn.disabled = true;
            try {
                await declineContract(btn.dataset.id);
                await render();
            } catch (e) {
                alert(e.message || e);
                btn.disabled = false;
            }
        };
    });
    root.querySelectorAll(".ct-renew").forEach(btn => {
        btn.onclick = async () => {
            btn.disabled = true;
            try {
                await renewContract(btn.dataset.id);
                alert("Renewal proposed — both parties must agree again.");
                await render();
            } catch (e) {
                alert(e.message || e);
                btn.disabled = false;
            }
        };
    });
    root.querySelectorAll(".ct-review").forEach(btn => {
        btn.onclick = () => {
            const pid = btn.dataset.property;
            if (pid) {
                sessionStorage.setItem("hf_review_property", pid);
                location.hash = "reviews";
                document.dispatchEvent(new CustomEvent("hf:tab-activated", { detail: { tab: "reviews" } }));
                // activate tab button
                document.querySelector('.profile-tab[data-tab="reviews"]')?.click();
            } else {
                alert("No property linked to this contract.");
            }
        };
    });
    root.querySelectorAll(".ct-assist-success").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Mark this broker assist as successful?\n\nThis records successful_assist on the request (portfolio history comes in Phase 5).")) return;
            btn.disabled = true;
            try {
                await markAssistanceSuccessful(btn.dataset.assist, btn.dataset.id);
                alert("Assist marked successful.");
                await render();
            } catch (e) {
                alert(e.message || e);
                btn.disabled = false;
            }
        };
    });
    root.querySelectorAll(".ct-delete").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Remove this contract card from your list?")) return;
            try {
                const hide = httpsCallable(functions, "hideContract");
                await hide({ contractId: btn.dataset.id });
                await render();
            } catch (e) {
                alert(e.message || e);
            }
        };
    });
}



async function agreeContract(id) {
    const agree = httpsCallable(functions, "agreeContract");
    return agree({ contractId: id });
}

async function declineContract(id) {
    const decline = httpsCallable(functions, "declineContract");
    return decline({ contractId: id });
}

async function renewContract(id) {
    const renew = httpsCallable(functions, "renewContract");
    const result = await renew({ contractId: id });
    await render();
    return result.data;
}


/** Phase 4 — Broker HQ handoff: contract room with broker as third party. */
export async function startContractFromAssistance(req) {
    if (!user) throw new Error("Sign in required");
    if (!req?.id) throw new Error("Missing assistance request");

    /* Anti-spam: one open/proposed room per assistance request for this broker */
    if (req.contractId) {
        try {
            const existing = await getDoc(doc(db, CONTRACTS, req.contractId));
            if (existing.exists()) {
                const st = String(existing.data()?.status || "");
                if (!["declined", "rejected", "closed", "cancelled"].includes(st)) {
                    return req.contractId;
                }
            }
        } catch (_) {}
    }
    try {
        const q = query(
            collection(db, CONTRACTS),
            where("assistanceRequestId", "==", req.id),
            where("brokerId", "==", user.uid),
            limit(5)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
            const st = String(d.data()?.status || "");
            if (!["declined", "rejected", "closed", "cancelled"].includes(st)) {
                return d.id;
            }
        }
    } catch (e) {
        console.warn("assist contract dedupe query", e);
    }

    const posterId = req.posterId || null;
    const posterRole = String(req.posterRole || "").toLowerCase();
    let ownerId = req.ownerId || null;
    let seekerId = req.seekerId || null;
    const propertyId = req.propertyId || `assist_${req.id}`;

    if (posterRole === "owner" || req.type === "list_property" || req.helpType === "list_property") {
        ownerId = ownerId || posterId;
        seekerId = seekerId || ""; // listing help may have no seeker yet
    } else if (posterRole === "seeker") {
        seekerId = seekerId || posterId;
        ownerId = ownerId || "";
    } else {
        ownerId = ownerId || posterId || "";
        seekerId = seekerId || "";
    }

    const cid = doc(collection(db, CONTRACTS)).id;
    const payload = {
        propertyId: String(propertyId),
        propertyTitle: req.title || req.summary || "Broker assistance",
        seekerId: String(seekerId || ""),
        ownerId: String(ownerId || ""),
        brokerId: user.uid,
        assistanceRequestId: req.id,
        status: "proposed",
        agreements: {
            seeker: !seekerId,
            owner: !ownerId,
            broker: true
        },
        proposedBy: user.uid,
        dealType: req.type || req.helpType || "assistance",
        type: "broker_assist",
        amount: req.listingHelpFeePhp ?? null,
        notes: "Opened from Broker HQ assistance claim.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const createContract = httpsCallable(functions, "createContract");
    await createContract({ ...payload, contractId: cid });

    // Patch 29: the handoff is only considered complete after both sides of
    // the canonical relationship read back consistently. The contract itself
    // remains server-authoritative through createContract.
    const requestRef = doc(db, "assistanceRequests", req.id);
    await updateDoc(requestRef, {
        status: "in_progress",
        contractId: cid,
        updatedAt: new Date().toISOString()
    });

    const [contractRead, requestRead] = await Promise.all([
        getDoc(doc(db, CONTRACTS, cid)),
        getDoc(requestRef)
    ]);
    const contractSaved = contractRead.exists() ? (contractRead.data() || {}) : {};
    const requestSaved = requestRead.exists() ? (requestRead.data() || {}) : {};
    if (contractSaved.brokerId !== user.uid || contractSaved.assistanceRequestId !== req.id) {
        throw new Error("Contract handoff failed broker/request readback verification.");
    }
    if (requestSaved.status !== "in_progress" || requestSaved.contractId !== cid) {
        throw new Error("Assistance request did not pass contract-link readback verification.");
    }

    const notifyUids = [ownerId, seekerId].filter((id) => id && id !== user.uid);
    for (const uid of notifyUids) {
        try {
            await addDoc(collection(db, "notifications", uid, "items"), {
                type: "contract_proposed",
                message: `Broker opened a contract room for: ${payload.propertyTitle}. Open Contracts to continue.`,
                contractId: cid,
                read: false,
                createdAt: new Date().toISOString()
            });
        } catch (_) {}
    }
    return cid;
}

export async function markAssistanceSuccessful(requestId, contractId) {
    if (!user || !requestId) throw new Error("Missing request");
    const complete = httpsCallable(functions, "markAssistanceSuccessful");
    return complete({ requestId, contractId: contractId || null });
}

/** Create proposed contract from marketplace Contact (listing card). */
export async function startContractFromListing({ propertyId, ownerId, propertyTitle, dealType = "rent", amount = null }) {
    if (!user) throw new Error("Sign in required");
    if (!propertyId || !ownerId) throw new Error("Missing property or owner");
    if (ownerId === user.uid) throw new Error("You cannot contract your own listing");

    const cid = doc(collection(db, CONTRACTS)).id;
    const payload = {
        propertyId,
        propertyTitle: propertyTitle || "",
        seekerId: user.uid,
        ownerId,
        brokerId: null,
        status: "proposed",
        agreements: { seeker: true, owner: false },
        proposedBy: user.uid,
        dealType,
        type: dealType,
        amount,
        startDate: null,
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const createContract = httpsCallable(functions, "createContract");
    await createContract({ ...payload, contractId: cid });
    return cid;
}

export async function bootContractsTab() {
    if (!user) return;
    await render();
}

document.addEventListener("hf:tab-activated", (e) => {
    if (e.detail?.tab === "contracts") bootContractsTab();
});

// pending contact from marketplace
(async function consumePendingContact() {
    try {
        const raw = sessionStorage.getItem("hf_pending_contact");
        if (!raw || !user) return;
        sessionStorage.removeItem("hf_pending_contact");
        const data = JSON.parse(raw);
        await startContractFromListing(data);
        document.querySelector('.profile-tab[data-tab="contracts"]')?.click();
        await bootContractsTab();
    } catch (e) {
        console.warn("pending contact", e);
    }
})();

bootContractsTab();
