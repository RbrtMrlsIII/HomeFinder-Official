/* HomeFinder Market — single discovery engine.  One feed, one filter state, one card rail. */
import { normalizeAmenityList, AMENITIES, PROPERTY_TYPES, propertyTypeFilterOptionsHtml } from "./listing-catalog.js";
import { normalizeCanonicalRole } from "./canonical-role.js";
import { authReady } from "./session.js";
import { db, functions } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { initMarketMap, filterIdsInRadius } from "./market-map.js";
import {
  readMarketInventory,
  marketCoordinates,
} from "./market-data-contract.js";

let marketUser = null;
let marketRole = "guest";
let allListings = [];
let allWanted = [];
let loadStatus = "idle";
let activeResults = [];
let filterTimer = null;
let recordListingActivity = null;
try { recordListingActivity = httpsCallable(functions, "recordListingActivity"); } catch (_) {}

function marketInquiryRequestId() {
  try { return crypto.randomUUID().replace(/-/g, ""); }
  catch (_) { return `${Date.now()}_${Math.random().toString(36).slice(2)}`; }
}

async function recordMarketListingInquiry(item) {
  if (!marketUser || marketRole !== "seeker" || !recordListingActivity || !item?.id) {
    throw new Error("Sign in as a seeker to contact a property listing.");
  }
  const d = item.data || {};
  const ownerId = String(d.ownerId || "").trim();
  if (!ownerId) throw new Error("This listing has no canonical owner.");
  if (ownerId === marketUser.uid) throw new Error("You cannot contact your own listing.");
  return recordListingActivity({
    listingId: String(item.id),
    eventType: "listing_inquiry",
    requestId: marketInquiryRequestId(),
    source: "market_contact"
  });
}

function marketActivityRequestId() {
  try { return crypto.randomUUID().replace(/-/g, ""); }
  catch (_) { return `${Date.now()}_${Math.random().toString(36).slice(2)}`; }
}

function marketDiscoverySessionId() {
  const key = "hf_market_discovery_session";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing && /^[A-Za-z0-9_-]{8,120}$/.test(existing)) return existing;
    const id = marketActivityRequestId();
    sessionStorage.setItem(key, id);
    return id;
  } catch (_) {
    return marketActivityRequestId();
  }
}

const marketImpressionSeen = new Set();
let marketImpressionObserver = null;
const marketImpressionTimers = new Map();

function recordMarketListingImpression(item, card) {
  if (!marketUser || marketRole !== "seeker" || !recordListingActivity || !item?.id || !card) return;
  if (card.dataset.kind !== "property") return;
  const listingId = String(item.id);
  const sessionId = marketDiscoverySessionId();
  const seenKey = `${sessionId}:${listingId}`;
  if (marketImpressionSeen.has(seenKey)) return;
  marketImpressionSeen.add(seenKey);
  recordListingActivity({
    listingId,
    eventType: "listing_impression",
    requestId: marketActivityRequestId(),
    sessionId,
    source: "market_card_impression"
  }).catch(() => {
    // Allow a transient failure to be retried during this session without
    // turning repeated observer callbacks into duplicate server events.
    marketImpressionSeen.delete(seenKey);
  });
}

function bindMarketImpressionObserver(rail, list) {
  if (!rail || !marketUser || marketRole !== "seeker") return;
  if (marketImpressionObserver) marketImpressionObserver.disconnect();
  marketImpressionObserver = null;
  marketImpressionTimers.forEach(timer => clearTimeout(timer));
  marketImpressionTimers.clear();

  if (typeof IntersectionObserver !== "function") return;
  const byId = new Map(list.filter(x => x?.id).map(x => [String(x.id), x]));
  marketImpressionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const card = entry.target;
      const item = byId.get(String(card.dataset.id));
      if (!item || card.dataset.kind !== "property") return;
      const existingTimer = marketImpressionTimers.get(card);
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (existingTimer) return;
        const timer = setTimeout(() => {
          marketImpressionTimers.delete(card);
          recordMarketListingImpression(item, card);
        }, 500);
        marketImpressionTimers.set(card, timer);
      } else if (existingTimer) {
        clearTimeout(existingTimer);
        marketImpressionTimers.delete(card);
      }
    });
  }, { root: rail, threshold: [0.5] });

  rail.querySelectorAll('.market-card[data-kind="property"]').forEach(card => marketImpressionObserver.observe(card));
}

function recordMarketListingView(item, kind) {
  if (kind !== "property" || !marketUser || !recordListingActivity || !item?.id) return;
  recordListingActivity({ listingId: String(item.id), eventType: "listing_view", requestId: marketActivityRequestId() })
    .catch(() => {});
}

const $ = (id) => document.getElementById(id);
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = (n) => n == null || n === "" ? "—" : "₱" + Number(n).toLocaleString();

function coords(item) {
  return marketCoordinates(item);
}
function marketDataOf(item) { return item?.marketData || item?.data || {}; }
function listingPriceRange(item) {
  const m = marketDataOf(item);
  return {
    min: Number.isFinite(Number(m.priceMin)) ? Number(m.priceMin) : null,
    max: Number.isFinite(Number(m.priceMax)) ? Number(m.priceMax) : null
  };
}
function listingTypeFrom(item) {
  const m = marketDataOf(item);
  return m.type || "Property";
}
function wantedTypeFrom(item) {
  const m = marketDataOf(item);
  return m.type || "Wanted request";
}
function listingAmenitiesOf(item) {
  return normalizeAmenityList(marketDataOf(item).amenities || []);
}
function firstListingImage(data = {}) {
  const candidates = [
    ...(Array.isArray(data.images) ? data.images : []),
    data.coverImage, data.coverUrl, data.imageUrl, data.photoUrl
  ];
  const first = candidates.find(Boolean);
  if (typeof first === "string") return first;
  if (first && typeof first === "object") return first.url || first.src || first.downloadURL || first.path || "";
  return "";
}
function searchText(item) {
  const m = marketDataOf(item);
  const raw = item?.data || {};
  return [
    m.title, m.description, m.type,
    raw.name, raw.propertyTitle, raw.wantedTitle,
    raw.address, raw.location, raw.city, raw.area, raw.barangay,
    raw.preferred_area, m.amenities?.join(" ")
  ].filter(Boolean).join(" ").toLowerCase();
}
function matchesSearch(item, q) { return !q || searchText(item).includes(q.toLowerCase()); }
function matchesType(item, type) {
  if (!type) return true;
  return String(marketDataOf(item).type || "").toLowerCase() === type.toLowerCase();
}
function overlapsRange(item, filterMin, filterMax) {
  if (!filterMin && !filterMax) return true;
  const r = listingPriceRange(item);
  if (r.min == null && r.max == null) return false;
  const lo = r.min ?? r.max;
  const hi = r.max ?? r.min;
  if (filterMin && hi < filterMin) return false;
  if (filterMax && lo > filterMax) return false;
  return true;
}

const filterState = {
  q: "", type: "", wantedType: "", priceMin: 0, priceMax: 0, budgetMin: 0, budgetMax: 0, amenities: [], wantedAmenities: []
};

function roleIsProperty() { return marketRole === "seeker"; }
function currentPool() {
  if (marketRole === "seeker") return allListings;
  if (marketRole === "owner") return allWanted;
  return [];
}
function currentKind() {
  return marketRole === "seeker" ? "property" : "wanted";
}

function renderAmenityFilters() {
  const normal = $("filter-amenities-chips");
  const wanted = $("filter-wanted-amenities-chips");
  const html = AMENITIES.map(a => `<label class="market-amenity-chip" data-group="${a.group}" data-amenity="${a.value}"><input type="checkbox" name="filter_amenity" value="${a.value}"> ${escapeHtml(a.label)}</label>`).join("");
  if (normal) normal.innerHTML = html;
  if (wanted) wanted.innerHTML = html.replaceAll('filter_amenity', 'filter_wanted_amenity');
  const propertySelect = $("filter-type");
  const wantedSelect = $("filter-wanted-type");
  const options = propertyTypeFilterOptionsHtml();
  if (propertySelect) propertySelect.innerHTML = options;
  if (wantedSelect) wantedSelect.innerHTML = options;
}
function propertyTypeGroup(type) {
  return PROPERTY_TYPES.find(t => t.value === type)?.group || "";
}
function syncAmenityVisibility() {
  const type = roleIsProperty() ? filterState.type : filterState.wantedType;
  const group = propertyTypeGroup(type);
  const selector = roleIsProperty() ? "#filter-amenities-chips .market-amenity-chip" : "#filter-wanted-amenities-chips .market-amenity-chip";
  document.querySelectorAll(selector).forEach(el => {
    const g = el.dataset.group;
    el.hidden = !!group && g !== "general" && g !== group;
    // Preserve selected values when the type changes; hidden chips remain part
    // of filterState instead of being silently cleared.
  });
  document.querySelectorAll(roleIsProperty() ? "#filter-wanted-amenities-chips .market-amenity-chip" : "#filter-amenities-chips .market-amenity-chip").forEach(el => { el.hidden = true; });
}
function selected(name) { return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(x => x.value); }
function readFilters() {
  filterState.q = ($( "market-search-q")?.value || "").trim();
  filterState.type = $("filter-type")?.value || "";
  filterState.wantedType = $("filter-wanted-type")?.value || "";
  filterState.priceMin = Number($("filter-price-min")?.value) || 0;
  filterState.priceMax = Number($("filter-price-max")?.value) || 0;
  filterState.budgetMin = Number($("filter-budget-min")?.value) || 0;
  filterState.budgetMax = Number($("filter-budget-max")?.value) || 0;
  filterState.amenities = selected("filter_amenity");
  filterState.wantedAmenities = selected("filter_wanted_amenity");
  syncAmenityVisibility();
  return filterState;
}
function filterProperty(list, f) {
  return list.filter(item => {
    if (!matchesSearch(item, f.q) || !matchesType(item, f.type)) return false;
    if (!overlapsRange(item, f.priceMin, f.priceMax)) return false;
    const have = new Set(listingAmenitiesOf(item));
    return !f.amenities.length || f.amenities.every(a => have.has(a));
  });
}
function filterWanted(list, f) {
  return list.filter(item => {
    if (!matchesSearch(item, f.q) || !matchesType(item, f.wantedType)) return false;
    if (!overlapsRange(item, f.budgetMin, f.budgetMax)) return false;
    const have = new Set(listingAmenitiesOf(item));
    return !f.wantedAmenities.length || f.wantedAmenities.every(a => have.has(a));
  });
}
function cardMarkup(item, kind) {
  const d = item.data || {};
  const m = marketDataOf(item);
  const property = kind === "property";
  const title = m.title || (property ? listingTypeFrom(item) : wantedTypeFrom(item));
  const type = property ? listingTypeFrom(item) : wantedTypeFrom(item);
  const description = m.description || (property ? "No description provided." : "No request description provided.");
  const range = listingPriceRange(item);
  const price = property ? (range.min != null && range.max != null && range.min !== range.max ? `${money(range.min)}–${money(range.max)}` : money(range.min ?? range.max)) : (range.max != null ? "Up to " + money(range.max) : range.min != null ? "From " + money(range.min) : "Budget open");
  const loc = d.city || d.area || d.barangay || d.preferred_area || d.address || "Location not specified";
  const image = firstListingImage(d);
  return `<article class="market-card" data-id="${escapeHtml(item.id)}" data-kind="${kind}">
    ${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">` : `<div class="market-card-ph"><i class="bx bx-home-alt-2"></i></div>`}
    <div class="market-card-body"><span class="market-card-type">${escapeHtml(type)}</span><h3>${escapeHtml(title)}</h3><p class="market-card-description">${escapeHtml(description)}</p><div class="market-card-meta"><span>${escapeHtml(loc)}</span><strong>${escapeHtml(price)}</strong></div></div>
  </article>`;
}
function renderCards(list) {
  activeResults = list.slice();
  const rail = $("market-card-rail");
  const count = $("market-discovery-count");
  if (count) count.textContent = `${list.length} card${list.length === 1 ? "" : "s"}`;
  if (!rail) return;
  if (!marketUser) { rail.innerHTML = ""; return; }
  if (!list.length) { rail.innerHTML = ""; return; }

  rail.innerHTML = list.map(x => cardMarkup(x, currentKind())).join("");

  rail.querySelectorAll(".market-card").forEach(card => {
    card.setAttribute("aria-label", "Open listing");
    card.setAttribute("tabindex", "0");

    const activate = () => {
      rail.querySelectorAll(".market-card.is-selected").forEach(c => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      rail.querySelectorAll(".market-card").forEach(c => c.setAttribute("aria-current", c === card ? "true" : "false"));
      try { card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); } catch (_) {}
      openCard(card.dataset.id, card.dataset.kind);
    };

    card.addEventListener("click", activate);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });

  // Patch 19: an impression is emitted only after a property card is at least
  // 50% visible inside the discovery rail for 500ms. Opening the card remains
  // the separate `listing_view` event.
  bindMarketImpressionObserver(rail, list);
}

function descriptionOf(d) { return d.description || d.notes || d.summary || "No description provided."; }
async function toggleMarketSave(item, kind) {
  if (!marketUser) throw new Error("Sign in to save this discovery.");
  const requestId = `market-save-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const fnName = kind === "property" ? "toggleListingSave" : "toggleWantedSave";
  const payload = kind === "property"
    ? { listingId: String(item.id), action: "save", requestId }
    : { wantedId: String(item.id), action: "save", requestId };
  const fn = httpsCallable(functions, fnName);
  return fn(payload);
}

function openCard(id, kind) {
  try {
    lastFocusedMarketCard = document.querySelector(`.market-card[data-id="${CSS.escape(String(id))}"]`);
  } catch (_) { lastFocusedMarketCard = null; }
  try { window.focusMarketResult?.(id); } catch (_) {}
  const source = kind === "property" ? allListings : allWanted;
  let item = source.find(x => x.id === id);

  if (!item) return;
  const d = item.data || {};
  const m = marketDataOf(item);
  activeModalItem = item;
  activeModalKind = kind;
  recordMarketListingView(item, kind);
  const modal = $("market-card-modal");
  const media = $("market-card-expanded-media");
  const image = firstListingImage(d);
  if (media) media.innerHTML = image ? `<img src="${escapeHtml(image)}" alt="">` : `<div class="market-card-expanded-placeholder"><i class="bx bx-home-alt-2"></i></div>`;
  $("market-card-expanded-kind").textContent = kind === "property" ? "Property listing" : "Wanted listing";
  const range = listingPriceRange(item);
  $("market-card-expanded-title").textContent = m.title || (kind === "property" ? listingTypeFrom(item) : wantedTypeFrom(item));
  $("market-card-expanded-description").textContent = m.description || descriptionOf(d);
  $("market-card-expanded-price").textContent = kind === "property"
    ? (range.min != null && range.max != null && range.min !== range.max ? `${money(range.min)}–${money(range.max)}` : money(range.min ?? range.max))
    : (range.max != null ? "Up to " + money(range.max) : range.min != null ? "From " + money(range.min) : "Budget open");
  $("market-card-expanded-meta").textContent = `${kind === "property" ? listingTypeFrom(item) : wantedTypeFrom(item)} · ${d.city || d.area || d.barangay || d.preferred_area || d.address || "Location not specified"}`;
  const contactActions = $("market-card-expanded-actions");
  const saveBtn = $("market-card-save-btn");
  const contactBtn = $("market-card-contact-btn");
  const canSave = !!marketUser && (
    (kind === "property" && (marketRole === "seeker" || marketRole === "broker") && String(d.ownerId || "") !== marketUser?.uid) ||
    (kind === "wanted" && (marketRole === "owner" || marketRole === "broker") && String(d.seekerId || d.uid || d.userId || "") !== marketUser?.uid)
  );
  if (contactActions) contactActions.hidden = !canSave && !(kind === "property" && marketRole === "seeker" && String(d.ownerId || "") !== marketUser?.uid);
  if (saveBtn) {
    saveBtn.hidden = !canSave;
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i class="bx bx-bookmark"></i><span>Save</span>`;
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      try {
        await toggleMarketSave(item, kind);
        saveBtn.innerHTML = `<i class="bx bx-check"></i><span>Saved</span>`;
      } catch (e) {
        alert(e?.message || "Could not save this discovery.");
        saveBtn.disabled = false;
      }
    };
  }
  if (contactBtn) {
    contactBtn.hidden = !(kind === "property" && marketRole === "seeker" && String(d.ownerId || "") !== marketUser?.uid);
  }
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  modal.setAttribute("aria-modal", "true");
  document.body.classList.add("market-card-modal-open");
  requestAnimationFrame(() => {
    try { $("market-card-modal-close")?.focus(); } catch (_) {}
  });
}
let lastFocusedMarketCard = null;
let activeModalItem = null;
let activeModalKind = null;
function closeCard() {
  const m = $("market-card-modal");
  if (!m) return;
  m.hidden = true;
  m.setAttribute("aria-hidden", "true");
  document.body.classList.remove("market-card-modal-open");
  try { lastFocusedMarketCard?.focus(); } catch (_) {}
  lastFocusedMarketCard = null;
  activeModalItem = null;
  activeModalKind = null;
}

function updateFilterChrome() {
  const f = filterState;
  const n = [f.q,f.type,f.wantedType,f.priceMin,f.priceMax,f.budgetMin,f.budgetMax,...f.amenities,...f.wantedAmenities].filter(Boolean).length;
  const badge = $("market-filter-badge"); const clear = $("market-filter-clear");
  if (badge) { badge.textContent = String(n); badge.hidden = n === 0; }
  if (clear) clear.hidden = n === 0;
  const count = $("market-filter-count");
  if (count) { count.hidden = !marketUser; count.textContent = `${activeResults.length} matched`; }
  try { window.syncMarketStatsSummary?.(); } catch (_) {}
}
function setFilterOpen(open) {
  if (!marketUser) open = false;
  const root = $("market-filters"); const panel = $("market-filter-panel"); const btn = $("market-filter-toggle");
  if (root) root.hidden = !open; if (panel) panel.hidden = !open; if (btn) btn.setAttribute("aria-expanded", String(open));
}
function clearFilters() {
  $("market-search-q").value = "";
  ["filter-type","filter-wanted-type"].forEach(id => { if ($(id)) $(id).value = ""; });
  ["filter-price-min","filter-price-max","filter-budget-min","filter-budget-max"].forEach(id => { if ($(id)) $(id).value = ""; });
  document.querySelectorAll('input[name="filter_amenity"], input[name="filter_wanted_amenity"]').forEach(x => x.checked = false);
  readFilters(); applyDiscovery();
}

function pinScoped(list) {
  const withCoords = list.filter(x => coords(x));
  const ids = filterIdsInRadius(withCoords);
  if (ids === null) return { pinActive: false, inRadius: [], total: list.length };
  return { pinActive: true, inRadius: withCoords.filter(x => ids.has(x.id)), total: list.length };
}
function applyDiscovery() {
  if (!marketUser) { activeResults = []; renderCards([]); updateFilterChrome(); return; }
  readFilters();
  const scoped = pinScoped(currentPool());
  if (!scoped.pinActive) { renderCards([]); showEmpty("Set a pin to discover cards inside its radius.", "Drop pin"); updateFilterChrome(); window.renderMarketResultMarkers?.([]); return; }
  let filtered;
  filtered = currentKind() === "property" ? filterProperty(scoped.inRadius, filterState) : filterWanted(scoped.inRadius, filterState);
  renderCards(filtered);
  showEmpty(filtered.length ? "" : "No cards match this pin, radius and filters.", filtered.length ? "" : "Clear filters");
  updateFilterChrome();
  window.renderMarketResultMarkers?.(filtered);
}
function showEmpty(message, action) {
  const el = $("market-empty"); if (!el) return;
  if (!message) { el.hidden = true; el.innerHTML = ""; return; }
  el.hidden = false; el.innerHTML = `<div class="market-empty-inner"><strong>${escapeHtml(message)}</strong>${action ? `<button type="button" class="market-empty-cta" data-empty-action="${escapeHtml(action)}">${escapeHtml(action)}</button>` : ""}</div>`;
}

// Patch 27 compatibility anchor: the old readCollection("propertyListings") /
// readCollection("wantedListings") reader is intentionally replaced by the
// single canonical readMarketInventory() boundary. Historical compatibility:
// normalizeMarketRecords(await readCollection("propertyListings"), "property") and
// normalizeMarketRecords(await readCollection("wantedListings"), "wanted") are no longer runtime paths.
async function loadData() {
  if (!marketUser) { allListings = []; allWanted = []; loadStatus = "loaded"; applyDiscovery(); return; }
  loadStatus = "loading";
  try {
    const result = await readMarketInventory(db, marketRole);
    allListings = result.kind === "property" ? result.records : [];
    allWanted = result.kind === "wanted" ? result.records : [];
    loadStatus = "loaded";
  } catch (e) {
    console.warn("Market data load", e);
    loadStatus = "error";
  }
  applyDiscovery();
}
function resolveMarketRole(profile) {
  const raw = canonicalRoleFromData(profile, "seeker") || "seeker";
  if (normalizeCanonicalRole(raw) === "owner") return "owner";
  if (["broker","agent"].includes(raw)) return "broker";
  return "seeker";
}
function cacheRole(role) { try { if (role && role !== "guest") sessionStorage.setItem("hf_account_role", role); else sessionStorage.removeItem("hf_account_role"); } catch (_) {} }
function releaseBoot() { document.body.classList.remove("market-boot-pending"); }
function syncRoleUI() {
  document.body.dataset.marketRole = marketRole;
  const seeker = marketRole === "seeker";
  $("market-filter-type-wrap").hidden = !seeker;
  $("market-price-min-wrap").hidden = !seeker;
  $("market-price-max-wrap").hidden = !seeker;
  $("filter-amenities").hidden = !seeker;
  $("market-filter-wanted-type-wrap").hidden = seeker;
  $("market-budget-min-wrap").hidden = seeker;
  $("market-budget-max-wrap").hidden = seeker;
  $("filter-wanted-amenities").hidden = seeker;
  $("market-discovery-title").textContent = seeker ? "Properties near your current pin" : "Wanted requests near your current pin";
  $("market-filter-role-note").textContent = seeker ? "Seeker Market: property listings." : "Owner Market: wanted listings.";
}
function bindCardSwipeDismiss() {
  const modal = $("market-card-modal");
  const card = modal?.querySelector(".market-card-expanded");
  if (!modal || !card || card.dataset.swipeBound === "1") return;
  card.dataset.swipeBound = "1";
  let startX = 0, startY = 0, tracking = false;
  card.addEventListener("touchstart", e => {
    const t = e.touches?.[0]; if (!t) return;
    startX = t.clientX; startY = t.clientY; tracking = true;
  }, { passive: true });
  card.addEventListener("touchend", e => {
    if (!tracking) return; tracking = false;
    const t = e.changedTouches?.[0]; if (!t) return;
    const dx = t.clientX - startX, dy = t.clientY - startY;
    // Horizontal swipe = dismiss. A strong downward swipe also dismisses,
    // while normal vertical scrolling remains available inside the card.
    if ((Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.2) || (dy > 110 && Math.abs(dy) > Math.abs(dx) * 1.2)) closeCard();
  }, { passive: true });
}

function bindModalAccessibility() {
  const modal = $("market-card-modal");
  if (!modal || modal.dataset.a11yBound === "1") return;
  modal.dataset.a11yBound = "1";
  modal.addEventListener("keydown", e => {
    if (e.key !== "Tab" || modal.hidden) return;
    const focusable = [...modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el => !el.hidden && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

function bindUI() {
  renderAmenityFilters(); syncRoleUI(); bindCardSwipeDismiss(); bindModalAccessibility();
  $("market-filter-toggle")?.addEventListener("click", () => setFilterOpen($("market-filter-toggle").getAttribute("aria-expanded") !== "true"));
  $("market-filter-clear")?.addEventListener("click", clearFilters);
  $("market-search-q")?.addEventListener("input", () => { clearTimeout(filterTimer); filterTimer = setTimeout(applyDiscovery, 180); });
  ["filter-type","filter-wanted-type"].forEach(id => $(id)?.addEventListener("change", applyDiscovery));
  ["filter-price-min","filter-price-max","filter-budget-min","filter-budget-max"].forEach(id => $(id)?.addEventListener("input", () => { clearTimeout(filterTimer); filterTimer = setTimeout(applyDiscovery, 180); }));
  $("market-filters")?.addEventListener("change", e => { if (e.target.matches('input[type="checkbox"]')) applyDiscovery(); });
  $("market-card-modal-close")?.addEventListener("click", closeCard);
  $("market-card-modal")?.addEventListener("click", e => {
    if (e.target.matches("[data-card-dismiss]") || e.target === $("market-card-modal")) closeCard();
  });
  $("market-card-contact-btn")?.addEventListener("click", async () => {
    const btn = $("market-card-contact-btn");
    if (!activeModalItem || activeModalKind !== "property" || !marketUser) return;
    btn.disabled = true;
    try {
      const d = activeModalItem.data || {};
      const ownerId = String(d.ownerId || "").trim();
      if (!ownerId) throw new Error("This listing has no canonical owner.");
      await recordMarketListingInquiry(activeModalItem);
      sessionStorage.setItem("hf_pending_contact", JSON.stringify({
        propertyId: String(activeModalItem.id),
        ownerId,
        propertyTitle: marketDataOf(activeModalItem).title || listingTypeFrom(activeModalItem),
        dealType: "rent",
        amount: listingPriceRange(activeModalItem).min ?? listingPriceRange(activeModalItem).max ?? null
      }));
      closeCard();
      location.href = "profile.html#contracts";
    } catch (e) {
      console.warn("Market listing inquiry", e);
      alert(e.message || "Could not contact this listing.");
      btn.disabled = false;
    }
  });
  document.addEventListener("keydown", e => {
    const modal = $("market-card-modal");
    if (e.key === "Escape" && modal && !modal.hidden) closeCard();
  });
  $("market-empty")?.addEventListener("click", e => { const b = e.target.closest("[data-empty-action]"); if (b?.dataset.emptyAction === "Clear filters") clearFilters(); if (b?.dataset.emptyAction === "Drop pin") $("market-pin-btn")?.click(); });
}

async function boot() {
  marketUser = await authReady.catch(() => null);
  if (marketUser) document.body.classList.add("mp-signed-in"); else document.body.classList.add("mp-guest");
  marketRole = marketUser ? await getRole(marketUser) : "guest";
  cacheRole(marketRole);
  if (marketRole === "broker") {
    location.replace("broker-hq.html");
    return;
  }
  bindUI(); releaseBoot();
  await initMarketMap();
  document.addEventListener("hf:market-pin", (e) => {
    // The selected pin is the shared context for radius + filters + cards.
    // A pin event always invalidates the visible discovery set.
    applyDiscovery();
  });
  document.addEventListener("hf:market-pin-kind", (e) => {
    applyDiscovery();
  });
  await loadData();
}
async function getRole(user) { try { const s = await getDoc(doc(db,"users",user.uid)); return s.exists() ? resolveMarketRole(s.data()) : "seeker"; } catch (_) { return "seeker"; } }
window.hfMarketRequireAuth = () => { location.href = "login.html?next=" + encodeURIComponent("market.html"); };

try {
  document.addEventListener("hf:market-card-focus", e => {
    const id = String(e.detail?.id ?? "");
    const item = activeResults.find(x => String(x.id) === id);
    const rail = $("market-card-rail");
    if (rail) {
      rail.querySelectorAll(".market-card.is-selected").forEach(c => c.classList.remove("is-selected"));
      const card = rail.querySelector(`.market-card[data-id="${CSS.escape(id)}"]`);
      if (card) {
        card.classList.add("is-selected");
        rail.querySelectorAll(".market-card").forEach(c => c.setAttribute("aria-current", c === card ? "true" : "false"));
        try { card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); } catch (_) {}
      }
    }
    if (item) openCard(item.id, currentKind());
  });
} catch (_) {}
authReady.then(u => { document.querySelectorAll("[data-auth=guest]").forEach(el => el.hidden = !!u); document.querySelectorAll("[data-auth=user]").forEach(el => el.hidden = !u); }).catch(() => {});
boot();
