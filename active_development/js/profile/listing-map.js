/* Listing pin — full-screen MapLibre 3D (same style stack as Market)
 * Group F: confirmed pin is source of truth for Market radius.
 * Address geocode only suggests a draft; never clears/replaces pin until Confirm.
 */
import * as maplibregl from "https://unpkg.com/maplibre-gl@6.3.0/dist/maplibre-gl.mjs";
import { DEFAULT_MAP_CENTER } from "../geo.js";

let map = null;
let marker = null;
/** Confirmed pin (saved to listing on submit). */
let pinLocation = null;
/** In-editor draft only — not written until Confirm. */
let draftPin = null;

export function getPinLocation() {
  return pinLocation;
}

export function hasListingPin() {
  return !!(pinLocation && Number.isFinite(pinLocation.lat) && Number.isFinite(pinLocation.lng));
}

function pinsDiffer(a, b) {
  if (!a || !b) return !!(a || b);
  return Math.abs(a.lat - b.lat) > 1e-6 || Math.abs(a.lng - b.lng) > 1e-6;
}

function updatePinStatus() {
  const el = document.getElementById("listing-pin-status");
  if (!el) return;
  if (hasListingPin()) {
    el.dataset.state = "set";
    const pending =
      draftPin && pinsDiffer(draftPin, pinLocation)
        ? " · draft moved — Confirm pin to replace"
        : "";
    el.textContent = `Pin set · ${pinLocation.lat.toFixed(5)}, ${pinLocation.lng.toFixed(5)} · ready for Market radius${pending}`;
  } else if (draftPin) {
    el.dataset.state = "draft";
    el.textContent = `Draft pin · ${draftPin.lat.toFixed(5)}, ${draftPin.lng.toFixed(5)} — Confirm pin to lock for Market`;
  } else {
    el.dataset.state = "missing";
    el.textContent =
      "⚠️ Required · no pin yet — Market cannot place this listing in a radius without it. Address text alone is not enough.";
  }
  document.dispatchEvent(new CustomEvent("hf:listing-pin-changed", { detail: { pin: pinLocation, draft: draftPin } }));
}

function setDraftPin(lat, lng) {
  draftPin = { lat, lng };
  if (!map) return;
  if (marker) {
    marker.setLngLat([lng, lat]);
  } else {
    marker = new maplibregl.Marker({ color: "#C4A574", draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);
    marker.on("dragend", () => {
      const ll = marker.getLngLat();
      draftPin = { lat: ll.lat, lng: ll.lng };
      const conf = document.getElementById("listing-map-confirm");
      if (conf) conf.disabled = false;
      updatePinStatus();
    });
  }
  const conf = document.getElementById("listing-map-confirm");
  if (conf) conf.disabled = false;
  updatePinStatus();
}

function ensureMap() {
  const container = document.getElementById("listing-pin-map");
  if (!container) return null;
  if (map) {
    setTimeout(() => map.resize(), 80);
    return map;
  }
  map = new maplibregl.Map({
    container: "listing-pin-map",
    style: "https://tiles.openfreemap.org/styles/bright",
    center: [DEFAULT_MAP_CENTER.lng || 120.9842, DEFAULT_MAP_CENTER.lat || 14.5995],
    zoom: 14,
    pitch: 45,
    bearing: -10,
    canvasContextAttributes: { antialias: true },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  map.on("click", (e) => {
    setDraftPin(e.lngLat.lat, e.lngLat.lng);
  });
  map.on("load", () => {
    map.resize();
    if (pinLocation) {
      setDraftPin(pinLocation.lat, pinLocation.lng);
      map.flyTo({ center: [pinLocation.lng, pinLocation.lat], zoom: 16, pitch: 50 });
    } else if (draftPin) {
      setDraftPin(draftPin.lat, draftPin.lng);
      map.flyTo({ center: [draftPin.lng, draftPin.lat], zoom: 16, pitch: 50 });
    }
  });
  return map;
}

export function openListingMapEditor() {
  const overlay = document.getElementById("listing-map-overlay");
  if (overlay) overlay.hidden = false;
  document.body.classList.add("listing-map-open");
  ensureMap();
  const conf = document.getElementById("listing-map-confirm");
  if (conf) conf.disabled = !draftPin && !pinLocation;
  if (pinLocation) setDraftPin(pinLocation.lat, pinLocation.lng);
  setTimeout(() => map?.resize(), 100);
}

export function closeListingMapEditor() {
  const overlay = document.getElementById("listing-map-overlay");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("listing-map-open");
  // Keep confirmed pin; discard unconfirmed draft drift back to confirmed
  if (pinLocation) {
    draftPin = { lat: pinLocation.lat, lng: pinLocation.lng };
  }
  updatePinStatus();
}

function confirmPin() {
  const src = draftPin || pinLocation;
  if (!src) {
    alert(
      "⚠️ Pin required.\n\nTap the 3D map to place the pin, then press Confirm pin.\nAddress text alone is not used for Market radius."
    );
    return;
  }
  if (pinLocation && draftPin && pinsDiffer(draftPin, pinLocation)) {
    const ok = confirm(
      "Replace confirmed pin?\n\nThis updates the coordinates Market will use for radius matching.\nAddress text is not changed."
    );
    if (!ok) {
      setDraftPin(pinLocation.lat, pinLocation.lng);
      return;
    }
  }
  pinLocation = { lat: src.lat, lng: src.lng, lockedAt: Date.now(), source: "map-confirm" };
  draftPin = { lat: src.lat, lng: src.lng };
  updatePinStatus();
  closeListingMapEditor();
}

async function geocodeAddress(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address + ", Philippines")}`
  );
  const results = await res.json();
  return results.length > 0
    ? { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
    : null;
}

const locateBtn = document.getElementById("locate-on-map-btn");
const addressInput = document.getElementById("property-address");

locateBtn?.addEventListener("click", async () => {
  const address = addressInput?.value?.trim();
  if (!address) {
    alert("Enter an address first, or open the map and tap to place the pin manually.");
    openListingMapEditor();
    return;
  }

  if (hasListingPin()) {
    const ok = confirm(
      "You already confirmed a map pin.\n\nLocate from address only suggests a new position on the map. Your confirmed pin stays until you press Confirm pin again.\n\nContinue?"
    );
    if (!ok) return;
  }

  openListingMapEditor();
  locateBtn.disabled = true;
  const originalLabel = locateBtn.innerHTML;
  locateBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Locating…";
  try {
    const result = await geocodeAddress(address);
    if (result) {
      ensureMap();
      // Draft only — does not clear pinLocation
      setDraftPin(result.lat, result.lng);
      map?.flyTo({ center: [result.lng, result.lat], zoom: 16, pitch: 50 });
      updatePinStatus();
    } else {
      alert("Could not find that address. Tap the map to place the pin manually.");
    }
  } catch (e) {
    console.warn("geocode", e);
    alert("Locate failed. Tap the map to place the pin manually.");
  } finally {
    locateBtn.disabled = false;
    locateBtn.innerHTML = originalLabel;
  }
});

// Typing address must never clear a confirmed pin
addressInput?.addEventListener("input", () => {
  /* intentional no-op on pinLocation */
  updatePinStatus();
});

document.getElementById("listing-map-close")?.addEventListener("click", closeListingMapEditor);
document.getElementById("listing-map-confirm")?.addEventListener("click", confirmPin);

updatePinStatus();
