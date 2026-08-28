/* Single logout + single back-leave confirm */
import { auth } from "./core.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/** Restriction #1: pin localStorage is per-uid — clear this account on logout (not another user's). */
function clearMarketPinLocalForCurrentUser() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    const keys = [
      `hf_market_pin_discovery_${uid}`,
      `hf_market_pin_portfolio_${uid}`,
      `hf_market_pin_kind_${uid}`,
      `hf_market_active_pin_${uid}`,
      /* legacy non-uid keys if ever written for this session */
      "hf_market_pin_discovery",
      "hf_market_pin_portfolio",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    /* Guest pending pin must not survive as this account's after logout */
    sessionStorage.removeItem("hf_market_pending_pin");
    localStorage.removeItem("hf_market_pending_pin_ls");
  } catch (_) {}
}

let loggingOut = false;
let promptOpen = false;
let leaveArmed = false;

function closeSettingsMenu() {
  try {
    const dd = document.getElementById("settings-dropdown");
    if (dd) {
      dd.classList.remove("open", "active", "is-portaled");
      dd.style.removeProperty("display");
      dd.style.removeProperty("top");
      dd.style.removeProperty("right");
      dd.style.removeProperty("z-index");
    }
  } catch (_) {}
}

/** One confirm at a time — no double dialogs */
function askLogOutOnce() {
  if (promptOpen || loggingOut) return false;
  promptOpen = true;
  let sure = false;
  try {
    sure = window.confirm("Log out of HomeFinder?");
  } finally {
    promptOpen = false;
  }
  return sure;
}

export async function confirmAndLogOut() {
  if (loggingOut) return;
  closeSettingsMenu();
  if (!askLogOutOnce()) return;
  loggingOut = true;
  try {
    clearMarketPinLocalForCurrentUser();
    try { sessionStorage.removeItem("hf_account_role"); } catch (_) {}
    await signOut(auth);
    window.location.href = "login.html";
  } catch (e) {
    loggingOut = false;
    console.error(e);
    alert("Could not log out: " + (e?.message || e));
  }
}

// Capture once — ignore if already handled this event tick
let lastLogoutTs = 0;
document.addEventListener(
  "click",
  (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    const btn = t.closest('[data-action="logout"], #settings-logout-btn, #logout-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastLogoutTs < 800) return; // debounce double handlers
    lastLogoutTs = now;
    confirmAndLogOut();
  },
  true
);

async function onLeavePop() {
  if (loggingOut || promptOpen) return;
  if (!askLogOutOnce()) {
    try {
      history.pushState({ hfProfileLeave: 1 }, "", location.href);
    } catch (_) {}
    return;
  }
  loggingOut = true;
  try {
    clearMarketPinLocalForCurrentUser();
    try { sessionStorage.removeItem("hf_account_role"); } catch (_) {}
    await signOut(auth);
  } catch (_) {}
  window.location.href = "login.html";
}

function armLeaveGuard() {
  if (leaveArmed) return;
  if (!document.body?.classList.contains("profile-page")) return;
  if (new URLSearchParams(location.search).get("uid")) return;
  leaveArmed = true;
  try {
    history.pushState({ hfProfileLeave: 1 }, "", location.href);
  } catch (_) {}
  window.addEventListener("popstate", onLeavePop);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(armLeaveGuard, 500));
} else {
  setTimeout(armLeaveGuard, 500);
}
