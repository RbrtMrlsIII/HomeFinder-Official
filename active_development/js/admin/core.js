/* HF-BUILD-2026-08-13 | core.js | three-role ops gate
 * Admin / Moderator / Staff — fair boundaries, dedicated pages.
 */
import { auth, db, functions } from "../firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged, signOut }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    ADMIN_UID,
    opsRoleForUid,
    opsRoleForCanonicalRole,
    isOpsUid,
    staffRoleForUid
} from "../admin-uid.js";

export { ADMIN_UID, functions };
export let user = null;
/** "admin" | "moderator" | "staff" */
export let opsRole = null;
/** legacy: "super" | "moderator" | "staff" */
export let staffRole = null;

const deny = (msg) => {
    document.body.innerHTML = `
        <div class="admin-denied">
            <div class="admin-denied-card">
                <i class='bx bxs-shield-x'></i>
                <h1>Access denied</h1>
                <p>${msg}</p>
                <a href="${homePageForRole(opsRole)}" class="admin-btn admin-btn-ghost">Back to console</a>
            </div>
        </div>`;
    throw new Error(msg);
};

function homePageForRole(role) {
    if (role === "admin") return "admin.html";
    if (role === "moderator") return "moderator.html";
    if (role === "staff") return "staff.html";
    return "profile.html";
}

await new Promise((resolve) => {
    onAuthStateChanged(auth, (u) => {
        if (!u) {
            window.location.href = "login.html";
            return;
        }
        getDoc(doc(db, "users", u.uid)).then((snap) => {
            const data = snap.exists() ? snap.data() : {};
            const resolvedRole = opsRoleForCanonicalRole(
                data.canonicalRole ?? data.accountType ?? data.role,
                u.uid
            );
            if (!resolvedRole) {
                deny("This console is only for HomeFinder ops accounts (Staff, Moderator, or Admin).");
                return;
            }
            user = u;
            opsRole = resolvedRole;
            staffRole = resolvedRole === "admin" ? "super" : resolvedRole;
            resolve();
        }).catch(() => {
            if (!isOpsUid(u.uid)) {
                deny("This console is only for HomeFinder ops accounts (Staff, Moderator, or Admin).");
                return;
            }
            user = u;
            opsRole = opsRoleForUid(u.uid);
            staffRole = staffRoleForUid(u.uid);
            resolve();
        });
        resolve();
    });
});

const path = (window.location.pathname || "").split("/").pop() || "";
const opsPages = new Set(["admin.html", "moderator.html", "staff.html"]);
const isOpsPage = opsPages.has(path);
const expected = homePageForRole(opsRole);
if (expected && isOpsPage && path !== expected) {
    window.location.replace(expected);
}

document.documentElement.dataset.opsRole = opsRole || "";
document.documentElement.dataset.staffRole = staffRole || "";
document.querySelectorAll("[data-ops-admin-only]").forEach((el) => {
    el.hidden = opsRole !== "admin";
});
document.body.classList.remove("staff-super", "staff-moderator", "staff-staff", "ops-admin", "ops-moderator", "ops-staff");
if (opsRole === "admin") document.body.classList.add("ops-admin", "staff-super");
if (opsRole === "moderator") document.body.classList.add("ops-moderator", "staff-moderator");
if (opsRole === "staff") document.body.classList.add("ops-staff", "staff-staff");

const roleChip = document.getElementById("admin-role-chip");
if (roleChip) {
    const label = opsRole === "admin" ? "Admin"
        : opsRole === "moderator" ? "Moderator"
        : opsRole === "staff" ? "Staff"
        : "Ops";
    roleChip.textContent = label;
    roleChip.className = "admin-role-chip " + (
        opsRole === "admin" ? "is-super"
        : opsRole === "moderator" ? "is-mod"
        : "is-staff"
    );
}

export async function adminLogout() {
    await signOut(auth);
    window.location.href = "login.html";
}

export { db, auth };
