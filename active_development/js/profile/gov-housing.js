/* F3 — Profile Gov Housing tab (seeker + owner) — SoT §34.16
 * Full-width scroll cards: image + Details only. Filters. Footer official links.
 */
import { listPublishedPublic, SECTORS } from "../gov-housing-posts.js";
import { loadDisclaimers, paintDisclaimerSection } from "../gov-disclaimers.js";

let cache = [];
let filter = "all";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function sectorLabel(id) {
  return SECTORS.find((s) => s.id === id)?.label || id || "Program";
}

function cardHTML(p) {
  const title = esc(p.title || "Government program");
  const img = esc(p.imageUrl || "");
  const url = esc(p.externalUrl || "#");
  const loc = p.locationText ? esc(p.locationText) : "";
  const band = p.priceBand && p.priceBand !== "unknown" ? esc(p.priceBand) : "";
  const partner = p.partnerName ? esc(p.partnerName) : "";
  const extraBadge = p.opsVerified
    ? `<span class="gov-profile-card-badge gov-badge-verified">Ops-verified partner</span>`
    : p.sector === "partner"
      ? `<span class="gov-profile-card-badge gov-badge-partner">Partner inventory</span>`
      : `<span class="gov-profile-card-badge">${esc(sectorLabel(p.sector))}</span>`;
  return `<article class="gov-profile-card${p.opsVerified ? " is-verified-partner" : ""}">
    <div class="gov-profile-card-media">
      <img src="${img}" alt="" loading="lazy" width="640" height="360">
      ${extraBadge}
    </div>
    <div class="gov-profile-card-body">
      <h4 class="gov-profile-card-title">${title}</h4>
      <div class="gov-profile-card-meta">
        ${loc ? `<span><i class="bx bx-map"></i> ${loc}</span>` : ""}
        ${band ? `<span><i class="bx bx-tag"></i> ${band}</span>` : ""}
        ${partner ? `<span><i class="bx bx-briefcase"></i> ${partner}</span>` : ""}
      </div>
      <p class="gov-profile-card-note field-hint">${p.opsVerified ? "Ops checked this outbound link. Still not a loan approval." : "Details open the official or partner page. Check eligibility there."}</p>
      <a class="gov-profile-details-btn" href="${url}" target="_blank" rel="noopener noreferrer">
        Details on official site <i class="bx bx-link-external"></i>
      </a>
    </div>
  </article>`;
}

function renderGrid() {
  const grid = document.getElementById("gov-profile-grid");
  if (!grid) return;
  let rows = cache;
  if (filter !== "all") {
    rows = cache.filter((p) => String(p.sector) === filter);
  }
  if (!rows.length) {
    grid.innerHTML = `<div class="gov-profile-empty">
      <i class="bx bx-building-house"></i>
      <p>${filter === "all" ? "No published government highlights yet." : "Nothing in this sector right now."}</p>
      <a href="financing.html" data-no-transition="1">Open government housing guide</a>
    </div>`;
    return;
  }
  grid.innerHTML = rows.map(cardHTML).join("");
}

async function load() {
  const grid = document.getElementById("gov-profile-grid");
  if (!grid) return;
  grid.innerHTML = `<p class="field-hint u-pad-12">Loading programs…</p>`;
  try {
    cache = await listPublishedPublic(60);
    renderGrid();
  } catch (e) {
    console.warn(e);
    grid.innerHTML = `<p class="field-hint">Could not load programs. Try again later or open the <a href="financing.html">guide</a>.</p>`;
  }
  try {
    const d = await loadDisclaimers();
    const host = document.getElementById("gov-profile-disclaimer");
    const sectors = ["global", ...new Set(cache.map((p) => p.sector).filter(Boolean))];
    paintDisclaimerSection(host, d, {
      title: "Disclaimers",
      sectors: sectors.filter((k) => d[k])
    });
  } catch (_) {}
}

document.querySelectorAll("[data-gov-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    filter = btn.getAttribute("data-gov-filter") || "all";
    document.querySelectorAll("[data-gov-filter]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    renderGrid();
  });
});

document.addEventListener("hf:tab-activated", (e) => {
  if (e.detail?.tab === "gov-housing") load();
});

if (location.hash === "#gov-housing") {
  setTimeout(load, 400);
}

// Soft load when panel exists (user may land on tab)
setTimeout(() => {
  const panel = document.getElementById("panel-gov-housing");
  if (panel?.classList.contains("active")) load();
}, 500);
