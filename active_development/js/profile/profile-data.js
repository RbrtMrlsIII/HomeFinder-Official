
function setProfileNameLetters(el, text) {
  if (!el) return;
  const raw = String(text || "").trim() || "HomeFinder User";
  el.textContent = "";
  el.setAttribute("aria-label", raw);
  const frag = document.createDocumentFragment();
  [...raw].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "hf-letter";
    s.style.setProperty("--i", String(i));
    s.textContent = ch === " " ? "\u00a0" : ch;
    frag.appendChild(s);
  });
  el.appendChild(frag);
}

/* HF-BUILD-2026-08-11-V13 | file: profile-data.js | DO NOT USE OLD CACHE PATH */
/* ==================================== */
/*  PROFILE DATA                        */
/* ==================================== */
/* Loads the user's profile doc into the header + edit fields,  */
/* and saves changes back to Firestore.                          */

import { user, db } from "./core.js";
import { isVisiting as urlVisit, visitUid as urlVisitUid } from "./visit-mode.js";
import { applyRoleVisibility } from "./tabs.js";
import { setRole } from "./role.js";
import { normalizeCanonicalRole, canonicalRoleFromData } from "../canonical-role.js";
import { doc, getDoc, setDoc }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { hasVerifiedId, hasBrokerLicense } from "../tiers.js";
import { refreshPerks } from "./perks.js";
import { isOpsUid } from "../admin-uid.js";


(function earlyName(){
    try {
        const el = document.getElementById("profile-name");
        if (el && /^Loading/i.test(el.textContent || "")) {
            const n = (user && user.displayName || "").trim();
            const e = (user && user.email || "").split("@")[0] || "";
            if (n || e) setProfileNameLetters(el, n || e);
        }
        const emailEl = document.getElementById("profile-email");
        if (emailEl && !emailEl.textContent && user && user.email) emailEl.textContent = user.email;
    } catch (_) {}
})();

const accountTypeLabels = {
    owner: "Property Owner",
    seeker: "Home Seeker",
    broker: "Property Broker"
};

function showLoadError(message){
    const nameEl = document.getElementById("profile-name");
    if(nameEl) setProfileNameLetters(nameEl, "HomeFinder User");

    const container = document.getElementById("toast-container");
    if(!container) return;
    const toast = document.createElement("div");
    toast.className = "toast error";
    toast.innerHTML = `<i class='bx bx-error-circle'></i><div><strong>Profile</strong><p>${message}</p></div>`;
    container.appendChild(toast);
    setTimeout(()=>{ toast.classList.add("leaving"); setTimeout(()=> toast.remove(), 300); }, 4500);
}


/* -------- ROLE PICKER (social / incomplete profiles) -------- */

function promptForAccountType(){
    if(document.getElementById("role-picker-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "role-picker-overlay";
    overlay.className = "role-picker-overlay";
    overlay.innerHTML = `
        <div class="role-picker-card">
            <h3>Choose your account type</h3>
            <p>
                We need this to show the right dashboard. Broker access is granted later after ID verification and license approval.
            </p>
            <div class="role-picker-actions">
                <button type="button" data-role="seeker" class="role-pick-btn">
                    🔍 Home Seeker — find a place to rent
                </button>
                <button type="button" data-role="owner" class="role-pick-btn">
                    🏠 Property Owner — list and manage units
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll(".role-pick-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const accountType = btn.dataset.role;
                if (!["owner", "seeker"].includes(accountType)) return;
            overlay.querySelectorAll(".role-pick-btn").forEach(b => b.disabled = true);
            try {
                await setDoc(doc(db, "users", user.uid), { accountType, canonicalRole: normalizeCanonicalRole(accountType) }, { merge: true });
                const _role = setRole(accountType);
                applyRoleVisibility(_role);
                const typeEl = document.getElementById("profile-account-type");
                if(typeEl){ typeEl.textContent = ""; typeEl.classList.add("is-hidden"); }
                overlay.remove();
                // Reload perks / role-gated panels with the real role
                window.location.hash = "perks";
                window.location.reload();
            } catch(error){
                console.error("Failed to save account type:", error);
                alert("Couldn't save your account type. Please try again.");
                overlay.querySelectorAll(".role-pick-btn").forEach(b => b.disabled = false);
            }
        });
    });
}

/* -------- LOAD -------- */

async function loadProfile(){
    // Visitor viewing someone else — visitor-profile.js owns the header
    const visitUid = urlVisitUid || new URLSearchParams(location.search).get("uid");
    if (visitUid && user?.uid && visitUid !== user.uid) {
        document.body.classList.add("visitor-mode");
        return;
    }
    if (visitUid && !user?.uid) {
        // Should not happen (requireAuth), but never load a random profile
        return;
    }

    let snap;
    try {
        const docRef = doc(db, "users", user.uid);
        snap = await Promise.race([
            getDoc(docRef),
            new Promise(function(_, rej){ setTimeout(function(){ rej(new Error("profile-read-timeout")); }, 6000); })
        ]);
    } catch(error){
        console.error("Failed to load profile document:", error);
        try { applyNameFailsafe(); } catch(_){}
        // Self-heal: ensure a users/{uid} doc exists, then one short retry
        try {
            await setDoc(doc(db, "users", user.uid), {
                firstName: (user.displayName || "").split(" ")[0] || "",
                surname: (user.displayName || "").split(" ").slice(1).join(" ") || "",
                email: user.email || "",
                accountType: "seeker",
                canonicalRole: "seeker",
                createdAt: new Date().toISOString()
            }, { merge: true });
            snap = await Promise.race([
                getDoc(doc(db, "users", user.uid)),
                new Promise(function(_, rej){ setTimeout(function(){ rej(new Error("profile-retry-timeout")); }, 4000); })
            ]);
            if (snap && snap.exists()) {
                // fall through to normal fill by re-entering via data path below
                const data = snap.data();
                applyRoleVisibility(setRole(canonicalRoleFromData(data)));
                const nameEl = document.getElementById("profile-name");
                if (nameEl) setProfileNameLetters(nameEl, `${data.firstName || ""} ${data.surname || ""}`.trim() || user.displayName || user.email || "HomeFinder User");
                const emailEl = document.getElementById("profile-email");
                if (emailEl) emailEl.textContent = data.email || user.email || "";
                try { refreshSetupBanner(data); } catch (_) {}
                try { await refreshPerks(); } catch(_){}
                return;
            }
        } catch (e2) {
            console.error("profile self-heal failed:", e2);
        }
        showLoadError("We couldn't reach your profile data. Check your connection and refresh. Confirm the named Firestore database `homefinder` is available and deployed correctly.");
        applyRoleVisibility(setRole(undefined));
        try { await refreshPerks(); } catch(_){}
        return;
    }

    if(!snap.exists()){
        // Firebase Auth account exists but its matching Firestore
        // "users/{uid}" doc was never written (e.g. the profile-save
        // step failed during registration). Self-heal by creating a
        // minimal doc so the page has something to show.
        const fallbackProfile = {
            firstName: "",
            surname: "",
            email: user.email || "",
            accountType: "seeker",
            canonicalRole: "seeker",
            createdAt: new Date().toISOString()
        };

        try {
            await setDoc(doc(db, "users", user.uid), fallbackProfile, { merge: true });
            snap = await getDoc(doc(db, "users", user.uid));
        } catch(error){
            console.error("Failed to create fallback profile document:", error);
            showLoadError("Your profile hasn't been set up yet. Please fill in your details below.");
            const nameEl = document.getElementById("profile-name");
            if(nameEl) setProfileNameLetters(nameEl, "HomeFinder User");
            // Same reasoning as the read-failure branch above -- resolve
            // getRole() so dependent modules don't hang.
            applyRoleVisibility(setRole(undefined));
            return;
        }
    }

    const data = snap.data();

    // Patch 21: standalone brokers no longer use profile.html.
    // Ops identities may retain broker accountType and are explicitly allowed.
    if (canonicalRoleFromData(data) === "broker" && !isOpsUid(user.uid)) {
        window.location.replace("broker-hq.html");
        return;
    }

    const initialsEl = document.getElementById("avatar-initials");
    if (initialsEl) {
        const a = String(data.firstName || "").trim();
        const b = String(data.surname || "").trim();
        let initials = ((a[0] || "") + (b[0] || "")).toUpperCase();
        if (!initials) {
            const local = String(data.email || (user && user.email) || "").split("@")[0];
            initials = local ? local.slice(0, 2).toUpperCase() : "HF";
        }
        initialsEl.textContent = initials.slice(0, 2);
    }

    const nameEl = document.getElementById("profile-name");
    if (nameEl) {
        const full = `${data.firstName || ""} ${data.surname || ""}`.trim();
        const fallback = (user && user.displayName) || (data.email || (user && user.email) || "").split("@")[0] || "HomeFinder User";
        setProfileNameLetters(nameEl, full || fallback);
    }

    const emailEl = document.getElementById("profile-email");
    if(emailEl) emailEl.textContent = data.email || user.email;

    const typeEl = document.getElementById("profile-account-type");
    // Role label lives in user_trust_row chips only (ASSETS_DICTIONARY / no duplicate HOME SEEKER)
    if(typeEl){
        typeEl.textContent = "";
        typeEl.setAttribute("aria-hidden", "true");
        typeEl.classList.add("is-hidden");
    }

    const badgesEl = document.getElementById("profile-badges");
    if(badgesEl){
        // Neutral = full text chips. Collapsed (scrolled) = icon-only (CSS toggles).
        const role = canonicalRoleFromData(data) || "seeker";
        const roleIcon = role === "owner" ? "bx-home-alt"
            : role === "broker" ? "bx-briefcase"
            : "bx-search-alt";
        const roleTitle = role === "owner" ? "Owner"
            : role === "broker" ? "Broker"
            : "Seeker";
        const chips = [];
        const roleDesc = role === "owner" ? "You list properties and manage contracts as an owner."
            : role === "broker" ? "You can list properties, post wanted requests, and need PRC verification for the licensed badge."
            : "You search listings, post wanted requests, and pin a map area within your tier radius.";
        chips.push(`<span class="trust-chip role-${role} hf-tip" data-tip="${roleTitle}" data-tip-desc="${roleDesc}">
            <i class="bx ${roleIcon}"></i><span class="trust-chip-label">${roleTitle}</span>
          </span>`);
        if (data.brokerApplication?.status) {
            const appStatus = String(data.brokerApplication.status);
            const appLabel = appStatus === "approved" ? "Broker application approved"
                : appStatus === "pending" ? "Broker application pending"
                : appStatus === "rejected" ? "Broker application rejected"
                : `Broker application: ${appStatus}`;
            chips.push(`<span class="trust-chip trust-application" title="${appLabel}"><i class="bx bx-file"></i><span class="trust-chip-label">${appLabel}</span></span>`);
        }
        if(hasVerifiedId){
            chips.push(`<span class="trust-chip trust-verified hf-tip" data-tip="Verified ID" data-tip-desc="Staff approved your government ID. Required before your first property listing goes live.">
              <i class="bx bx-check-shield"></i><span class="trust-chip-label">Verified</span>
            </span>`);
        }
        if(role === "broker" && hasBrokerLicense(data)){
            chips.push(`<span class="trust-chip trust-licensed hf-tip" data-tip="Licensed broker" data-tip-desc="Your PRC license or certificate was approved by staff. Shown publicly on your profile.">
              <i class="bx bx-id-card"></i><span class="trust-chip-label">Licensed</span>
            </span>`);
        }
        badgesEl.innerHTML = chips.join("");
        badgesEl.classList.add("trust-chip-row");
    }

    // Single normalization point (role.js) -- also unblocks every other
    // module awaiting getRole() instead of re-fetching this same doc.
    const _role = setRole(canonicalRoleFromData(data));
    applyRoleVisibility(_role);
    try { refreshSetupBanner(data); } catch (_) {}

    // Social sign-in (and some legacy accounts) may lack accountType.
    // Prompt once so owner/broker users are not stuck as the seeker default.
    if(!canonicalRoleFromData(data) || !["owner","seeker","broker"].includes(canonicalRoleFromData(data))){
        // Missing or invalid type — prompt Seeker/Owner only (broker is granted via KYC).
        promptForAccountType();
    }

    // Crash-proof fallbacks: tries the prefixed ID first, falls back
    // to the plain ID if missing.
    const firstNameInput = document.getElementById("p-first-name") || document.getElementById("first-name");
    if(firstNameInput) firstNameInput.value = data.firstName || "";

    const surnameInput = document.getElementById("p-surname") || document.getElementById("surname");
    if(surnameInput) surnameInput.value = data.surname || "";

    const phoneInput = document.getElementById("p-phone") || document.getElementById("phone");
    if(phoneInput) phoneInput.value = data.phone || "";

    const addressInput = document.getElementById("p-address") || document.getElementById("address");
    if(addressInput && data.address){
        const a = data.address;
        addressInput.value = [a.street, a.city, a.province, a.country].filter(Boolean).join(", ");
    }
}
loadProfile().then(() => {
    try { refreshPerks(); } catch (e) { console.warn(e); }
}).catch((e) => { console.error("loadProfile() failed:", e); });


/* -------- SAVE -------- */

/* Parse freeform address into the structured shape registration uses.
   "Street, City, Province, Country" → { street, city, province, country }.
   Fewer commas still work: everything lands in street until we have parts. */
function parseAddressInput(raw){
    const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
    if(parts.length === 0){
        return { street: "", city: "", province: "", country: "" };
    }
    if(parts.length === 1){
        return { street: parts[0], city: "", province: "", country: "Philippines" };
    }
    if(parts.length === 2){
        return { street: parts[0], city: parts[1], province: "", country: "Philippines" };
    }
    if(parts.length === 3){
        return { street: parts[0], city: parts[1], province: parts[2], country: "Philippines" };
    }
    // 4+ : street may itself contain commas — keep first as street, last as country
    return {
        street: parts.slice(0, -3).join(", "),
        city: parts[parts.length - 3],
        province: parts[parts.length - 2],
        country: parts[parts.length - 1]
    };
}


/* -------- PER-FIELD SAVES (name / phone / address) -------- */

function setDetailBtn(btn, text, disabled) {
    if (!btn) return;
    btn.disabled = !!disabled;
    btn.textContent = text;
}

async function refreshCompleteFlag() {
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.exists() ? snap.data() : {};
        const firstName = (document.getElementById("p-first-name")?.value || d.firstName || "").trim();
        const surname = (document.getElementById("p-surname")?.value || d.surname || "").trim();
        const phone = (document.getElementById("p-phone")?.value || d.phone || "").trim();
        const complete = Boolean(firstName && surname && String(phone).replace(/\D/g, "").length >= 10);
        if (complete && !d.profileComplete) {
            await setDoc(doc(db, "users", user.uid), { profileComplete: true }, { merge: true });
        }
        try { refreshSetupBanner({ firstName, surname, phone, profileComplete: complete || !!d.profileComplete }); } catch (_) {}
    } catch (_) {}
}

document.getElementById("save-name-btn")?.addEventListener("click", async () => {
    const btn = document.getElementById("save-name-btn");
    const firstName = (document.getElementById("p-first-name")?.value || "").trim();
    const surname = (document.getElementById("p-surname")?.value || "").trim();
    if (!firstName && !surname) {
        alert("Enter at least a first name or surname.");
        return;
    }
    setDetailBtn(btn, "Saving…", true);
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const prev = snap.exists() ? snap.data() : {};
        const nameChanged = (firstName !== (prev.firstName || "") || surname !== (prev.surname || ""));
        if (nameChanged) {
            const { applyNameChange } = await import("./profile-cooldown.js");
            await applyNameChange(firstName, surname, prev.middleInitial || "");
        } else {
            await setDoc(doc(db, "users", user.uid), { firstName, surname }, { merge: true });
        }
        const nameEl = document.getElementById("profile-name");
        if (nameEl) setProfileNameLetters(nameEl, `${firstName} ${surname}`.trim() || "HomeFinder User");
        const initialsEl = document.getElementById("avatar-initials");
        if (initialsEl) {
            const a = firstName[0] || "";
            const b = surname[0] || "";
            initialsEl.textContent = ((a + b).toUpperCase() || "HF").slice(0, 2);
        }
        await refreshCompleteFlag();
        try {
            const { applyIdentityCooldownUI } = await import("./profile-cooldown.js");
            await applyIdentityCooldownUI();
        } catch (_) {}
        setDetailBtn(btn, "Saved!", true);
        setTimeout(() => setDetailBtn(btn, "Save name", false), 1200);
    } catch (error) {
        console.error(error);
        if (String(error.message || error) !== "Cancelled") {
            alert(error.message || "Could not save name");
        }
        setDetailBtn(btn, "Save name", false);
    }
});

document.getElementById("save-phone-btn")?.addEventListener("click", async () => {
    const btn = document.getElementById("save-phone-btn");
    const phoneRaw = (document.getElementById("p-phone")?.value || "").trim();
    const phoneDigits = phoneRaw.replace(/\D/g, "");
    const phone = /^09\d{9}$/.test(phoneDigits)
        ? `63${phoneDigits.slice(1)}`
        : (/^63\d{10}$/.test(phoneDigits) ? phoneDigits : "");
    if (!phone) {
        alert("Enter a valid Philippine mobile number as exactly 12 digits (639XXXXXXXXX).");
        return;
    }
    setDetailBtn(btn, "Saving…", true);
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const prev = snap.exists() ? snap.data() : {};
        const phoneChanged = phone !== (prev.phone || "");
        if (phoneChanged) {
            const { applyPhoneChange } = await import("./profile-cooldown.js");
            await applyPhoneChange(phone);
        } else {
            await setDoc(doc(db, "users", user.uid), { phone }, { merge: true });
        }
        await refreshCompleteFlag();
        try {
            const { applyIdentityCooldownUI } = await import("./profile-cooldown.js");
            await applyIdentityCooldownUI();
        } catch (_) {}
        setDetailBtn(btn, "Saved!", true);
        setTimeout(() => setDetailBtn(btn, "Save phone", false), 1200);
    } catch (error) {
        console.error(error);
        if (String(error.message || error) !== "Cancelled") {
            alert(error.message || "Could not save mobile");
        }
        setDetailBtn(btn, "Save phone", false);
    }
});

document.getElementById("save-address-btn")?.addEventListener("click", async () => {
    const btn = document.getElementById("save-address-btn");
    const addressRaw = (document.getElementById("p-address")?.value || "").trim();
    const address = parseAddressInput(addressRaw);
    setDetailBtn(btn, "Saving…", true);
    try {
        const { applyAddressChange, applyIdentityCooldownUI } = await import("./profile-cooldown.js");
        await applyAddressChange(address);
        await refreshCompleteFlag();
        await applyIdentityCooldownUI();
        setDetailBtn(btn, "Saved!", true);
        setTimeout(() => setDetailBtn(btn, "Save address", false), 1200);
    } catch (error) {
        console.error(error);
        if (String(error.message || error) !== "Cancelled") {
            const code = error?.code || "";
            const raw = String(error.message || error || "");
            let msg = raw || "Could not save address";
            if (code === "permission-denied" || /insufficient permissions/i.test(raw)) {
                msg = "Could not save address (permission denied). If this persists after a refresh, contact support — profile address rules may need a deploy.";
            }
            alert(msg);
        }
        setDetailBtn(btn, "Save address", false);
    }
});

// Failsafe: never leave header on "Loading…" forever
async function applyNameFailsafe() {
    const el = document.getElementById("profile-name");
    if (!el) return;
    if (!/^Loading/i.test(el.textContent || "") && el.textContent.trim() !== "") return;
    try {
        if (user?.uid) {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                const d = snap.data() || {};
                const full = `${d.firstName || ""} ${d.surname || ""}`.trim();
                if (full) {
                    el.textContent = full;
                    const emailEl = document.getElementById("profile-email");
                    if (emailEl) emailEl.textContent = d.email || user.email || "";
                    return;
                }
            }
        }
    } catch (e) { console.warn("failsafe getDoc", e); }
    const authName = (user?.displayName || "").trim();
    const emailLocal = (user?.email || "").split("@")[0] || "";
    el.textContent = authName || emailLocal || "HomeFinder User";
    const emailEl = document.getElementById("profile-email");
    if (emailEl && !emailEl.textContent && user?.email) emailEl.textContent = user.email;
}
setTimeout(() => { applyNameFailsafe(); }, 400);
setTimeout(() => { applyNameFailsafe(); }, 1500);
setTimeout(() => { applyNameFailsafe(); }, 4000);
setTimeout(() => { applyNameFailsafe(); }, 10000);


/* -------- SETUP BANNER (Finish Account Setup) -------- */
/* Visible when profile incomplete; Hide lasts until next login only. */

const SETUP_HIDE_KEY = "hf_hide_setup_banner";

function isProfileComplete(data) {
    if (!data) return false;
    if (data.profileComplete === true) return true;
    const name = `${data.firstName || ""} ${data.surname || ""}`.trim();
    const phone = String(data.phone || "").replace(/\D/g, "");
    return Boolean(name && phone.length >= 10);
}

function showSetupBanner(show) {
    const zone = document.getElementById("completion-alert-zone");
    if (!zone) return;
    if (show) {
        zone.classList.remove("is-hidden");
        zone.removeAttribute("hidden");
    } else {
        zone.classList.add("is-hidden");
        zone.setAttribute("hidden", "");
    }
}

export function refreshSetupBanner(data) {
    const hiddenThisLogin = sessionStorage.getItem(SETUP_HIDE_KEY) === "1";
    const complete = isProfileComplete(data);
    showSetupBanner(!complete && !hiddenThisLogin);
}

function initSetupBannerControls() {
    const hideBtn = document.getElementById("hide-setup-banner");
    hideBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        sessionStorage.setItem(SETUP_HIDE_KEY, "1");
        showSetupBanner(false);
    });
}

initSetupBannerControls();

/* Independent identity cooldowns (name / phone / address) */
(async function initIdentityCooldowns() {
    try {
        const { applyIdentityCooldownUI } = await import("./profile-cooldown.js");
        await applyIdentityCooldownUI();
        document.addEventListener("hf:tab-activated", (e) => {
            if (e.detail?.tab === "edit-fields") {
                applyIdentityCooldownUI().catch(() => {});
            }
        });
    } catch (e) {
        console.warn("identity cooldown UI", e);
    }
})();

