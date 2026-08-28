/* Profile settings dropdown — role-aware product controls */
import { getRole } from "./role.js";

const settingsBtn = document.getElementById("settings-btn");
const settingsDropdown = document.getElementById("settings-dropdown");

function placeSettingsMenu() {
    if (!settingsDropdown || !settingsBtn) return;
    const r = settingsBtn.getBoundingClientRect();
    const menuW = Math.min(300, window.innerWidth - 16);
    let top = r.bottom + 6;
    const maxH = Math.min(window.innerHeight * 0.7, 480);
    if (top + 120 > window.innerHeight) {
      top = Math.max(8, r.top - 8);
    }
    settingsDropdown.style.position = "fixed";
    settingsDropdown.style.top = top + "px";
    settingsDropdown.style.right = Math.max(8, window.innerWidth - r.right) + "px";
    settingsDropdown.style.left = "auto";
    settingsDropdown.style.width = menuW + "px";
    settingsDropdown.style.maxHeight = maxH + "px";
    settingsDropdown.style.zIndex = "30000";
}

function closeSettings() {
    settingsDropdown?.classList.remove("open", "active", "is-portaled");
    if (settingsDropdown) {
      settingsDropdown.style.top = "";
      settingsDropdown.style.right = "";
    }
}

function openSettings() {
    if (!settingsDropdown) return;
    if (settingsDropdown.parentElement !== document.body) {
      document.body.appendChild(settingsDropdown);
    }
    settingsDropdown.classList.add("open", "active", "is-portaled");
    placeSettingsMenu();
}

function activateTab(name) {
    document.querySelector(`.profile-tab[data-tab="${name}"]`)?.click();
}

/** Resolve only product-role visibility. Operations roles cannot enter Profile. */
async function resolveSettingsRoles() {
    const role = (await getRole()) || "seeker";
    return { role, roles: new Set([role]) };
}

function applySettingsVisibility(roles) {
    if (!settingsDropdown) return;
    settingsDropdown.querySelectorAll("[data-roles]").forEach((el) => {
        const need = String(el.getAttribute("data-roles") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        // Search people: SoT §17 — data-roles only (broker + ops)
        const ok = need.length === 0 || need.some((r) => roles.has(r));
        el.hidden = !ok;
    });
    const anySearch = [...settingsDropdown.querySelectorAll("[data-action^='search-']")]
        .some((b) => !b.hidden);
    const div = settingsDropdown.querySelector("[data-settings-search-divider]");
    if (div) div.hidden = !anySearch;
}

let ignoreDocCloseUntil = 0;

settingsBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!settingsDropdown) return;
    const willOpen = !(settingsDropdown.classList.contains("open") || settingsDropdown.classList.contains("active"));
    if (willOpen) {
        openSettings();
        ignoreDocCloseUntil = Date.now() + 400;
        resolveSettingsRoles().then(({ roles }) => applySettingsVisibility(roles));
    } else {
        closeSettings();
    }
});

document.addEventListener("click", (e) => {
    if (!settingsDropdown?.classList.contains("open") && !settingsDropdown?.classList.contains("active")) return;
    if (Date.now() < ignoreDocCloseUntil) return;
    if (settingsDropdown.contains(e.target) || e.target === settingsBtn || settingsBtn?.contains(e.target)) return;
    closeSettings();
});

document.addEventListener("DOMContentLoaded", () => {
    resolveSettingsRoles().then(({ roles }) => applySettingsVisibility(roles));

    settingsDropdown?.querySelectorAll("button[data-action]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const action = btn.dataset.action;
            if (!action) return;

            if (action === "theme") {
                // the cinematic environment root owns presentation state
                return;
            }

            if (action.startsWith("privacy-")) {
                try {
                    const m = await import("./privacy-settings.js");
                    if (action === "privacy-toggle") await m.toggleShowBasicInfo?.();
                    if (action === "privacy-email") await m.toggleShowEmail?.();
                    if (action === "privacy-online") await m.toggleHideOnline?.();
                    if (action === "privacy-phone") await m.toggleShowPhone?.();
                } catch (err) {
                    console.error("privacy toggle failed", err);
                    alert("Could not update privacy: " + (err.message || err));
                }
                return;
            }

            closeSettings();

            if (action === "edit-profile") activateTab("edit-fields");
            if (action === "saved") activateTab("saved");
            if (action === "perks") activateTab("perks");
            if (action === "search-user") {
                try {
                    const { openUserSearch } = await import("./user-search.js");
                    await openUserSearch();
                } catch (err) {
                    console.warn(err);
                    alert("People search unavailable. Try again.");
                }
                return;
            }

            if (action === "tier-progress") {
                const { openTierProgressModal } = await import("./tier-progress-modal.js");
                openTierProgressModal();
                return;
            }
            if (action === "support-ticket") {
                const { openSupportTicketForm } = await import("./support-ticket.js");
                openSupportTicketForm();
                return;
            }
            if (action === "law-dictionary") {
                document.getElementById("law-dictionary-modal")?.classList.add("active");
            }
            if (action === "contract-dictionary") {
                const { openContractDictionary } = await import("./contract-dictionary.js");
                openContractDictionary();
                return;
            }
            if (action === "choose-avatar") {
                closeSettings();
                try {
                    const { openAvatarPicker } = await import("./avatar-picker.js");
                    openAvatarPicker();
                } catch (err) {
                    console.warn(err);
                    alert("Avatar picker unavailable. Use the camera icon on your photo.");
                }
                return;
            }
            if (action === "delete-account") {
                try {
                    const { confirmAndDeleteAccount } = await import("./delete-account.js");
                    await confirmAndDeleteAccount();
                } catch (err) {
                    console.error(err);
                    alert("Delete account failed: " + (err?.message || err));
                }
                return;
            }
            if (action === "logout") {
                /* Handled by logout.js capture-phase listener */
                return;
            }
        });
    });
});


/* Header tier chip (outside dropdown) — capture so nothing steals the tap */
function openHeaderTier(e) {
    e.preventDefault();
    e.stopPropagation();
    import("./tier-progress-modal.js")
        .then((m) => m.openTierProgressModal())
        .catch((err) => console.error(err));
}
["tier-chip", "header-tier-chip"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", openHeaderTier, true);
});

window.addEventListener("resize", () => {
  if (settingsDropdown?.classList.contains("open")) placeSettingsMenu();
}, { passive: true });
