/* ==================================== */
/*  CONTRACT PROPOSAL FROM CHAT        */
/* ==================================== */

import { user, db } from "./core.js";
import { getRole } from "./role.js";
import { lockBodyScroll, unlockBodyScroll } from "./body-scroll-lock.js";
import {
    collection, doc, getDoc, addDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getPropertyListing } from "../collections.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { functions } from "./core.js";

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * @param {{ conversationId: string, propertyId: string, otherUid: string, propertyTitle?: string }} ctx
 */
export async function openProposeContractModal(ctx) {
    const role = await getRole();
    let modal = document.getElementById("contract-propose-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "contract-propose-modal";
        modal.className = "law-modal";
        modal.innerHTML = `
          <div class="law-modal-backdrop" data-close></div>
          <div class="law-modal-panel" style="max-width:420px;">
            <header class="law-modal-header">
              <div><h2>Propose contract</h2>
              <p class="law-modal-sub">Both parties must agree before it becomes active.</p></div>
              <button type="button" class="law-modal-close" data-close>&times;</button>
            </header>
            <form id="contract-propose-form" class="tier-prog-body" style="display:grid;gap:12px;padding:8px 20px 20px;">
              <div class="field-group">
                <label>Deal type</label>
                <select id="cp-deal-type" required>
                  <option value="rent">Rent</option>
                  <option value="lease">Lease</option>
                  <option value="rent_to_own">Rent-to-own</option>
                  <option value="sale">Sale</option>
                </select>
              </div>
              <div class="field-group">
                <label>Monthly amount (₱) — or sale price</label>
                <input type="number" id="cp-amount" min="0" step="0.01" required placeholder="e.g. 12000">
              </div>
              <div class="field-group">
                <label>Start date</label>
                <input type="date" id="cp-start" required>
              </div>
              <div class="field-group">
                <label>Notes (optional)</label>
                <textarea id="cp-notes" rows="2" maxlength="500" placeholder="Deposit, inclusions…"></textarea>
              </div>
              <button type="submit" class="primary-btn">Send proposal</button>
            </form>
          </div>`;
        document.body.appendChild(modal);
        modal.querySelectorAll("[data-close]").forEach(el => {
            el.onclick = () => { modal.classList.remove("active"); unlockBodyScroll(); };
        });
    }
    modal.classList.add("active");
    lockBodyScroll();
    const form = document.getElementById("contract-propose-form");
    form.onsubmit = async (e) => {
        e.preventDefault();
        const dealType = document.getElementById("cp-deal-type").value;
        const amount = Number(document.getElementById("cp-amount").value);
        const startDate = document.getElementById("cp-start").value;
        const notes = document.getElementById("cp-notes").value.trim();
        try {
            await proposeContract({ ...ctx, dealType, amount, startDate, notes, role });
            modal.classList.remove("active");
            unlockBodyScroll();
            alert("Proposal sent. The other party can Accept or Reject in this chat.");
        } catch (err) {
            console.error(err);
            alert("Could not propose: " + (err.message || err));
        }
    };
}

async function proposeContract({ conversationId, propertyId, otherUid, propertyTitle, dealType, amount, startDate, notes, role }) {
    if (!user?.uid || !propertyId || !otherUid) throw new Error("Missing parties or property");

    // Resolve seeker vs owner
    let seekerId, ownerId, brokerId = null;
    if (role === "seeker") {
        seekerId = user.uid;
        ownerId = otherUid;
    } else if (role === "owner") {
        ownerId = user.uid;
        seekerId = otherUid;
    } else {
        // broker — this conversation must be with the seeker, not the
        // property owner, since a contract needs a real seekerId
        // distinct from the broker's own uid.
        //
        // BUG FIXED HERE: the previous version computed seekerId with
        // `otherUid === pOwner ? user.uid : otherUid`, then immediately
        // followed it with `if (otherUid !== pOwner) seekerId = otherUid`.
        // The second line is a no-op in the case it's meant to guard
        // (it only ever re-confirms the same value the ternary already
        // set) -- so when a broker proposed a contract from a chat with
        // the ACTUAL OWNER (otherUid === pOwner, e.g. negotiating
        // directly), seekerId silently became the broker's own uid.
        // That's not a fallback path, it's a real one -- brokers do
        // message owners directly -- so it was writing genuinely wrong
        // contracts (broker recorded as the seeker on their own deal),
        // and firestore.rules only type-checks seekerId as a string,
        // so nothing server-side caught it either. Now it's an explicit
        // error instead of bad data.
        brokerId = user.uid;
        const pSnap = await getPropertyListing(db, propertyId, { getDoc, doc });
        const pOwner = pSnap.exists() ? pSnap.data().ownerId : null;
        if (!pOwner) throw new Error("Could not resolve the property owner for this listing.");

        if (pOwner === user.uid) {
            // Broker owns this specific listing themselves -- act as
            // owner on this contract rather than broker-representing-
            // a-third-party (this case existed in the original code
            // and is preserved as-is; only the buggy branch below it
            // was wrong).
            ownerId = user.uid;
            seekerId = otherUid;
            brokerId = null;
        } else if (otherUid === pOwner) {
            throw new Error("Propose this from your chat with the seeker, not the owner — a contract needs a seeker, an owner, and you as the broker.");
        } else {
            ownerId = pOwner;
            seekerId = otherUid;
        }
    }

    const cid = `c_${propertyId}_${[seekerId, ownerId].sort().join("_")}_${Date.now().toString(36)}`;
    const payload = {
        propertyId,
        propertyTitle: propertyTitle || "",
        seekerId,
        ownerId,
        brokerId,
        dealType,
        amount,
        currency: "PHP",
        startDate,
        notes: notes || "",
        status: "proposed",
        proposedBy: user.uid,
        conversationId: conversationId || null,
        createdAt: new Date().toISOString()
    };
    const createContract = httpsCallable(functions, "createContract");
    await createContract({ ...payload, contractId: cid });

    // System message in chat
    if (conversationId) {
        await addDoc(collection(db, "conversations", conversationId, "messages"), {
            senderId: user.uid,
            type: "contract_proposal",
            contractId: cid,
            text: `📋 Contract proposed: ${dealType} · ₱${amount.toLocaleString()} · start ${startDate}`,
            createdAt: new Date().toISOString(),
            read: false
        });
        try {
            await updateDoc(doc(db, "conversations", conversationId), {
                lastMessage: `Contract proposed (${dealType})`,
                lastMessageAt: new Date().toISOString()
            });
        } catch (_) {}
    }

    return cid;
}

export async function respondToContract(contractId, accept, conversationId) {
    const ref = doc(db, "contracts", contractId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Contract not found");
    const c = snap.data();
    if (c.status !== "proposed") throw new Error("Already responded");
    if (c.proposedBy === user.uid) throw new Error("You cannot accept your own proposal");

    if (accept) {
        const agreeContract = httpsCallable(functions, "agreeContract");
        await agreeContract({ contractId });
    } else {
        const declineContract = httpsCallable(functions, "declineContract");
        await declineContract({ contractId });
    }

    if (conversationId) {
        await addDoc(collection(db, "conversations", conversationId, "messages"), {
            senderId: user.uid,
            type: "contract_response",
            contractId,
            text: accept
                ? `✅ Contract accepted — now active. It appears under Ongoing contracts.`
                : `❌ Contract proposal rejected.`,
            createdAt: new Date().toISOString(),
            read: false
        });
        try {
            await updateDoc(doc(db, "conversations", conversationId), {
                lastMessage: accept ? "Contract accepted" : "Contract rejected",
                lastMessageAt: new Date().toISOString()
            });
        } catch (_) {}
    }

}