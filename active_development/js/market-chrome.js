/* Market header chrome: settings, density, brand avatar, auth visibility */
import { authReady } from "./session.js";
import { auth, db } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const SCALE_KEY = "hf_market_scale"; // Market Header owns the page/global scale; map has no independent scale.

function $(id) {
  return document.getElementById(id);
}

function applyScale(pct) {
  let n = Number(pct);
  if (!Number.isFinite(n)) n = 100;
  n = Math.min(100, Math.max(50, Math.round(n)));
  const factor = n / 100;
  const inv = factor > 0 ? 1 / factor : 1;
  const root = $("market-scale-root") || document.body;

  // Whole-page root: header · guide · map bands · feeds · footer
  root.style.setProperty("--market-ui-scale", String(factor));
  root.style.setProperty("--market-ui-scale-inv", String(inv));
  document.body.setAttribute("data-scale", String(n));
  document.documentElement.style.setProperty("--market-ui-scale", String(factor));
  document.documentElement.style.setProperty("--market-ui-scale-inv", String(inv));

  // Prefer zoom on the scale root. Clear legacy body zoom (no double scale).
  try {
    document.body.style.zoom = "";
  } catch (_) {}
  try {
    root.style.zoom = String(factor);
  } catch (_) {}

  // Fallback when zoom is unsupported: transform the root
  const zoomApplied = root.style.zoom && root.style.zoom !== "" && root.style.zoom !== "normal";
  if (!zoomApplied) {
    root.style.transform = `scale(${factor})`;
    root.style.transformOrigin = "top center";
    root.style.width = factor > 0 ? `${100 / factor}%` : "100%";
  } else {
    root.style.transform = "";
    root.style.width = "";
  }

  // Settings menu counter-scale so the slider stays readable at 50%
  const dd = $("market-settings-dropdown");
  if (dd) {
    try {
      dd.style.zoom = String(inv);
    } catch (_) {
      dd.style.transform = `scale(${inv})`;
      dd.style.transformOrigin = "top right";
    }
  }

  try { localStorage.setItem(SCALE_KEY, String(n)); } catch (_) {}
  const label = $("market-scale-value");
  if (label) label.textContent = String(n);
  const range = $("market-scale-range");
  if (range && String(range.value) !== String(n)) range.value = String(n);

  document.querySelectorAll(".market-scale-preset").forEach((btn) => {
    const p = Number(btn.getAttribute("data-scale-preset"));
    btn.classList.toggle("is-active", p === n);
  });

  // MapLibre + band layout need a reflow after scale
  requestAnimationFrame(() => {
    try { window.dispatchEvent(new Event("resize")); } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent("hf:scale-changed", { detail: { pct: n, factor, scope: "global-page" } }));
    } catch (_) {}
    try {
      const mapEl = $("market-map");
      if (mapEl) mapEl.dispatchEvent(new Event("hf:scale-changed"));
    } catch (_) {}
  });
}


function syncAuthVisibility(user) {
  document.querySelectorAll("[data-auth=guest]").forEach((el) => {
    el.hidden = !!user;
  });
  document.querySelectorAll("[data-auth=user]").forEach((el) => {
    el.hidden = !user;
  });
}

async function syncBrand(user) {
  const logo = $("market-brand-logo");
  const avatar = $("market-brand-avatar");
  const img = $("market-user-avatar-img");
  const initials = $("market-user-avatar-initials");
  if (!user) {
    if (logo) logo.hidden = false;
    if (avatar) avatar.hidden = true;
    return;
  }
  if (logo) logo.hidden = true;
  if (avatar) avatar.hidden = false;
  let name = user.displayName || user.email || "?";
  let photo = user.photoURL || "";
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const d = snap.data();
      name = d.displayName || d.name || [d.firstName, d.surname].filter(Boolean).join(" ") || name;
      photo = d.avatarUrl || d.photoURL || photo;
    }
  } catch (_) {}
  const letters = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";
  if (initials) initials.textContent = letters;
  if (img) {
    if (photo) {
      img.hidden = false;
      img.src = photo;
      if (initials) initials.hidden = true;
    } else {
      img.hidden = true;
      if (initials) initials.hidden = false;
    }
  }
}

function closeSettings() {
  const dd = $("market-settings-dropdown");
  const btn = $("market-settings-btn");
  if (dd) dd.hidden = true;
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function openDictionary(open) {
  const modal = $("market-dictionary-modal");
  if (!modal) return;
  modal.hidden = !open;
}


function wireRulesSections() {
  const nav = $("market-rules-nav");
  if (!nav || nav.dataset.bound === "1") return;
  nav.dataset.bound = "1";
  nav.addEventListener("click", (e) => {
    const chip = e.target.closest?.("[data-rules-section]");
    if (!chip) return;
    e.preventDefault();
    e.stopPropagation();
    const id = chip.getAttribute("data-rules-section");
    nav.querySelectorAll("[data-rules-section]").forEach((c) => {
      c.classList.toggle("is-active", c === chip);
    });
    document.querySelectorAll("[data-rules-panel]").forEach((panel) => {
      const on = panel.getAttribute("data-rules-panel") === id;
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
    });
  });
}

function wireSettings() {
  const range = $("market-scale-range");
  if (range) {
    const onScale = (e) => {
      e.stopPropagation();
      applyScale(e.target.value);
    };
    range.addEventListener("input", onScale);
    range.addEventListener("change", onScale);
    // prevent settings menu click handler from hijacking the range
    range.addEventListener("click", (e) => e.stopPropagation());
    range.addEventListener("pointerdown", (e) => e.stopPropagation());
  }

  $("market-settings-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const dd = $("market-settings-dropdown");
    if (!dd) return;
    const next = dd.hidden;
    dd.hidden = !next;
    $("market-settings-btn")?.setAttribute("aria-expanded", next ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    const wrap = e.target.closest?.(".market-settings-wrap");
    if (!wrap) closeSettings();
  });

  document.getElementById("market-settings-dropdown")?.addEventListener("click", async (e) => {
    if (e.target.closest?.("#market-scale-range, .market-scale-row")) return;
    const btn = e.target.closest?.("[data-market-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-market-action");
    if (action === "scale") return;
    e.preventDefault();

    if (action === "home") {
      window.location.href = "index.html";
      return;
    }
    if (action === "login") {
      window.location.href = "login.html?next=" + encodeURIComponent("market.html");
      return;
    }
    if (action === "register") {
      window.location.href = "register.html";
      return;
    }
    if (action === "profile") {
      window.location.href = "profile.html";
      return;
    }
    if (action === "logout") {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn(err);
      }
      window.location.href = "market.html";
      return;
    }
    if (action === "dictionary") {
      closeSettings();
      openDictionary(true);
      return;
    }
    if (action === "close-dictionary") {
      openDictionary(false);
      return;
    }
  });
}

async function boot() {
  applyScale(localStorage.getItem(SCALE_KEY) || "100");
  wireSettings();
  wireRulesSections();

  let user = null;
  try {
    user = await authReady;
  } catch (_) {
    user = null;
  }
  syncAuthVisibility(user);
  await syncBrand(user);
}

boot();
