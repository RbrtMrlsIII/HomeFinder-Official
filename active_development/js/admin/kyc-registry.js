/* ==================================== */
/*  ADMIN KYC REFERENCE REGISTRY        */
/* ==================================== */
/* Excel-style grid over kycReferenceIndex/{indexId} -- ONE doc per     */
/* (idType, normalized reference number). Deliberately holds only the   */
/* reference number, its type, and which uid currently owns the claim   */
/* -- never the ID photo itself (that stays in Supabase Storage,        */
/* private bucket, staff-only signed URL via getKycSignedUrlFn). See    */
/* docs/KYC_Reference_Registry.md for the privacy reasoning.            */
/*                                                                        */
/* The actual duplicate-PREVENTION happens in firestore.rules (a        */
/* second account can never claim a reference number already tied to a  */
/* different uid -- see that file's kycReferenceIndex block) and in     */
/* js/profile/kyc-form.js (claims the number as part of submitting).    */
/* This dashboard is for staff to SEARCH what's on file and, for        */
/* pre-launch backfill or an edge case the automatic claim missed       */
/* (e.g. a submission from before this feature existed), manually       */
/* record an entry -- it does not itself block anyone from registering; */
/* the rules do that regardless of whether staff ever open this tab.    */

import { db, staffRole, user } from "./core.js";
import {
    collection, getDocs, doc, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ACCEPTED_ID_LABELS } from "../tiers.js";
import { kycReferenceIndexId, normalizeReferenceNumber } from "../kyc-reference.js";

const searchInput = document.getElementById("admin-kyc-registry-search");
const typeFilter = document.getElementById("admin-kyc-registry-type");
const refreshBtn = document.getElementById("admin-kyc-registry-refresh");
const resultsBody = document.getElementById("admin-kyc-registry-results");
const resultsEmpty = document.getElementById("admin-kyc-registry-empty");
const countEl = document.getElementById("admin-kyc-registry-count");

const addForm = document.getElementById("admin-kyc-registry-add-form");
const addType = document.getElementById("admin-kyc-registry-add-type");
const addNumber = document.getElementById("admin-kyc-registry-add-number");
const addUid = document.getElementById("admin-kyc-registry-add-uid");
const addStatus = document.getElementById("admin-kyc-registry-add-status");

const TYPE_LABELS = { ...ACCEPTED_ID_LABELS };

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let allEntries = [];

async function loadRegistry() {
    if (!resultsBody) return;
    resultsBody.innerHTML = `<tr><td colspan="5" class="admin-loading">Loading…</td></tr>`;
    try {
        const snap = await getDocs(collection(db, "kycReferenceIndex"));
        allEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (countEl) countEl.textContent = String(allEntries.length);
        render();
    } catch (err) {
        console.error(err);
        resultsBody.innerHTML = `<tr><td colspan="5" class="admin-empty-state">Could not load registry (permissions or network).<br><small>${escapeHtml(err.message || err)}</small></td></tr>`;
    }
}

function render() {
    const term = (searchInput?.value || "").trim().toLowerCase();
    const typeF = typeFilter?.value || "all";
    const normTerm = normalizeReferenceNumber(term);

    const filtered = allEntries.filter(e => {
        if (typeF !== "all" && e.idType !== typeF) return false;
        if (!term) return true;
        return (e.referenceNumber || "").toLowerCase().includes(term)
            || normalizeReferenceNumber(e.referenceNumber).includes(normTerm)
            || (e.linkedUid || "").toLowerCase().includes(term);
    });

    if (resultsEmpty) resultsEmpty.hidden = filtered.length > 0;
    if (!filtered.length) {
        resultsBody.innerHTML = "";
        return;
    }

    resultsBody.innerHTML = filtered.map(e => `
        <tr data-id="${escapeHtml(e.id)}">
            <td>${escapeHtml(TYPE_LABELS[e.idType] || e.idType || "—")}</td>
            <td><code>${escapeHtml(e.referenceNumber || "—")}</code></td>
            <td><code class="admin-uid-cell">${escapeHtml(e.linkedUid || "—")}</code></td>
            <td>${e.updatedAt ? new Date(e.updatedAt).toLocaleDateString() : "—"}</td>
            <td>
                ${staffRole === "super" ? `<button type="button" class="admin-btn admin-btn-ghost admin-btn-sm admin-kyc-registry-delete" data-id="${escapeHtml(e.id)}">Remove</button>` : ""}
            </td>
        </tr>
    `).join("");

    resultsBody.querySelectorAll(".admin-kyc-registry-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!confirm("Remove this reference-number claim? The number becomes claimable again by any account.")) return;
            try {
                await deleteDoc(doc(db, "kycReferenceIndex", btn.dataset.id));
                await loadRegistry();
            } catch (err) {
                alert("Could not remove: " + (err.message || err));
            }
        });
    });
}

searchInput?.addEventListener("input", render);
typeFilter?.addEventListener("change", render);
refreshBtn?.addEventListener("click", loadRegistry);

// Manual add -- for pre-launch backfill or a submission that predates
// this feature. Goes through the SAME setDoc() + same firestore.rules
// path as kyc-form.js's automatic claim, so a manual entry here
// blocks a matching self-service registration exactly the same way,
// and (just as importantly) can't silently overwrite an existing
// claim under a different uid either -- the rules don't grant admin a
// bypass on the create path, only on update (see firestore.rules'
// kycReferenceIndex block), so even staff get a clear error here
// instead of accidentally reassigning someone's claim.
addForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idType = addType?.value;
    const referenceNumber = addNumber?.value?.trim();
    const linkedUid = addUid?.value?.trim();

    if (!idType || !referenceNumber || !linkedUid) {
        if (addStatus) addStatus.textContent = "Fill in type, reference number, and UID.";
        return;
    }

    const indexId = kycReferenceIndexId(idType, referenceNumber);
    if (!indexId) {
        if (addStatus) addStatus.textContent = "Reference number too short after normalization.";
        return;
    }

    const submitBtn = addForm.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    if (addStatus) addStatus.textContent = "Checking user exists…";

    try {
        const userSnap = await getDoc(doc(db, "users", linkedUid));
        if (!userSnap.exists()) {
            if (addStatus) addStatus.textContent = "No user found with that UID -- check it against the Users tab.";
            return;
        }

        await setDoc(doc(db, "kycReferenceIndex", indexId), {
            idType,
            referenceNumber,
            linkedUid,
            updatedAt: new Date().toISOString(),
            addedManuallyBy: user?.uid || null
        });

        if (addStatus) addStatus.textContent = "Saved.";
        addForm.reset();
        await loadRegistry();
    } catch (err) {
        console.error(err);
        if (err.code === "permission-denied") {
            if (addStatus) addStatus.textContent = "Already claimed by a different UID -- that's the duplicate this system exists to catch.";
        } else {
            if (addStatus) addStatus.textContent = "Could not save: " + (err.message || err);
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

loadRegistry();
