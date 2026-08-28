/* ==================================== */
/*  LISTING FORM                        */
/* ==================================== */
/* Everything that powers the "Create Listing" form: the flood   */
/* status dot, property-type-driven field visibility, the N/A    */
/* cost toggles, and the Firestore submit handler.                */
/* Client-side listing cap check (docs/CONTRACT-TIER-SYSTEM.md §7)  */
/* is fail-fast UX only, same as everywhere else in this app -- the */
/* real gate is server-side: submit calls the `createListing`      */
/* Cloud Function callable, which re-derives the cap itself and     */
/* rejects if the caller is already at capacity (Flagged_bugs.md    */
/* F-04). Direct `addDoc` on `properties` no longer works for       */
/* normal users -- firestore.rules denies it (see CREATE-VIA-       */
/* FUNCTION comment there).                                         */

import { user, db, functions } from "./core.js";
import { normalizeAmenityList } from "../listing-catalog.js";
import { loadPayPalSdk, LISTING_HELP_BUTTON } from "../payment-config.js";
import { createPropertyListingAuthoritative } from "../listing-create-gate.js";
import { refreshPerks, getOwnerListingCapStatus } from "./perks.js";
import { activateTab } from "./tabs.js";
import { getRole } from "./role.js";
import { getPinLocation, hasListingPin } from "./listing-map.js";
import { canCreateFirstListing, hasBrokerLicense, ownerImagesPerListing, totalImagesPerListing, resolveBoostPackageId, isSubscriptionEntitlementActive } from "../tiers.js";
import {
    compressImageFile, uploadListingImageViaEdge, listingImagePath
} from "../supabase.js";
import { doc, getDoc, query, where, getDocs, collection, addDoc, serverTimestamp, updateDoc }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { httpsCallable }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

/* -------- FLOOD STATUS DOT -------- */

window.updateFloodIndicator = function(value){
    const dot = document.getElementById("flood-indicator");
    const panel = document.getElementById("flood-history-panel");
    const chip = document.getElementById("flood-preview-chip");
    value = String(value || "na").toLowerCase();
    const labels = {
        safe: "Safe — no known flooding",
        low: "Low — rare / shallow",
        prone: "Prone — regular or deep",
        na: "Unknown",
    };
    const short = { safe: "Safe", low: "Low risk", prone: "Flood-prone", na: "Unknown" };
    if (dot) {
        dot.classList.remove("flood-safe","flood-low","flood-prone","flood-na");
        const map = { safe:"flood-safe", low:"flood-low", prone:"flood-prone", na:"flood-na" };
        dot.classList.add(map[value] || "flood-na");
        dot.title = short[value] || "Unknown";
    }
    if (chip) {
        const cls = { safe:"flood-safe", low:"flood-low", prone:"flood-prone", na:"flood-na" }[value] || "flood-na";
        chip.className = "flood-preview-chip is-" + (value || "na");
        chip.innerHTML = `<i class="bx bx-water"></i> Flood · ${short[value] || "Unknown"}`;
        chip.setAttribute("data-risk", value || "na");
    }
    if (panel) {
        const needsDetail = value === "low" || value === "prone";
        // Progressive: show history for low/prone; optional collapse for safe/na
        panel.classList.toggle("flood-history-emphasized", needsDetail);
        panel.classList.toggle("listing-cond-hidden", value === "na");
        panel.classList.toggle("listing-cond-block", value !== "na");
        // Safe still can open details — show panel but not emphasized
        if (value === "safe") {
            panel.classList.remove("listing-cond-hidden");
            panel.classList.add("listing-cond-block");
        }
        // Soft prompt text
        let tip = panel.querySelector(".flood-detail-prompt");
        if (!tip) {
            tip = document.createElement("p");
            tip.className = "field-hint flood-detail-prompt";
            panel.insertBefore(tip, panel.firstChild);
        }
        if (needsDetail) {
            tip.textContent = "Risk is elevated — frequency, last year, or depth helps seekers decide.";
            tip.hidden = false;
        } else if (value === "safe") {
            tip.textContent = "Optional: add history only if you want extra context for seekers.";
            tip.hidden = false;
        } else {
            tip.hidden = true;
        }
    }
}


/* -------- PROPERTY-TYPE-DRIVEN FIELDS -------- */
/* Shows/hides sections based on the selected classification so  */
/* owners only see questions relevant to their property type.    */

const propertyTypeGroups = {
    residential: ["condo_studio","bedspace_dorm","townhouse","house_lot"],
    commercial: ["office_fitted","coworking_desk","retail_store"],
    industrial: ["warehouse","industrial_lot","raw_land"]
};

function categoryOf(classification){
    for(const [category, values] of Object.entries(propertyTypeGroups)){
        if(values.includes(classification)) return category;
    }
    return null;
}

function applyConditionalFields(classification){
    const category = categoryOf(classification);

    document.querySelectorAll("[data-show-for]").forEach(el=>{
        const allowed = el.dataset.showFor.split(",").map(s=>s.trim());
        el.classList.toggle("listing-cond-hidden", !allowed.includes(category));
    });

    // Bed capacity + per-bed: optional; show mainly for bedspace/dorm
    const isBedspace = classification === "bedspace_dorm";
    const perBedField = document.getElementById("per-bed-price-group");
    const bedCapField = document.getElementById("bed-capacity-group");
    if (perBedField) {
        perBedField.classList.toggle("listing-cond-hidden", !isBedspace);
        const inp = document.getElementById("per_bed_price");
        if (inp) inp.required = false;
    }
    if (bedCapField) {
        bedCapField.classList.toggle("listing-cond-hidden", !isBedspace);
        const inp = document.getElementById("bed_capacity");
        if (inp) inp.required = false;
    }
}

const classificationSelect = document.getElementById("property_classification");
if(classificationSelect){
    classificationSelect.addEventListener("change", ()=>{
        applyConditionalFields(classificationSelect.value);
    });
    // run once on load in case a value is pre-selected (e.g. editing a listing)
    applyConditionalFields(classificationSelect.value);
}

/* -------- N/A TOGGLES FOR OPTIONAL COST FIELDS (Amount | N/A row) -------- */

function syncNaToggle(checkbox) {
    const targetInput = document.getElementById(checkbox.dataset.target);
    if (!targetInput) return;
    const row = checkbox.closest(".fee-input-row") || checkbox.closest(".field-group");
    const on = !!checkbox.checked;
    targetInput.disabled = on;
    targetInput.required = false;
    if (on) {
        targetInput.value = "";
        targetInput.setAttribute("data-na", "1");
    } else {
        targetInput.removeAttribute("data-na");
    }
    row?.classList.toggle("is-na", on);
    checkbox.closest(".fee-na-chip")?.classList.toggle("is-active", on);
}

document.querySelectorAll(".na-toggle").forEach((checkbox) => {
    checkbox.addEventListener("change", () => syncNaToggle(checkbox));
    syncNaToggle(checkbox);
});


/* -------- listing image + slot caps (boost-aware) -------- */
async function countOwnerListings(uid) {
    try {
        const { getDocs, query, collection, where } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        const { PROPERTY_LISTINGS } = await import("../collections.js");
        const snap = await getDocs(query(collection(db, PROPERTY_LISTINGS), where("ownerId", "==", uid)));
        return snap.size;
    } catch (e) {
        console.warn("countOwnerListings", e);
        try {
            const { getDocs, query, collection, where } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            const snap = await getDocs(query(collection(db, "propertyListings"), where("ownerId", "==", uid)));
            return snap.size;
        } catch (_) {
            return 0;
        }
    }
}


/** Group D — at capacity: hide create wizard, show manage cards only. */
function applyListingCapUI(slotsUsed, listingCap) {
    const atCap = Number(slotsUsed) >= Number(listingCap) && Number(listingCap) > 0;
    const formRoot = document.getElementById("listing-form-root");
    const banner = document.getElementById("listing-at-cap-banner");
    const panel = document.getElementById("panel-listing");
    if (formRoot) formRoot.hidden = atCap;
    if (banner) banner.hidden = !atCap;
    if (panel) panel.classList.toggle("is-listing-at-cap", atCap);
    if (atCap) {
        try {
            document.dispatchEvent(new CustomEvent("hf:listing-cap", { detail: { atCap, slotsUsed, listingCap } }));
        } catch (_) {}
    }
}

async function refreshListingImageCap() {
    const hint = document.getElementById("listing-images-cap-hint");
    const input = document.getElementById("listing-images-input");
    const slotLabel = document.getElementById("listing-slot-label");
    const photoLabel = document.getElementById("listing-photo-label");
    const slotChip = document.getElementById("listing-slot-chip");
    const photoChip = document.getElementById("listing-photo-chip");
    if (!input) {
        /* still gate wizard when photo input missing */
        try { applyListingCapUI(0, 1); } catch (_) {}
        return 1;
    }
    let max = 1;
    let listingCap = 1;
    let slotsUsed = 0;
    try {
        const { getDoc, doc, getDocs, query, collection, where } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        const { getRole } = await import("./role.js");
        const {
            totalImagesPerListing,
            tierIndexFromPoints,
            OWNER_TIERS,
            BROKER_TIERS,
            SEEKER_TIERS,
            resolveBoostPackageId,
            totalListingCap,
        } = await import("../tiers.js");
        const role = await getRole();
        const tierRole = role === "broker" ? "broker" : role === "seeker" ? "seeker" : "owner";
        const ladder = role === "broker" ? BROKER_TIERS : role === "seeker" ? SEEKER_TIERS : OWNER_TIERS;
        const tierSnap = await getDoc(doc(db, "users", user.uid, "tier", tierRole));
        let tierIndex = 0;
        if (tierSnap.exists()) {
            const td = tierSnap.data();
            tierIndex = Math.max(Number(td.highestIndex) || 0, tierIndexFromPoints(td.totalPoints || 0, ladder));
        }
        const [boostSnap, entitlementSnap] = await Promise.all([
            getDoc(doc(db, "boosts", user.uid)),
            getDoc(doc(db, "subscriptionEntitlements", user.uid))
        ]);
        const boostDoc = boostSnap.exists() ? boostSnap.data() : {};
        const entitlement = entitlementSnap.exists() ? entitlementSnap.data() : null;
        const pkg = resolveBoostPackageId(boostDoc.owner);
        max = Math.min(10, totalImagesPerListing(tierIndex, pkg) || 1);

        listingCap = totalListingCap(pkg, boostDoc.extraListings, tierIndex, entitlement);
        try {
            const profileSnap = await getDoc(doc(db, "users", user.uid));
            const override = profileSnap.exists() ? profileSnap.data().listingCapOverride : null;
            if (override != null) listingCap = Number(override) || listingCap;
        } catch (_) {}

        const activeListings = await countOwnerListings(user.uid);
        let activeContracts = 0;
        try {
            const cs = await getDocs(query(collection(db, "contracts"), where("ownerId", "==", user.uid), where("status", "==", "active")));
            activeContracts = cs.size;
        } catch (_) {}
        slotsUsed = activeListings + activeContracts;
    } catch (e) {
        console.warn(e);
        max = 1;
    }
    max = Math.max(1, Math.min(10, max));
    if (hint) {
        hint.textContent = `Photos on this listing: up to ${max} (tier + listing boost · hard max 10). First image is the cover.`;
    }
    input.dataset.maxImages = String(max);
    input.dataset.listingCap = String(listingCap);
    input.dataset.slotsUsed = String(slotsUsed);
    if (slotLabel) slotLabel.textContent = `Listings · ${slotsUsed} / ${listingCap} slots`;
    if (slotChip) slotChip.classList.toggle("is-at-cap", slotsUsed >= listingCap);
    applyListingCapUI(slotsUsed, listingCap);
    if (photoLabel) {
        const used = Number(input.dataset.photoCount || 0);
        photoLabel.textContent = `Photos · ${used} / ${max}`;
    }
    if (photoChip) photoChip.classList.toggle("is-at-cap", Number(input.dataset.photoCount || 0) >= max);
    return max;
}

function updatePhotoChip(count, max) {
    const photoLabel = document.getElementById("listing-photo-label");
    const photoChip = document.getElementById("listing-photo-chip");
    const input = document.getElementById("listing-images-input");
    const dropzone = document.getElementById("listing-images-dropzone");
    if (input) input.dataset.photoCount = String(count);
    if (photoLabel) photoLabel.textContent = `Photos · ${count} / ${max}`;
    if (photoChip) photoChip.classList.toggle("is-at-cap", count >= max);
    if (dropzone) dropzone.classList.toggle("is-at-photo-cap", count >= max);
}

/**
 * Property photos dropzone: unlike KYC's single-file swap-in-place
 * preview, this accumulates files across multiple picks/drops (up to
 * the boost-aware cap) and renders each as its own removable thumbnail.
 * The hidden <input> stays in sync via DataTransfer after every add/
 * remove, so the existing submit handler (reads imgInput.files) needs
 * no changes at all.
 */

let _listingHelpPaypalRendered = false;
async function renderListingHelpPaypal() {
  const mount = document.getElementById("paypal-container-Y3NZNSJYJ2Y24");
  if (!mount || _listingHelpPaypalRendered) return;
  try {
    mount.innerHTML = "<p class=\"field-hint\">Loading PayPal…</p>";
    const paypal = await loadPayPalSdk();
    mount.innerHTML = "";
    await paypal.HostedButtons({
      hostedButtonId: LISTING_HELP_BUTTON.hostedButtonId
    }).render("#paypal-container-Y3NZNSJYJ2Y24");
    _listingHelpPaypalRendered = true;
  } catch (err) {
    console.warn("listing help PayPal", err);
    if (mount) {
      mount.innerHTML = "<p class=\"field-hint\">PayPal could not load. Pay via PayPal app using product <strong>Need Help?</strong> (₱99.99), then paste the transaction ID below.</p>";
    }
  }
}

function setListingHelpStatus(state, text) {
  const box = document.getElementById("listing-help-status");
  const label = document.getElementById("listing-help-status-text");
  if (box) box.setAttribute("data-state", state || "idle");
  if (label) label.textContent = text || "Not requested";
}

async function applyListingHelpRoleVisibility() {
  const fieldset = document.getElementById("listing-help-fieldset");
  if (!fieldset) return;
  let role = "owner";
  try {
    role = (await getRole()) || "owner";
  } catch (_) {}
  const isBroker = role === "broker";
  fieldset.hidden = isBroker;
  fieldset.setAttribute("data-role-hidden", isBroker ? "broker" : "");
  const ownerCopy = document.getElementById("listing-help-owner-copy");
  const brokerCopy = document.getElementById("listing-help-broker-copy");
  if (ownerCopy) ownerCopy.hidden = isBroker;
  if (brokerCopy) brokerCopy.hidden = !isBroker;
  if (isBroker) {
    const cb = document.getElementById("needs_broker_help");
    if (cb) {
      cb.checked = false;
      cb.required = false;
    }
    const panel = document.getElementById("listing-help-pay-panel");
    if (panel) panel.hidden = true;
    const ref = document.getElementById("listing_help_payment_ref");
    if (ref) {
      ref.required = false;
      ref.value = "";
    }
  }
}

function wireListingHelpToggle() {
  const cb = document.getElementById("needs_broker_help");
  const panel = document.getElementById("listing-help-pay-panel");
  const ref = document.getElementById("listing_help_payment_ref");
  if (!cb || !panel) return;
  applyListingHelpRoleVisibility().catch(() => {});
  if (cb.dataset.wired === "1") return;
  cb.dataset.wired = "1";
  const sync = () => {
    panel.hidden = !cb.checked;
    if (ref) ref.required = !!cb.checked;
    if (!cb.checked && ref) ref.value = "";
    if (cb.checked) {
      setListingHelpStatus("pay", "Pay ₱99.99, then paste reference");
      renderListingHelpPaypal();
    } else {
      setListingHelpStatus("idle", "Not requested");
    }
  };
  ref?.addEventListener("input", () => {
    if (!cb.checked) return;
    const has = (ref.value || "").trim().length >= 6;
    setListingHelpStatus(has ? "ready" : "pay", has ? "Reference entered — submit listing" : "Pay ₱99.99, then paste reference");
  });
  cb.addEventListener("change", sync);
  sync();
}

function wireListingImagePreview() {
    const dropzone = document.getElementById("listing-images-dropzone");
    const input = document.getElementById("listing-images-input");
    const preview = document.getElementById("listing-images-preview");
    if (!dropzone || !input || !preview) return;
    // One-time wiring only (tab re-entry must not stack listeners).
    if (dropzone.dataset.wired === "1") return;
    dropzone.dataset.wired = "1";

    let files = [];
    const objectUrls = [];

    function syncInput() {
        try {
            const dt = new DataTransfer();
            files.forEach((f) => dt.items.add(f));
            input.files = dt.files;
        } catch (err) {
            // Some mobile WebViews throw on assigning input.files — thumbs still work.
            console.warn("syncInput DataTransfer", err);
        }
    }

    function render() {
        while (objectUrls.length) {
            try { URL.revokeObjectURL(objectUrls.pop()); } catch (_) {}
        }
        preview.innerHTML = "";
        const emptyState = document.getElementById("listing-dropzone-empty-state");
        const max = Number(input.dataset.maxImages || 1);
        if (emptyState) {
            emptyState.classList.toggle("listing-cond-hidden", files.length > 0);
            emptyState.hidden = files.length > 0;
            emptyState.style.display = files.length > 0 ? "none" : "";
        }
        if (files.length) {
            preview.classList.add("is-active");
            preview.style.display = "grid";
        } else {
            preview.classList.remove("is-active");
            preview.style.display = "none";
        }
        files.forEach((f, i) => {
            const wrap = document.createElement("div");
            wrap.className = "listing-image-thumb-wrap" + (i === 0 ? " is-cover" : "");

            const img = document.createElement("img");
            const url = URL.createObjectURL(f);
            objectUrls.push(url);
            img.src = url;
            img.alt = f.name || `Photo ${i + 1}`;
            img.className = "listing-image-thumb";
            img.loading = "lazy";

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "listing-image-thumb-remove";
            removeBtn.setAttribute("aria-label", `Remove photo ${i + 1}`);
            removeBtn.innerHTML = "<i class='bx bx-x'></i>";
            removeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                files.splice(i, 1);
                render();
                syncInput();
            });

            wrap.appendChild(img);
            wrap.appendChild(removeBtn);
            preview.appendChild(wrap);
        });
        updatePhotoChip(files.length, max);
    }

    function addFiles(newFiles) {
        const max = Number(input.dataset.maxImages || 1);
        const all = [...newFiles];
        const isAllowedImage = (f) => {
            const ty = (f.type || "").toLowerCase();
            const n = (f.name || "").toLowerCase();
            if (ty === "image/jpeg" || ty === "image/jpg" || ty === "image/png" || ty === "image/webp") return true;
            if (ty.startsWith("image/") && !ty.includes("heic") && !ty.includes("heif")) return true;
            if (/\.(jpe?g|png|webp)$/i.test(n)) return true;
            if (!ty && f.size > 0 && f.size < 12 * 1024 * 1024) return true;
            return false;
        };
        const incoming = all.filter(isAllowedImage);
        const rejected = all.length - incoming.length;
        if (rejected > 0) {
            alert(`${rejected} file(s) skipped — use JPG, PNG, or WebP (not HEIC).`);
        }
        const room = max - files.length;
        if (room <= 0) {
            alert(`Photo limit reached (${max}). Remove a photo to add another.`);
            return;
        }
        if (incoming.length > room) {
            alert(`Your plan allows up to ${max} photo(s). Added ${room}; ${incoming.length - room} not added.`);
        }
        files = files.concat(incoming.slice(0, Math.max(room, 0)));
        // Thumbs first (visible even if DataTransfer sync fails on some phones)
        render();
        syncInput();
    }

    dropzone.addEventListener("click", (e) => {
        if (e.target.closest(".listing-image-thumb-remove")) return;
        if (e.target.closest("label[for='listing-images-input']")) return; // label triggers input
        if (e.target === input || e.target.closest("input[type=file]")) return;
        // Reset before opening the native picker (not after a successful
        // pick -- see the "change" handler below) so re-picking the same
        // file still fires "change" on mobile, without wiping input.files
        // while it's holding the files the submit handler needs to read.
        input.value = "";
        try { input.click(); } catch (_) {}
    });
    dropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            input.value = "";
            input.click();
        }
    });

    input.addEventListener("change", () => {
        if (input.files?.length) {
            addFiles(Array.from(input.files));
            // NOTE: do not reset input.value here. addFiles() -> syncInput()
            // just set input.files to the full accumulated selection, which
            // is exactly what the submit handler reads at listing-create time
            // ("Property photos" block further down). Clearing it here left
            // imgInput.files permanently empty by the time the user actually
            // hit "List Property", so no photo ever uploaded even when the
            // thumbnail preview looked right. The re-pick-same-file-on-mobile
            // reset now happens before the picker reopens instead (dropzone
            // click/keydown handlers above), which gets the same mobile fix
            // without discarding the accumulated files in between.
        }
    });

    ["dragover", "dragenter"].forEach(evt =>
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        })
    );
    ["dragleave", "dragend"].forEach(evt =>
        dropzone.addEventListener(evt, () => dropzone.classList.remove("dragover"))
    );
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    });

    // form.reset() (called after a successful submit) clears the
    // input's FileList natively, but not this closure's `files` array
    // or the rendered thumbnails -- without this they'd linger stale.
    document.getElementById("create-property-form")
        ?.addEventListener("reset", () => {
            files = [];
            render();
        });
}

refreshListingImageCap().then(() => {
  try { wireListingImagePreview(); } catch (_) {}
}).catch(() => {
  try { wireListingImagePreview(); } catch (_) {}
});
wireListingHelpToggle();

const floodSel = document.getElementById("flood_status");
if (floodSel) {
    floodSel.addEventListener("change", () => window.updateFloodIndicator(floodSel.value));
    window.updateFloodIndicator(floodSel.value);
}

/* -------- SUBMIT: CREATE LISTING -------- */

const createPropertyForm = document.getElementById("create-property-form");
if(createPropertyForm){
    createPropertyForm.addEventListener("submit", async (e)=>{
        e.preventDefault();
        // Visible feedback that submit fired (helps debug "silent" clicks)
        const _busy = createPropertyForm.querySelector('button[type="submit"]');
        if (_busy && _busy.disabled) return;
        if (!createPropertyForm.checkValidity()) {
            createPropertyForm.reportValidity();
            const bad = createPropertyForm.querySelector(":invalid");
            if (bad) {
                bad.scrollIntoView({ behavior: "smooth", block: "center" });
                try { bad.focus(); } catch (_) {}
            }
            alert("Please complete the highlighted required fields before publishing.");
            return;
        }

        const role = await getRole();

        // Unverified publishers allowed: listing goes to pending_approval
        // until admin approves (notif bell + admin Properties queue).
        let publisherVerified = false;
        try {
            const profileSnap = await getDoc(doc(db, "users", user.uid));
            const profile = profileSnap.exists() ? profileSnap.data() : {};
            if (profile.verified === true || profile.idVerified === true) {
                profile.idVerification = Object.assign({}, profile.idVerification || {}, { status: "verified" });
            }
            const idSt = String(profile.idVerification?.status || "").toLowerCase();
            publisherVerified = idSt === "verified" || idSt === "approved";
            // Soft nudge only — does not block submit
            if (!publisherVerified) {
                const toastContainer = document.getElementById("toast-container");
                if (toastContainer) {
                    const toast = document.createElement("div");
                    toast.className = "toast info kyc-toast";
                    toast.innerHTML = `
                        <i class='bx bx-info-circle'></i>
                        <div>
                            <strong>Unverified publisher</strong>
                            <p>Your listing will be submitted for admin approval before it appears on the Market. Verify your ID anytime for instant publish next time.</p>
                        </div>`;
                    toastContainer.appendChild(toast);
                    setTimeout(() => toast.remove(), 10000);
                }
            }
        } catch (profileErr) {
            console.warn("profile verify check", profileErr);
            publisherVerified = false;
        }

            const capStatus = await getOwnerListingCapStatus();
            if(capStatus.atCap){
                alert(
                    `You've reached your listing capacity (${capStatus.slotsUsed ?? capStatus.activeListings}/${capStatus.listingCap}). ` +
                    `${capStatus.activeContracts ? capStatus.activeContracts + " slot(s) held by ongoing contracts. " : ""}` +
                    `Buy Extra Listing Slot (₱49.99/mo each) or a Listing Boost package for more slots.`
                );
                return;
            }

        const formData = new FormData(createPropertyForm);
        const earlyBtn = createPropertyForm.querySelector('button[type="submit"]');
        if (earlyBtn) {
            earlyBtn.disabled = true;
            earlyBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Checking form…";
        }

        // Neither price field has a `required` attribute (exactly one
        // should be filled depending on classification -- monthly for
        // most types, per-bed for bedspace/dorm -- so HTML `required`
        // can't express an either/or). Enforced here instead.
        if(!formData.get("monthly_price") && !formData.get("per_bed_price")){
            alert("Please enter a monthly rent or a price per bed before publishing this listing.");
            return;
        }

        const listing = {};

        for(const [key, value] of formData.entries()){
            // Never put File/Blob into the Firestore payload (upload separately)
            if (typeof File !== "undefined" && value instanceof File) continue;
            if (typeof Blob !== "undefined" && value instanceof Blob && !(typeof File !== "undefined" && value instanceof File) && value.constructor?.name === "Blob") continue;
            if (value && typeof value === "object" && (value.name && value.size != null && value.type != null)) continue;
            // fields named like "amenities[]" collect into arrays
            const cleanKey = key.replace("[]","");
            if (cleanKey === "listing_images" || cleanKey === "images") continue;
            if(key.endsWith("[]")){
                if(!listing[cleanKey]) listing[cleanKey] = [];
                listing[cleanKey].push(value);
            } else {
                listing[cleanKey] = value;
            }
        }
        // Hard strip any leftover file-ish keys
        delete listing.listing_images;
        // Merge visitor window times into visitor_hours display string when notes empty
        try {
            const vf = document.getElementById("visitor_hours_from")?.value;
            const vt = document.getElementById("visitor_hours_to")?.value;
            if (vf || vt) {
                const note = String(listing.visitor_hours || "").trim();
                listing.visitor_hours = [vf && `from ${vf}`, vt && `to ${vt}`, note].filter(Boolean).join(" · ");
            }
            // Normalize flood history numeric fields
            if (listing.flood_last_year) listing.flood_last_year = Number(listing.flood_last_year) || null;
            if (listing.flood_depth_cm) listing.flood_depth_cm = Number(listing.flood_depth_cm) || null;
            listing.floodHistory = {
                status: listing.flood_status || "na",
                frequency: listing.flood_frequency || "unknown",
                lastYear: listing.flood_last_year || null,
                depthCm: listing.flood_depth_cm || null,
                source: listing.flood_source || "owner",
                notes: listing.flood_notes || ""
            };
        } catch (_) {}


        const dealPick = createPropertyForm.querySelector('input[name="deal_type"]:checked')
            || createPropertyForm.querySelector('input[name="deal_types"]:checked');
        if (!dealPick) {
            alert("Choose one contract type: Rent, Lease, Rent-to-own, or Sale.");
            return;
        }
        listing.deal_type = dealPick.value;
        listing.dealType = dealPick.value; /* camelCase alias for market/contract (B) */
        listing.deal_types = [dealPick.value];
        listing.ownerId = user.uid;
        /* E: type field symmetry for market matchesType */
        {
            const t = String(listing.property_classification || listing.classification || "").trim();
            if (t) {
                listing.property_classification = t;
                listing.classification = t;
            }
        }
        /* D: createdAt set as Firestore serverTimestamp in listing-create-gate */
        delete listing.createdAt;
        // Keep floor_area as free text (e.g. "20x40" or "30")
        if (listing.floor_area != null) {
            const fa = String(listing.floor_area).trim().replace(/,/g, "");
            const faNum = parseFloat(fa);
            if (!Number.isFinite(faNum) || faNum < 5 || faNum > 500) {
                alert("Floor area must be a number between 5 and 500 sqm (e.g. 22.5).");
                return;
            }
            listing.floor_area = faNum;
        }
        // D: coerce money/count fields to numbers (or drop empty / keep "na")
        for (const k of [
            "security_deposit","advance_rent","downpayment","monthly_price","sale_price","per_bed_price",
            "number_of_bathrooms","number_of_beds","bed_capacity"
        ]) {
            if (listing[k] === "" || listing[k] == null) {
                delete listing[k];
            } else if (listing[k] === "na") {
                listing[k] = "na";
            } else {
                const n = Number(listing[k]);
                if (Number.isFinite(n)) listing[k] = n;
                else delete listing[k];
            }
        }


        // Property photos → Supabase Storage (public listing-images bucket)
        const imgInput = document.getElementById("listing-images-input");
        if (imgInput && imgInput.files && imgInput.files.length) {
            const max = Number(imgInput.dataset.maxImages || await refreshListingImageCap());
            const files = [...imgInput.files].slice(0, max);
            const folderId = `draft-${Date.now()}`;
            const imageUrls = [];
            const imagePaths = [];
            const firebaseIdToken = await user.getIdToken();
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                try {
                    const blob = await compressImageFile(f, 1400, 0.8);
                    const path = listingImagePath(user.uid, folderId, i);
                    const up = await Promise.race([
                        uploadListingImageViaEdge(firebaseIdToken, path, blob),
                        new Promise((_, rej) => setTimeout(() => rej(new Error("Photo upload timed out (15s). Check Supabase storage.")), 15000))
                    ]);
                    if (up.url) imageUrls.push(up.url);
                    imagePaths.push(up.path);
                } catch (imgErr) {
                    console.warn(imgErr);
                    console.warn(imgErr);
                    // Do not abort the whole listing — continue other files / publish without this photo
                    alert(`Photo skipped (${f.name}): ${imgErr.message || imgErr}\nYou can still publish; add photos later if the listing allows.`);
                }
            }
            listing.images = imageUrls;
            listing.imagePaths = imagePaths;
            listing.imageStorage = "supabase";
            if (imageUrls[0]) {
                listing.coverImage = imageUrls[0];
                listing.coverUrl = imageUrls[0]; /* Market card alias (A) */
            }
        }


                /* C1: MapLibre 3D pin required — no Nominatim substitute for Market radius accuracy */
        if (!hasListingPin()) {
            alert(
                "⚠️ Property pin required\n\n" +
                "This listing cannot be published without a MapLibre 3D pin.\n\n" +
                "1) Open “Open 3D map & set pin”\n" +
                "2) Tap the map\n" +
                "3) Confirm “Use this pin”\n\n" +
                "Address text alone is not enough for Market radius matching."
            );
            document.getElementById("locate-on-map-btn")?.focus();
            if (earlyBtn) {
                earlyBtn.disabled = false;
                earlyBtn.innerHTML = "List Property";
            }
            return;
        }
        /* Group F: coordinates from confirmed pin only — never geocode at submit */
        const pin = getPinLocation();
        listing.lat = Number(pin.lat);
        listing.lng = Number(pin.lng);
        listing.location = { lat: listing.lat, lng: listing.lng };
        listing.pinSource = pin.source || "map-confirm";


        const submitBtn = createPropertyForm.querySelector('button[type="submit"]');
        const prevLabel = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Creating listing…";
        }

        try {
            const lockOk = confirm("Publish this listing?\n\nFor 48 hours after this listing goes live you cannot edit or delete it. After that you can manage it from your active listings.\n\nContinue?");
            if (!lockOk) {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = prevLabel || "List Property"; }
                return;
            }
            // Spark plan: Cloud Functions often return functions/internal.
            // Always write from the client first (rules allow ownerId + createdAt).
            let result = null;

            // Phase 1 SoT §27: listing help — pay at submit, staff verifies
            const needsHelp = !!document.getElementById("needs_broker_help")?.checked;
            if (needsHelp) {
                const ref = String(document.getElementById("listing_help_payment_ref")?.value || "").trim();
                if (ref.length < 4) {
                    alert("Broker listing help requires a payment reference (₱99.99). Enter your payment ref, then submit again.");
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = prevLabel || "List Property"; }
                    return;
                }
                listing.needsBrokerHelp = true;
                listing.listingHelpFeePhp = 99.99;
                listing.listingHelpPaymentStatus = "checking";
                listing.listingHelpPaymentRef = ref;
                listing.listingHelpSubmittedAt = new Date().toISOString();
                // Hold off Market until staff verifies payment (even if ID-verified)
                listing.status = "pending_approval";
                listing.approvalStatus = "pending";
                listing.pendingReason = "listing_help_payment_check";
            } else {
                listing.needsBrokerHelp = false;
                listing.listingHelpFeePhp = null;
                listing.listingHelpPaymentStatus = "none";
            }

            if (!listing.needsBrokerHelp) {
              listing.status = publisherVerified ? "active" : "pending_approval";
              listing.approvalStatus = publisherVerified ? "approved" : "pending";
            }
            listing.publisherVerified = !!publisherVerified;
            listing.submittedAt = listing.submittedAt || new Date().toISOString();
            // 30-day listing window (renewal reminder is client/admin-side)
            if (!listing.expiresAt) {
                const exp = new Date();
                exp.setDate(exp.getDate() + 30);
                listing.expiresAt = exp.toISOString();
            }
            // Firestore only accepts JSON-ish values — strip File/Blob/undefined
            for (const k of Object.keys(listing)) {
                const v = listing[k];
                if (v === undefined) { delete listing[k]; continue; }
                if (typeof File !== "undefined" && v instanceof File) { delete listing[k]; continue; }
                if (typeof Blob !== "undefined" && v instanceof Blob) { delete listing[k]; continue; }
                if (Array.isArray(v) && v.some(x => (typeof File !== "undefined" && x instanceof File) || (typeof Blob !== "undefined" && x instanceof Blob))) {
                    listing[k] = v.filter(x => !(typeof File !== "undefined" && x instanceof File) && !(typeof Blob !== "undefined" && x instanceof Blob));
                }
            }
            delete listing.listing_images;
        // Merge visitor window times into visitor_hours display string when notes empty
        try {
            const vf = document.getElementById("visitor_hours_from")?.value;
            const vt = document.getElementById("visitor_hours_to")?.value;
            if (vf || vt) {
                const note = String(listing.visitor_hours || "").trim();
                listing.visitor_hours = [vf && `from ${vf}`, vt && `to ${vt}`, note].filter(Boolean).join(" · ");
            }
            // Normalize flood history numeric fields
            if (listing.flood_last_year) listing.flood_last_year = Number(listing.flood_last_year) || null;
            if (listing.flood_depth_cm) listing.flood_depth_cm = Number(listing.flood_depth_cm) || null;
            listing.floodHistory = {
                status: listing.flood_status || "na",
                frequency: listing.flood_frequency || "unknown",
                lastYear: listing.flood_last_year || null,
                depthCm: listing.flood_depth_cm || null,
                source: listing.flood_source || "owner",
                notes: listing.flood_notes || ""
            };
        } catch (_) {}

            /* SoT §14: callable-first gate, validated client fallback (Spark) */
            try {
                const created = await createPropertyListingAuthoritative(listing);
                result = { data: { id: created.id, via: created.via } };
            } catch (createErr) {
                console.error("Authoritative property create failed:", createErr);
                throw createErr;
            }
            const newId = result?.data?.id || result?.data?.propertyId || "";
            const heldForHelp = !!listing.needsBrokerHelp;
            const toastBox = document.getElementById("toast-container");
            if (toastBox) {
                const t = document.createElement("div");
                t.className = "toast success";
                if (heldForHelp) {
                    t.innerHTML = `<i class='bx bx-time-five'></i><div><strong>Listing help · payment check</strong><p>₱99.99 under staff review${newId ? " · ID " + newId : ""}.</p></div>`;
                } else if (publisherVerified) {
                    t.innerHTML = `<i class='bx bx-check-circle'></i><div><strong>Listing published</strong><p>Your property is live${newId ? " · ID " + newId : ""}. Check Market and Featured.</p></div>`;
                } else {
                    t.innerHTML = `<i class='bx bx-time-five'></i><div><strong>Submitted for approval</strong><p>Unverified listings need admin approval. Watch your notification bell.</p></div>`;
                }
                toastBox.appendChild(t);
                setTimeout(() => t.remove(), 8000);
            }
            try {
                if (heldForHelp && user?.uid) {
                    try {
                        await addDoc(collection(db, "assistanceRequests"), {
                            type: "list_property",
                            helpType: "list_property",
                            title: listing.title || listing.property_title || "Listing help",
                            summary: "Client requested broker help to list a property.",
                            status: "open",
                            posterId: user.uid,
                            posterRole: (await getRole()) || "owner",
                            propertyId: newId || null,
                            listingHelpFeePhp: 99.99,
                            listingHelpPaymentStatus: "checking",
                            listingHelpPaymentRef: listing.listingHelpPaymentRef || null,
                            lat: listing.lat != null ? Number(listing.lat) : null,
                            lng: listing.lng != null ? Number(listing.lng) : null,
                            createdAt: serverTimestamp()
                        });
                    } catch (assistErr) {
                        console.warn("assistanceRequests create", assistErr);
                    }
                }
                if (heldForHelp) {
                    await addDoc(collection(db, "notifications", user.uid, "items"), {
                        type: "listing_help_payment_check",
                        title: "Listing help — payment check",
                        message: "Your listing was submitted with broker help (₱99.99). Staff will verify payment before it can go live.",
                        propertyId: newId || null,
                        read: false,
                        createdAt: serverTimestamp()
                    });
                    alert(`Listing submitted.\nFee: ₱99.99 · payment under staff review.${newId ? "\nProperty ID: " + newId : ""}\n\nIt will not go live until payment is verified.`);
                } else if (publisherVerified) {
                    try {
                        const { notifyMatchesForListing } = await import("./match-notify.js");
                        await notifyMatchesForListing({ id: newId, ...listing });
                    } catch (_) {}
                    await addDoc(collection(db, "notifications", user.uid, "items"), {
                        type: "listing_published",
                        title: "Listing published",
                        message: "Your property is live on the Market.",
                        propertyId: newId || null,
                        read: false,
                        createdAt: serverTimestamp()
                    });
                    alert(`Listing published successfully!${newId ? "\nProperty ID: " + newId : ""}\n\nOpen Market or the Featured tab to see it.`);
                } else {
                    await addDoc(collection(db, "notifications", user.uid, "items"), {
                        type: "listing_pending_approval",
                        title: "Listing pending approval",
                        message: "Your listing was submitted. An admin will review it before it appears on the Market. You will be notified here.",
                        propertyId: newId || null,
                        read: false,
                        createdAt: serverTimestamp()
                    });
                    alert(`Listing submitted for admin approval.${newId ? "\nProperty ID: " + newId : ""}\n\nUnverified publishers need approval before Market visibility. Check your notification bell.`);
                }
            } catch (_) {
                if (heldForHelp) {
                    alert(`Listing submitted for payment check.${newId ? "\nProperty ID: " + newId : ""}`);
                } else if (publisherVerified) {
                    alert(`Listing published successfully!${newId ? "\nProperty ID: " + newId : ""}`);
                } else {
                    alert(`Listing submitted for admin approval.${newId ? "\nProperty ID: " + newId : ""}`);
                }
            }
            document.dispatchEvent(new Event("hf:listing-created"));
            createPropertyForm.reset();
            applyConditionalFields("");
            refreshPerks();
            // Form had no "done" state -- fields cleared via .reset() but the
            // full multi-section form stayed open/visible on the same tab, so
            // publishing felt like nothing happened (user report: "form still
            // open after final confirmation"). The just-created listing card
            // already renders via active-listings.js's own
            // hf:listing-created listener -- it just lives on a different
            // tab (Perks & Portfolio > "Your listings"), so the user never
            // saw it without manually switching tabs. Jump there now: the
            // List Property tab is left reset and ready for "add another
            // listing" next time they come back to it.
            activateTab("perks");
        } catch(error){
            console.error(error);
            let reason = error.message;
            if(error.code === "permission-denied"){
                reason = "Permission denied -- check Firestore rules for 'propertyListings' (canonical property inventory).";
            } else if(error.code === "unavailable" || !navigator.onLine){
                reason = "No internet connection -- check your WiFi/data and try again.";
            }
            alert("Couldn't create the listing:\n\n" + reason + "\n\nIf this persists: confirm you are signed in, your ID shows Verified, and firestore.rules allow propertyListings create.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = prevLabel || "List Property";
            }
        }
    });
}


/* Curfew / visitor progressive disclosure + live access preview chips */
(function wireRuleTimes(){
    function showRow(el, on) {
        if (!el) return;
        el.classList.toggle("listing-cond-hidden", !on);
        el.classList.toggle("listing-cond-block", !!on);
        el.classList.toggle("listing-cond-flex", !!on);
    }
    function updateAccessPreview() {
        const curfewEl = document.getElementById("access-preview-curfew");
        const visEl = document.getElementById("access-preview-visitors");
        const curfew = document.querySelector('input[name="curfew_policy"]:checked')?.value || "none";
        const visitor = document.querySelector('input[name="visitor_policy"]:checked')?.value || "allowed";
        const gate = document.getElementById("curfew_time")?.value || "";
        const buildingNote = (document.getElementById("curfew_building_notes")?.value || "").trim();
        const vf = document.getElementById("visitor_hours_from")?.value || "";
        const vt = document.getElementById("visitor_hours_to")?.value || "";
        const vNote = (document.getElementById("visitor_hours")?.value || "").trim();
        const noneNote = (document.getElementById("visitor_none_notes")?.value || "").trim();

        if (curfewEl) {
            let c = "Curfew · None";
            if (curfew === "building") c = buildingNote ? `Curfew · Building · ${buildingNote.slice(0, 40)}` : "Curfew · Building rules";
            if (curfew === "custom") c = gate ? `Curfew · Gate ${gate}` : "Curfew · Custom gate time";
            curfewEl.innerHTML = `<i class="bx bx-time-five"></i> ${c}`;
            curfewEl.classList.toggle("is-active", curfew !== "none");
        }
        if (visEl) {
            let v = "Visitors · Allowed anytime";
            if (visitor === "restricted") {
                v = vf || vt ? `Visitors · ${vf || "?"}–${vt || "?"}` : "Visitors · Restricted hours";
                if (vNote) v += ` · ${vNote.slice(0, 28)}`;
            }
            if (visitor === "none") {
                v = noneNote ? `Visitors · Not allowed · ${noneNote.slice(0, 28)}` : "Visitors · Not allowed";
            }
            visEl.innerHTML = `<i class="bx bx-user-check"></i> ${v}`;
            visEl.classList.toggle("is-active", visitor !== "allowed");
        }
    }
    function sync(){
        const curfew = document.querySelector('input[name="curfew_policy"]:checked')?.value || "none";
        showRow(document.getElementById("curfew-time-row"), curfew === "custom");
        showRow(document.getElementById("curfew-building-row"), curfew === "building");
        const timeInput = document.getElementById("curfew_time");
        if (timeInput) timeInput.required = curfew === "custom";

        const visitor = document.querySelector('input[name="visitor_policy"]:checked')?.value || "allowed";
        showRow(document.getElementById("visitor-hours-row"), visitor === "restricted");
        showRow(document.getElementById("visitor-none-row"), visitor === "none");
        const vf = document.getElementById("visitor_hours_from");
        const vt = document.getElementById("visitor_hours_to");
        if (vf) vf.required = visitor === "restricted";
        if (vt) vt.required = visitor === "restricted";
        updateAccessPreview();
    }
    document.querySelectorAll('input[name="curfew_policy"], input[name="visitor_policy"]').forEach(el => {
        el.addEventListener("change", sync);
    });
    ["curfew_time", "curfew_building_notes", "visitor_hours_from", "visitor_hours_to", "visitor_hours", "visitor_none_notes"].forEach((id) => {
        document.getElementById(id)?.addEventListener("input", updateAccessPreview);
        document.getElementById(id)?.addEventListener("change", updateAccessPreview);
    });
    sync();
})();

(function wireDealTypeHint(){
    const hints = {
        rent: "Use monthly price (and per-bed price if bedspace).",
        lease: "Use monthly price for the lease term.",
        rent_to_own: "Monthly price plus any rent-to-own notes in description.",
        sale: "Use sale / total price fields where shown; monthly rent optional.",
    };
    const hintEl = document.getElementById("deal-type-hint");
    function sync() {
        const v = document.querySelector('input[name="deal_type"]:checked')?.value;
        if (!hintEl) return;
        if (!v || !hints[v]) {
            hintEl.hidden = true;
            hintEl.textContent = "";
            return;
        }
        hintEl.hidden = false;
        hintEl.textContent = hints[v];
    }
    document.querySelectorAll('input[name="deal_type"]').forEach((el) => el.addEventListener("change", sync));
    sync();
})();


/* Conditional required fields by property type — bed capacity & per-bed never required */
function applyListingFieldOptionality() {
    const typeEl =
        document.getElementById("property_classification") ||
        document.getElementById("property-type") ||
        document.querySelector('[name="property_type"]') ||
        document.querySelector('[name="property_classification"]');
    const baths = document.getElementById("number_of_bathrooms");
    const beds = document.getElementById("number_of_beds");
    const bedCap = document.getElementById("bed_capacity");
    const perBed = document.getElementById("per_bed_price");
    const type = (typeEl?.value || "").toLowerCase();
    const industrial = ["warehouse", "industrial_lot", "raw_land", "lot", "commercial_lot"].includes(type);
    if (baths) {
        baths.required = false; // soft: optional UI; server may still validate category
        if (industrial && (!baths.value || baths.value === "")) baths.value = "";
    }
    if (beds) beds.required = false;
    if (bedCap) bedCap.required = false;
    if (perBed) perBed.required = false;
}
document.getElementById("property_classification")?.addEventListener("change", applyListingFieldOptionality);
document.getElementById("property-type")?.addEventListener("change", applyListingFieldOptionality);
document.querySelector('[name="property_type"]')?.addEventListener("change", applyListingFieldOptionality);
applyListingFieldOptionality();

/* Flood frequency: hide year/depth when "never" */
(function wireFloodFrequencyDetail() {
    function sync() {
        const freq = document.getElementById("flood_frequency")?.value || "unknown";
        const never = freq === "never";
        const yearG = document.getElementById("flood-last-year-group");
        const depthG = document.getElementById("flood-depth-group");
        const year = document.getElementById("flood_last_year");
        const depth = document.getElementById("flood_depth_cm");
        if (yearG) {
            yearG.classList.toggle("listing-cond-hidden", never);
            yearG.hidden = never;
        }
        if (depthG) {
            depthG.classList.toggle("listing-cond-hidden", never);
            depthG.hidden = never;
        }
        if (never) {
            if (year) {
                year.value = "";
                year.required = false;
            }
            if (depth) {
                depth.value = "";
                depth.required = false;
            }
        } else {
            if (year) year.required = false;
            if (depth) depth.required = false;
        }
    }
    document.getElementById("flood_frequency")?.addEventListener("change", sync);
    sync();
})();


/* Amenities: category tabs + badges; hide panels never clear checks */
(function wireAmenitiesTabs() {
    const root = document.getElementById("listing-amenities-block");
    if (!root || root.dataset.amenitiesWired === "1") return;
    root.dataset.amenitiesWired = "1";

    const labels = {
        wifi: "Wi‑Fi", aircon: "Aircon", parking: "Parking", security: "Security", cctv: "CCTV",
        power_backup: "Backup power", water_included: "Water incl.", gated: "Gated entry", access_24h: "24h access",
        furnished: "Furnished", semi_furnished: "Semi-furnished", kitchen: "Kitchen", laundry: "Laundry",
        pets: "Pets OK", elevator: "Elevator", balcony: "Balcony", own_meter: "Own meter",
        fiber_ready: "Fiber-ready", meeting_room: "Meeting room", reception: "Reception", fit_out: "Fitted",
        street_frontage: "Street frontage", display_window: "Display window",
        loading_bay: "Loading bay", loading_area: "Loading area", truck_access: "Truck access",
        racking_ok: "Racking OK", existing_racking: "Existing racking", pallet_ready: "Pallet-ready",
        three_phase_power: "3-phase power", high_clearance: "High clearance", yard_space: "Yard space",
        fire_sprinkler: "Fire sprinkler",
    };

    function selectedValues() {
        return normalizeAmenityList([...root.querySelectorAll('input[name="amenities[]"]:checked')].map((el) => el.value));
    }

    function updateSummary() {
        const summary = document.getElementById("amenities-selected-summary");
        const vals = selectedValues();
        if (!summary) return;
        if (!vals.length) {
            summary.textContent = "Selected: none";
            return;
        }
        const names = vals.map((v) => labels[v] || v);
        const head = names.slice(0, 4).join(" · ");
        const more = names.length > 4 ? ` · +${names.length - 4} more` : "";
        summary.textContent = `Selected: ${head}${more}`;
    }

    function updateBadges() {
        ["residential", "workspace", "industrial"].forEach((cat) => {
            const panel = root.querySelector(`[data-amenities-panel="${cat}"]`);
            const badge = root.querySelector(`[data-badge-for="${cat}"]`);
            if (!panel || !badge) return;
            const n = panel.querySelectorAll('input[name="amenities[]"]:checked').length;
            badge.textContent = String(n);
            badge.hidden = n === 0;
        });
    }

    function activateTab(cat) {
        root.querySelectorAll(".amenities-cat-tab").forEach((btn) => {
            const on = btn.getAttribute("data-amenities-tab") === cat;
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
        });
        root.querySelectorAll(".amenities-cat-panel").forEach((panel) => {
            const on = panel.getAttribute("data-amenities-panel") === cat;
            panel.classList.toggle("is-active", on);
            panel.hidden = !on;
        });
    }

    root.querySelectorAll(".amenities-cat-tab").forEach((btn) => {
        btn.addEventListener("click", () => activateTab(btn.getAttribute("data-amenities-tab")));
    });

    root.addEventListener("change", (e) => {
        if (e.target?.matches?.('input[name="amenities[]"]')) {
            updateSummary();
            updateBadges();
        }
    });

    // Suggest tab from property classification without clearing selections
    function suggestTabFromType() {
        const typeEl =
            document.getElementById("property_classification") ||
            document.getElementById("property-type") ||
            document.querySelector('[name="property_classification"]');
        const type = (typeEl?.value || "").toLowerCase();
        const industrial = ["warehouse", "industrial_lot"].includes(type);
        const workspace = ["office_fitted", "coworking_desk", "retail_store"].includes(type);
        if (industrial) activateTab("industrial");
        else if (workspace) activateTab("workspace");
        else activateTab("residential");
    }
    document.getElementById("property_classification")?.addEventListener("change", suggestTabFromType);
    document.getElementById("property-type")?.addEventListener("change", suggestTabFromType);

    updateSummary();
    updateBadges();
    suggestTabFromType();
})();


/* -------- 5-step listing shell (step 1 gates on pin) -------- */

/* Step 2: price visibility + soft fee defaults by deal type (does not wipe entered amounts) */
(function wireDealTypePricing() {
    function setNaIfEmpty(id, wantNa) {
        const input = document.getElementById(id);
        const na = document.querySelector(`.na-toggle[data-target="${id}"]`);
        if (!input || !na) return;
        if (!wantNa) return;
        if ((input.value || "").trim() !== "") return; // respect user amount
        if (na.checked) return;
        na.checked = true;
        na.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function clearNaIfNeeded(id) {
        const input = document.getElementById(id);
        const na = document.querySelector(`.na-toggle[data-target="${id}"]`);
        if (!input || !na) return;
        // do not force uncheck — user may still want N/A
    }
    function sync() {
        const deal = document.querySelector('input[name="deal_type"]:checked')?.value || "rent";
        const monthlyG = document.getElementById("monthly-price-group");
        const saleG = document.getElementById("sale-price-group");
        const isSale = deal === "sale";
        if (monthlyG) monthlyG.hidden = isSale;
        if (saleG) saleG.hidden = !isSale;
        const monthly = document.getElementById("monthly_price");
        const sale = document.getElementById("sale_price");
        if (monthly) monthly.required = false;
        if (sale) sale.required = false;

        // Soft defaults only when empty: sale → deposit/advance N/A; rent-like → downpayment N/A
        if (isSale) {
            setNaIfEmpty("security_deposit", true);
            setNaIfEmpty("advance_rent", true);
        } else {
            setNaIfEmpty("downpayment", true);
        }
    }
    document.querySelectorAll('input[name="deal_type"]').forEach((el) => {
        el.addEventListener("change", sync);
    });
    sync();
})();

(function wireListingStepper() {
    const labels = {
        1: "Step 1 of 5 · Basics & location",
        2: "Step 2 of 5 · Space & money",
        3: "Step 3 of 5 · Risk & rules",
        4: "Step 4 of 5 · Amenities & media",
        5: "Step 5 of 5 · Review & publish",
    };
    let step = 1;

    function pinOk() {
        try {
            return !!window.__listingHasPin;
        } catch (_) {
            return false;
        }
    }

    async function refreshPinFlag() {
        try {
            const mod = await import("./listing-map.js");
            window.__listingHasPin = typeof mod.hasListingPin === "function" && mod.hasListingPin();
        } catch (_) {
            window.__listingHasPin = false;
        }
    }

    function showStep(n) {
        step = Math.max(1, Math.min(5, n));
        document.querySelectorAll(".listing-step-panel").forEach((panel) => {
            const id = Number(panel.getAttribute("data-listing-step"));
            const on = id === step;
            panel.classList.toggle("is-active", on);
            panel.hidden = !on;
        });
        document.querySelectorAll(".listing-step-dot").forEach((dot) => {
            const id = Number(dot.getAttribute("data-go-step"));
            dot.classList.toggle("is-active", id === step);
            dot.classList.toggle("is-done", id < step);
        });
        const lab = document.getElementById("listing-step-label");
        if (lab) lab.textContent = labels[step] || "";
        const back = document.getElementById("listing-step-back");
        const next = document.getElementById("listing-step-next");
        const submit = document.getElementById("listing-submit-btn") || document.querySelector("#create-property-form button[type='submit']");
        if (back) back.hidden = step <= 1;
        if (next) {
            next.hidden = step >= 5;
            next.textContent = "Continue";
        }
        if (submit) submit.hidden = step < 5;
        if (step === 5) refreshReviewSummary();
        try {
            panelTop();
        } catch (_) {}
    }

    function panelTop() {
        document.getElementById("listing-stepper")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function refreshReviewSummary() {
        const box = document.getElementById("listing-review-summary");
        if (!box) return;
        const title = document.getElementById("listing_title")?.value || "—";
        const type = document.getElementById("property_classification")?.value || "—";
        const address = document.getElementById("property-address")?.value || "—";
        const deal = document.querySelector('input[name="deal_type"]:checked')?.value || "—";
        const pin = window.__listingHasPin ? "Set" : "Missing";
        const monthly = document.getElementById("monthly_price")?.value;
        const sale = document.getElementById("sale_price")?.value;
        const priceLine =
            deal === "sale"
                ? (sale ? `Sale ₱${sale}` : "Sale price —")
                : (monthly ? `Monthly ₱${monthly}` : "Monthly —");
        const risk = document.getElementById("flood_status")?.value || "na";
        const riskLabel = ({ na: "Unknown", safe: "Safe", low: "Low", prone: "Prone" })[risk] || risk;
        const curfew = document.querySelector('input[name="curfew_policy"]:checked')?.value || "none";
        const visitor = document.querySelector('input[name="visitor_policy"]:checked')?.value || "allowed";
        const curfewLabel = ({ none: "None", building: "Building rules", custom: "Custom gate" })[curfew] || curfew;
        const visitorLabel = ({ allowed: "Allowed anytime", restricted: "Restricted", none: "Not allowed" })[visitor] || visitor;
        box.innerHTML = `<ul class="listing-review-list">
          <li><strong>Title</strong> ${escape(title)}</li>
          <li><strong>Type</strong> ${escape(type)} · ${escape(deal)}</li>
          <li><strong>Address</strong> ${escape(address)}</li>
          <li><strong>Map pin</strong> ${pin}</li>
          <li><strong>Price</strong> ${escape(priceLine)}</li>
          <li><strong>Flood</strong> ${escape(riskLabel)}</li>
          <li><strong>Access</strong> Curfew ${escape(curfewLabel)} · Visitors ${escape(visitorLabel)}</li>
          <li><strong>Amenities</strong> ${document.querySelectorAll('#listing-amenities-block input[name="amenities[]"]:checked').length} selected</li>
          <li><strong>Photos</strong> ${(document.getElementById("listing-images-input")?.files?.length || 0) || (document.getElementById("listing-images-preview")?.children?.length || 0)}</li>
          <li class="muted">Jump steps anytime — data is kept. Submit publishes the listing.</li>
        </ul>`;
    }

    function escape(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[c]);
    }

    async function validateStep(n) {
        if (n === 1) {
            await refreshPinFlag();
            const title = document.getElementById("listing_title");
            const type = document.getElementById("property_classification");
            const address = document.getElementById("property-address");
            const deal = document.querySelector('input[name="deal_type"]:checked');
            if (title && !title.value.trim()) {
                alert("Add a listing title.");
                title.focus();
                return false;
            }
            if (type && !type.value) {
                alert("Select a property type.");
                type.focus();
                return false;
            }
            if (!deal) {
                alert("Select a contract type.");
                return false;
            }
            if (address && !address.value.trim()) {
                alert("Add an address.");
                address.focus();
                return false;
            }
            if (!window.__listingHasPin) {
                alert("⚠️ Property pin required to continue.\n\nOpen the 3D map, place a pin, then confirm it. Without a pin this listing cannot appear correctly on Market.");
                document.getElementById("locate-on-map-btn")?.focus();
                return false;
            }
        }
        if (n === 2) {
            const deal = document.querySelector('input[name="deal_type"]:checked')?.value || "";
            const monthly = document.getElementById("monthly_price");
            const sale = document.getElementById("sale_price");
            const perBed = document.getElementById("per_bed_price");
            const type = (
                document.getElementById("property_classification")?.value || ""
            ).toLowerCase();

            const monthlyVal = monthly?.disabled ? "" : (monthly?.value || "").trim();
            const saleVal = sale?.disabled ? "" : (sale?.value || "").trim();
            const perBedVal = perBed?.disabled ? "" : (perBed?.value || "").trim();

            if (deal === "sale") {
                if (!saleVal || Number(saleVal) <= 0) {
                    alert("Enter a sale price to continue.");
                    sale?.focus();
                    return false;
                }
            } else {
                // rent / lease / rent_to_own — need monthly or (bedspace) per-bed
                const hasMonthly = monthlyVal && Number(monthlyVal) > 0;
                const hasPerBed = perBedVal && Number(perBedVal) > 0;
                if (!hasMonthly && !(type === "bedspace_dorm" && hasPerBed)) {
                    alert(
                        type === "bedspace_dorm"
                            ? "Enter a monthly price or per-bed price to continue."
                            : "Enter a monthly price to continue."
                    );
                    (hasPerBed ? perBed : monthly)?.focus();
                    return false;
                }
            }

            // Fees: each row should be either N/A or a number ≥ 0 (empty = ask once)
            const feeIds = ["security_deposit", "advance_rent", "downpayment"];
            for (const id of feeIds) {
                const input = document.getElementById(id);
                const na = document.querySelector(`.na-toggle[data-target="${id}"]`);
                if (!input) continue;
                if (na?.checked) continue;
                const v = (input.value || "").trim();
                if (v === "") {
                    // soft: auto-mark N/A rather than hard-block (careful UX)
                    if (na) {
                        na.checked = true;
                        na.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                    continue;
                }
                if (Number(v) < 0) {
                    alert("Fee amounts cannot be negative.");
                    input.focus();
                    return false;
                }
            }
        }
        if (n === 3) {
            const risk = document.getElementById("flood_status")?.value || "na";
            const freq = document.getElementById("flood_frequency")?.value || "unknown";
            const year = document.getElementById("flood_last_year");
            const depth = document.getElementById("flood_depth_cm");

            // Frequency "never" must not keep year/depth (already hidden UI — clear for safety)
            if (freq === "never") {
                if (year) year.value = "";
                if (depth) depth.value = "";
            }

            // Soft year bounds only when provided
            if (year && (year.value || "").trim() !== "") {
                const y = Number(year.value);
                const maxY = new Date().getFullYear();
                if (!Number.isFinite(y) || y < 1950 || y > maxY) {
                    alert(`Last flood year must be between 1950 and ${maxY}.`);
                    year.focus();
                    return false;
                }
            }
            if (depth && (depth.value || "").trim() !== "") {
                const d = Number(depth.value);
                if (!Number.isFinite(d) || d < 0 || d > 500) {
                    alert("Typical depth must be between 0 and 500 cm.");
                    depth.focus();
                    return false;
                }
            }

            // Elevated risk: soft tip only (no hard block) — already emphasized in UI
            // Custom curfew requires gate time
            const curfew = document.querySelector('input[name="curfew_policy"]:checked')?.value || "none";
            if (curfew === "custom") {
                const ct = document.getElementById("curfew_time");
                if (!ct?.value) {
                    alert("Set the gate close time for custom curfew.");
                    ct?.focus();
                    return false;
                }
            }

            const visitor = document.querySelector('input[name="visitor_policy"]:checked')?.value || "allowed";
            if (visitor === "restricted") {
                const vf = document.getElementById("visitor_hours_from");
                const vt = document.getElementById("visitor_hours_to");
                if (!vf?.value || !vt?.value) {
                    alert("Set visitor From and To times for restricted hours.");
                    (vf?.value ? vt : vf)?.focus();
                    return false;
                }
            }

            // Ensure radios have a selection (defaults exist)
            if (!document.querySelector('input[name="curfew_policy"]:checked')) {
                alert("Choose a curfew option.");
                return false;
            }
            if (!document.querySelector('input[name="visitor_policy"]:checked')) {
                alert("Choose a visitors option.");
                return false;
            }
        }
        if (n === 4) {
            // Amenities: optional — never block
            // Photos: at least 1 required to publish path
            const input = document.getElementById("listing-images-input");
            const count = input?.files?.length || 0;
            const preview = document.getElementById("listing-images-preview");
            const thumbCount = preview ? preview.querySelectorAll(".listing-image-thumb-wrap, .listing-image-thumb").length : 0;
            // Prefer live files; fall back to preview children if DataTransfer quirks
            const nPhotos = Math.max(count, thumbCount);
            if (nPhotos < 1) {
                alert("Add at least one photo before continuing.");
                document.getElementById("listing-images-dropzone")?.scrollIntoView({ behavior: "smooth", block: "center" });
                return false;
            }
            // Description optional but soft nudge stored only as hint in UI — no hard block
            const desc = (document.getElementById("listing_description")?.value || "").trim();
            if (desc.length > 2000) {
                alert("Description must be 2000 characters or fewer.");
                document.getElementById("listing_description")?.focus();
                return false;
            }
        }
        if (n === 5) {
            // Final gate: pin + price already enforced on earlier steps; re-check pin
            await refreshPinFlag();
            if (!window.__listingHasPin) {
                alert("Map pin is required. Go back to step 1 and set the pin.");
                return false;
            }
        }
        return true;
    }

    document.getElementById("listing-step-next")?.addEventListener("click", async () => {
        if (!(await validateStep(step))) return;
        showStep(step + 1);
    });
    document.getElementById("listing-step-back")?.addEventListener("click", () => showStep(step - 1));
    document.querySelectorAll(".listing-step-dot").forEach((dot) => {
        dot.addEventListener("click", async () => {
            const target = Number(dot.getAttribute("data-go-step"));
            if (target > step) {
                // forward only through validated path for step 1
                for (let s = step; s < target; s++) {
                    if (!(await validateStep(s))) return;
                    showStep(s + 1);
                }
            } else {
                showStep(target);
            }
        });
    });

    document.addEventListener("hf:listing-pin-changed", () => {
        refreshPinFlag();
    });

    // Hide native submit until step 5
    const submit = document.getElementById("listing-submit-btn") || document.querySelector("#create-property-form button[type='submit']");
    if (submit) submit.hidden = true;

    refreshPinFlag().then(() => showStep(1));
})();

document.addEventListener("hf:tab-activated", (e) => {
    if (e.detail?.tab === "listing") {
        try {
            wireListingImagePreview();
            wireListingHelpToggle();
            applyListingHelpRoleVisibility().catch(() => {});
            refreshListingImageCap();
        } catch (_) {}
    }
});