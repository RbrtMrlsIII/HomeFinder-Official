/* Home map teaser — MapLibre ESM (same stack as Market). Preview pin + guest confirm → login. */
import * as maplibregl from "https://unpkg.com/maplibre-gl@6.3.0/dist/maplibre-gl.mjs";

const MANILA = [120.9842, 14.5995];
const PENDING_KEY = "hf_market_pending_pin";

let map = null;
let marker = null;
let placing = false;
let pendingLngLat = null;

function status(msg) {
  const el = document.getElementById("home-map-status");
  if (el) el.textContent = msg;
}

function savePending(lngLat) {
  try {
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ lng: lngLat.lng, lat: lngLat.lat, kind: "discovery", at: Date.now() })
    );
  } catch (_) {}
  try {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ lng: lngLat.lng, lat: lngLat.lat, kind: "discovery", at: Date.now() })
    );
  } catch (_) {}
}

function placeMarker(lngLat) {
  if (!map) return;
  if (marker) marker.remove();
  marker = new maplibregl.Marker({ color: "#C4A574" })
    .setLngLat([lngLat.lng, lngLat.lat])
    .addTo(map);
  map.flyTo({
    center: [lngLat.lng, lngLat.lat],
    zoom: Math.max(map.getZoom(), 14),
    pitch: 42,
  });
}

function showConfirm(show) {
  const box = document.getElementById("home-map-confirm");
  if (box) box.hidden = !show;
}

function init() {
  const el = document.getElementById("home-map-canvas");
  if (!el) {
    status("Map container missing");
    return;
  }
  if (!maplibregl || !maplibregl.Map) {
    status("Map library failed — open Market for full map");
    return;
  }

  try {
    map = new maplibregl.Map({
      container: "home-map-canvas",
      style: "https://tiles.openfreemap.org/styles/bright",
      center: MANILA,
      zoom: 13,
      pitch: 42,
      bearing: -12,
      canvasContextAttributes: { antialias: true },
    });
  } catch (err) {
    console.warn(err);
    status("Could not start map — open Market");
    return;
  }

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  status("Loading 3D map…");

  map.on("load", () => {
    try {
      map.addSource("openfreemap", {
        url: "https://tiles.openfreemap.org/planet",
        type: "vector",
      });
      map.addLayer({
        id: "3d-buildings",
        source: "openfreemap",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#9CA3AF",
          "fill-extrusion-height": ["get", "render_height"],
          "fill-extrusion-base": ["get", "render_min_height"],
        },
      });
    } catch (_) {}
    status("3D ready — Drop pin to preview (sign-in to lock on Market)");
    try {
      map.resize();
    } catch (_) {}
  });

  map.on("error", () => status("Map tiles issue — try Open full Market"));

  map.on("click", (e) => {
    if (!placing) return;
    placing = false;
    pendingLngLat = e.lngLat;
    placeMarker(e.lngLat);
    showConfirm(true);
    status("Confirm pin → sign in to apply on Market (SoT guest path)");
    const btn = document.getElementById("home-map-drop-btn");
    if (btn) btn.innerHTML = '<i class="bx bx-map-pin"></i> Drop pin';
  });

  document.getElementById("home-map-drop-btn")?.addEventListener("click", () => {
    placing = true;
    showConfirm(false);
    status("Tap the map to place a preview pin");
    const btn = document.getElementById("home-map-drop-btn");
    if (btn) btn.textContent = "Tap map…";
  });

  document.getElementById("home-map-confirm-ok")?.addEventListener("click", () => {
    if (!pendingLngLat) return;
    savePending(pendingLngLat);
    showConfirm(false);
    status("Pin saved — redirecting to sign in…");
    window.location.href = "login.html?next=" + encodeURIComponent("market.html");
  });

  document.getElementById("home-map-confirm-cancel")?.addEventListener("click", () => {
    showConfirm(false);
    pendingLngLat = null;
    if (marker) {
      marker.remove();
      marker = null;
    }
    status("Pin cancelled — drop again when ready");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
