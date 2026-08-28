/* F2 — Home government housing strip under Featured (SoT §34.16)
 * Cards: image + optional title + Details (external). No full description.
 * Disclaimers: separate block below sector groups.
 */
import { listPublishedPublic, SECTORS } from "./gov-housing-posts.js";
import { loadDisclaimers, paintDisclaimerSection } from "./gov-disclaimers.js";

const MAX_PER_SECTOR = 6;
const MIN_HINT = 3;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function sectorLabel(id) {
  return SECTORS.find((s) => s.id === id)?.label || id || "Programs";
}

function cardHTML(p) {
  const title = esc(p.title || "Government program");
  const img = esc(p.imageUrl || "");
  const url = esc(p.externalUrl || "#");
  const loc = p.locationText ? `<span class="gov-card-meta">${esc(p.locationText)}</span>` : "";
  const partnerBadge = p.opsVerified
    ? `<span class="gov-badge gov-badge-verified">Ops-verified partner</span>`
    : p.sector === "partner" || p.partnerName
      ? `<span class="gov-badge gov-badge-partner">Partner inventory</span>`
      : "";
  const partnerLine = p.partnerName ? `<span class="gov-card-meta">${esc(p.partnerName)}</span>` : "";
  return `<article class="gov-home-card${p.opsVerified ? " is-verified-partner" : ""}" data-sector="${esc(p.sector)}">
    <a class="gov-home-card-media" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Details: ${title}">
      <img src="${img}" alt="" loading="lazy" width="320" height="180">
      ${partnerBadge}
    </a>
    <div class="gov-home-card-body">
      <h3 class="gov-home-card-title">${title}</h3>
      ${loc}${partnerLine}
      <a class="gov-home-card-details" href="${url}" target="_blank" rel="noopener noreferrer">Details</a>
    </div>
  </article>`;
}

function groupBySector(posts) {
  const order = SECTORS.map((s) => s.id);
  const map = {};
  for (const p of posts) {
    const k = p.sector || "other";
    if (!map[k]) map[k] = [];
    if (map[k].length < MAX_PER_SECTOR) map[k].push(p);
  }
  return order.filter((k) => map[k]?.length).map((k) => ({ sector: k, items: map[k] }));
}

async function render() {
  const host = document.getElementById("home-gov-sectors");
  const discHost = document.getElementById("home-gov-disclaimer-host");
  if (!host) return;

  try {
    const posts = await listPublishedPublic(48);
    if (!posts.length) {
      host.innerHTML = `<div class="home-gov-empty">
        <p>No published government program highlights yet.</p>
        <a href="financing.html">Read the government housing guide</a>
      </div>`;
    } else {
      const groups = groupBySector(posts);
      host.innerHTML = groups
        .map((g) => {
          const note =
            g.items.length < MIN_HINT
              ? `<p class="gov-sector-hint field-hint">Showing ${g.items.length} — more can be published by ops (target ${MIN_HINT}+ per sector).</p>`
              : "";
          return `<div class="gov-sector-block" data-sector="${esc(g.sector)}">
            <h3 class="gov-sector-title">${esc(sectorLabel(g.sector))}</h3>
            ${note}
            <div class="gov-home-card-row">${g.items.map(cardHTML).join("")}</div>
          </div>`;
        })
        .join("");
    }
  } catch (e) {
    console.warn("home gov housing", e);
    host.innerHTML = `<p class="field-hint">Could not load government highlights. <a href="financing.html">Open the guide</a></p>`;
  }

  try {
    const d = await loadDisclaimers();
    const sectorsUsed = [
      "global",
      ...new Set(
        Array.from(document.querySelectorAll(".gov-sector-block[data-sector]")).map((el) =>
          el.getAttribute("data-sector")
        )
      )
    ];
    paintDisclaimerSection(discHost, d, {
      title: "Disclaimers",
      sectors: sectorsUsed.filter((k) => d[k])
    });
  } catch (e) {
    console.warn("home gov disclaimers", e);
  }
}

render();
