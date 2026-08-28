import { canonicalRoleFromData } from "./canonical-role.js";
/* Broker HQ — Phase 2 rebuild + Phase 3 claim (SoT §25–26)
 * Isolated desk, service pin map (mapStateOwner), request pipeline.
 */
import * as maplibregl from "https://unpkg.com/maplibre-gl@6.3.0/dist/maplibre-gl.mjs";
import { auth, db, functions } from "./firebase.js";
import { authReady } from "./session.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getMapState, attemptRelocate, formatCooldown } from "./radius-cooldown.js";
import {
  radiusForTier,
  maxPinsForAccount,
  resolveBoostPackageId,
  boostExpiresAt,
} from "./tiers.js";
import { buildPinSlots } from "./pins-model.js";
import {
  effectiveRadiusKm,
  readPreferred,
  mountPreferredRadiusControl,
} from "./preferred-radius.js";
import { startContractFromAssistance } from "./profile/contracts-tab.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { AMENITIES, PROPERTY_TYPES } from "./listing-catalog.js";
import { PROPERTY_LISTINGS, PROPERTY_LISTINGS_LEGACY } from "./collections.js";
import { normalizeBrokerWorkspace } from "./broker-data-contract.js";

const MANILA = [120.9842, 14.5995];
const BROKER_HQ_MAX_RADIUS_KM = 50;
let NEAR_KM = BROKER_HQ_MAX_RADIUS_KM;
const SERVICE_FIELD = "mapStateOwner";

const gate = document.getElementById("bhq-gate");
const home = document.getElementById("bhq-home");
const welcome = document.getElementById("bhq-welcome");
const listPanel = document.getElementById("bhq-list-panel");
const listEl = document.getElementById("bhq-list");
const listEmpty = document.getElementById("bhq-list-empty");
const listTitle = document.getElementById("bhq-list-title");
const statusEl = document.getElementById("bhq-service-status");

let currentUser = null;
let servicePin = null;
let currentView = "new";
let map = null;
let marker = null;
let placing = false;
let pendingLngLat = null;
let tierIndex = 0;
let bhqPinFlyIndex = 0;
/** @type {{ id: string, center: { lat: number, lng: number }, label: string }[]} */
let bhqFlyPins = [];

function $(id) {
  return document.getElementById(id);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function showGate(title, msg, ctaHref, ctaLabel) {
  const tabs = $("bhq-tabs");
  if (tabs) tabs.hidden = true;
  if (home) home.hidden = true;
  if (gate) gate.hidden = false;
  if ($("bhq-gate-title")) $("bhq-gate-title").textContent = title;
  if ($("bhq-gate-msg")) $("bhq-gate-msg").textContent = msg;
  const c = $("bhq-gate-cta");
  if (c) {
    c.href = ctaHref || "login.html";
    c.textContent = ctaLabel || "Sign in";
  }
}

function showHome() {
  if (gate) gate.hidden = true;
  if (home) home.hidden = false;
  const tabs = $("bhq-tabs");
  if (tabs) tabs.hidden = false;
}

function setCount(id, n) {
  const el = $(id);
  if (!el) return;
  el.textContent = String(n);
}

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function requestCoords(r) {
  const lat = Number(r.lat ?? r.latitude);
  const lng = Number(r.lng ?? r.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

/* ---------- Requests ---------- */
async function fetchOpenRequests() {
  try {
    const snap = await getDocs(
      query(collection(db, "assistanceRequests"), where("status", "==", "open"), limit(60))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("open requests", e);
    return [];
  }
}

async function fetchMyActive(uid) {
  try {
    const snap = await getDocs(
      query(collection(db, "assistanceRequests"), where("claimedBy", "==", uid), limit(60))
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => ["claimed", "in_progress"].includes(String(r.status || "")));
  } catch (e) {
    console.warn("active", e);
    return [];
  }
}

function filterNear(open) {
  if (!servicePin) return open;
  return open.filter((r) => {
    const c = requestCoords(r);
    if (!c) return true;
    return haversineKm(servicePin, c) <= currentBrokerPreferredRadius();
  });
}

async function loadAssistanceCounts(uid) {
  const open = await fetchOpenRequests();
  const active = await fetchMyActive(uid);
  const near = filterNear(open);
  setCount("bhq-count-new", open.length);
  setCount("bhq-count-near", near.length);
  setCount("bhq-count-active", active.length);
  const pulse = $("bhq-pulse-new");
  if (pulse) pulse.hidden = open.length === 0;
  return { open, near, active };
}

function renderRequestCard(r, { claimable }) {
  const type = String(r.type || r.helpType || "assistance").replace(/_/g, " ");
  const when = r.createdAt?.toDate?.()
    ? r.createdAt.toDate().toISOString().slice(0, 19)
    : String(r.createdAt || "").slice(0, 19);
  const fee =
    r.listingHelpFeePhp != null
      ? `₱${Number(r.listingHelpFeePhp).toFixed(2)} listing help`
      : r.budgetMin != null
        ? `Budget ₱${Number(r.budgetMin).toLocaleString()}–${Number(r.budgetMax ?? 0).toLocaleString()}`
        : "";
  let dist = "";
  const c = requestCoords(r);
  if (servicePin && c) dist = ` · ${haversineKm(servicePin, c).toFixed(1)} km`;

  let actions = "";
  if (claimable) {
    actions = `<button type="button" class="bhq-btn bhq-btn-primary" data-claim="${esc(r.id)}">Claim</button>`;
  } else {
    actions = `<span class="bhq-chip">${esc(r.status || "active")}</span>`;
    if (r.contractId) {
      actions += ` <a class="bhq-btn bhq-btn-ghost" href="profile.html#contracts" data-no-transition="1">Open contract</a>`;
    } else {
      actions += ` <button type="button" class="bhq-btn bhq-btn-primary" data-handoff="${esc(r.id)}">Open contract room</button>`;
    }
  }

  return `<article class="bhq-list-item" data-id="${esc(r.id)}">
    <div class="bhq-list-item-main">
      <strong class="bhq-list-type">${esc(type)}</strong>
      <div class="bhq-list-title">${esc(r.title || r.summary || "Assistance request")}</div>
      <div class="bhq-list-meta">${esc(when)}${esc(dist)}${fee ? " · " + esc(fee) : ""}</div>
    </div>
    <div class="bhq-list-actions">${actions}</div>
  </article>`;
}

async function showList(view) {
  if (!listPanel || !listEl || !currentUser) return;
  currentView = view;
  listPanel.hidden = false;
  const titles = { new: "New requests", near: "Near you", active: "My active requests" };
  if (listTitle) listTitle.textContent = titles[view] || "Requests";
  listEl.innerHTML = `<p class="bhq-empty">Loading…</p>`;
  if (listEmpty) listEmpty.hidden = true;

  let docs = [];
  if (view === "active") docs = await fetchMyActive(currentUser.uid);
  else {
    docs = await fetchOpenRequests();
    if (view === "near") docs = filterNear(docs);
  }

  if (!docs.length) {
    listEl.innerHTML = "";
    if (listEmpty) {
      listEmpty.hidden = false;
      listEmpty.textContent =
        view === "active"
          ? "No active work yet. Claim a request from New."
          : view === "near"
            ? "Nothing in range. Drop a service pin or widen later when radius preference ships."
            : "No open requests. When clients use Need help or listing help, they appear here.";
    }
    return;
  }
  if (listEmpty) listEmpty.hidden = true;
  listEl.innerHTML = docs.map((r) => renderRequestCard(r, { claimable: view !== "active" })).join("");
}

async function claimRequest(requestId) {
  if (!currentUser) return;
  if (!confirm("Claim this request?\n\nIt moves to My active. Open a contract room when you’re ready.")) return;
  try {
    const ref = doc(db, "assistanceRequests", requestId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("Request not found");
      const data = snap.data() || {};
      if (String(data.status || "") !== "open") {
        if (data.claimedBy === currentUser.uid) return;
        throw new Error(`Request is no longer open (${data.status || "unknown"}).`);
      }
      tx.update(ref, {
        status: "claimed",
        claimedBy: currentUser.uid,
        claimedAt: serverTimestamp()
      });
    });

    // Patch 29 smoke-test boundary: never report a claim as complete
    // until the same canonical document reads back the expected state.
    const readback = await getDoc(ref);
    const saved = readback.exists() ? (readback.data() || {}) : {};
    if (saved.status !== "claimed" || saved.claimedBy !== currentUser.uid) {
      throw new Error("Claim write did not pass Firestore readback verification.");
    }

    await loadAssistanceCounts(currentUser.uid);
    await showList(currentView);
  } catch (err) {
    alert("Could not claim:\n" + (err.message || err));
  }
}

listEl?.addEventListener("click", async (e) => {
  const claimBtn = e.target.closest("[data-claim]");
  if (claimBtn) {
    claimRequest(claimBtn.getAttribute("data-claim"));
    return;
  }
  const handoffBtn = e.target.closest("[data-handoff]");
  if (!handoffBtn) return;
  handoffBtn.disabled = true;
  try {
    const id = handoffBtn.getAttribute("data-handoff");
    const snap = await getDoc(doc(db, "assistanceRequests", id));
    if (!snap.exists()) throw new Error("Request not found");
    await startContractFromAssistance({ id, ...snap.data() });
    window.location.href = "profile.html#contracts";
  } catch (err) {
    alert("Could not open contract:\n" + (err.message || err));
    handoffBtn.disabled = false;
  }
});

$("bhq-back-home")?.addEventListener("click", () => {
  if (listPanel) listPanel.hidden = true;
});
["bhq-btn-new", "bhq-btn-near", "bhq-btn-active"].forEach((id) => {
  $(id)?.addEventListener("click", (e) => showList(e.currentTarget.getAttribute("data-view")));
});
$("bhq-refresh-counts")?.addEventListener("click", async () => {
  if (!currentUser) return;
  setStatus("Refreshing…");
  await loadAssistanceCounts(currentUser.uid);
  setStatus(servicePin ? `Service pin · ${servicePin.lat.toFixed(4)}, ${servicePin.lng.toFixed(4)}` : "No service pin yet");
});

/* ---------- Service map ---------- */
function placeMarker(lngLat, { commitLocal = false } = {}) {
  if (!map) return;
  if (marker) marker.remove();
  marker = new maplibregl.Marker({ color: "#2563eb" }).setLngLat(lngLat).addTo(map);
  servicePin = { lat: lngLat.lat, lng: lngLat.lng };
  if (commitLocal) {
    try {
      localStorage.setItem(
        "hf_market_owner_pin",
        JSON.stringify({ lng: lngLat.lng, lat: lngLat.lat, kind: "portfolio" })
      );
    } catch (_) {}
  }
  setStatus(`Service pin · ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)} · Search radius ≤ ${currentBrokerPreferredRadius()} km`);
}

function showConfirm(show, msg) {
  const bar = $("bhq-map-confirm");
  if (!bar) return;
  bar.hidden = !show;
  if (msg && $("bhq-map-confirm-msg")) $("bhq-map-confirm-msg").textContent = msg;
}

async function commitServicePin(lngLat) {
  if (!currentUser) return false;
  const state = await getMapState(currentUser.uid, tierIndex, 0, SERVICE_FIELD);
  const had =
    !!(state?.lastKnownCenter || state?.lastRelocatedAt) ||
    !!localStorage.getItem("hf_market_owner_pin");

  if (had && state && !state.canRelocate) {
    setStatus(`Relocate on cooldown · ${formatCooldown(state.cooldownRemainingMs || 0)}`);
    alert(`Service pin relocate is on cooldown (${formatCooldown(state.cooldownRemainingMs || 0)}).`);
    return false;
  }

  if (had) {
    const result = await attemptRelocate(
      currentUser.uid,
      tierIndex,
      0,
      { lat: lngLat.lat, lng: lngLat.lng },
      SERVICE_FIELD
    );
    if (!result.success) {
      setStatus(
        result.reason === "cooldown"
          ? `Cooldown · ${formatCooldown(result.cooldownRemainingMs || 0)}`
          : "Could not save service pin"
      );
      return false;
    }
  } else {
    // First pin: the same authoritative callable is used; do not treat a
    // local-only marker as a successful server save.
    const result = await attemptRelocate(
      currentUser.uid,
      tierIndex,
      0,
      { lat: lngLat.lat, lng: lngLat.lng },
      SERVICE_FIELD
    );
    if (!result.success) {
      setStatus(result.reason === "cooldown"
        ? `Cooldown · ${formatCooldown(result.cooldownRemainingMs || 0)}`
        : "Could not save service pin");
      return false;
    }
  }

  // Patch 29 smoke-test boundary: confirm the canonical mapStateOwner
  // projection contains the requested center before declaring success.
  const verified = await getMapState(currentUser.uid, tierIndex, 0, SERVICE_FIELD);
  const saved = verified?.lastKnownCenter;
  const latOk = saved && Math.abs(Number(saved.lat) - Number(lngLat.lat)) < 1e-6;
  const lngOk = saved && Math.abs(Number(saved.lng) - Number(lngLat.lng)) < 1e-6;
  if (!latOk || !lngOk) {
    setStatus("Service pin write did not pass server readback verification");
    return false;
  }

  placeMarker(lngLat, { commitLocal: true });
  await loadAssistanceCounts(currentUser.uid);
  return true;
}


async function refreshBhqFlyPins() {
  bhqFlyPins = [];
  if (!currentUser) return;
  let sPkg = 0;
  let oPkg = 0;
  try {
    const bs = await getDoc(doc(db, "boosts", currentUser.uid));
    if (bs.exists()) {
      const b = bs.data() || {};
      sPkg = resolveBoostPackageId(b.seeker);
      oPkg = resolveBoostPackageId(b.owner);
    }
  } catch (_) {}
  try {
    const supply = await getMapState(currentUser.uid, tierIndex, oPkg, SERVICE_FIELD);
    const c = supply?.lastKnownCenter;
    if (c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng))) {
      bhqFlyPins.push({
        id: "supply-1",
        label: "Service pin",
        center: { lat: Number(c.lat), lng: Number(c.lng) },
      });
    }
  } catch (_) {}
  try {
    const disc = await getMapState(currentUser.uid, tierIndex, sPkg, "mapState");
    const c = disc?.lastKnownCenter;
    if (c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng))) {
      if (!bhqFlyPins.some((p) => Math.abs(p.center.lat - Number(c.lat)) < 1e-6 && Math.abs(p.center.lng - Number(c.lng)) < 1e-6)) {
        bhqFlyPins.push({
          id: "discovery-1",
          label: "Search pin",
          center: { lat: Number(c.lat), lng: Number(c.lng) },
        });
      }
    }
  } catch (_) {}
  try {
    const us = await getDoc(doc(db, "users", currentUser.uid));
    const pins = us.exists() ? us.data()?.pins : null;
    if (pins && typeof pins === "object") {
      for (const [id, raw] of Object.entries(pins)) {
        const c = raw?.center || raw?.lastKnownCenter;
        if (!c || !Number.isFinite(Number(c.lat))) continue;
        bhqFlyPins.push({
          id,
          label: raw?.label || `Pin ${id}`,
          center: { lat: Number(c.lat), lng: Number(c.lng) },
        });
      }
    }
  } catch (_) {}
}

async function initServiceMap() {
  const el = $("bhq-map");
  if (!el || typeof maplibregl === "undefined") {
    setStatus("Map unavailable");
    return;
  }

  map = new maplibregl.Map({
    container: "bhq-map",
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: MANILA,
    zoom: 11,
    pitch: 40
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

  map.on("load", async () => {
    // Restore pin
    let restored = null;
    try {
      const raw = localStorage.getItem("hf_market_owner_pin");
      if (raw) restored = JSON.parse(raw);
    } catch (_) {}
    if (!restored && currentUser) {
      try {
        const st = await getMapState(currentUser.uid, tierIndex, 0, SERVICE_FIELD);
        if (st?.lastKnownCenter) restored = st.lastKnownCenter;
      } catch (_) {}
    }
    if (restored?.lng != null && restored?.lat != null) {
      placeMarker({ lng: Number(restored.lng), lat: Number(restored.lat) });
      map.flyTo({ center: [restored.lng, restored.lat], zoom: 13, pitch: 42 });
    } else {
      setStatus("Tap Drop service pin, then the map — confirm to save");
    }
  });

        await loadBrokerDiscovery();
  });

  map.on("click", (e) => {
    if (!placing) return;
    placing = false;
    pendingLngLat = e.lngLat;
    placeMarker(e.lngLat);
    map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: Math.max(map.getZoom(), 13) });
    showConfirm(true, "Use this location as your service pin?");
    const btn = $("bhq-pin-btn");
    if (btn) btn.textContent = "Drop service pin";
  });

  $("bhq-pin-btn")?.addEventListener("click", async () => {
    if (!currentUser) return;
    try {
      const st = await getMapState(currentUser.uid, tierIndex, 0, SERVICE_FIELD);
      if (marker && st && !st.canRelocate) {
        setStatus(`Cooldown · ${formatCooldown(st.cooldownRemainingMs || 0)}`);
        return;
      }
    } catch (_) {}
    placing = true;
    const btn = $("bhq-pin-btn");
    if (btn) btn.textContent = "Tap map…";
    setStatus("Tap the map to place your service pin");
  });

  $("bhq-locate-btn")?.addEventListener("click", async () => {
    /* P2 polish: My pin = camera only (no GPS). Cycle when >1 committed centers. */
    try {
      await refreshBhqFlyPins();
    } catch (_) {}
    const pins = bhqFlyPins.filter((p) => p.center);
    if (!pins.length) {
      setStatus("No pin set yet — drop a service pin first");
      return;
    }
    bhqPinFlyIndex = bhqPinFlyIndex % pins.length;
    const p = pins[bhqPinFlyIndex];
    bhqPinFlyIndex = (bhqPinFlyIndex + 1) % pins.length;
    const { lat, lng } = p.center;
    map?.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 13), essential: true });
    if (marker) {
      try { marker.setLngLat([lng, lat]); } catch (_) {}
    }
    setStatus(
      pins.length > 1
        ? `Centered on ${p.label} (${bhqPinFlyIndex === 0 ? pins.length : bhqPinFlyIndex}/${pins.length}) — tap again for next`
        : `Centered on ${p.label}`
    );
  });

  $("bhq-map-cancel")?.addEventListener("click", () => {
    showConfirm(false);
    pendingLngLat = null;
  });

  $("bhq-map-ok")?.addEventListener("click", async () => {
    if (!pendingLngLat) return;
    const ok = await commitServicePin(pendingLngLat);
    showConfirm(false);
    pendingLngLat = null;
    if (ok) {
      // commitServicePin verifies the server-authoritative mapStateOwner readback.
      setStatus(`Service pin saved · Search radius ${currentBrokerPreferredRadius()} km (max ${BROKER_HQ_MAX_RADIUS_KM} km)`);
      await loadBrokerDiscovery();
    }
  });
}



/* ========== Patch 11C-R3 — Authorized Broker HQ discovery ========== */
const bhqDiscovery = {
  records: [],
  filtered: [],
  filters: { q:"", kind:"all", min:0, max:0, amenities:[] },
  requestSeq: 0,
  activePinKey: null,
  status: "idle"
};
const discoverCallable = httpsCallable(functions, "brokerHQDiscover");
const setBrokerServiceRadiusCallable = httpsCallable(functions, "setBrokerServiceRadius");
const workspaceCallable = httpsCallable(functions, "brokerHQWorkspace");
let brokerWorkspace = normalizeBrokerWorkspace();

function normalizeAmenityKey(v) {
  return String(v || "").trim().toLowerCase();
}
function activeDiscoveryPin() {
  return servicePin ? { lat:Number(servicePin.lat), lng:Number(servicePin.lng) } : null;
}

function currentBrokerPreferredRadius() {
  const raw = Number(
    document.body.dataset.bhqPreferredRadiusKm ||
    window.__hfBrokerPreferredRadiusKm ||
    BROKER_HQ_MAX_RADIUS_KM
  );
  return Math.min(BROKER_HQ_MAX_RADIUS_KM, Math.max(0.5, Number.isFinite(raw) ? raw : BROKER_HQ_MAX_RADIUS_KM));
}

async function loadBrokerPreferredRadius() {
  if (!currentUser) return BROKER_HQ_MAX_RADIUS_KM;
  try {
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    const data = snap.exists() ? (snap.data() || {}) : {};
    const service = data.mapStateOwner || {};
    const pinSpecific = data.pins?.["supply-1"] || {};
    const radius = Number(pinSpecific.preferredRadiusKm ?? service.preferredRadiusKm);
    const effective = Math.min(BROKER_HQ_MAX_RADIUS_KM, Math.max(0.5, Number.isFinite(radius) ? radius : BROKER_HQ_MAX_RADIUS_KM));
    window.__hfBrokerPreferredRadiusKm = effective;
    document.body.dataset.bhqPreferredRadiusKm = String(effective);
    try { localStorage.setItem("hf_preferred_service_radius_km", String(effective)); } catch (_) {}
    return effective;
  } catch (_) {
    return BROKER_HQ_MAX_RADIUS_KM;
  }
}

async function saveBrokerPreferredRadius(radiusKm, pinId = "supply-1") {
  const effective = Math.min(BROKER_HQ_MAX_RADIUS_KM, Math.max(0.5, Number(radiusKm) || BROKER_HQ_MAX_RADIUS_KM));
  const result = await setBrokerServiceRadiusCallable({ pinId, radiusKm: effective });
  const saved = Number(result?.data?.preferredRadiusKm);
  const next = Number.isFinite(saved) ? saved : effective;
  window.__hfBrokerPreferredRadiusKm = next;
  document.body.dataset.bhqPreferredRadiusKm = String(next);
  return next;
}
function renderAmenityChoices() {
  const host = $("bhq-amenities-list");
  if (!host) return;
  const list = Array.isArray(AMENITIES) ? AMENITIES.slice(0, 40) : [];
  host.innerHTML = list.map(a => {
    const value = a.value || a.label || a;
    const label = a.label || value;
    return `<label class="bhq-amenity-option"><input type="checkbox" value="${esc(value)}" data-bhq-amenity> ${esc(label)}</label>`;
  }).join("");
}
function clientFilterDiscovery() {
  const f = bhqDiscovery.filters;
  const q = f.q.toLowerCase();
  bhqDiscovery.filtered = bhqDiscovery.records.filter(r => {
    if (f.kind !== "all") {
      if (f.kind === "propertyHelp" && !(r.marketKind === "property" && r.help)) return false;
      if (f.kind === "wantedHelp" && !(r.marketKind === "wanted" && r.help)) return false;
      if (f.kind === "property" && r.marketKind !== "property") return false;
      if (f.kind === "wanted" && r.marketKind !== "wanted") return false;
    }
    const hay = [r.title,r.type,r.description,(r.amenities||[]).join(" ")].join(" ").toLowerCase();
    if (q && !hay.includes(q)) return false;
    const lo = Number(r.priceMin), hi = Number(r.priceMax);
    if (f.min && Number.isFinite(hi) && hi < f.min) return false;
    if (f.max && Number.isFinite(lo) && lo > f.max) return false;
    if (f.amenities.length) {
      const a = (r.amenities || []).map(normalizeAmenityKey);
      if (!f.amenities.every(x => a.includes(normalizeAmenityKey(x)))) return false;
    }
    return true;
  });
  renderDiscoveryRail();
}
function renderDiscoveryRail() {
  const rail = $("bhq-discovery-rail"), count = $("bhq-discovery-count");
  if (!rail) return;
  if (count) count.textContent = `${bhqDiscovery.filtered.length} discovered`;
  if (!bhqDiscovery.filtered.length) {
    const message = bhqDiscovery.status === "no-pin"
      ? "Select a valid Broker HQ pin to discover listings."
      : bhqDiscovery.records.length
        ? "Listings were discovered, but none match the current filters."
        : "No listings were discovered inside this pin’s selected service radius.";
    rail.innerHTML = `<p class="bhq-empty">${esc(message)}</p>`;
    return;
  }
  rail.innerHTML = bhqDiscovery.filtered.map((r, i) => {
    const price = r.priceMin != null || r.priceMax != null
      ? `₱${Number(r.priceMin ?? r.priceMax).toLocaleString()}${r.priceMax != null && r.priceMax !== r.priceMin ? `–₱${Number(r.priceMax).toLocaleString()}` : ""}`
      : "Price unavailable";
    const image = r.image ? `<img src="${esc(r.image)}" alt="" loading="lazy">` : "";
    return `<article class="bhq-discovery-card" data-bhq-card="${i}">
      ${image}
      <div class="bhq-discovery-card-body">
        <p class="bhq-discovery-card-title">${esc(r.title)}${r.help ? `<span class="bhq-help-chip">NEED HELP</span>` : ""}</p>
        <p class="bhq-discovery-card-meta">${esc(r.type || (r.marketKind === "wanted" ? "Wanted" : "Property"))} · ${esc(price)} · ${r.distanceKm} km</p>
        <p class="bhq-discovery-card-desc">${esc(r.description || "No description provided.")}</p>
      </div>
    </article>`;
  }).join("");
}
/* R4: every discovery load is tied to the current active pin. */
async function loadBrokerDiscovery() {
  const pin = activeDiscoveryPin();
  const status = $("bhq-discovery-status");
  const count = $("bhq-discovery-count");
  const seq = ++bhqDiscovery.requestSeq;

  if (!pin || !Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) {
    bhqDiscovery.status = "no-pin";
    bhqDiscovery.records = [];
    bhqDiscovery.filtered = [];
    bhqDiscovery.activePinKey = null;
    renderDiscoveryRail();
    if (status) status.textContent = " · Select a valid pin to discover";
    return;
  }

  const pinKey = `${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`;
  bhqDiscovery.activePinKey = pinKey;
  bhqDiscovery.status = "loading";
    if (status) status.textContent = " · Loading authorized projection…";
  if (count) count.textContent = "…";

  try {
    const result = await discoverCallable({
      pin,
      pinId: "supply-1",
      discoveryType: "all",
      requestId: `${Date.now()}-${seq}`
    });
    if (seq !== bhqDiscovery.requestSeq || bhqDiscovery.activePinKey !== pinKey) return;

    const data = result?.data || {};
    const serverRecords = Array.isArray(data.records) ? data.records : [];
    bhqDiscovery.records = serverRecords.filter(r => Number(r.distanceKm) <= currentBrokerPreferredRadius());
    bhqDiscovery.status = "ready";
        clientFilterDiscovery();

    if (status) {
      status.textContent = ` · ${data.radiusKm || currentBrokerPreferredRadius()} km search radius (max ${data.maxRadiusKm || BROKER_HQ_MAX_RADIUS_KM} km)`;
    }
  } catch (e) {
    if (seq !== bhqDiscovery.requestSeq) return;
    bhqDiscovery.status = e?.code === "functions/permission-denied" ? "unauthorized" : "error";
        bhqDiscovery.records = [];
    bhqDiscovery.filtered = [];
    renderDiscoveryRail();
    if (status) {
      status.textContent = bhqDiscovery.status === "unauthorized"
        ? " · Broker authorization required"
        : " · Discovery service unavailable";
    }
    console.warn("Broker HQ discovery", e);
  }
}
function syncDiscoveryFilters() {
  bhqDiscovery.filters.q = $("bhq-discovery-search")?.value || "";
  bhqDiscovery.filters.kind = $("bhq-discovery-kind")?.value || "all";
  bhqDiscovery.filters.min = Number($("bhq-price-min")?.value || 0);
  bhqDiscovery.filters.max = Number($("bhq-price-max")?.value || 0);
  bhqDiscovery.filters.amenities = [...document.querySelectorAll("[data-bhq-amenity]:checked")].map(x => x.value);
  clientFilterDiscovery();
}
function openDiscoveryModal(record) {
  let modal = $("bhq-card-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "bhq-card-modal";
    modal.className = "bhq-card-modal";
    modal.hidden = true;
    modal.innerHTML = `<div class="bhq-card-modal-inner" role="dialog" aria-modal="true">
      <button class="bhq-card-modal-close" type="button" aria-label="Close">×</button>
      <div id="bhq-card-modal-content"></div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => { if (e.target === modal || e.target.closest(".bhq-card-modal-close")) modal.hidden = true; });
  }
  const price = record.priceMin != null || record.priceMax != null
    ? `₱${Number(record.priceMin ?? record.priceMax).toLocaleString()}${record.priceMax != null && record.priceMax !== record.priceMin ? `–₱${Number(record.priceMax).toLocaleString()}` : ""}`
    : "Price unavailable";
  $("bhq-card-modal-content").innerHTML = `${record.image ? `<img src="${esc(record.image)}" alt="">` : ""}
    <div class="bhq-card-modal-body">
      <h2>${esc(record.title)}</h2>
      <p><strong>${esc(record.type || "Listing")}</strong> · ${esc(price)} · ${record.distanceKm} km</p>
      ${record.help ? `<p><span class="bhq-help-chip">NEED HELP</span></p>` : ""}
      <p>${esc(record.description || "No description provided.")}</p>
      <p>${(record.amenities || []).map(esc).join(" · ")}</p>
    </div>`;
  modal.hidden = false;
}
$("bhq-discovery-rail")?.addEventListener("click", e => {
  const card = e.target.closest("[data-bhq-card]");
  if (!card) return;
  const record = bhqDiscovery.filtered[Number(card.dataset.bhqCard)];
  if (record) openDiscoveryModal(record);
});
["bhq-discovery-search","bhq-discovery-kind","bhq-price-min","bhq-price-max"].forEach(id => {
  $(id)?.addEventListener("input", syncDiscoveryFilters);
  $(id)?.addEventListener("change", syncDiscoveryFilters);
});
$("bhq-amenities-btn")?.addEventListener("click", () => {
  const p = $("bhq-amenities-popover");
  if (!p) return;
  p.hidden = !p.hidden;
  $("bhq-amenities-btn").setAttribute("aria-expanded", String(!p.hidden));
});
$("bhq-amenities-close")?.addEventListener("click", () => {
  $("bhq-amenities-popover").hidden = true;
  $("bhq-amenities-btn")?.setAttribute("aria-expanded","false");
});
$("bhq-amenities-list")?.addEventListener("change", syncDiscoveryFilters);
$("bhq-discovery-refresh")?.addEventListener("click", loadBrokerDiscovery);
$("bhq-map-settings-btn")?.addEventListener("click", () => {
  const p = $("bhq-map-settings");
  if (!p) return; p.hidden = !p.hidden;
});
$("bhq-3d-toggle")?.addEventListener("change", e => {
  if (!map) return;
  try { map.setTerrain(null); } catch (_) {}
  // MapLibre style terrain/building support varies by style; keep the preference
  // explicit without claiming unsupported terrain exists.
  document.body.dataset.bhq3d = e.target.checked ? "on" : "off";
});
$("bhq-3d-toggle")?.addEventListener("change", () => { if (map) try { map.resize(); } catch (_) {} });

renderAmenityChoices();


/* ---------- Chrome ---------- */
$("bhq-logout-btn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (_) {}
  location.href = "login.html";
});



/* ========== Phase D — Manage pins tab ========== */

function setBhqTab(tab) {
  const normalized = ["desk", "pins", "profile"].includes(tab) ? tab : "desk";
  const desk = normalized === "desk";
  const pins = normalized === "pins";
  const profile = normalized === "profile";

  document.querySelectorAll(".bhq-tab").forEach((btn) => {
    const on = btn.getAttribute("data-bhq-tab") === normalized;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });

  const pinsPanel = $("bhq-pins-panel");
  const profilePanel = $("bhq-profile-panel");
  if (pinsPanel) pinsPanel.hidden = !pins;
  if (profilePanel) profilePanel.hidden = !profile;

  const deskBlocks = document.querySelectorAll(
    "#bhq-home > .bhq-section-head, #bhq-home > .bhq-cards, #bhq-home > .bhq-service, #bhq-list-panel"
  );
  deskBlocks.forEach((el) => {
    el.hidden = !desk;
    if (desk && el.id === "bhq-list-panel" && listPanel) {
      // Keep an explicitly opened request list state under the Desk tab.
      el.hidden = listPanel.hidden;
    }
  });

  if (pins) {
    if (listPanel) listPanel.hidden = true;
    renderManagePins().catch((e) => console.warn(e));
  } else if (desk) {
    try { map?.resize(); } catch (_) {}
  }
}

async function fetchNearbyPropertyCards(center, maxKm, limitN = 12) {
  if (!center) return [];
  const ownedIds = new Set((brokerWorkspace.ownedInventory || []).map((r) => String(r.id)));
  const out = (brokerWorkspace.assistedWork || [])
    .filter((r) => r.collection === PROPERTY_LISTINGS && r.coordinates)
    .map((r) => ({
      id: r.id,
      title: r.title || "Listing",
      price: r.priceMin ?? r.priceMax ?? null,
      km: Number(r.distanceKm ?? haversineKm(center, r.coordinates)),
      type: r.type || "",
      col: r.collection,
    }))
    .filter((r) => Number.isFinite(r.km) && r.km <= maxKm && !ownedIds.has(String(r.id)))
    .sort((a, b) => a.km - b.km);
  return out.slice(0, limitN);
}

async function fetchNearbyAssistanceCards(center, maxKm, limitN = 8) {
  if (!center) return [];
  try {
    const open = await fetchOpenRequests();
    const out = [];
    for (const r of open) {
      const c = requestCoords(r);
      if (!c) continue;
      const km = haversineKm(center, c);
      if (km > maxKm) continue;
      out.push({
        id: r.id,
        title: String(r.type || r.helpType || "Assistance").replace(/_/g, " "),
        km: Math.round(km * 10) / 10,
        kind: "assist",
      });
    }
    out.sort((a, b) => a.km - b.km);
    return out.slice(0, limitN);
  } catch (_) {
    return [];
  }
}

function pinRailHtml(slot, { coolText, expText, cards, isService }) {
  const has = !!slot.center;
  const coord = has
    ? `${Number(slot.center.lat).toFixed(4)}, ${Number(slot.center.lng).toFixed(4)}`
    : "Not set";
  const status = !has ? "Empty" : coolText ? `Cooldown · ${coolText}` : "Ready";
  const statusState = !has ? "empty" : coolText ? "cool" : "ready";
  const cardsHtml =
    cards.length === 0
      ? `<p class="bhq-pin-cards-empty">${has ? "No nearby active listings in radius yet." : "Set this pin to load discovery cards."}</p>`
      : cards
          .map((c) => {
            const price =
              c.price != null && c.price !== ""
                ? `₱${Number(c.price).toLocaleString()}`
                : c.kind === "assist"
                  ? "Help request"
                  : "Price n/a";
            return `<article class="bhq-disc-card" role="listitem">
              <p class="bhq-disc-card-title">${esc(c.title)}</p>
              <p class="bhq-disc-card-meta">${esc(price)} · ${c.km} km</p>
              ${c.type ? `<p class="bhq-disc-card-type">${esc(String(c.type).replace(/_/g, " "))}</p>` : ""}
            </article>`;
          })
          .join("");

  return `<article class="bhq-pin-rail${has ? "" : " is-empty"}" role="listitem" data-pin-id="${esc(slot.id)}">
    <div class="bhq-pin-rail-meta">
      <div class="bhq-pin-rail-top">
        <h3 class="bhq-pin-rail-name">${esc(slot.label)}${isService ? ' <span class="bhq-pin-badge">Service</span>' : ""}</h3>
        <span class="bhq-pin-status" data-state="${statusState}">${esc(status)}</span>
      </div>
      <p class="bhq-pin-coord"><i class="bx bx-map"></i> ${esc(coord)}</p>
      <dl class="bhq-pin-dl">
        <div><dt>Cooldown</dt><dd>${coolText ? esc(coolText) : "—"}</dd></div>
        <div><dt>Boost window</dt><dd>${expText ? esc(expText) : "—"}</dd></div>
      </dl>
      <div class="bhq-pin-rail-ctas">
        <button type="button" class="bhq-btn bhq-btn-primary bhq-pin-to-desk" data-goto-desk-map="1" title="Open Desk service map (brokers do not use Market)">
          <i class="bx bx-map-alt"></i> Desk map
        </button>
        <button type="button" class="bhq-btn bhq-btn-ghost bhq-pin-scroll-hint" data-scroll-rail="${esc(slot.id)}" title="Scroll discovery cards">
          <i class="bx bx-chevrons-right"></i> Cards
        </button>
      </div>
    </div>
    <div class="bhq-pin-cards-wrap">
      <p class="bhq-pin-cards-label">Discovery near this pin</p>
      <div class="bhq-pin-cards" id="bhq-cards-${esc(slot.id)}" role="list" tabindex="0">${cardsHtml}</div>
    </div>
  </article>`;
}

async function loadBrokerWorkspace() {
  if (!currentUser) return brokerWorkspace;
  try {
    const result = await workspaceCallable({ requestId: `${Date.now()}-workspace` });
    brokerWorkspace = normalizeBrokerWorkspace(result?.data || {});
  } catch (e) {
    console.warn("Broker HQ workspace projection", e);
    brokerWorkspace = normalizeBrokerWorkspace();
  }
  return brokerWorkspace;
}

async function renderManagePins() {
  const rails = $("bhq-pin-rails");
  const capNum = $("bhq-pins-cap-num");
  const loading = $("bhq-pins-loading");
  if (!rails || !currentUser) return;
  if (loading) loading.hidden = false;
  rails.innerHTML = `<p class="bhq-pins-loading">Loading pin slots…</p>`;

  let boostDoc = {};
  try {
    const bs = await getDoc(doc(db, "boosts", currentUser.uid));
    if (bs.exists()) boostDoc = bs.data() || {};
  } catch (_) {}
  const sPkg = resolveBoostPackageId(boostDoc.seeker);
  const oPkg = resolveBoostPackageId(boostDoc.owner);
  const se = boostExpiresAt(boostDoc.seeker);
  const oe = boostExpiresAt(boostDoc.owner);

  let tIdx = tierIndex;
  try {
    const tr = await getDoc(doc(db, "users", currentUser.uid, "tier", "broker"));
    if (tr.exists()) tIdx = Number(tr.data().highestIndex || tr.data().index || tIdx) || tIdx;
  } catch (_) {}

  const maxP = maxPinsForAccount({
    role: "broker",
    tierIndex: tIdx,
    seekerPackageId: sPkg,
    ownerPackageId: oPkg,
    seekerActivePackageIds: boostDoc.seeker?.packages ? Object.keys(boostDoc.seeker.packages).map(Number) : null,
    ownerActivePackageIds: boostDoc.owner?.packages ? Object.keys(boostDoc.owner.packages).map(Number) : null,
  });

  let mapState = null;
  let mapStateOwner = null;
  let userPins = null;
  try {
    mapState = await getMapState(currentUser.uid, tIdx, sPkg, "mapState");
    mapStateOwner = await getMapState(currentUser.uid, tIdx, oPkg, "mapStateOwner");
  } catch (_) {}
  try {
    const us = await getDoc(doc(db, "users", currentUser.uid));
    if (us.exists()) userPins = us.data()?.pins || null;
  } catch (_) {}

  const slots = buildPinSlots({
    role: "broker",
    tierIndex: tIdx,
    seekerPackageId: sPkg,
    ownerPackageId: oPkg,
    seekerBoost: boostDoc.seeker || null,
    ownerBoost: boostDoc.owner || null,
    mapState,
    mapStateOwner,
    userPins,
  });

  /* Ensure service slot visible for brokers */
  if (!slots.some((s) => s.id === "supply-1" || s.kind === "supply" || s.kind === "portfolio")) {
    const c = mapStateOwner?.lastKnownCenter;
    slots.unshift({
      id: "supply-1",
      kind: "supply",
      center: c && Number.isFinite(Number(c.lat)) ? { lat: Number(c.lat), lng: Number(c.lng) } : null,
      label: "Service pin",
      stateField: "mapStateOwner",
    });
  }

  while (slots.length < maxP) {
    slots.push({
      id: `empty-${slots.length + 1}`,
      kind: "discovery",
      center: null,
      label: `Open slot ${slots.length + 1}`,
      empty: true,
    });
  }

  const used = slots.filter((s) => s.center).length;
  if (capNum) capNum.innerHTML = `${used}<span class="bhq-pins-cap-max">/${maxP}</span>`;

  const radiusKm = Math.min(BROKER_HQ_MAX_RADIUS_KM, Math.max(0.5, Number(NEAR_KM) || await loadBrokerPreferredRadius()));
  const htmlParts = [];
  for (const slot of slots.slice(0, Math.max(maxP, slots.length))) {
    const isService = slot.id === "supply-1" || slot.kind === "supply" || slot.kind === "portfolio";
    let coolText = null;
    try {
      const st = isService ? mapStateOwner : mapState;
      if (st && st.canRelocate === false) coolText = formatCooldown(st.cooldownRemainingMs || 0);
    } catch (_) {}
    const expText = isService
      ? oe && oPkg
        ? `Listing until ${oe.toLocaleDateString()}`
        : null
      : se && sPkg
        ? `Seeking until ${se.toLocaleDateString()}`
        : null;

    let cards = [];
    if (slot.center) {
      const props = await fetchNearbyPropertyCards(slot.center, radiusKm, 10);
      const assist = await fetchNearbyAssistanceCards(slot.center, radiusKm, 6);
      cards = [...props, ...assist].sort((a, b) => a.km - b.km).slice(0, 12);
    }
    htmlParts.push(pinRailHtml(slot, { coolText, expText, cards, isService }));
  }

  rails.innerHTML = htmlParts.join("") || `<p class="bhq-pins-loading">No pin slots.</p>`;

  rails.querySelectorAll("[data-scroll-rail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-scroll-rail");
      const strip = document.getElementById(`bhq-cards-${id}`);
      if (strip) strip.scrollBy({ left: 220, behavior: "smooth" });
    });
  });
  rails.querySelectorAll("[data-goto-desk-map]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setBhqTab("desk");
      try {
        $("bhq-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (_) {}
    });
  });
}

$("bhq-open-profile")?.addEventListener("click", () => setBhqTab("profile"));
$("bhq-profile-reload")?.addEventListener("click", () => {
  const frame = $("bhq-profile-frame");
  if (!frame) return;
  try { frame.contentWindow.location.reload(); } catch (_) { frame.src = "profile.html?embedded=broker-hq#perks"; }
});

$("bhq-tabs")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-bhq-tab]");
  if (!btn) return;
  setBhqTab(btn.getAttribute("data-bhq-tab") || "desk");
});

$("bhq-pins-refresh")?.addEventListener("click", () => {
  renderManagePins().catch((e) => console.warn(e));
});

$("bhq-pins-to-desk")?.addEventListener("click", () => {
  setBhqTab("desk");
});

async function boot() {
  const user = await authReady.catch(() => null);
  if (!user) {
    showGate(
      "Sign in to open Broker HQ",
      "Licensed brokers only.",
      "login.html?next=" + encodeURIComponent("broker-hq.html"),
      "Sign in"
    );
    return;
  }

  let role = "seeker";
  let name = "";
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.exists() ? snap.data() : {};
    role = canonicalRoleFromData(data, "seeker") || "seeker";
    try { if (role === "broker" || role === "agent") sessionStorage.setItem("hf_account_role", "broker"); } catch (_) {}
    name = [data.firstName, data.surname].filter(Boolean).join(" ") || "";
    tierIndex = Number(data.tierIndex ?? data.tier?.highestIndex ?? 0) || 0;
  } catch (_) {}

  if (role !== "broker" && role !== "agent") {
    /* P01's market.html has an inline pre-module script that trusts a
       cached sessionStorage.hf_account_role === "broker" and redirects
       here INSTANTLY, before market.js's boot() (the only other place
       that writes this key) ever gets a chance to run and correct it.
       If that cache is stale (role changed since it was set, or was
       set while testing) and we land here as a genuine non-broker, we
       MUST clear it -- otherwise this account is bounced back here
       forever on every future Market visit, unable to ever re-run the
       real check that would fix it. One-time self-heal. */
    try { sessionStorage.removeItem("hf_account_role"); } catch (_) {}
    showGate(
      "Brokers only",
      "Complete broker KYC if you’re applying. Seekers and owners use Market.",
      "profile.html",
      "Go to Profile"
    );
    return;
  }

  currentUser = user;
  await loadBrokerWorkspace();
  showHome();
  const preferredHost = document.getElementById("bhq-preferred-radius-host");
  if (preferredHost) {
    try {
      await loadBrokerPreferredRadius();
      window.__hfBrokerPreferredRadiusControl?.destroy?.();
      window.__hfBrokerPreferredRadiusControl = mountPreferredRadiusControl({
        host: preferredHost,
        getMaxKm: () => BROKER_HQ_MAX_RADIUS_KM,
        onChange: async (km) => {
          try {
            const saved = await saveBrokerPreferredRadius(km, "supply-1");
            NEAR_KM = saved;
            await loadAssistanceCounts(user.uid);
            await loadBrokerDiscovery();
            setStatus(`Service radius · ${saved} km (max ${BROKER_HQ_MAX_RADIUS_KM} km)`);
          } catch (e) {
            console.warn("broker preferred radius", e);
            await loadBrokerPreferredRadius();
            window.__hfBrokerPreferredRadiusControl?.paint?.();
          }
        },
        kind: "hq",
        label: "This pin's search radius"
      });
    } catch (e) {
      console.warn("Broker preferred radius control", e);
    }
  }
  if (welcome) welcome.textContent = name ? `Welcome, ${name}` : "Welcome to your broker desk";


  const preferred = await loadBrokerPreferredRadius();
  NEAR_KM = preferred;
  const hqRadius = document.getElementById("bhq-radius-label");
  if (hqRadius) hqRadius.textContent = `${preferred} km`;
  await loadBrokerPreferredRadius();
  await loadAssistanceCounts(user.uid);

  await initServiceMap();
}

boot();
