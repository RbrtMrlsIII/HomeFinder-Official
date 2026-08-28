/* Market map — MapLibre 3D + search pin + tier/boost radius + relocate cooldown (SoT) */
import * as maplibregl from "https://unpkg.com/maplibre-gl@6.3.0/dist/maplibre-gl.mjs";
import { normalizeCanonicalRole } from "./canonical-role.js";
import { authReady } from "./session.js";
import { db, app } from "./firebase.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const marketFunctions = getFunctions(app);
const relocateUserPinFn = httpsCallable(marketFunctions, "relocateUserPin");

import {
  seekerTierForCategory,
  ownerTierForScore,
  brokerTierForScore,
  resolveBoostPackageId,
  radiusForTier,
  maxPinsForAccount,
} from "./tiers.js";
import {
  getMapState,
  attemptRelocate,
  formatCooldown,
} from "./radius-cooldown.js";
import {
  entitlementMaxKm,
  effectiveRadiusKm,
  readPreferred,
  mountPreferredRadiusControl,
} from "./preferred-radius.js";
import {
  buildPinSlots,
  resolveActivePin,
  nextPinWithCenter,
  writeActivePinId,
} from "./pins-model.js";
import { marketCoordinates } from "./market-data-contract.js";

const MANILA = [120.9842, 14.5995]; // lng, lat
const DEFAULT_RADIUS_KM = 2; // T0 base until user state loads

let map = null;
let pinMarker = null;
let placingPin = false;
let mapUser = null;
let tierIndex = 0;
/** Discovery pin ladder: seeker tier (brokers use HQ — not Market discovery) */
let discoveryTierIndex = 0;
/** Portfolio pin ladder: always owner-tier (rules + SoT) */
let portfolioTierIndex = 0;
let seekerPackageId = 0;
let seekerBoostState = null;
let ownerBoostState = null;
let mapStateCache = null;
/** @type {"seeker"|"owner"|"broker"} */
let accountRole = "seeker";
/** @type {"discovery"|"portfolio"} */
let activePinKind = "discovery";
/** Slot id: discovery-1 | supply-1 | slot-2… */
let activePinSlotId = "discovery-1";
let discoveryMarker = null;
/** P03 — true only after confirm / server-or-local hydrate commit; provisional map taps stay false */
let pinCommitted = false;
let portfolioMarker = null;
const PIN_COLOR = { discovery: "#C4A574", portfolio: "#3B82F6" };
/** @deprecated unscoped keys — migrated once per kind on read */
const PIN_STORAGE_LEGACY = {
  discovery: "hf_market_pin_discovery",
  portfolio: "hf_market_pin_portfolio",
};

/**
 * Pin cache is per-uid (and guest uses "guest").
 * Prevents login→logout→login from reusing another account's device pin.
 */
function pinStorageKey(kind, uid = null) {
  const k = kind === "portfolio" ? "portfolio" : "discovery";
  const who = uid || mapUser?.uid || "guest";
  return `hf_market_pin_${k}_${who}`;
}

function pinKindKey(uid = null) {
  const who = uid || mapUser?.uid || "guest";
  return `hf_market_pin_kind_${who}`;
}

/** Firestore users/{uid} fields for each pin kind (must match firestore.rules). */
const PIN_STATE_FIELD = {
  discovery: "mapState",
  portfolio: "mapStateOwner",
};

function tierIndexForKind(kind) {
  return kind === "portfolio" ? portfolioTierIndex : discoveryTierIndex;
}

function stateFieldForKind(kind) {
  return PIN_STATE_FIELD[kind === "portfolio" ? "portfolio" : "discovery"] || "mapState";
}


function requireAuthOrLogin() {
  if (typeof window.hfMarketRequireAuth === "function") {
    window.hfMarketRequireAuth();
    return;
  }
  window.location.href = "login.html?next=" + encodeURIComponent("market.html");
}

const PENDING_PIN_KEY = "hf_market_pending_pin";
/** localStorage mirror — survives some WebView/auth redirects that drop sessionStorage */
const PENDING_PIN_LS_KEY = "hf_market_pending_pin_ls";

function savePendingPin(lngLat) {
  // Guest pending always applies as discovery search pin after login (SoT D1)
  const payload = JSON.stringify({
    lng: lngLat.lng,
    lat: lngLat.lat,
    kind: "discovery",
    at: Date.now(),
  });
  try {
    sessionStorage.setItem(PENDING_PIN_KEY, payload);
  } catch (_) {}
  try {
    localStorage.setItem(PENDING_PIN_LS_KEY, payload);
  } catch (_) {}
}

function readPendingPin() {
  const parse = (raw) => {
    if (!raw) return null;
    try {
      const p = JSON.parse(raw);
      if (!Number.isFinite(p?.lng) || !Number.isFinite(p?.lat)) return null;
      return {
        lng: p.lng,
        lat: p.lat,
        kind: p.kind === "portfolio" ? "portfolio" : "discovery",
      };
    } catch (_) {
      return null;
    }
  };
  try {
    const fromSession = parse(sessionStorage.getItem(PENDING_PIN_KEY));
    if (fromSession) return fromSession;
  } catch (_) {}
  try {
    return parse(localStorage.getItem(PENDING_PIN_LS_KEY));
  } catch (_) {
    return null;
  }
}

function clearPendingPin() {
  try {
    sessionStorage.removeItem(PENDING_PIN_KEY);
  } catch (_) {}
  try {
    localStorage.removeItem(PENDING_PIN_LS_KEY);
  } catch (_) {}
}

/** Read a committed pin from localStorage for a kind (scoped to uid). */
function readLocalPin(kind, uid = null) {
  const k = kind === "portfolio" ? "portfolio" : "discovery";
  const who = uid || mapUser?.uid || "guest";
  try {
    let raw = localStorage.getItem(pinStorageKey(k, who));
    /* One-time migrate from pre-uid keys into this uid (or guest) */
    if (!raw && who) {
      const legacy = localStorage.getItem(PIN_STORAGE_LEGACY[k]);
      if (legacy) {
        raw = legacy;
        try {
          localStorage.setItem(pinStorageKey(k, who), legacy);
          localStorage.removeItem(PIN_STORAGE_LEGACY[k]);
        } catch (_) {}
      }
    }
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!Number.isFinite(Number(p?.lng)) || !Number.isFinite(Number(p?.lat))) return null;
    return {
      lng: Number(p.lng),
      lat: Number(p.lat),
      kind: k,
      uid: who,
    };
  } catch (_) {
    return null;
  }
}

/** Clear device pin cache for a uid (call on logout). Guest key optional. */
export function clearMarketPinLocalForUid(uid) {
  if (!uid) return;
  try {
    localStorage.removeItem(pinStorageKey("discovery", uid));
    localStorage.removeItem(pinStorageKey("portfolio", uid));
    localStorage.removeItem(pinKindKey(uid));
  } catch (_) {}
}

export function clearMarketPinLocalGuest() {
  try {
    localStorage.removeItem(pinStorageKey("discovery", "guest"));
    localStorage.removeItem(pinStorageKey("portfolio", "guest"));
    localStorage.removeItem(pinKindKey("guest"));
    localStorage.removeItem(PIN_STORAGE_LEGACY.discovery);
    localStorage.removeItem(PIN_STORAGE_LEGACY.portfolio);
    localStorage.removeItem("hf_market_pin_kind");
    localStorage.removeItem("hf_market_pin");
  } catch (_) {}
}

/**
 * Cold-start hydrate: localStorage first, else Firestore lastKnownCenter.
 * Writes localStorage when restoring from server so next visit is fast.
 */
async function hydratePinKind(kind) {
  const k = kind === "portfolio" ? "portfolio" : "discovery";
  const local = readLocalPin(k);
  if (local) {
    placePin(local, { announce: false, commit: true, kind: k });
    return local;
  }
  if (!mapUser?.uid) return null;
  try {
    const field = stateFieldForKind(k);
    const tIdx = tierIndexForKind(k);
    const pkg = k === "discovery" ? seekerPackageId : 0;
    const state = await getMapState(mapUser.uid, tIdx, pkg, field);
    const c = state?.lastKnownCenter;
    if (!c || !Number.isFinite(Number(c.lng)) || !Number.isFinite(Number(c.lat))) return null;
    const pin = { lng: Number(c.lng), lat: Number(c.lat), kind: k };
    placePin(pin, { announce: false, commit: true, kind: k });
    return pin;
  } catch (e) {
    console.warn("hydratePinKind", k, e);
    return null;
  }
}

function confirmPinDialog({ isGuest, isMove }) {
  const bar = document.getElementById("market-pin-confirm");
  const msg = document.getElementById("market-pin-confirm-msg");
  const btnOk = document.getElementById("market-pin-confirm-ok");
  const btnCancel = document.getElementById("market-pin-confirm-cancel");
  if (!bar || !btnOk || !btnCancel) {
    // Fallback if markup missing
    if (isGuest) {
      return Promise.resolve(window.confirm(
        "Use this location as your search pin? You’ll sign in next."
      ));
    }
    return Promise.resolve(window.confirm(
      isMove ? "Move your search pin here?" : "Set your search pin here?"
    ));
  }
  if (msg) {
    if (isGuest) {
      msg.textContent = "Use this pin? Confirm to sign in — we’ll apply it after login.";
    } else if (isMove) {
      msg.textContent = "Move pin here? Results refresh for the new radius. Cooldown may apply.";
    } else {
      msg.textContent = "Set search pin here? You’ll only see results inside your radius.";
    }
  }
  bar.hidden = false;
  return new Promise((resolve) => {
    const done = (val) => {
      bar.hidden = true;
      btnOk.removeEventListener("click", onOk);
      btnCancel.removeEventListener("click", onCancel);
      resolve(val);
    };
    const onOk = () => done(true);
    const onCancel = () => done(false);
    btnOk.addEventListener("click", onOk);
    btnCancel.addEventListener("click", onCancel);
  });
}


/** P03 — discovery/feed must use isMarketPinCommitted() + getPinLngLat() */
export function isMarketPinCommitted() {
  return !!pinCommitted;
}

export function getPinLngLat(kind = null) {
  /* Extra slot active: prefer users.pins center */
  if (activePinSlotId && String(activePinSlotId).startsWith("slot-") && userPinsCache) {
    const c = userPinsCache[activePinSlotId]?.center;
    if (c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng))) {
      return { lng: Number(c.lng), lat: Number(c.lat) };
    }
  }
  const k = kind || activePinKind;
  const marker = k === "portfolio" ? portfolioMarker : discoveryMarker;
  if (!marker && pinMarker) {
    const ll = pinMarker.getLngLat();
    return { lng: ll.lng, lat: ll.lat };
  }
  if (!marker) return null;
  const ll = marker.getLngLat();
  return { lng: ll.lng, lat: ll.lat };
}


function wirePreferredRadiusUi() {
  const host = document.getElementById("preferred-radius-host");
  if (!host || !mapUser) {
    if (host) host.hidden = true;
    return;
  }
  host.hidden = false;
  if (window.__hfPreferredRadiusControl) {
    try { window.__hfPreferredRadiusControl.paint(); } catch (_) {}
    return;
  }
  window.__hfPreferredRadiusControl = mountPreferredRadiusControl({
    host,
    kind: "market",
    label: "Discovery radius",
    getMaxKm: () =>
      Number(window.__hfMarketMaxRadiusKm) ||
      radiusForTier(tierIndex, seekerPackageId) ||
      DEFAULT_RADIUS_KM,
    onChange: (km) => {
      window.__hfMarketPreferredKm = km;
      window.__hfMarketRadiusKm = km;
      const pin = getPinLngLat();
      if (pin) drawRadius({ lng: pin.lng, lat: pin.lat });
      const rChip = document.getElementById("market-radius-chip"); /* stats HUD */
      if (rChip) rChip.textContent = `Radius ${km} km`;
      try { setStatus(`Radius ${km} km · max ${window.__hfMarketMaxRadiusKm || "—"} km`); } catch (_) {}
      try {
        window.dispatchEvent(new CustomEvent("hf:market-pin", { detail: { radiusKm: km } }));
      } catch (_) {}
    },
  });
}

export function getRadiusKm() {
  const max =
    Number.isFinite(window.__hfMarketMaxRadiusKm)
      ? Number(window.__hfMarketMaxRadiusKm)
      : radiusForTier(tierIndex, seekerPackageId) || DEFAULT_RADIUS_KM;
  // Preferred radius ≤ entitlement max (Phase 9)
  if (Number.isFinite(window.__hfMarketPreferredKm)) {
    return effectiveRadiusKm(max, window.__hfMarketPreferredKm, "market");
  }
  const pref = readPreferred("market");
  return effectiveRadiusKm(max, pref, "market");
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** @returns {Set<string>|null} null = no pin (caller decides empty vs all) */
export function filterIdsInRadius(listings) {
  /* P03: provisional markers do not activate radius discovery */
  if (!pinCommitted) return null;
  const pin = getPinLngLat();
  if (!pin) return null;
  const r = getRadiusKm();
  const ids = new Set();
  for (const item of listings) {
    const point = marketCoordinates(item);
    if (!point) continue;
    if (haversineKm(pin, point) <= r) ids.add(item.id);
  }
  return ids;
}


function syncMarketStatsSummary() {
  // Stats are owned by the Map Settings dropdown. Keep only the canonical
  // status chips there; there is no second stats HUD.
  try { updateMapChips(); } catch (_) {}
}

function initMarketStatsDropdown() {
  const stats = document.getElementById("market-map-stats-panel");
  if (stats) stats.hidden = true;
}


function setStatus(text) {
  const el = document.getElementById("market-map-status");
  if (el) el.textContent = text;
  try { syncMarketStatsSummary(); } catch (_) {}
}

function drawRadius(center) {
  if (!map || !center) return;
  const r = getRadiusKm();
  const points = [];
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const angle = (i / n) * 2 * Math.PI;
    const dx =
      ((r / 111.32) * Math.cos(angle)) /
      Math.cos((center.lat * Math.PI) / 180);
    const dy = (r / 110.57) * Math.sin(angle);
    points.push([center.lng + dx, center.lat + dy]);
  }
  const geo = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [points] },
  };
  if (map.getSource("pin-radius")) {
    map.getSource("pin-radius").setData(geo);
  } else if (map.isStyleLoaded()) {
    map.addSource("pin-radius", { type: "geojson", data: geo });
    map.addLayer({
      id: "pin-radius-fill",
      type: "fill",
      source: "pin-radius",
      paint: {
        "fill-color": "#7A5A3E",
        "fill-opacity": 0.15,
      },
    });
    map.addLayer({
      id: "pin-radius-line",
      type: "line",
      source: "pin-radius",
      paint: {
        "line-color": "#5B4030",
        "line-width": 2,
      },
    });
  }
}

async function refreshUserMapContext() {
  mapUser = await authReady.catch(() => null);
  if (!mapUser) {
    window.__hfMarketRadiusKm = DEFAULT_RADIUS_KM;
    mapStateCache = null;
    return;
  }
  try {
    const snap = await getDoc(doc(db, "users", mapUser.uid));
    const data = snap.exists() ? snap.data() : {};
    userPinsCache = data.pins && typeof data.pins === "object" ? data.pins : null;
    const roleRaw = canonicalRoleFromData(data, "seeker") || "seeker";
    const role =
      normalizeCanonicalRole(roleRaw) === "owner"
        ? "owner"
        : roleRaw === "broker" || roleRaw === "agent"
          ? "broker"
          : "seeker";
    accountRole = role;
    // Market always uses a discovery pin. Profile listing pins / portfolio pins
    // are a separate coordinate concept and must never become the Market search
    // context. Brokers are routed to Broker HQ before Market discovery starts.
    if (accountRole === "owner" || accountRole === "seeker") activePinKind = "discovery";
    try {
      const savedKind = localStorage.getItem(pinKindKey(mapUser?.uid));
      if (accountRole === "broker" && (savedKind === "discovery" || savedKind === "portfolio")) {
        activePinKind = savedKind;
      }
    } catch (_) {}
    /* Phase 6: restore active slot from server or device */
    try {
      const fromServer = data.activePinId && String(data.activePinId);
      const fromLocal = localStorage.getItem(`hf_market_active_pin_${mapUser.uid}`);
      const slot = fromServer || fromLocal || null;
      if (slot) {
        activePinSlotId = slot;
        // Market discovery is always discovery-kind. Supply/portfolio pins
        // belong to listing/HQ workflows and must not leak into Market.
        activePinKind = "discovery";
        if (slot === "supply-1" && accountRole !== "owner") activePinKind = "discovery";
      } else {
        activePinSlotId = "discovery-1";
      }
    } catch (_) {
      activePinSlotId = "discovery-1";
    }
    syncPinModeUi();
    const points =
      Number(data.totalPoints || data.tierPoints || data.reputationPoints || 0) || 0;
    // Discovery ladder: seeker | broker. Portfolio ladder: always owner (matches rules).
    discoveryTierIndex = 0;
    portfolioTierIndex = ownerTierForScore(
      data.completedContracts || 0,
      data.avgSatisfaction,
      points
    ).index;
    if (role === "broker") {
      discoveryTierIndex = brokerTierForScore(
        data.satisfiedClosures || 0,
        data.rentToOwnRescues || 0,
        points
      ).index;
      tierIndex = discoveryTierIndex;
    } else if (role === "owner") {
      discoveryTierIndex = portfolioTierIndex;
      tierIndex = portfolioTierIndex;
    } else {
      discoveryTierIndex = seekerTierForCategory(points).index;
      portfolioTierIndex = discoveryTierIndex; // seekers do not use portfolio pin
      tierIndex = discoveryTierIndex;
    }
    /* Boost packages live on boosts/{uid} (not only users doc) */
    let boostDoc = {};
    try {
      const bs = await getDoc(doc(db, "boosts", mapUser.uid));
      if (bs.exists()) boostDoc = bs.data() || {};
    } catch (_) {}
    seekerBoostState = boostDoc.seeker || null;
    ownerBoostState = boostDoc.owner || null;
    const rawBoost =
      boostDoc.seeker ?? data.boosts?.seeker ?? data.seekerBoost ?? data.boostPackageId ?? 0;
    const rawO = boostDoc.owner ?? data.boosts?.owner ?? data.ownerBoost ?? 0;
    try {
      ownerPackageId = resolveBoostPackageId(
        typeof rawO === "object" && rawO ? rawO : { active: Number(rawO) > 0, package: Number(rawO) || 0 }
      );
    } catch (_) {
      ownerPackageId = 0;
    }
    seekerPackageId = resolveBoostPackageId(
      typeof rawBoost === "object" && rawBoost
        ? rawBoost
        : { active: Number(rawBoost) > 0, package: Number(rawBoost) || 0 }
    );
    /* Market discovery uses the role-appropriate discovery boost. */
    if (role === "owner") seekerPackageId = ownerPackageId;

    /* Cache both pin fields for multi-slot cooldown / centers */
    try {
      mapStateOwnerCache = await getMapState(
        mapUser.uid,
        portfolioTierIndex,
        0,
        "mapStateOwner"
      );
    } catch (_) {
      mapStateOwnerCache = null;
    }
    try {
      const discState = await getMapState(
        mapUser.uid,
        discoveryTierIndex,
        seekerPackageId,
        "mapState"
      );
      if (activePinKind === "portfolio") {
        mapStateCache = mapStateOwnerCache || discState;
      } else {
        mapStateCache = discState;
      }
    } catch (_) {
      mapStateCache = mapStateOwnerCache;
    }

    const tIdx = tierIndexForKind(activePinKind);
    window.__hfMarketMaxRadiusKm = mapStateCache?.radiusKm || radiusForTier(tIdx, seekerPackageId);
    window.__hfMarketPreferredKm = effectiveRadiusKm(
      window.__hfMarketMaxRadiusKm,
      readPreferred("market"),
      "market"
    );
    window.__hfMarketRadiusKm = window.__hfMarketPreferredKm;
    tierIndex = tIdx;
    try {
      cachedPinSlots = currentPinSlots();
    } catch (_) {}
    try { wirePreferredRadiusUi(); } catch (_) {}
    try { window.__hfPreferredRadiusControl?.paint?.(); } catch (_) {}
  } catch (e) {
    console.warn("market map context", e);
    const maxR = radiusForTier(tierIndex, seekerPackageId);
    window.__hfMarketMaxRadiusKm = maxR;
    window.__hfMarketPreferredKm = effectiveRadiusKm(maxR, readPreferred("market"), "market");
    window.__hfMarketRadiusKm = window.__hfMarketPreferredKm;
  }
}


let cachedPinSlots = [];
let ownerPackageId = 0;

function currentPinSlots() {
  try {
    const disc =
      activePinKind === "discovery" && mapStateCache
        ? mapStateCache
        : null;
    /* Prefer dedicated owner cache; fall back when owner uses mapStateCache */
    const supply = mapStateOwnerCache || (accountRole === "owner" ? mapStateCache : null);
    return buildPinSlots({
      role: accountRole || "seeker",
      tierIndex: Math.max(discoveryTierIndex || 0, portfolioTierIndex || 0, tierIndex || 0),
      seekerPackageId: seekerPackageId || 0,
      ownerPackageId: ownerPackageId || 0,
      seekerBoost: seekerBoostState,
      ownerBoost: ownerBoostState,
      mapState:
        accountRole === "owner"
          ? null
          : disc || mapStateCache,
      mapStateOwner: accountRole === "seeker" ? null : supply,
      userPins: userPinsCache,
    });
  } catch (_) {
    return [];
  }
}

function syncPinBarChrome() {
  const capEl = document.getElementById("market-pin-capacity");
  const coolEl = document.getElementById("market-pin-cooldown");
  const btn = document.getElementById("market-pin-btn");
  const menu = document.getElementById("market-pin-menu");
  const maxP = maxPinsForAccount({
    role: accountRole || "seeker",
    tierIndex: tierIndex || 0,
    seekerPackageId: seekerPackageId || 0,
    ownerPackageId: ownerPackageId || 0,
    seekerActivePackageIds: seekerBoostState?.packages ? Object.keys(seekerBoostState.packages).map(Number) : null,
    ownerActivePackageIds: ownerBoostState?.packages ? Object.keys(ownerBoostState.packages).map(Number) : null,
  });
  /* Phase 2: slots from model; centers still driven by active kind markers */
  const hasPin = !!(getPinLngLat() || (mapStateCache && mapStateCache.lastKnownCenter));
  const used = hasPin ? Math.max(1, cachedPinSlots.filter((s) => s.center).length || 1) : 0;
  if (capEl) capEl.textContent = `Pins ${Math.min(used, maxP)}/${maxP}`;
  const cooling = !!(mapStateCache && mapStateCache.canRelocate === false);
  const wait = cooling ? formatCooldown(mapStateCache.cooldownRemainingMs || 0) : "";
  if (coolEl) {
    coolEl.textContent = cooling ? wait : hasPin ? "Ready" : "—";
    coolEl.classList.toggle("is-cooling", cooling);
  }
  if (btn) {
    if (!hasPin) {
      btn.textContent = maxP > 1 ? "Drop pin ▾" : "Drop pin";
      btn.disabled = false;
      btn.classList.remove("is-cooling");
    } else if (cooling) {
      btn.textContent = `Cooldown · ${wait}`;
      btn.disabled = true;
      btn.classList.add("is-cooling");
    } else {
      btn.textContent = maxP > 1 ? "Move pin ▾" : "Move pin";
      btn.disabled = false;
      btn.classList.remove("is-cooling");
    }
  }
  if (menu && maxP > 1 && mapUser?.uid) {
    const slots = cachedPinSlots.length ? cachedPinSlots : currentPinSlots();
    menu.innerHTML = slots
      .map((s) => {
        let st = s.center ? "Ready" : "Empty";
        if (s.id === "discovery-1" || s.id === "supply-1") {
          const stObj =
            s.kind === "supply" ? mapStateOwnerCache : mapStateCache;
          if (s.center && stObj && stObj.canRelocate === false) {
            st = formatCooldown(stObj.cooldownRemainingMs || 0);
          }
        } else if (s.center && userPinsCache && userPinsCache[s.id]) {
          const hours = Number(mapStateCache?.cooldownHours) || 24;
          const rem = userPinCooldownRemainingMs(userPinsCache[s.id], hours);
          if (rem > 0) st = formatCooldown(rem);
        }
        const label = accountRole === "owner" && s.kind === "supply" ? "Discovery pin" : (s.label || `Pin ${s.id}`);
        const readyMs = s.center && st !== "Ready" && /[0-9]/.test(st) ? (s.id === "discovery-1" || s.id === "supply-1" ? Number((s.kind === "supply" ? mapStateOwnerCache : mapStateCache)?.cooldownRemainingMs || 0) : Number(userPinCooldownRemainingMs(userPinsCache?.[s.id], Number(mapStateCache?.cooldownHours) || 24) || 0)) : 0;
        const ready = readyMs > 0 ? new Date(Date.now() + readyMs).toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}) : "Ready to move";
        return `<button type="button" role="option" class="market-pin-menu-item" data-pin-id="${s.id}" data-kind="${s.kind}"><span class="market-pin-menu-label">${label}</span><span class="market-pin-menu-status">${st === "Ready" ? "Ready to move" : `Cooldown · ${st}`}</span><span class="market-pin-menu-ready">${readyMs > 0 ? `Ready ${ready}` : "Available now"}</span></button>`;
      })
      .join("");
  } else if (menu) {
    menu.hidden = true;
    menu.innerHTML = "";
  }
  const legend = document.getElementById("market-pin-legend");
  if (legend) legend.hidden = true;
}

function initPinMenu() {
  const btn = document.getElementById("market-pin-btn");
  const menu = document.getElementById("market-pin-menu");
  if (!btn || !menu || btn.dataset.pinMenu === "1") return;
  btn.dataset.pinMenu = "1";
  btn.addEventListener("click", (e) => {
    const maxP = maxPinsForAccount({
      role: accountRole || "seeker",
      tierIndex: tierIndex || 0,
      seekerPackageId: seekerPackageId || 0,
      ownerPackageId: ownerPackageId || 0,
    });
    if (maxP <= 1 || btn.disabled) return; /* single-pin: existing place handler */
    /* Multi: open menu first; long-press path still via placingPin flag from other control */
    if (menu.hidden === false) {
      menu.hidden = true;
      return;
    }
    e.stopPropagation();
    syncPinBarChrome();
    menu.hidden = false;
  });
  menu.addEventListener("click", (e) => {
    const item = e.target.closest?.("[data-pin-id]");
    if (!item) return;
    const kind = item.getAttribute("data-kind") === "supply" ? "portfolio" : "discovery";
    activePinKind = kind;
    activePinSlotId = item.getAttribute("data-pin-id") || "discovery-1";
    try {
      writeActivePinId(mapUser?.uid, activePinSlotId);
    } catch (_) {}
    menu.hidden = true;
    try { syncPinModeUi?.(); } catch (_) {}
    const existing = getPinLngLat();
    if (existing) {
      pinCommitted = true;
      drawRadius(existing);
      try { map?.flyTo?.({ center:[existing.lng, existing.lat], duration:500 }); } catch (_) {}
      setStatus(`Active: ${item.querySelector(".market-pin-menu-label")?.textContent || item.textContent.trim()} · ${getRadiusKm()} km radius`);
    } else {
      pinCommitted = false;
      setStatus(`Active pin selected · drop a pin to begin discovery`);
    }
    syncPinBarChrome();
    emitMarketPinEvent({ source: "pin-menu" });
  });
  document.addEventListener("click", () => {
    if (menu) menu.hidden = true;
  });
}

function placePin(lngLat, { announce = true, commit = true, kind = null } = {}) {
  if (!map) return;
  /* P03: commit=false → provisional marker only (feeds must not treat as pinActive) */
  pinCommitted = !!commit;
  const k = kind || activePinKind;
  const color = PIN_COLOR[k] || PIN_COLOR.discovery;
  if (k === "discovery") {
    if (discoveryMarker) discoveryMarker.remove();
    discoveryMarker = new maplibregl.Marker({ color })
      .setLngLat(lngLat)
      .addTo(map);
    pinMarker = discoveryMarker;
    if (k === activePinKind) drawRadius({ lng: lngLat.lng, lat: lngLat.lat });
  } else {
    if (portfolioMarker) portfolioMarker.remove();
    portfolioMarker = new maplibregl.Marker({ color })
      .setLngLat(lngLat)
      .addTo(map);
    pinMarker = portfolioMarker;
    // Portfolio pin: smaller focus ring still helps orientation
    if (k === activePinKind) drawRadius({ lng: lngLat.lng, lat: lngLat.lat });
  }
  if (commit) {
    try {
      /* Only persist under a real uid when commit=true. Guests use pending keys only. */
      if (commit && mapUser?.uid) {
        localStorage.setItem(
          pinStorageKey(k, mapUser.uid),
          JSON.stringify({
            lng: lngLat.lng,
            lat: lngLat.lat,
            kind: k,
            uid: mapUser.uid,
          })
        );
      }
    } catch (_) {}
  }
  if (announce) {
    const r = getRadiusKm();
    const label = k === "portfolio" ? "Portfolio pin" : "Search pin";
    setStatus(`${label} set · ${r} km radius`);
    const btn = document.getElementById("market-pin-btn");
    if (btn) btn.textContent = "Move pin";
    emitMarketPinEvent({
      lng: lngLat.lng,
      lat: lngLat.lat,
      radiusKm: r,
      kind: k,
      source: "placePin",
    });
  }
  try { updateMapChips(); } catch (_) {}
}

/** Commit pin for signed-in user; relocates respect cooldown (no spam via login). */
async function commitPinForUser(lngLat, user, kind = null) {
  const k = kind || activePinKind;
  const pinId = activePinSlotId || (k === "portfolio" ? "supply-1" : "discovery-1");
  try {
    const result = await relocateUserPinFn({
      pinId,
      kind: k === "portfolio" ? "supply" : "discovery",
      center: {lat:Number(lngLat.lat), lng:Number(lngLat.lng)}
    });
    if (!result?.data?.success) {
      const wait = formatCooldown(Number(result?.data?.cooldownRemainingMs || 0));
      setStatus(`Cannot relocate ${pinId} — cooldown ${wait}.`);
      return false;
    }
    clearPendingPin();
    placePin(lngLat, {announce:true, commit:true, kind:k});
    if (!userPinsCache) userPinsCache = {};
    userPinsCache[pinId] = {
      kind:k === "portfolio" ? "supply" : "discovery",
      center:{lat:Number(lngLat.lat),lng:Number(lngLat.lng)},
      lastRelocatedAt:new Date(),
      nextRelocationAt:result.data.nextRelocationAt || null,
      entitlementKey:pinId
    };
    cachedPinSlots = currentPinSlots();
    syncPinBarChrome();
    return true;
  } catch (e) {
    console.warn("authoritative pin relocation", e);
    setStatus("Could not save pin — check connection or cooldown.");
    return false;
  }
}

async function tryPlaceOrRelocate(lngLat) {
  const user = await authReady.catch(() => null);
  /* Prev pin only for the signed-in uid — never treat another account / guest cache as committed */
  const prev = mapUser?.uid
    ? (readLocalPin(activePinKind, mapUser.uid) ||
        readLocalPin("discovery", mapUser.uid) ||
        readLocalPin("portfolio", mapUser.uid))
    : null;
  const hadCommitted = !!(prev && Number.isFinite(prev.lng));
  const isMove = hadCommitted && !!user;

  // Provisional only — do not write localStorage until commit (blocks guest spam path)
  placePin(lngLat, { announce: false, commit: false });
  map?.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: Math.max(map.getZoom(), 14), pitch: map.getPitch() });

  if (!user) {
    const ok = await confirmPinDialog({ isGuest: true, isMove: false });
    if (!ok) {
      if (prev?.lng) placePin(prev, { announce: false, commit: true });
      else {
        if (pinMarker) { pinMarker.remove(); pinMarker = null; }
        pinCommitted = false;
        try { updateMapChips(); } catch (_) {}
        setStatus("Pin cancelled — drop again when ready");
      }
      return;
    }
    savePendingPin(lngLat);
    // Do not commit to localStorage as final pin while guest
    setStatus("Pin saved — sign in to apply…");
    requireAuthOrLogin();
    return;
  }

  const ok = await confirmPinDialog({ isGuest: false, isMove });
  if (!ok) {
    if (prev?.lng) placePin(prev, { announce: false, commit: true });
    else if (pinMarker) {
      pinMarker.remove();
      pinMarker = null;
      pinCommitted = false;
      updateMapChips();
    }
    setStatus("Pin change cancelled");
    return;
  }

  await commitPinForUser(lngLat, user);
}

function updateMapChips() {
  /* Discovery pin chip reflects active slot + kind */
  const chips = document.getElementById("market-map-chips");
  const rChip = document.getElementById("market-radius-chip"); /* stats HUD */
  const pChip = document.getElementById("market-pin-chip");
  if (chips) chips.hidden = false;
  if (rChip) rChip.textContent = `Radius ${getRadiusKm()} km`;
  const pin = getPinLngLat();
  if (pChip) {
    const label = activePinKind === "portfolio" ? "Portfolio" : "Search";
    pChip.textContent = pin
      ? `${label} ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`
      : `No ${label.toLowerCase()} pin`;
  }
}

let cooldownTimer = null;
function startCooldownCountdown(ms, kindLabel) {
  const btn = document.getElementById("market-pin-btn");
  if (cooldownTimer) clearInterval(cooldownTimer);
  let left = Math.max(0, Number(ms) || 0);
  const tick = () => {
    if (!btn) return;
    if (left <= 0) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
      btn.disabled = false;
      btn.textContent = "Move pin";
      setStatus(`Ready to move ${kindLabel || "pin"} · ${getRadiusKm()} km radius`);
      return;
    }
    btn.disabled = true;
    btn.textContent = `Cooldown ${formatCooldown(left)}`;
    left -= 1000;
  };
  tick();
  cooldownTimer = setInterval(tick, 1000);
}

function pinKindLabels() {
  /* Market uses the role-authorized pin source; UI presents it as the current discovery pin. */
  if (accountRole === "broker") {
    return {
      discovery: { short: "Property search", long: "Property search pin — find listings", legend: "Property search" },
      portfolio: { short: "Wanted search", long: "Wanted search pin — find demand", legend: "Wanted search" },
    };
  }
  if (accountRole === "owner") {
    return {
      discovery: { short: "Search pin", long: "Search pin", legend: "Search" },
      portfolio: { short: "Discovery pin", long: "Discovery pin — find wanted requests", legend: "Discovery" },
    };
  }
  return {
    discovery: { short: "Search pin", long: "Search pin — discovery radius", legend: "Search pin" },
    portfolio: { short: "Portfolio pin", long: "Portfolio pin", legend: "Portfolio pin" },
  };
}

/** Pin kind state only — Search/Portfolio mode row removed from product chrome (sweep 1). */
function syncPinModeUi() {
  if (accountRole === "owner") activePinKind = "portfolio";
  else activePinKind = "discovery";

  try {
    document.body.setAttribute("data-pin-role", accountRole || "guest");
    document.body.setAttribute("data-pin-kind", activePinKind);
  } catch (_) {}

  const labels = pinKindLabels();
  const kindChip = document.getElementById("market-pin-kind-chip");
  if (kindChip) {
    if (accountRole === "owner") {
      kindChip.textContent = (labels.portfolio?.short || "Discovery pin") + " · wanted";
      kindChip.hidden = false;
    } else if (accountRole === "seeker") {
      kindChip.textContent = (labels.discovery?.short || "Search pin") + " · properties";
      kindChip.hidden = false;
    } else {
      kindChip.hidden = true;
    }
  }
  const legend = document.getElementById("market-pin-legend");
  if (legend) legend.hidden = true;

  try {
    localStorage.setItem(pinKindKey(mapUser?.uid), activePinKind);
  } catch (_) {}
}

export function setActivePinKind(kind) {
  if (kind !== "discovery" && kind !== "portfolio") return;
  if (accountRole === "seeker" && kind !== "discovery") return;
  if (accountRole === "owner" && kind !== "portfolio") return;
  if (accountRole === "guest" || !accountRole) kind = "discovery";
  activePinKind = kind;
  /* Discovery feed → discovery-1 slot; wanted/supply → supply-1 */
  if (kind === "discovery") activePinSlotId = "discovery-1";
  else activePinSlotId = "supply-1";
  try {
    if (mapUser?.uid) writeActivePinId(mapUser.uid, activePinSlotId);
  } catch (_) {}
  pinMarker = kind === "portfolio" ? portfolioMarker : discoveryMarker;
  syncPinModeUi();
  const pin = getPinLngLat(kind);
  if (pin) {
    drawRadius(pin);
    try {
      map?.flyTo?.({ center: [pin.lng, pin.lat], duration: 600 });
    } catch (_) {}
  }
  try { syncPinBarChrome(); } catch (_) {}
  emitMarketPinEvent({ source: "setActivePinKind" });
  try {
    document.dispatchEvent(new CustomEvent("hf:market-pin-kind", { detail: { kind: activePinKind, role: accountRole, slotId: activePinSlotId } }));
  } catch (_) {}
}



function isMapFullscreen() {
  const shell = getMapShell();
  return !!(document.fullscreenElement === shell || shell?.classList.contains("is-map-fullscreen"));
}

async function toggleMapFullscreen() {
  const shell = getMapShell();
  if (!shell) return;
  /* Close layout popover so it is not stranded off-screen */
  try {
    const panel = document.getElementById("market-map-settings");
    const sbtn = document.getElementById("market-map-settings-btn");
    if (panel) panel.hidden = true;
    if (sbtn) sbtn.setAttribute("aria-expanded", "false");
  } catch (_) {}
  try {
    if (!document.fullscreenElement) {
      if (shell.requestFullscreen) {
        await shell.requestFullscreen();
      } else {
        shell.classList.add("is-map-fullscreen");
        document.body.classList.add("market-map-is-fullscreen");
      }
    } else {
      await document.exitFullscreen();
      shell.classList.remove("is-map-fullscreen");
      document.body.classList.remove("market-map-is-fullscreen");
    }
  } catch (e) {
    console.warn("fullscreen unavailable", e);
    shell.classList.toggle("is-map-fullscreen");
    document.body.classList.toggle(
      "market-map-is-fullscreen",
      shell.classList.contains("is-map-fullscreen")
    );
  }
  syncFullscreenButton();
  try { placePreferredRadiusHost(); } catch (_) {}
  requestAnimationFrame(() => {
    resizeMarketMap();
    setTimeout(resizeMarketMap, 150);
    setTimeout(resizeMarketMap, 400);
    try {
    } catch (_) {}
  });
}

function syncFullscreenButton() {
  const el = document.querySelector("#market-map-fullscreen-menu span");
  if (el) el.textContent = isMapFullscreen() ? "Exit fullscreen" : "Enter fullscreen";
}

function set3DBuildings(enabled) {
  if (!map) return;
  try {
    if (map.getLayer("3d-buildings")) map.setLayoutProperty("3d-buildings", "visibility", enabled ? "visible" : "none");
    localStorage.setItem("hf_market_3d", enabled ? "1" : "0");
    const state = document.getElementById("market-map-3d-state");
    if (state) state.textContent = enabled ? "On" : "Off";
    document.body.classList.toggle("market-map-flat", !enabled);
  } catch (_) {}
}

function initMapControls() {
  const btn = document.getElementById("market-map-settings-btn");
  const panel = document.getElementById("market-map-settings");
  if (!btn || !panel || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.hidden = true; btn.setAttribute("aria-expanded", "false");
    }
  });
  document.getElementById("market-map-zoom-in")?.addEventListener("click", () => map?.zoomIn({duration:250}));
  document.getElementById("market-map-zoom-out")?.addEventListener("click", () => map?.zoomOut({duration:250}));
  document.getElementById("market-map-fullscreen-menu")?.addEventListener("click", () => toggleMapFullscreen());
  document.getElementById("market-map-stats-toggle")?.addEventListener("click", () => {
    const stats = document.getElementById("market-map-stats-panel");
    if (stats) stats.hidden = !stats.hidden;
  });
  document.getElementById("market-map-3d-toggle")?.addEventListener("click", () => {
    const state = document.getElementById("market-map-3d-state");
    set3DBuildings((state?.textContent || "On") !== "On");
  });
  document.addEventListener("fullscreenchange", () => {
    const shell = getMapShell();
    if (!document.fullscreenElement) {
      shell?.classList.remove("is-map-fullscreen");
      document.body.classList.remove("market-map-is-fullscreen");
    } else {
      document.body.classList.add("market-map-is-fullscreen");
      shell?.classList.add("is-map-fullscreen");
    }
    syncFullscreenButton();
    try { placePreferredRadiusHost(); } catch (_) {}
    requestAnimationFrame(resizeMarketMap);
    setTimeout(resizeMarketMap, 180);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || document.fullscreenElement) return;
    const shell = getMapShell();
    if (!shell?.classList.contains("is-map-fullscreen")) return;
    shell.classList.remove("is-map-fullscreen");
    document.body.classList.remove("market-map-is-fullscreen");
    syncFullscreenButton();
    placePreferredRadiusHost();
  });
  window.addEventListener("resize", () => { clearTimeout(initMapControls._rt); initMapControls._rt = setTimeout(resizeMarketMap, 120); });
}


export async function initMarketMap() {
  const container = document.getElementById("market-map");
  if (!container) {
    setStatus("Map container missing");
    return;
  }
  if (typeof maplibregl === "undefined" || !maplibregl?.Map) {
    setStatus("Map library failed to load — check network / CDN");
    console.error("maplibregl global/module missing after ESM import");
    return;
  }

  await refreshUserMapContext();
  initMapControls();
  try { placePreferredRadiusHost(); } catch (_) {}
  initMarketStatsDropdown();

  map = new maplibregl.Map({
    container: "market-map",
    style: "https://tiles.openfreemap.org/styles/bright",
    center: MANILA,
    zoom: 14,
    pitch: 42,
    bearing: -12,
    canvasContextAttributes: { antialias: true },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), "bottom-left");
  updateMapChips();
  setStatus("Loading map style…");

  map.on("error", (e) => {
    console.warn("maplibre error", e);
    setStatus("Map tile error — try refresh or Open full Market");
  });

  map.on("load", async () => {
    setStatus("Map ready — Drop pin or My pin to re-center");
    resizeMarketMap();

    const layers = map.getStyle().layers || [];
    let labelLayerId;
    for (const layer of layers) {
      if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
        labelLayerId = layer.id;
        break;
      }
    }

    map.addSource("openfreemap", {
      url: "https://tiles.openfreemap.org/planet",
      type: "vector",
    });

    map.addLayer(
      {
        id: "3d-buildings",
        source: "openfreemap",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 15,
        filter: ["!=", ["get", "hide_3d"], true],
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "render_height"],
            0,
            "lightgray",
            200,
            "royalblue",
            400,
            "lightblue",
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            16,
            ["get", "render_height"],
          ],
          "fill-extrusion-base": [
            "case",
            [">=", ["get", "zoom"], 16],
            ["get", "render_min_height"],
            0,
          ],
        },
      },
      labelLayerId
    );
    try {
      const saved3d = localStorage.getItem("hf_market_3d");
      set3DBuildings(saved3d !== "0");
    } catch (_) {}

    try {
      const user = await authReady.catch(() => null);
      const pending = readPendingPin();
      if (user && pending) {
        // Must respect relocate cooldown — no sign-out/in spam bypass.
        // Don't fly the camera to the guest's dropped coordinates yet --
        // if this account is on cooldown, commitPinForUser draws the
        // account's *existing* pin instead (server lastKnownCenter, see
        // its own fix), and that's what the camera should center on, not
        // the rejected drop point.
        activePinKind = pending.kind === "portfolio" ? "portfolio" : "discovery";
        const applied = await commitPinForUser(pending, user, activePinKind);
        if (applied) {
          map.flyTo({ center: [pending.lng, pending.lat], zoom: 15, pitch: 42 });
          setStatus(`Pin applied after sign-in · ${getRadiusKm()} km radius`);
        } else {
          clearPendingPin();
          const existing = getPinLngLat(activePinKind);
          if (existing) {
            // placePin() (inside commitPinForUser's cooldown fallback)
            // already drew the radius circle at this center; just recenter.
            map.flyTo({ center: [existing.lng, existing.lat], zoom: 15, pitch: 42 });
          }
          // status already set by commitPinForUser (cooldown)
        }
      } else {
        // Restore: localStorage first, else Firestore lastKnownCenter (survives re-login / new device)
        let focus = null;
        try {
          focus = await hydratePinKind("discovery");
          activePinKind = "discovery";
          activePinSlotId = "discovery-1";
        } catch (e) {
          console.warn("pin restore", e);
        }
        if (focus) {
          map.flyTo({ center: [focus.lng, focus.lat], zoom: 15, pitch: 42 });
          drawRadius(focus);
          setStatus(`Restored ${activePinKind} pin · ${getRadiusKm()} km radius`);
          try {
            updateMapChips();
          } catch (_) {}
          emitMarketPinEvent({
            lng: focus.lng,
            lat: focus.lat,
            source: "restore",
          });
        } else {
          setStatus(`Tap “Drop pin”, then the map · confirm to lock`);
        }
        syncPinModeUi();
      }
    } catch (_) {
      setStatus("Tap “Drop pin”, then the map");
    }
  });

  map.on("click", async (e) => {
    if (!placingPin) return;
    placingPin = false;
    await tryPlaceOrRelocate(e.lngLat);
  });
  document.getElementById("market-pin-btn")?.addEventListener("click", async () => {
    const user = await authReady.catch(() => null);
    if (user) {
      await refreshUserMapContext();
      if (pinMarker && mapStateCache && !mapStateCache.canRelocate) {
        setStatus(
          `Relocate on cooldown · ${formatCooldown(mapStateCache.cooldownRemainingMs)}`
        );
        return;
      }
    }
    placingPin = true;
    const btn = document.getElementById("market-pin-btn");
    if (btn) btn.textContent = pinMarker ? "Tap map to move pin" : "Tap map to place pin";
    setStatus(
      user
        ? (pinMarker
            ? `Tap map to relocate · ${getRadiusKm()} km radius — you’ll confirm next`
            : `Tap map to place pin · ${getRadiusKm()} km radius — you’ll confirm next`)
        : "Tap the map to preview a pin — confirm to sign in and apply"
    );
  });

  document.getElementById("market-locate-btn")?.addEventListener("click", async () => {
    // My pin — fly to active; if 2+ centers, cycle to next and activate
    const slots = (cachedPinSlots.length ? cachedPinSlots : currentPinSlots()).filter((s) => s.center);
    let pin = typeof getPinLngLat === "function" ? getPinLngLat() : null;
    if (slots.length > 1 && mapUser?.uid) {
      const curId = slots.find((s) => s.kind === (activePinKind === "portfolio" ? "supply" : "discovery"))?.id;
      const nxt = nextPinWithCenter(slots, curId);
      if (nxt?.center) {
        activePinKind = nxt.kind === "supply" ? "portfolio" : "discovery";
        writeActivePinId(mapUser.uid, nxt.id);
        pin = { lng: nxt.center.lng, lat: nxt.center.lat };
        try {
          placePin(pin, { announce: false, commit: false, kind: activePinKind });
          drawRadius(pin);
        } catch (_) {}
        setStatus(`My pin → ${nxt.label}`);
      }
    }
    if (!pin || !Number.isFinite(pin.lng) || !Number.isFinite(pin.lat)) {
      setStatus("No pin yet — drop a pin first, then use My pin to re-center");
      return;
    }
    if (!map) return;
    map.flyTo({ center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), 14), pitch: map.getPitch() });
    if (slots.length <= 1) setStatus("Centered on your pin");
    try { syncPinBarChrome(); } catch (_) {}
  });


  function setGuideOpen(open) {
    const g = document.getElementById("market-guide");
    const reopen = document.getElementById("market-guide-reopen");
    if (g) {
      g.hidden = !open;
      g.classList.toggle("is-dismissed", !open);
      g.style.display = open ? "" : "none";
    }
    if (reopen) {
      reopen.hidden = open;
      reopen.style.display = open ? "none" : "";
    }
    try {
      if (open) localStorage.removeItem("hf_market_guide_dismissed");
      else localStorage.setItem("hf_market_guide_dismissed", "1");
    } catch (_) {}
    if (map) {
      try { map.resize(); } catch (_) {}
      setTimeout(() => { try { map.resize(); } catch (_) {} }, 320);
    }
  }

  document.getElementById("market-guide-cta")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGuideOpen(false);
    requestAnimationFrame(() => {
      document.getElementById("market-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
  document.getElementById("market-guide-reopen")?.addEventListener("click", (e) => {
    e.preventDefault();
    setGuideOpen(true);
    document.getElementById("market-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Guests always see the guide on a fresh session path from Home unless they dismissed this browser.
  // Signed-in users who dismissed stay collapsed (reopen chip available).
  try {
    const dismissed = localStorage.getItem("hf_market_guide_dismissed") === "1";
    setGuideOpen(!dismissed);
  } catch (_) {
    setGuideOpen(true);
  }

}

// Whole-page scale → keep MapLibre sized to canvas
window.addEventListener("hf:scale-changed", () => {
  try { if (map) map.resize(); } catch (_) {}
});
document.getElementById("market-map")?.addEventListener("hf:scale-changed", () => {
  try { if (map) map.resize(); } catch (_) {}
});

export function setMarketPitch(deg = 42) {
  if (map) {
    try {
      map.easeTo({ pitch: deg, duration: 400 });
    } catch (_) {}
  }
}



let resultMarkers = [];
let activeResultId = null;
export function focusMarketResult(id) {
  activeResultId = id || null;
  let target = null;
  for (const m of resultMarkers) {
    const el = m.getElement?.();
    const same = el?.dataset?.resultId === String(activeResultId);
    el?.classList.toggle("is-active", same);
    if (same) target = m;
  }
  if (target && map) {
    try { const ll = target.getLngLat(); map.flyTo({ center:[ll.lng,ll.lat], zoom:Math.max(map.getZoom(),15), duration:450 }); } catch (_) {}
  }
}

export function renderMarketResultMarkers(items = []) {
  if (!map) return;
  resultMarkers.forEach(m => { try { m.remove(); } catch (_) {} });
  resultMarkers = [];
  for (const item of items) {
    const point = marketCoordinates(item);
    if (!point) continue;
    const lat = point.lat;
    const lng = point.lng;
    const d = item?.data || {};
    const el = document.createElement("button");
    el.type = "button";
    el.className = "market-result-marker";
    el.dataset.resultId = String(item.id);
    el.setAttribute("aria-label", d.listing_title || d.title || "Market result");
    el.innerHTML = '<i class="bx bx-home-alt-2"></i>';
    el.addEventListener("click", () => {
      try { map.flyTo({center:[lng,lat], zoom:Math.max(map.getZoom(),15), duration:450}); } catch (_) {}
      document.dispatchEvent(new CustomEvent("hf:market-card-focus", {detail:{id:item.id}}));
    });
    const marker = new maplibregl.Marker({element:el, anchor:"bottom"}).setLngLat([lng,lat]).addTo(map);
    resultMarkers.push(marker);
  }
  if (activeResultId) focusMarketResult(activeResultId);
}
try { window.focusMarketResult = focusMarketResult; } catch (_) {}
try { window.syncMarketStatsSummary = syncMarketStatsSummary; } catch (_) {}
try { window.getDiscoveryPinLngLat = getDiscoveryPinLngLat; } catch (_) {}
try { window.emitMarketPinEvent = emitMarketPinEvent; } catch (_) {}

try { window.isMarketPinCommitted = isMarketPinCommitted; } catch (_) {}
try { window.renderMarketResultMarkers = renderMarketResultMarkers; } catch (_) {}
