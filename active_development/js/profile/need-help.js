/* Patch 21 — Need Help role cleanup
 * Two types only → details → review → assistanceRequests
 * list_property redirects to List Property (₱99.99 pay-at-submit path)
 */
import { user, db } from "./core.js";
import { getRole } from "./role.js";
import { activateTab } from "./tabs.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const TYPE_META = {
  find_property: {
    title: "Find a Property",
    sub: "Help me find something"
  },
  list_property: {
    title: "List My Property",
    sub: "Broker help listing · pay ₱99.99 on List Property"
  },
};

/** Group B — tile visibility by existing account roles (no new groups). */
const TYPE_ROLES = {
  find_property: ["seeker"],
  list_property: ["owner"],
};

let cachedNeedHelpRole = null;

async function resolveNeedHelpRole() {
  if (cachedNeedHelpRole) return cachedNeedHelpRole;
  try {
    cachedNeedHelpRole = await getRole();
  } catch (_) {
    cachedNeedHelpRole = "seeker";
  }
  return cachedNeedHelpRole;
}

function roleMayUseHelpType(role, type) {
  const allowed = TYPE_ROLES[type] || [];
  return allowed.includes(role);
}

async function applyNeedHelpRoleVisibility() {
  const role = await resolveNeedHelpRole();
  document.querySelectorAll(".need-help-tile[data-help-type]").forEach((tile) => {
    const type = tile.getAttribute("data-help-type");
    const ok = roleMayUseHelpType(role, type);
    tile.hidden = !ok;
    tile.disabled = !ok;
    tile.setAttribute("aria-hidden", ok ? "false" : "true");
    tile.classList.toggle("is-role-hidden", !ok);
  });
  const tiles = $("need-help-step-1")?.querySelector(".need-help-tiles");
  if (tiles) {
    const any = [...tiles.querySelectorAll(".need-help-tile")].some((t) => !t.hidden);
    let empty = tiles.querySelector(".need-help-role-empty");
    if (!any) {
      if (!empty) {
        empty = document.createElement("p");
        empty.className = "field-hint need-help-role-empty";
        empty.textContent = "No help types available for your account role.";
        tiles.appendChild(empty);
      }
      empty.hidden = false;
    } else if (empty) {
      empty.hidden = true;
    }
  }
}

let selectedType = null;
let draft = {};
let selectedListing = null;
let assetCache = [];

function $(id) {
  return document.getElementById(id);
}

function setStep(n) {
  [1, 2, 3].forEach((i) => {
    const el = $(`need-help-step-${i}`);
    if (el) el.hidden = i !== n;
  });
  document.querySelectorAll("#need-help-progress .nh-step").forEach((s) => {
    const step = Number(s.getAttribute("data-nh-step"));
    s.classList.toggle("is-active", step === n);
    s.classList.toggle("is-done", step < n);
  });
  const prog = $("need-help-progress");
  if (prog) prog.setAttribute("aria-hidden", n === 1 ? "true" : "false");
}

function showTypeFields(type) {
  document.querySelectorAll(".nh-fields").forEach((block) => {
    const forTypes = (block.getAttribute("data-for") || "").split(",");
    block.hidden = !forTypes.includes(type);
  });
  const budget = $("nh-budget-block");
  if (budget) {
    // list_property uses fixed fee on listing form — no range here
    budget.hidden = type === "list_property";
    $("nh_budget_min")?.toggleAttribute("required", type !== "list_property");
    $("nh_budget_max")?.toggleAttribute("required", type !== "list_property");
  }
}


/** Types that use an existing listing/wanted card for pin + broker locate (Group E). */
function typeNeedsAssetCard(type) {
  return type === "list_property";
}

function extractPin(data) {
  if (!data || typeof data !== "object") return null;
  if (data.lat != null && data.lng != null) return { lat: Number(data.lat), lng: Number(data.lng) };
  if (data.location?.lat != null) return { lat: Number(data.location.lat), lng: Number(data.location.lng) };
  if (data.pin?.lat != null) return { lat: Number(data.pin.lat), lng: Number(data.pin.lng) };
  if (data.coordinates?.lat != null) return { lat: Number(data.coordinates.lat), lng: Number(data.coordinates.lng) };
  if (data.mapPin?.lat != null) return { lat: Number(data.mapPin.lat), lng: Number(data.mapPin.lng) };
  return null;
}

function listingTitle(data) {
  return data.listing_title || data.title || data.address || "Listing";
}

function listingStatus(data) {
  return String(data.status || "active").toLowerCase();
}

async function loadAssetCards(type) {
  const list = $("nh-asset-list");
  const picker = $("nh-asset-picker");
  if (!list || !picker || !user) return;

  selectedListing = null;
  if ($("nh_listing_id")) $("nh_listing_id").value = "";
  if ($("nh_listing_col")) $("nh_listing_col").value = "";
  if ($("nh_lat")) $("nh_lat").value = "";
  if ($("nh_lng")) $("nh_lng").value = "";

  if (!typeNeedsAssetCard(type)) {
    picker.hidden = true;
    list.innerHTML = "";
    assetCache = [];
    return;
  }

  picker.hidden = false;
  list.innerHTML = `<p class="field-hint">Loading your cards…</p>`;
  const items = [];

  const cols = type === "find_property"
    ? []
    : ["propertyListings"];

  for (const colName of cols) {
    try {
      const q = query(collection(db, colName), where("ownerId", "==", user.uid), limit(25));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const data = d.data() || {};
        const st = listingStatus(data);
        if (st === "closed" || st === "deleted") return;
        items.push({ id: d.id, col: colName, data });
      });
    } catch (e) {
      console.warn("need-help assets", colName, e);
    }
  }

  // Dedupe by id prefer propertyListings
  const seen = new Set();
  assetCache = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    assetCache.push(it);
  }

  if (!assetCache.length) {
    list.innerHTML = `<p class="field-hint">No open listing cards yet. Post a listing first (List Property), then request help on that card.</p>`;
    return;
  }

  list.innerHTML = assetCache
    .map((it) => {
      const pin = extractPin(it.data);
      const help = !!(it.data.needsBrokerHelp || it.data.needs_broker_help);
      const st = listingStatus(it.data);
      return `<button type="button" class="nh-asset-card${help ? " has-help-request" : ""}" role="option" data-id="${it.id}" data-col="${it.col}">
        <span class="nh-asset-title">${escapeHtml(listingTitle(it.data))}</span>
        <span class="nh-asset-meta">${escapeHtml(st)}${pin ? " · pin set" : " · no pin"}${help ? " · help open" : ""}</span>
      </button>`;
    })
    .join("");

  list.querySelectorAll(".nh-asset-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      list.querySelectorAll(".nh-asset-card").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      const id = btn.getAttribute("data-id");
      const col = btn.getAttribute("data-col");
      const row = assetCache.find((x) => x.id === id && x.col === col);
      selectedListing = row || null;
      if ($("nh_listing_id")) $("nh_listing_id").value = id || "";
      if ($("nh_listing_col")) $("nh_listing_col").value = col || "";
      const pin = row ? extractPin(row.data) : null;
      if (pin) {
        if ($("nh_lat")) $("nh_lat").value = String(pin.lat);
        if ($("nh_lng")) $("nh_lng").value = String(pin.lng);
      } else {
        if ($("nh_lat")) $("nh_lat").value = "";
        if ($("nh_lng")) $("nh_lng").value = "";
      }
      const titleEl = $("nh_title");
      if (titleEl && !titleEl.value.trim() && row) {
        titleEl.value = `Help: ${listingTitle(row.data)}`.slice(0, 120);
      }
    });
  });
}

async function selectType(type) {
  if (!TYPE_META[type]) return;
  const role = await resolveNeedHelpRole();
  if (!roleMayUseHelpType(role, type)) {
    alert("This help type is not available for your account role.");
    return;
  }

  // list_property: prefer selecting an existing card (Group E). Optional path to new listing form.
  if (type === "list_property") {
    selectedType = type;
    if ($("nh_type")) $("nh_type").value = type;
    const label = $("nh-type-label");
    if (label) {
      label.innerHTML = `<strong>${TYPE_META[type].title}</strong> — ${TYPE_META[type].sub}
        <button type="button" class="secondary-btn nh-open-new-listing" id="nh-open-new-listing" style="margin-top:8px;">Or open List Property form (new listing · ₱99.99)</button>`;
      label.querySelector("#nh-open-new-listing")?.addEventListener("click", () => {
        activateTab("listing");
        setTimeout(() => {
          const cb = $("needs_broker_help");
          if (cb && !cb.checked) {
            cb.checked = true;
            cb.dispatchEvent(new Event("change", { bubbles: true }));
          }
          $("listing-help-fieldset")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      });
    }
    showTypeFields(type);
    setStep(2);
    await loadAssetCards(type);
    return;
  }

  selectedType = type;
  if ($("nh_type")) $("nh_type").value = type;
  const label = $("nh-type-label");
  if (label) {
    label.innerHTML = `<strong>${TYPE_META[type].title}</strong> — ${TYPE_META[type].sub}`;
  }
  showTypeFields(type);
  setStep(2);
  await loadAssetCards(type);
}

function readForm() {
  const type = selectedType || $("nh_type")?.value;
  const title = String($("nh_title")?.value || "").trim();
  const summary = String($("nh_summary")?.value || "").trim();
  const budgetMin = Number($("nh_budget_min")?.value);
  const budgetMax = Number($("nh_budget_max")?.value);
  const lat = $("nh_lat")?.value !== "" ? Number($("nh_lat").value) : null;
  const lng = $("nh_lng")?.value !== "" ? Number($("nh_lng").value) : null;
  const listingId = String($("nh_listing_id")?.value || selectedListing?.id || "").trim() || null;
  const listingCol = String($("nh_listing_col")?.value || selectedListing?.col || "").trim() || null;

  const extra = {};
  if (type === "find_property") {
    extra.budgetRent = $("nh_budget_rent")?.value
      ? Number($("nh_budget_rent").value)
      : null;
    extra.areaPref = String($("nh_area_pref")?.value || "").trim() || null;
  }

  return {
    type,
    title,
    summary,
    budgetMin: Number.isFinite(budgetMin) ? budgetMin : null,
    budgetMax: Number.isFinite(budgetMax) ? budgetMax : null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    listingId,
    listingCol,
    ...extra
  };
}

function validateDetails(d) {
  if (!d.type || !TYPE_META[d.type]) return "Choose a help type.";
  if (!d.title || d.title.length < 3) return "Add a short title (at least 3 characters).";
  if (!d.summary || d.summary.length < 10) return "Describe what you need (at least 10 characters).";
  if (typeNeedsAssetCard(d.type) && !d.listingId) {
    return "Select a listing card so brokers can locate the pin.";
  }
  if (typeNeedsAssetCard(d.type) && (d.lat == null || d.lng == null)) {
    return "Selected listing has no map pin. Open List Property, set Confirm pin, then try again.";
  }
  if (d.type !== "list_property") {
    if (d.budgetMin == null || d.budgetMax == null) return "Enter a min and max budget (₱).";
    if (d.budgetMin < 0 || d.budgetMax < 0) return "Budget cannot be negative.";
    if (d.budgetMax < d.budgetMin) return "Max budget must be ≥ min budget.";
  }
  if ((d.lat != null) !== (d.lng != null)) return "Provide both latitude and longitude, or leave both empty.";
  return null;
}

function paintReview(d) {
  const box = $("need-help-review");
  if (!box) return;
  const meta = TYPE_META[d.type] || {};
  const rows = [
    ["Type", meta.title || d.type],
    ["Title", d.title],
    ["Details", d.summary],
    ["Budget range", d.budgetMin != null ? `₱${d.budgetMin.toLocaleString()} – ₱${d.budgetMax.toLocaleString()}` : "—"],
  ];
  if (d.areaPref) rows.push(["Area", d.areaPref]);
  if (d.budgetRent != null) rows.push(["Target rent", `₱${Number(d.budgetRent).toLocaleString()}`]);
  if (d.listingId) rows.push(["Listing card", d.listingId]);
  if (d.lat != null) rows.push(["Pin", `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}`]);

  box.innerHTML = `
    <h4>Review your request</h4>
    <p class="field-hint">Brokers will see this in HQ. You can go back to edit.</p>
    <dl class="need-help-review-dl">
      ${rows
        .map(
          ([k, v]) =>
            `<div class="nh-rev-row"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd></div>`
        )
        .join("")}
    </dl>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function submitRequest() {
  if (!user) {
    alert("Sign in required.");
    return;
  }
  const d = draft.type ? draft : readForm();
  const err = validateDetails(d);
  if (err) {
    alert(err);
    setStep(2);
    return;
  }

  const status = $("nh-submit-status");
  const btn = $("nh-submit");
  if (btn) btn.disabled = true;
  if (status) {
    status.hidden = false;
    status.textContent = "Submitting…";
  }

  try {
    const role = (await getRole()) || "seeker";
    const payload = {
      type: d.type,
      helpType: d.type,
      title: d.title,
      summary: d.summary,
      status: "open",
      posterId: user.uid,
      posterRole: role,
      budgetMin: d.budgetMin,
      budgetMax: d.budgetMax,
      lat: d.lat,
      lng: d.lng,
      areaPref: d.areaPref || null,
      budgetRent: d.budgetRent ?? null,
      propertyRef: d.listingId || null,
      propertyId: d.listingId || null,
      listingId: d.listingId || null,
      listingCol: d.listingCol || null,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "assistanceRequests"), payload);

    if (status) status.textContent = "Request submitted. Brokers can claim it in HQ.";
    alert("Your help request is open for brokers.\n\nTrack progress later under Contracts if a broker opens a room.");

    // Reset wizard
    $("need-help-form")?.reset();
    selectedType = null;
    draft = {};
    setStep(1);
  } catch (e) {
    console.error(e);
    alert("Could not submit request:\n" + (e.message || e));
    if (status) status.textContent = "Submit failed — try again.";
  } finally {
    if (btn) btn.disabled = false;
  }
}

function wire() {
  document.querySelectorAll(".need-help-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      if (tile.hidden || tile.disabled) return;
      selectType(tile.getAttribute("data-help-type"));
    });
  });
  applyNeedHelpRoleVisibility().catch(() => {});

  $("nh-back-1")?.addEventListener("click", () => {
    selectedType = null;
    setStep(1);
  });

  $("nh-to-review")?.addEventListener("click", () => {
    const d = readForm();
    const err = validateDetails(d);
    if (err) {
      alert(err);
      return;
    }
    draft = d;
    paintReview(d);
    setStep(3);
  });

  $("nh-back-2")?.addEventListener("click", () => setStep(2));
  $("nh-submit")?.addEventListener("click", () => submitRequest());

  $("nh-use-location")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation not available on this device.");
      return;
    }
    $("nh-use-location").disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if ($("nh_lat")) $("nh_lat").value = String(pos.coords.latitude);
        if ($("nh_lng")) $("nh_lng").value = String(pos.coords.longitude);
        $("nh-use-location").disabled = false;
      },
      () => {
        alert("Could not get location.");
        $("nh-use-location").disabled = false;
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });

  setStep(1);
}

if (document.getElementById("panel-need-help")) {
  wire();
}

document.addEventListener("hf:tab-activated", (e) => {
  if (e.detail?.tab === "need-help") {
    applyNeedHelpRoleVisibility().catch(() => {});
    setStep(selectedType ? 2 : 1);
  }
});
