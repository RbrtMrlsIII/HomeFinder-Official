/* Wanted-area pin — full-screen map chrome (Confirm + Exit at bottom) */
import * as maplibregl from "https://unpkg.com/maplibre-gl@6.3.0/dist/maplibre-gl.mjs";
import { DEFAULT_MAP_CENTER } from "../geo.js";

let map = null;
let marker = null;
let pinLocation = null;
let draftPin = null;

export function getWantedPinLocation() {
  return pinLocation;
}

function updateStatus() {
  const status = document.getElementById("wanted-pin-status");
  if (!status) return;
  if (pinLocation) {
    status.textContent = `Pin set · ${pinLocation.lat.toFixed(5)}, ${pinLocation.lng.toFixed(5)}`;
    status.hidden = false;
  }
}

function setDraftPin(lat, lng) {
  draftPin = { lat, lng };
  if (!map) return;
  if (marker) {
    marker.setLngLat([lng, lat]);
  } else {
    marker = new maplibregl.Marker({ color: "#3b82f6", draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);
    marker.on("dragend", () => {
      const ll = marker.getLngLat();
      draftPin = { lat: ll.lat, lng: ll.lng };
      const conf = document.getElementById("wanted-map-confirm");
      if (conf) conf.disabled = false;
    });
  }
  const conf = document.getElementById("wanted-map-confirm");
  if (conf) conf.disabled = false;
}

function ensureMap() {
  const container = document.getElementById("wanted-pin-map-fs") || document.getElementById("wanted-pin-map");
  if (!container) return null;
  if (map) {
    setTimeout(() => map.resize(), 80);
    return map;
  }
  container.hidden = false;
  map = new maplibregl.Map({
    container: container.id,
    style: "https://tiles.openfreemap.org/styles/bright",
    center: [DEFAULT_MAP_CENTER.lng || 120.9842, DEFAULT_MAP_CENTER.lat || 14.5995],
    zoom: 13,
    pitch: 42,
    bearing: -8,
    canvasContextAttributes: { antialias: true },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  map.on("click", (e) => setDraftPin(e.lngLat.lat, e.lngLat.lng));
  map.on("load", () => {
    map.resize();
    if (pinLocation) {
      setDraftPin(pinLocation.lat, pinLocation.lng);
      map.flyTo({ center: [pinLocation.lng, pinLocation.lat], zoom: 15 });
    }
  });
  return map;
}

function openWantedMapEditor() {
  const overlay = document.getElementById("wanted-map-overlay");
  if (!overlay) {
    ensureMap();
    return;
  }
  overlay.hidden = false;
  document.body.classList.add("wanted-map-open");
  ensureMap();
  const conf = document.getElementById("wanted-map-confirm");
  if (conf) conf.disabled = !draftPin && !pinLocation;
  if (pinLocation) setDraftPin(pinLocation.lat, pinLocation.lng);
  setTimeout(() => map?.resize(), 120);
}

function closeWantedMapEditor() {
  const overlay = document.getElementById("wanted-map-overlay");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("wanted-map-open");
}

function confirmWantedPin() {
  const src = draftPin || pinLocation;
  if (!src) {
    alert("Tap the map to place a pin, then press Confirm pin.");
    return;
  }
  pinLocation = { lat: src.lat, lng: src.lng, lockedAt: Date.now() };
  updateStatus();
  closeWantedMapEditor();
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

export function refreshWantedMapSize() {
  if (map) setTimeout(() => map.resize(), 100);
}

const locateBtn = document.getElementById("wanted-locate-on-map-btn");
const addressInput = document.getElementById("wanted_address");

if (locateBtn) {
  locateBtn.addEventListener("click", async () => {
    openWantedMapEditor();
    const address = (addressInput?.value || "").trim();
    if (!address) return;
    locateBtn.disabled = true;
    const original = locateBtn.innerHTML;
    locateBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Locating…";
    try {
      const result = await geocodeAddress(address);
      if (result) {
        ensureMap();
        setDraftPin(result.lat, result.lng);
        map?.flyTo({ center: [result.lng, result.lat], zoom: 15, pitch: 42 });
      }
    } catch (e) {
      console.warn(e);
    } finally {
      locateBtn.disabled = false;
      locateBtn.innerHTML = original;
    }
  });
}

document.getElementById("wanted-map-close")?.addEventListener("click", closeWantedMapEditor);
document.getElementById("wanted-map-confirm")?.addEventListener("click", confirmWantedPin);

document.addEventListener("hf:tab-activated", (e) => {
  if (e.detail?.tab === "wanted") refreshWantedMapSize();
});
