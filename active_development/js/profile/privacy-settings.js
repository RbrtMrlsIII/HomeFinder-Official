/* Privacy toggles - ON/OFF for basic / email / phone */
import { user, db } from "./core.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function getPrivacy() {
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        return (snap.exists() && snap.data().privacy) || {};
    } catch (e) {
        console.warn("getPrivacy", e);
        return {};
    }
}

async function savePrivacy(next) {
    await setDoc(doc(db, "users", user.uid), { privacy: next }, { merge: true });
}

function paint(action, isOn, onText, offText) {
    const el = document.querySelector('[data-action="' + action + '"]');
    if (!el) return;
    let span = el.querySelector("span");
    if (!span) {
        span = document.createElement("span");
        el.appendChild(span);
    }
    span.textContent = isOn ? onText : offText;
    el.classList.toggle("privacy-on", !!isOn);
    el.classList.toggle("privacy-off", !isOn);
    el.setAttribute("aria-pressed", isOn ? "true" : "false");
    let badge = el.querySelector(".privacy-badge");
    if (!badge) {
        badge = document.createElement("em");
        badge.className = "privacy-badge";
        el.appendChild(badge);
    }
    badge.textContent = isOn ? "ON" : "OFF";
    badge.classList.toggle("privacy-badge-on", isOn);
    badge.classList.toggle("privacy-badge-off", !isOn);
    el.classList.add("privacy-toggle-row");
}

export async function toggleShowBasicInfo() {
    const privacy = Object.assign({}, await getPrivacy());
    const currentlyOn = privacy.showBasicInfo !== false;
    privacy.showBasicInfo = !currentlyOn;
    await savePrivacy(privacy);
    await refreshPrivacyLabel();
}
export async function toggleShowEmail() {
    const privacy = Object.assign({}, await getPrivacy());
    privacy.showEmail = privacy.showEmail !== true;
    await savePrivacy(privacy);
    await refreshPrivacyLabel();
}
export async function toggleShowPhone() {
    const privacy = Object.assign({}, await getPrivacy());
    privacy.showPhone = privacy.showPhone !== true;
    await savePrivacy(privacy);
    await refreshPrivacyLabel();
}
export async function toggleHideOnline() {
    const privacy = Object.assign({}, await getPrivacy());
    privacy.hideOnlineStatus = privacy.hideOnlineStatus !== true;
    await savePrivacy(privacy);
    await refreshPrivacyLabel();
}
export async function refreshPrivacyLabel() {
    try {
        const privacy = await getPrivacy();
        // Label = current state + what tap does (visitor About only)
        paint("privacy-toggle", privacy.showBasicInfo !== false,
            "Name on public profile · ON — tap to hide", "Name on public profile · OFF — tap to show");
        paint("privacy-email", privacy.showEmail === true,
            "Email on public profile · ON — tap to hide", "Email on public profile · OFF — tap to show");
        paint("privacy-phone", privacy.showPhone === true,
            "Phone on public profile · ON — tap to hide", "Phone on public profile · OFF — tap to show");
        paint("privacy-online", privacy.hideOnlineStatus !== true,
            "Online status · ON — tap to hide", "Online status · OFF — tap to show");
    } catch (e) { console.warn(e); }
}
refreshPrivacyLabel();
