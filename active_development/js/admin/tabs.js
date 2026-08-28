/* Admin tab switching — robust, no dependency on other modules */

function activateAdminTab(tabId) {
    if (!tabId) return;
    document.querySelectorAll(".admin-tab-btn").forEach((t) => {
        t.classList.toggle("active", t.dataset.tab === tabId);
    });
    document.querySelectorAll(".admin-panel").forEach((p) => {
        const match = p.id === "admin-panel-" + tabId;
        p.classList.toggle("active", match);
        // force display in case CSS loses a race
        p.classList.toggle("is-hidden", !match);
    });
    try {
        history.replaceState(null, "", "#tab=" + tabId);
    } catch (_) {}
}

function bindAdminTabs() {
    document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            activateAdminTab(btn.dataset.tab);
        });
    });

    // deep-link support
    const hash = (location.hash || "").replace(/^#/, "");
    if (hash.startsWith("tab=")) {
        activateAdminTab(hash.slice(4));
    } else {
        // ensure only the active panel is visible on load
        const current = document.querySelector(".admin-tab-btn.active")?.dataset.tab || "verifications";
        activateAdminTab(current);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAdminTabs);
} else {
    bindAdminTabs();
}

export { activateAdminTab };
