/**
 * listing-catalog.js — single source for property types + amenities.
 * Phase 1 SoT: listing form checkboxes and market filters MUST use these values.
 * Labels may differ slightly in UI; `value` keys are the wire format stored on
 * propertyListings.amenities[] and used by market hard-filters.
 */
export const PROPERTY_TYPES = [
  { value: "condo_studio", label: "Condo / Studio", group: "residential" },
  { value: "bedspace_dorm", label: "Bedspace / Dorm", group: "residential" },
  { value: "townhouse", label: "Townhouse", group: "residential" },
  { value: "house_lot", label: "House & lot", group: "residential" },
  { value: "office_fitted", label: "Office", group: "commercial" },
  { value: "coworking_desk", label: "Coworking", group: "commercial" },
  { value: "retail_store", label: "Retail", group: "commercial" },
  { value: "warehouse", label: "Warehouse", group: "industrial" },
  { value: "industrial_lot", label: "Industrial lot", group: "industrial" },
  { value: "raw_land", label: "Raw land", group: "industrial" },
];

/** @type {{ value: string, label: string, group: string }[]} */
export const AMENITIES = [
  // general
  { value: "wifi", label: "Wi‑Fi", group: "general" },
  { value: "aircon", label: "Aircon", group: "general" },
  { value: "parking", label: "Parking", group: "general" },
  { value: "security", label: "Security", group: "general" },
  { value: "cctv", label: "CCTV", group: "general" },
  { value: "power_backup", label: "Backup power", group: "general" },
  { value: "water_included", label: "Water incl.", group: "general" },
  { value: "gated", label: "Gated entry", group: "general" },
  { value: "access_24h", label: "24h access", group: "general" },
  // residential
  { value: "furnished", label: "Furnished", group: "residential" },
  { value: "semi_furnished", label: "Semi-furnished", group: "residential" },
  { value: "kitchen", label: "Kitchen", group: "residential" },
  { value: "laundry", label: "Laundry", group: "residential" },
  { value: "pets", label: "Pets OK", group: "residential" },
  { value: "elevator", label: "Elevator", group: "residential" },
  { value: "balcony", label: "Balcony", group: "residential" },
  // commercial
  { value: "reception", label: "Reception", group: "commercial" },
  { value: "meeting_room", label: "Meeting room", group: "commercial" },
  { value: "fit_out", label: "Fit-out", group: "commercial" },
  { value: "fiber_ready", label: "Fiber ready", group: "commercial" },
  { value: "display_window", label: "Display window", group: "commercial" },
  { value: "street_frontage", label: "Street frontage", group: "commercial" },
  // industrial
  { value: "loading_bay", label: "Loading bay", group: "industrial" },
  { value: "loading_area", label: "Loading area", group: "industrial" },
  { value: "truck_access", label: "Truck access", group: "industrial" },
  { value: "high_clearance", label: "High clearance", group: "industrial" },
  { value: "three_phase_power", label: "3-phase power", group: "industrial" },
  { value: "fire_sprinkler", label: "Fire sprinkler", group: "industrial" },
  { value: "racking_ok", label: "Racking OK", group: "industrial" },
  { value: "existing_racking", label: "Existing racking", group: "industrial" },
  { value: "pallet_ready", label: "Pallet ready", group: "industrial" },
  { value: "yard_space", label: "Yard space", group: "industrial" },
  { value: "own_meter", label: "Own meter", group: "industrial" },
];

export const AMENITY_VALUES = new Set(AMENITIES.map((a) => a.value));
export const PROPERTY_TYPE_VALUES = new Set(PROPERTY_TYPES.map((t) => t.value));

/** Normalize stored amenity tokens to catalog values (legacy aliases). */
export function normalizeAmenityToken(raw) {
  const s = String(raw || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (AMENITY_VALUES.has(s)) return s;
  const aliases = {
    wi_fi: "wifi",
    "wi-fi": "wifi",
    internet: "wifi",
    pet: "pets",
    pet_friendly: "pets",
    air_con: "aircon",
    "air-con": "aircon",
    air_conditioning: "aircon",
    backup_power: "power_backup",
    generator: "power_backup",
    water: "water_included",
    water_incl: "water_included",
  };
  return aliases[s] || s;
}

export function normalizeAmenityList(raw) {
  let list = [];
  if (Array.isArray(raw)) list = raw;
  else if (typeof raw === "string") list = raw.split(/[,|]/).map((x) => x.trim()).filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const n = normalizeAmenityToken(item);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/**
 * Build amenity filter chips HTML for market (name=filter_amenity).
 * @param {"all"|"general"|"residential"|"commercial"|"industrial"} group
 */
export function amenitiesFilterHtml(group = "all") {
  const items =
    group === "all" ? AMENITIES : AMENITIES.filter((a) => a.group === group || a.group === "general");
  return items
    .map(
      (a) =>
        `<label class="market-amenity-chip"><input type="checkbox" name="filter_amenity" value="${a.value}"> ${a.label}</label>`
    )
    .join("\n");
}

export function propertyTypeFilterOptionsHtml() {
  const groups = [
    { key: "residential", label: "Residential" },
    { key: "commercial", label: "Commercial" },
    { key: "industrial", label: "Industrial" },
  ];
  let html = `<option value="">Any type</option>`;
  for (const g of groups) {
    html += `<optgroup label="${g.label}">`;
    for (const t of PROPERTY_TYPES.filter((x) => x.group === g.key)) {
      html += `<option value="${t.value}">${t.label}</option>`;
    }
    html += `</optgroup>`;
  }
  return html;
}
