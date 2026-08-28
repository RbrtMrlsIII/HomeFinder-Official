/* ==================================== */
/*  TABS                                */
/* ==================================== */
/* Hash-based tab switching so a page refresh keeps you on the  */
/* same tab. Exports activateTab() for other modules (e.g. the  */
/* settings dropdown) that need to jump to a tab programmatically. */

import { isVisiting } from "./visit-mode.js";

const tabs = document.querySelectorAll(".profile-tab");
const panels = document.querySelectorAll(".profile-panel");

export function activateTab(tabName){
    if (!tabName) return;
    // Do not activate a role-hidden panel (avoids blank tab switches)
    const targetPanel = document.getElementById("panel-" + tabName);
    if (targetPanel && (targetPanel.classList.contains("is-hidden") || targetPanel.style.display === "none")) return;

    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
    panels.forEach(p => p.classList.toggle("active", p.id === "panel-" + tabName));
    history.replaceState(null, "", "#" + tabName);

    // Keep scroll stable — do NOT toggle profile-header collapsed here.
    // Header collapse is owned only by header-scroll.js (real scroll).
    // Mutating header height on tab change caused the "shake" on switch.

    document.dispatchEvent(new CustomEvent("hf:tab-activated", { detail: { tab: tabName } }));
}

tabs.forEach(tab=>{
    tab.addEventListener("click", () => {
        if (tab.classList.contains("is-hidden") || tab.style.display === "none") return;
        activateTab(tab.dataset.tab);
    });
});

const initialTab = location.hash.replace("#","") || "perks";
activateTab(initialTab);

/* -------- ROLE-BASED VISIBILITY -------- */
/* Called once from profile-data.js after the user's real accountType  */
/* loads. Hides (not just deactivates) any tab/panel whose data-roles  */
/* list doesn't include the given role, and reroutes off a tab that    */
/* just became hidden -- e.g. the URL hash pointed at one, or the      */
/* "perks" default happens to not be allowed for this role.            */

export function applyRoleVisibility(role){
    // Visiting someone else's profile has its own, more specific tab
    // filtering (js/profile/visitor-profile.js) that must be the ONLY
    // thing controlling tab visibility in that mode -- this function
    // running too, based on the *visitor's own* role, used to race
    // against it and could silently re-hide the one tab visit mode
    // needs shown (properties-view has data-roles="" specifically so
    // it's never shown by normal role rules, only by visit mode).
    if (isVisiting) return;
    document.querySelectorAll("[data-roles]").forEach(el=>{
        const allowed = (el.dataset.roles || "").split(",").map(r=>r.trim()).filter(Boolean);
        // Empty data-roles="" means "no role restriction" only if attribute missing;
        // empty list = hide. Exception: attribute present but empty string → hide.
        const visible = allowed.length === 0
            ? !el.hasAttribute("data-roles")  // no attribute → show; data-roles="" → hide
            : allowed.includes(role);

        if (el.classList.contains("profile-panel")) {
            // CRITICAL: never set display:"" / block on panels.
            // Inline display overrides CSS and makes EVERY role-visible panel
            // show at once ("Perks" content appears under all tabs).
            // Tabs control visibility only via .active → CSS display:block.
            if (!visible) {
                el.style.display = "none";
                el.classList.remove("active");
            } else {
                el.style.removeProperty("display");
            }
        } else {
            // Tab buttons, etc.
            el.style.display = visible ? "" : "none";
        }
    });

    // a panel just hidden by the pass above shouldn't stay marked
    // "active" -- e.g. a stale #hash pointed at a tab this role can't see
    panels.forEach(panel=>{
        if(panel.style.display === "none") panel.classList.remove("active");
    });

    // reroute off a panel that just became hidden (or was never visible
    // for this role) onto the first tab this role can see. Checks the
    // active PANEL rather than the active tab button, since not every
    // panel (e.g. Account Details, reachable only via the settings menu)
    // has a corresponding tab-bar button anymore.
    const activePanel = Array.from(panels).find(p => p.classList.contains("active"));
    if(!activePanel || activePanel.style.display === "none"){
        const firstVisible = Array.from(tabs).find(t => t.style.display !== "none");
        if(firstVisible) activateTab(firstVisible.dataset.tab);
    }
}

// Bridge for inline onclick="" handlers in profile.html (e.g. the
// "Complete Setup" banner button, the portfolio's "Add New" button) --
// those run in global scope, not this module's scope, so activateTab
// needs an explicit window hook to be reachable from them.
window.activateDashboardTab = activateTab;


/* Delegated tab jumps (replaces inline onclick=activateDashboardTab) */
document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-activate-tab]");
    if (!btn) return;
    const name = btn.getAttribute("data-activate-tab");
    if (!name) return;
    activateTab(name);
    const panel = document.getElementById("panel-" + name);
    if (panel) {
        requestAnimationFrame(() => {
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }
});


/* Tab switching is click-only (no swipe / no scroll-snap auto-activate).
   Header collapse remains scroll-driven in header-scroll.js only. */

