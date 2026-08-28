/* ==================================== */
/*  KYC / ID UPLOAD (profile)          */
/* ==================================== */
/* Stores pending verification on users/{uid}; ID/PRC photos go to      */
/* Supabase Storage (private kyc-documents bucket) via storagePath, not */
/* data URLs -- see js/supabase.js's uploadImage(). Reference numbers   */
/* are also claimed in kycReferenceIndex/{indexId} (see                 */
/* js/kyc-reference.js) so the same government ID or PRC number can't   */
/* be used to verify two different accounts -- enforced by              */
/* firestore.rules, not just admin review.                              */

import { user, db, auth } from "./core.js";
import { getRole } from "./role.js";
import {
    doc, getDoc, setDoc, updateDoc, collection, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    compressImageFile, uploadImage, uploadKycViaEdge, kycImagePath, BUCKET_KYC
} from "../supabase.js";
import { kycReferenceIndexId } from "../kyc-reference.js";

const form = document.getElementById("kyc-id-form");
const statusLine = document.getElementById("kyc-status-line");
const statusPill = document.getElementById("kyc-status-pill");
const brokerBlock = document.getElementById("kyc-broker-block");

function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* JPEG-only, everywhere images get attached: the `accept="image/jpeg,image/jpg,image/png"`
 * attribute on the <input> only filters what the OS file picker shows
 * -- it doesn't stop a drag-and-drop of a PNG/HEIC/whatever, and some
 * mobile browsers ignore `accept` for the camera capture path
 * entirely. This is the actual gate. */
function isAcceptedImage(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("image/")) return true;
    return /\.(jpe?g|png|webp|heic)$/i.test(file.name || "");
}
function isJpegFile(file) { return isAcceptedImage(file); }

/**
 * Wires a dropzone <div> (containing a hidden <input type=file> and the
 * .kyc-dropzone-empty / .kyc-dropzone-preview markup) for click-to-upload,
 * drag & drop, live thumbnail preview, and a remove button. Pure UI --
 * the actual upload still reads straight off the <input>'s .files at
 * submit time, same as before this got a dropzone face.
 */
function attachDropzone(dropzoneEl) {
    if (!dropzoneEl) return;
    const input =
        dropzoneEl.querySelector('input[type="file"]') ||
        dropzoneEl.parentElement?.querySelector('input[type="file"]') ||
        null;
    if (!input) {
        console.warn("KYC dropzone: no file input", dropzoneEl.id);
        return;
    }
    const emptyState = dropzoneEl.querySelector(".kyc-dropzone-empty");
    const previewState = dropzoneEl.querySelector(".kyc-dropzone-preview");
    if (!input || !emptyState || !previewState) return;
    const previewImg = previewState.querySelector("img");
    const nameEl = previewState.querySelector(".kyc-preview-name");
    const sizeEl = previewState.querySelector(".kyc-preview-size");
    const removeBtn = previewState.querySelector(".kyc-preview-remove");
    if (!previewImg || !nameEl || !sizeEl || !removeBtn) return;

    function showPreview(file) {
        nameEl.textContent = file.name;
        sizeEl.textContent = formatBytes(file.size);
        const reader = new FileReader();
        reader.onload = () => { previewImg.src = reader.result; };
        reader.readAsDataURL(file);
        emptyState.hidden = true;
        previewState.hidden = false;
        dropzoneEl.classList.add("has-file");
    }

    function clearPreview() {
        input.value = "";
        previewImg.src = "";
        emptyState.hidden = false;
        previewState.hidden = true;
        dropzoneEl.classList.remove("has-file");
    }

    dropzoneEl.addEventListener("click", (e) => {
        if (dropzoneEl.classList.contains("has-file")) return; // remove btn handles its own click
        input.click();
    });
    dropzoneEl.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && !dropzoneEl.classList.contains("has-file")) {
            e.preventDefault();
            input.click();
        }
    });

    input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        if (!isJpegFile(file)) {
            alert("Please upload a JPEG (.jpg/.jpeg) photo -- other formats aren't accepted.");
            input.value = "";
            return;
        }
        showPreview(file);
    });

    ["dragover", "dragenter"].forEach(evt =>
        dropzoneEl.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzoneEl.classList.add("dragover");
        })
    );
    ["dragleave", "dragend"].forEach(evt =>
        dropzoneEl.addEventListener(evt, () => dropzoneEl.classList.remove("dragover"))
    );
    dropzoneEl.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzoneEl.classList.remove("dragover");
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (!isJpegFile(file)) {
            alert("Please upload a JPEG (.jpg/.jpeg) photo -- other formats aren't accepted.");
            return;
        }
        input.files = e.dataTransfer.files;
        showPreview(file);
    });

    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearPreview();
    });
}

attachDropzone(document.getElementById("kyc-id-dropzone"));
attachDropzone(document.getElementById("kyc-broker-dropzone"));


function setStatusPill(idv, brk, brokerVisible) {
    if (!statusPill) return;
    const statuses = [idv?.status].concat(brokerVisible ? [brk?.status] : []).filter(Boolean);
    let state = "none";
    let label = "Not submitted";
    if (statuses.includes("rejected")) {
        state = "rejected"; label = "Action needed";
    } else if (statuses.includes("pending")) {
        state = "pending"; label = "Pending review";
    } else if (statuses.length && statuses.every(s => s === "verified")) {
        state = "verified"; label = "Verified";
    } else if (statuses.length) {
        state = "pending"; label = "In progress";
    }
    statusPill.dataset.state = state;
    statusPill.textContent = label;
}

function setBtnState(btn, { disabled, text }) {
    if (!btn) return;
    btn.disabled = !!disabled;
    if (text) btn.textContent = text;
}

const ID_TYPE_LABELS = {
  ph_national_id: "Philippine National ID",
  national_id: "Philippine National ID",
  passport: "Passport",
  drivers_license: "Driver's License",
  umid: "UMID",
  sss: "SSS ID",
  philhealth: "PhilHealth ID",
  postal: "Postal ID",
  prc: "PRC ID",
  nbi: "NBI Clearance",
  other: "Other government ID",
};

function maskIdNumber(num) {
  const s = String(num || "").trim();
  if (s.length <= 4) return s || "—";
  return "•".repeat(Math.min(8, s.length - 4)) + s.slice(-4);
}

function formatSubmittedAt(iso) {
  if (!iso) return null;
  try {
    const d = typeof iso.toDate === "function" ? iso.toDate() : new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch (_) {
    return null;
  }
}

function showKycIdReceipt(idv) {
  const receipt = document.getElementById("kyc-id-receipt");
  const form = document.getElementById("kyc-id-form");
  if (!receipt) return;
  const status = String(idv?.status || "").toLowerCase();
  const isPending = status === "pending";
  const isVerified = status === "verified";
  const isRejected = status === "rejected";

  if (isPending || isVerified) {
    receipt.hidden = false;
    if (form) form.hidden = true;
  } else {
    receipt.hidden = true;
    if (form) form.hidden = false;
  }

  const pill = document.getElementById("kyc-receipt-pill");
  const timing = document.getElementById("kyc-receipt-timing");
  const typeEl = document.getElementById("kyc-receipt-type");
  const numEl = document.getElementById("kyc-receipt-number");
  const nameEl = document.getElementById("kyc-receipt-name");
  const dobEl = document.getElementById("kyc-receipt-dob");
  const photoEl = document.getElementById("kyc-receipt-photo");
  const guides = receipt.querySelector(".kyc-receipt-guides");

  const idType = idv.idType || idv.id_type || "";
  const idNumber = idv.idNumber || idv.id_number || "";
  const fullName = idv.fullName || idv.full_name || "";
  const dob = idv.dateOfBirth || idv.date_of_birth || idv.dob || "";
  if (typeEl) typeEl.textContent = ID_TYPE_LABELS[idType] || idType || "—";
  if (numEl) numEl.textContent = maskIdNumber(idNumber);
  if (nameEl) nameEl.textContent = fullName || "—";
  if (dobEl) dobEl.textContent = dob || "—";
  if (photoEl) {
    photoEl.textContent = (idv.storagePath || idv.imagePath || idv.photoPath)
      ? "Document received"
      : "Document on file";
  }

  if (pill) {
    if (isPending) {
      pill.dataset.state = "pending";
      pill.textContent = "Pending review";
    } else if (isVerified) {
      pill.dataset.state = "verified";
      pill.textContent = "Verified";
    } else if (isRejected) {
      pill.dataset.state = "rejected";
      pill.textContent = "Rejected";
    }
  }

  if (timing) {
    const when = formatSubmittedAt(idv.submittedAt);
    if (isPending) {
      timing.textContent = when
        ? `Submitted ${when} · reviews usually finish within 1–2 business days. You’ll get a notification when decided.`
        : "Submitted · reviews usually finish within 1–2 business days. You’ll get a notification when decided.";
    } else if (isVerified) {
      timing.textContent = when
        ? `Verified · submitted ${when}. You do not need to upload again.`
        : "Government ID verified. You do not need to upload again.";
    } else {
      timing.textContent = "";
    }
  }

  if (guides) {
    guides.hidden = !isPending;
  }
}


async function refreshStatus() {
    if (!statusLine) return;
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.exists() ? snap.data() : {};
        const idv = d.idVerification || {};
        const brk = d.brokerLicense || {};
        const bits = [];
        if (idv.status) bits.push(`Government ID: ${idv.status}`);
        if (brk.status) bits.push(`Broker license: ${brk.status}`);
        statusLine.textContent = bits.length ? bits.join(" · ") : "Not submitted yet.";
        const brokerVisible = brokerBlock && !brokerBlock.classList.contains("is-hidden") && !brokerBlock.hidden;
        setStatusPill(idv, brk, brokerVisible);

        const idBtn = document.getElementById("kyc-id-submit-btn");
        const licBtn = document.getElementById("kyc-license-submit-btn");
        showKycIdReceipt(idv);

        if (idv.status === "pending") {
            setBtnState(idBtn, { disabled: true, text: "ID pending review" });
            document.querySelectorAll("#kyc-id-form input, #kyc-id-form select, #kyc-id-form button").forEach(el => { el.disabled = true; });
            if (statusLine) {
                statusLine.hidden = true;
            }
            if (statusPill) statusPill.hidden = true;
        } else if (idv.status === "verified") {
            setBtnState(idBtn, { disabled: true, text: "ID verified" });
            if (idBtn) idBtn.hidden = true;
            if (statusLine) statusLine.hidden = true;
            if (statusPill) statusPill.hidden = true;
            const idFormWrap = document.querySelector('[data-asset="profile-kyc-id-form"]');
            idFormWrap?.querySelector(".kyc-id-done")?.remove();
        } else if (idv.status === "rejected") {
            showKycIdReceipt({ ...idv, status: "" }); // force form visible
            const receipt = document.getElementById("kyc-id-receipt");
            if (receipt) receipt.hidden = true;
            const form = document.getElementById("kyc-id-form");
            if (form) form.hidden = false;
            document.querySelectorAll("#kyc-id-form .field-group, #kyc-id-dropzone").forEach((el) => {
                el.hidden = false;
            });
            if (idBtn) idBtn.hidden = false;
            setBtnState(idBtn, { disabled: false, text: "Submit ID again" });
            document.querySelectorAll("#kyc-id-form input, #kyc-id-form select").forEach(el => { el.disabled = false; });
            if (statusLine) {
                statusLine.hidden = false;
                const reason = idv.rejectionReason || idv.rejectReason || "";
                statusLine.textContent = reason
                    ? `Rejected: ${reason}`
                    : "Rejected — update your details and submit again.";
            }
            if (statusPill) {
                statusPill.hidden = false;
                statusPill.dataset.state = "rejected";
                statusPill.textContent = "Rejected";
            }
        } else {
            const receipt = document.getElementById("kyc-id-receipt");
            if (receipt) receipt.hidden = true;
            const form = document.getElementById("kyc-id-form");
            if (form) form.hidden = false;
            document.querySelectorAll("#kyc-id-form .field-group, #kyc-id-dropzone").forEach((el) => {
                el.hidden = false;
            });
            if (idBtn) idBtn.hidden = false;
            setBtnState(idBtn, { disabled: false, text: "Submit ID for verification" });
            document.querySelectorAll("#kyc-id-form input, #kyc-id-form select").forEach(el => { el.disabled = false; });
            if (statusLine) {
                statusLine.hidden = false;
            }
            if (statusPill) statusPill.hidden = false;
        }
        showKycLicenseReceipt(brk);
        if (brk.status === "pending") {
            setBtnState(licBtn, { disabled: true, text: "License pending review" });
            if (licBtn) licBtn.hidden = true;
        } else if (brk.status === "verified" || brk.status === "approved") {
            setBtnState(licBtn, { disabled: true, text: "License verified" });
            if (licBtn) licBtn.hidden = true;
        } else {
            setBtnState(licBtn, { disabled: false, text: "Submit license for verification" });
            if (licBtn) licBtn.hidden = false;
        }
        if (idv.idType) {
            const sel = document.getElementById("kyc-id-type");
            if (sel && !sel.value) sel.value = idv.idType;
        }
        if (idv.fullName || idv.full_name) {
            const n = document.getElementById("kyc-id-full-name");
            if (n && !n.value) n.value = idv.fullName || idv.full_name;
        }
        if (idv.dateOfBirth || idv.date_of_birth || idv.dob) {
            const d = document.getElementById("kyc-id-dob");
            if (d && !d.value) d.value = idv.dateOfBirth || idv.date_of_birth || idv.dob;
        }
    } catch (e) {
        console.warn(e);
    }
}

async function initBrokerVisibility() {
    if (!brokerBlock) return;
    let show = false;
    try {
        const role = await getRole();
        const snap = await getDoc(doc(db, "users", user.uid));
        const idv = (snap.exists() ? snap.data().idVerification : null) || {};
        show = idv.status === "verified" || role === "broker";
    } catch (e) {
        console.warn("initBrokerVisibility", e);
    }
    brokerBlock.classList.toggle("is-hidden", !show);
    if (show) brokerBlock.removeAttribute("hidden");
    else brokerBlock.setAttribute("hidden", "");
    brokerBlock.style.removeProperty("display");
}

const idForm = document.getElementById("kyc-id-form");
const licenseForm = document.getElementById("kyc-license-form");

idForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("kyc-id-submit-btn");
    if (btn?.disabled) return;
    setBtnState(btn, { disabled: true, text: "Checking…" });

    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.exists() ? snap.data() : {};
        if (d.idVerification?.status === "pending") {
            alert("Your government ID is already pending review.");
            return;
        }
        if (d.idVerification?.status === "verified") {
            alert("Your government ID is already verified.");
            return;
        }

        const idType = document.getElementById("kyc-id-type")?.value;
        const idNumber = (document.getElementById("kyc-id-number")?.value || "").trim();
        const fullName = (document.getElementById("kyc-id-full-name")?.value || "").trim();
        const dateOfBirth = (document.getElementById("kyc-id-dob")?.value || "").trim();
        const idInput = document.getElementById("kyc-id-photo");
        const idFile = idInput?.files?.[0];
        if (!idType) { alert("Select a government ID type."); return; }
        if (!fullName || fullName.length < 3) {
          alert("Enter your full name exactly as printed on the ID.");
          return;
        }
        if (!dateOfBirth) {
          alert("Enter the date of birth printed on your ID.");
          return;
        }
        {
          const dob = new Date(dateOfBirth + "T12:00:00");
          if (Number.isNaN(dob.getTime()) || dob > new Date()) {
            alert("Date of birth looks invalid.");
            return;
          }
          const ageMs = Date.now() - dob.getTime();
          const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
          if (ageYears < 18) {
            alert("You must be at least 18 years old to verify an ID on HomeFinder.");
            return;
          }
        }
        if (!idNumber) { alert("Enter the ID number."); return; }
        if (!idFile) { alert("Upload a clear photo of your ID."); return; }
        if (!isJpegFile(idFile)) { alert("Please upload a JPEG or PNG photo."); return; }

        setBtnState(btn, { disabled: true, text: "Uploading…" });
        const blob = await compressImageFile(idFile, 1600, 0.82);
        const idToken = await auth.currentUser.getIdToken();
        const up = await uploadKycViaEdge(idToken, blob, "id");

        if (idNumber) {
            try {
                const indexId = kycReferenceIndexId(idType, idNumber);
                const normalizedReference = String(idNumber || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
                await setDoc(doc(db, "kycReferenceIndex", indexId), {
                    linkedUid: user.uid,
                    idType,
                    referenceNumber: normalizedReference,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            } catch (claimErr) {
                console.warn(claimErr);
            }
        }

        await updateDoc(doc(db, "users", user.uid), {
            idVerification: {
                status: "pending",
                idType,
                idNumber: idNumber || null,
                fullName,
                dateOfBirth,
                storagePath: up.path,
                storageBucket: BUCKET_KYC,
                submittedAt: new Date().toISOString()
            }
        });

        try {
            await addDoc(collection(db, "notifications", user.uid, "items"), {
                type: "verification_pending",
                read: false,
                message: "⚠️ Government ID submitted. An administrator reviews it after submission. You’ll get a notification when there’s an update.",
                createdAt: new Date().toISOString()
            });
        } catch (_) {}

        if (statusLine) statusLine.textContent = "Government ID: pending — administrator review.";
        alert("ID submitted for verification. Check your notification bell for updates.");
    } catch (err) {
        console.error(err);
        const msg = String(err.message || err);
        if (/row-level security|RLS|policy/i.test(msg)) {
            alert("Could not upload ID photo: Storage policy blocked the file. See docs/contracts/integrations/storage-authority.json");
        } else {
            alert("Could not submit ID: " + msg);
        }
    } finally {
        setBtnState(btn, { disabled: false, text: "Submit ID for verification" });
        refreshStatus();
        initBrokerVisibility();
    }
});

licenseForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("kyc-license-submit-btn");
    if (btn?.disabled) return;
    setBtnState(btn, { disabled: true, text: "Checking…" });

    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.exists() ? snap.data() : {};
        const idv = d.idVerification || {};
        if (idv.status !== "verified") {
            alert("⚠️ Verify your government ID first. License submit unlocks after ID is approved.");
            return;
        }
        const licStatus = (d.brokerLicense || {}).status;
        if (licStatus === "pending") {
            alert("Your broker license is already pending review.");
            return;
        }
        if (licStatus === "verified") {
            alert("Your broker license is already verified.");
            return;
        }

        const lic = (document.getElementById("kyc-broker-license")?.value || "").trim();
        const bFile = document.getElementById("kyc-broker-photo")?.files?.[0];
        if (!lic) { alert("Enter your PRC / certificate number."); return; }
        if (!bFile) { alert("Upload a photo of your PRC ID or certificate."); return; }
        if (!isJpegFile(bFile)) { alert("Please upload a JPEG or PNG photo."); return; }

        setBtnState(btn, { disabled: true, text: "Uploading…" });
        const bBlob = await compressImageFile(bFile, 1600, 0.82);
        const idTokenB = await auth.currentUser.getIdToken();
        const bUp = await uploadKycViaEdge(idTokenB, bBlob, "broker");

        try {
            const indexId = kycReferenceIndexId("prc_license", lic);
            const normalizedReference = String(lic || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
            await setDoc(doc(db, "kycReferenceIndex", indexId), {
                linkedUid: user.uid,
                idType: "prc_license",
                referenceNumber: normalizedReference,
                createdAt: new Date().toISOString()
            }, { merge: true });
        } catch (claimErr) {
            console.warn(claimErr);
        }

        const brokerFields = {
            status: "pending",
            licenseType: "prc_license",
            licenseNumber: lic,
            storagePath: bUp.path,
            storageBucket: BUCKET_KYC,
            submittedAt: new Date().toISOString()
        };
        await updateDoc(doc(db, "users", user.uid), {
            brokerLicense: brokerFields,
            brokerApplication: {
                status: "pending",
                submittedAt: brokerFields.submittedAt,
                licenseType: brokerFields.licenseType
            }
        });
        showKycLicenseReceipt(brokerFields);
        setBtnState(btn, { disabled: true, text: "License pending review" });
        if (btn) btn.hidden = true;

        try {
            await addDoc(collection(db, "notifications", user.uid, "items"), {
                type: "verification_pending",
                read: false,
                message: "⚠️ Broker application submitted. Your documents are pending review; approval is an application decision and does not silently change your account role.",
                createdAt: new Date().toISOString()
            });
        } catch (_) {}

        if (statusLine) statusLine.textContent = "Broker license: pending — administrator review.";
        alert("License submitted for verification.");
    } catch (err) {
        console.error(err);
        alert("Could not submit license: " + (err.message || err));
    } finally {
        setBtnState(btn, { disabled: false, text: "Submit license for verification" });
        refreshStatus();
    }
});

(async () => {
    await initBrokerVisibility();
    refreshStatus();
})();
