/* ==================================== */
/*  AVATAR PICKER (curated only)       */
/* ==================================== */
/* Users cannot upload custom photos. They pick from assets/User Avatars. */

import { user, db } from "./core.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { lockBodyScroll, unlockBodyScroll } from "./body-scroll-lock.js";

export const CURATED_AVATARS = [
    "assets/User Avatars/image_5547e4a1.webp",
    "assets/User Avatars/image_75f53a8b.webp",
    "assets/User Avatars/image_78423f51.webp",
    "assets/User Avatars/image_7b08ec7c.webp",
    "assets/User Avatars/image_85396f8c.webp",
    "assets/User Avatars/image_9fc3978b.webp",
    "assets/User Avatars/image_a48e5b59.webp",
    "assets/User Avatars/image_ab3b5fdb.webp",
    "assets/User Avatars/image_cb7ef1d4.webp",
    "assets/User Avatars/image_d052ef90.webp",
    "assets/User Avatars/image_d89bb40d.webp",
    "assets/User Avatars/image_d9cbc399.webp",
    "assets/User Avatars/image_edf294ba.webp",
    "assets/User Avatars/image_fd906f9a.webp"
];

export function openAvatarPicker() {
    const modal = document.getElementById("avatar-picker-modal");
    if (!modal) return;
    const grid = document.getElementById("avatar-picker-grid");
    if (grid && !grid.dataset.ready) {
        grid.innerHTML = CURATED_AVATARS.map((src, i) => `
            <button type="button" class="avatar-pick-btn" data-src="${src}" aria-label="Avatar ${i + 1}">
                <img src="${src}" alt="Avatar option ${i + 1}" loading="lazy">
            </button>
        `).join("");
        grid.dataset.ready = "1";
        grid.querySelectorAll(".avatar-pick-btn").forEach((btn) => {
            btn.addEventListener("click", () => selectAvatar(btn.dataset.src));
        });
    }
    modal.classList.add("active");
    lockBodyScroll();
}

export function closeAvatarPicker() {
    document.getElementById("avatar-picker-modal")?.classList.remove("active");
    unlockBodyScroll();
}

async function selectAvatar(src) {
    try {
        await updateDoc(doc(db, "users", user.uid), { avatarUrl: src });
        applyAvatarToDom(src);
        closeAvatarPicker();
    } catch (err) {
        console.error(err);
        const msg = err?.code === "permission-denied"
            ? "Could not save avatar (permission denied). Try again or contact support."
            : ("Could not save avatar: " + (err.message || err));
        alert(msg);
        unlockBodyScroll();
    }
}

export function applyAvatarToDom(src) {
    const avatar = document.getElementById("profile-avatar");
    if (!avatar) return;
    let img = avatar.querySelector("img.profile-avatar-img");
    const initials = document.getElementById("avatar-initials");
    if (src) {
        if (!img) {
            img = document.createElement("img");
            img.className = "profile-avatar-img";
            img.alt = "Profile avatar";
            avatar.insertBefore(img, avatar.firstChild);
        }
        img.src = src;
        img.classList.remove("is-hidden");
        if (initials) initials.classList.add("is-hidden");
    } else {
        if (img) img.classList.add("is-hidden");
        if (initials) initials.classList.remove("is-hidden");
    }
}

// Disable free-form camera upload on the avatar button
const editBtn = document.querySelector(".avatar-edit");
if (editBtn) {
    editBtn.setAttribute("aria-label", "Choose avatar");
    editBtn.title = "Choose from HomeFinder avatars";
    editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAvatarPicker();
    });
}

document.getElementById("avatar-picker-close")?.addEventListener("click", closeAvatarPicker);
document.getElementById("avatar-picker-backdrop")?.addEventListener("click", closeAvatarPicker);

// Load saved avatar
(async () => {
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().avatarUrl) {
            applyAvatarToDom(snap.data().avatarUrl);
        }
    } catch (_) {}
})();
