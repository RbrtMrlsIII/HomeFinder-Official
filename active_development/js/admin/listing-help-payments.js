/* Phase 1 — Listing help ₱99.99 payment check queue (staff + admin) */
import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  doc,
  updateDoc,
  addDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { updatePropertyListing } from "../collections.js";

const body = document.getElementById("listing-help-pay-results");
const empty = document.getElementById("listing-help-pay-empty");
const countEl = document.getElementById("listing-help-pay-count");
const filterEl = document.getElementById("listing-help-pay-filter");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function notifyOwner(uid, payload) {
  if (!uid) return;
  try {
    await addDoc(collection(db, "notifications", uid, "items"), {
      ...payload,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn("notify", e);
  }
}

async function loadQueue() {
  if (!body) return;
  body.innerHTML = `<tr><td colspan="7" class="admin-loading">Loading…</td></tr>`;
  const want = (filterEl?.value || "checking").toLowerCase();

  let rows = [];
  try {
    for (const colName of ["propertyListings"]) {
      try {
        let qy;
        if (want === "all") {
          qy = query(collection(db, colName), where("needsBrokerHelp", "==", true), limit(80));
        } else {
          qy = query(
            collection(db, colName),
            where("listingHelpPaymentStatus", "==", want),
            limit(80)
          );
        }
        const snap = await getDocs(qy);
        snap.forEach((d) => rows.push({ id: d.id, col: colName, ...d.data() }));
      } catch (err) {
        console.warn("listing-help query", colName, err);
      }
    }
  } catch (err) {
    body.innerHTML = `<tr><td colspan="7">Could not load queue: ${esc(err.message)}</td></tr>`;
    return;
  }

  // Dedupe by id
  const seen = new Set();
  rows = rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  if (want !== "all") {
    rows = rows.filter((r) => String(r.listingHelpPaymentStatus || "").toLowerCase() === want);
  }

  rows.sort((a, b) => String(b.listingHelpSubmittedAt || "").localeCompare(String(a.listingHelpSubmittedAt || "")));

  if (countEl) {
    const n = rows.filter((r) => r.listingHelpPaymentStatus === "checking").length;
    countEl.hidden = n === 0;
    countEl.textContent = String(n);
  }

  if (!rows.length) {
    body.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  body.innerHTML = rows
    .map((r) => {
      const st = String(r.listingHelpPaymentStatus || "—");
      const title = r.title || r.propertyTitle || "Listing";
      const owner = r.ownerId || r.uid || "—";
      const ref = r.listingHelpPaymentRef || "—";
      const when = r.listingHelpSubmittedAt || r.submittedAt || "—";
      const fee = r.listingHelpFeePhp != null ? `₱${Number(r.listingHelpFeePhp).toFixed(2)}` : "₱99.99";
      const canAct = st === "checking" || st === "unpaid";
      return `<tr data-id="${esc(r.id)}" data-col="${esc(r.col)}" data-owner="${esc(owner)}">
        <td>${esc(when).slice(0, 19)}</td>
        <td>${esc(title)}<div class="ops-muted">${esc(r.id)}</div></td>
        <td><code>${esc(owner).slice(0, 12)}…</code></td>
        <td>${esc(fee)}</td>
        <td><code>${esc(ref)}</code></td>
        <td><span class="ops-chip ops-chip-${esc(st)}">${esc(st)}</span></td>
        <td class="ops-actions">
          ${
            canAct
              ? `<button type="button" class="admin-btn admin-btn-primary" data-act="verify">Verify payment</button>
                 <button type="button" class="admin-btn admin-btn-ghost" data-act="reject">Reject</button>`
              : "—"
          }
        </td>
      </tr>`;
    })
    .join("");
}

async function setPaymentStatus(propertyId, ownerId, col, next, reason) {
  const payload = {
    listingHelpPaymentStatus: next,
    listingHelpReviewedAt: new Date().toISOString()
  };
  if (reason) payload.listingHelpReviewNote = reason;

  if (next === "verified") {
    // Payment clear — leave listing pending_approval for normal content review if still pending
    payload.pendingReason = null;
  }
  if (next === "rejected") {
    payload.status = "rejected";
    payload.approvalStatus = "rejected";
    payload.reviewReason = reason || "Listing help payment not verified";
  }

  try {
    await updatePropertyListing(db, propertyId, payload, { doc, getDoc, updateDoc });
  } catch (_) {
    // Fallback direct update on known collection
    await updateDoc(doc(db, col || "propertyListings", propertyId), payload);
  }

  if (next === "verified") {
    await notifyOwner(ownerId, {
      type: "listing_help_payment_verified",
      title: "Listing help payment verified",
      message: "Your ₱99.99 listing-help payment was verified. Your listing continues through approval if still required.",
      propertyId
    });
  } else if (next === "rejected") {
    await notifyOwner(ownerId, {
      type: "listing_help_payment_rejected",
      title: "Listing help payment not accepted",
      message: `Payment for listing help was not verified.${reason ? "\n\nNote: " + reason : ""}\n\nYou may resubmit with a valid reference.`,
      propertyId
    });
  }
}

body?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const tr = btn.closest("tr");
  if (!tr) return;
  const id = tr.getAttribute("data-id");
  const col = tr.getAttribute("data-col");
  const owner = tr.getAttribute("data-owner");
  const act = btn.getAttribute("data-act");

  if (act === "verify") {
    if (!confirm("Mark ₱99.99 listing-help payment as VERIFIED for this listing?")) return;
    btn.disabled = true;
    try {
      await setPaymentStatus(id, owner, col, "verified");
      await loadQueue();
    } catch (err) {
      alert("Could not verify: " + (err.message || err));
      btn.disabled = false;
    }
  }
  if (act === "reject") {
    const reason = prompt("Reason for rejecting payment (shown to user):", "Payment reference could not be verified");
    if (reason == null) return;
    btn.disabled = true;
    try {
      await setPaymentStatus(id, owner, col, "rejected", reason);
      await loadQueue();
    } catch (err) {
      alert("Could not reject: " + (err.message || err));
      btn.disabled = false;
    }
  }
});

filterEl?.addEventListener("change", () => loadQueue());

// Load when tab becomes active or on boot if panel exists
loadQueue();
document.querySelectorAll(".admin-tab-btn").forEach((b) => {
  b.addEventListener("click", () => {
    if (b.getAttribute("data-tab") === "listing-help-pay") {
      setTimeout(loadQueue, 50);
    }
  });
});
