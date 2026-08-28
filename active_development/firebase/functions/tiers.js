/* ================================ */
/*  TIERS                           */
/* ================================ */
/* Shared tier-calculation engine. Pure functions only -- no        */
/* Firebase imports here on purpose, so this file can be unit       */
/* tested and reused from both the browser and (as a copied,        */
/* kept-in-sync file) from Cloud Functions.                          */
/*                                                                    */
/* See docs/CONTRACT-TIER-SYSTEM.md for the full spec. Every         */
/* threshold below is marked 🔧 DEFAULT in that doc -- change the    */
/* numbers here to match once real values are decided.                */

/* -------- property category grouping -------- */
/* Mirrors the classifications used in js/profile/listing-form.js */

const CATEGORY_OF_CLASSIFICATION = {
    bedspace_dorm: "bedspace",
    room: "residential",
    condo_studio: "residential",
    townhouse: "residential",
    house_lot: "residential",
    office_fitted: "commercial",
    coworking_desk: "commercial",
    retail_store: "commercial",
    warehouse: "industrial",
    industrial_lot: "industrial",
    raw_land: "industrial"
};

const CATEGORIES = ["bedspace", "residential", "commercial", "industrial"];

function categoryOf(classification){
    return CATEGORY_OF_CLASSIFICATION[classification] || null;
}

/* -------- 🔧 DEFAULT contract points (all roles) -------- */
/* Points accrue from completed / partially paid contracts. Same    */
/* schedule applies to seeker, owner, and broker progression.       */

/** Monthly points while a rent/lease/RTO contract is paid. */
const MONTHLY_POINTS_BY_CLASSIFICATION = {
    bedspace_dorm: 10,   // Bedspace
    coworking_desk: 10,  // Flexible desk
    room: 30,            // Room
    townhouse: 30,       // treated as room-scale residential
    condo_studio: 50,    // Condo
    house_lot: 50,       // House
    warehouse: 50,       // Warehouse
    retail_store: 50,    // Retail
    office_fitted: 60,   // Commercial / fitted office
    industrial_lot: 60,  // Lot
    raw_land: 60         // Lot / masterplanned
};

/** One-time bonus when contract type is sale and completes. */
const SALE_COMPLETION_BONUS = 300;

/**
 * Lease / rent-to-own success bonuses by years successfully owned.
 * Checked from highest threshold down.
 * 🔧 DEFAULT years → points
 */
const LEASE_RTO_SUCCESS_BONUSES = [
    { minYears: 18, points: 10000 },
    { minYears: 10, points: 3200 },
    { minYears: 7,  points: 1600 },
    { minYears: 4,  points: 800 },
    { minYears: 2,  points: 500 },
    { minYears: 0,  points: 100 }  // less than 2 years
];

function monthlyPointsForClassification(classification){
    return MONTHLY_POINTS_BY_CLASSIFICATION[classification] || 10;
}

function leaseRtoSuccessBonus(yearsOwned){
    const y = Math.max(0, Number(yearsOwned) || 0);
    for(const row of LEASE_RTO_SUCCESS_BONUSES){
        if(y >= row.minYears) return row.points;
    }
    return 100;
}

/**
 * Points awarded when a contract resolves.
 * @param {object} opts
 * @param {string} opts.classification  property_classification value
 * @param {string} opts.type            sale | rent | lease | rent_to_own
 * @param {number} opts.monthsPaid      months actually paid (cancel → only paid months)
 * @param {string} opts.outcome         completed | cancelled
 * @param {number} [opts.yearsOwned]    for lease/RTO completed ownership span
 */
function contractPoints(opts){
    const classification = opts.classification || "";
    const type = opts.type || "rent";
    const monthsPaid = Math.max(0, Number(opts.monthsPaid) || 0);
    const outcome = opts.outcome || "completed";
    const monthly = monthlyPointsForClassification(classification);

    // Cancelled / completed rent: monthly × months paid only
    let points = monthly * monthsPaid;

    if(outcome === "completed" && type === "sale"){
        points += SALE_COMPLETION_BONUS;
    }

    if(outcome === "completed" && (type === "lease" || type === "rent_to_own")){
        // success ownership bonus (in addition to monthly accrual)
        const years = opts.yearsOwned != null
            ? opts.yearsOwned
            : monthsPaid / 12;
        points += leaseRtoSuccessBonus(years);
    }

    return points;
}

/* -------- 🔧 DEFAULT rank ladders (points thresholds, all roles) -------- */

const SEEKER_TIERS = [
    { name: "Tier 0", min: 0,     icon: "bx-user" },
    { name: "Tier 1", min: 20,    icon: "bx-user-plus" },
    { name: "Tier 2", min: 400,   icon: "bx-badge-check" },
    { name: "Tier 3", min: 4000,  icon: "bx-compass" },
    { name: "Tier 4", min: 8000,  icon: "bx-diamond" },
    { name: "Tier 5", min: 10000, icon: "bx-trophy" }
];

/* Satisfaction still slightly weights owners (optional polish). */
const OWNER_SATISFACTION_WEIGHT = 10;

const OWNER_TIERS = [
    { name: "Tier 0", min: 0,     icon: "bx-home" },
    { name: "Tier 1", min: 20,    icon: "bx-home-heart" },
    { name: "Tier 2", min: 400,   icon: "bx-building" },
    { name: "Tier 3", min: 4000,  icon: "bx-shield-quarter" },
    { name: "Tier 4", min: 8000,  icon: "bx-crown" },
    { name: "Tier 5", min: 10000, icon: "bx-trophy" }
];

/* -------- 🔧 DEFAULT broker tier ladder (score-based) -------- */
/* brokerScore = satisfiedClosures + (rentToOwnRescues * BROKER_RESCUE_BONUS) */

const BROKER_RESCUE_BONUS = 10;

const BROKER_TIERS = [
    { name: "Tier 0", min: 0,     icon: "bx-user" },
    { name: "Tier 1", min: 20,    icon: "bx-user-plus" },
    { name: "Tier 2", min: 400,   icon: "bx-walk" },
    { name: "Tier 3", min: 4000,  icon: "bx-briefcase" },
    { name: "Tier 4", min: 8000,  icon: "bx-shield-quarter" },
    { name: "Tier 5", min: 10000, icon: "bx-trophy" }
];

/* -------- 🔧 DEFAULT long-duration contract bonus (lease / rent-to-own) -------- */

/** @deprecated use contractPoints() monthly rates + LEASE_RTO_SUCCESS_BONUSES */
const DURATION_POINT_MONTHS = 1;
const RENT_TO_OWN_SUCCESS_BONUS = 100; // minimum RTO success (<2y)

/* -------- 🔧 DEFAULT map radius (km) by tier index -------- */

const RADIUS_BY_TIER_KM = [2, 4, 6, 9, 12, 15];

/* -------- 🔧 DEFAULT relocation cooldown (hours) by tier index -------- */

const COOLDOWN_BY_TIER_HOURS = [72, 48, 24, 12, 6, 3];

/* -------- 🔧 DEFAULT boost packages (PHP pricing) -------- */
/* Seekers buy Seeking Boost 1–5. Owners buy Listing Boost 1–5.     */
/* Brokers may purchase from BOTH catalogs (stored under             */
/* boosts/{uid}.seeker and boosts/{uid}.owner independently).        */
/* See docs/Boosting_And_Default_System.md.                          */

/** Base active wanted posts allowed with no seeker boost. */
const BASE_WANTED_ACTIVE_CAP = 1;

/** Base owner listing cap with no listing boost. */
const BASE_OWNER_LISTING_CAP = 1;

/** Base max images per listing with no listing boost. */
const BASE_IMAGES_PER_LISTING = 1;

/**
 * REMOVED product (2026-08-13): à-la-carte Extra Listing Slot.
 * Owner package id 1 ("Extra Slots" on PayPal) is Listing Boost 1 only.
 * Stub kept so old imports do not crash; do not sell this product.
 * @deprecated
 */
const EXTRA_LISTING_SLOT = {
    pricePhp: 0,
    slotsPerPurchase: 0,
    durationDays: 0,
    name: "Removed — use Owner Boost packages",
    retired: true
};


/**
 * Seeking Boost packages (package id 1–5).
 * radiusBonusKm   — added on top of tier radius
 * wantedBonus     — added on top of BASE_WANTED_ACTIVE_CAP
 * cooldownReduceH — hours subtracted from tier cooldown (floor 1h)
 * matchNotices    — wanted-match listing notifications
 * canSave         — marketplace "Save property" unlocked
 * featuredFilters — budget/range controls on featured feed
 */
const SEEKER_BOOST_PACKAGES = {
    /* radiusBonusKm / wantedBonus = cumulative at this level (SOT: +4 km and +1 wanted per level).
       cooldownReduceH progressive; floor 12h enforced in cooldown helpers.
       Match notices = Boost 2+ in spirit; canSave / featuredFilters at higher packs. */
    0: { id: 0, name: "None",            pricePhp: 0,      radiusBonusKm: 0,  wantedBonus: 0, cooldownReduceH: 0,  matchNotices: false, canSave: false, featuredFilters: false },
    1: { id: 1, name: "Wider reach",     pricePhp: 49.99,  radiusBonusKm: 4,  wantedBonus: 1, cooldownReduceH: 0,  matchNotices: false, canSave: false, featuredFilters: false },
    2: { id: 2, name: "Area Scout",      pricePhp: 99.99,  radiusBonusKm: 8,  wantedBonus: 2, cooldownReduceH: 6,  matchNotices: true,  canSave: false, featuredFilters: false },
    3: { id: 3, name: "Match Alert",     pricePhp: 149.99, radiusBonusKm: 12, wantedBonus: 3, cooldownReduceH: 12, matchNotices: true,  canSave: false, featuredFilters: false, pinBonus: 1 },
    4: { id: 4, name: "Save and Scout",  pricePhp: 199.99, radiusBonusKm: 16, wantedBonus: 4, cooldownReduceH: 18, matchNotices: true,  canSave: true,  featuredFilters: false, pinBonus: 1 },
    5: { id: 5, name: "Full Horizon",    pricePhp: 249.99, radiusBonusKm: 20, wantedBonus: 5, cooldownReduceH: 24, matchNotices: true,  canSave: true,  featuredFilters: true,  pinBonus: 1 }
};

/**
 * Listing Boost packages for owners (package id 1–5).
 * listingBonus     — added on top of BASE_OWNER_LISTING_CAP
 * wantedTabAccess  — always true (no paywall; boosts add capacity only)
 * imagesBonus      — added on top of BASE_IMAGES_PER_LISTING
 * wantedNotices    — bell for matching wanted requests
 */
const OWNER_BOOST_PACKAGES = {
    /* Prices + PayPal labels (merchant hosted buttons). Effects follow source_of_truth Boost 1–5. */
    0: { id: 0, name: "None",              pricePhp: 0,      listingBonus: 0,  wantedTabAccess: true, imagesBonus: 0, wantedNotices: false },
    1: { id: 1, name: "Extra Slots",       pricePhp: 49.99,  listingBonus: 2,  wantedTabAccess: true,  imagesBonus: 1, wantedNotices: false },
    2: { id: 2, name: "Demand View",       pricePhp: 99.99,  listingBonus: 3,  wantedTabAccess: true,  imagesBonus: 1, wantedNotices: false },
    3: { id: 3, name: "Showcase",          pricePhp: 149.99, listingBonus: 5,  wantedTabAccess: true,  imagesBonus: 2, wantedNotices: false, pinBonus: 1 },
    4: { id: 4, name: "Spotlight",         pricePhp: 199.99, listingBonus: 8,  wantedTabAccess: true,  imagesBonus: 3, wantedNotices: true, pinBonus: 1 },
    5: { id: 5, name: "Full Listing Desk", pricePhp: 249.99, listingBonus: 12, wantedTabAccess: true,  imagesBonus: 5, wantedNotices: true , pinBonus: 1}
};


/* -------- tier lookup helpers -------- */
/* All three "tierIndexFor*" functions return the same shape so UI  */
/* code doesn't need to branch on role: { index, tier, next }        */

function tierIndexFromLadder(ladder, score){
    let index = 0;
    for(let i = 0; i < ladder.length; i++){
        if(score >= ladder[i].min) index = i;
    }
    return index;
}

function tierResult(ladder, score){
    const index = tierIndexFromLadder(ladder, score);
    return {
        index,
        tier: ladder[index],
        next: ladder[index + 1] || null,
        score
    };
}

/** @param {number} points total contract points in a seeker category (or overall) */
function seekerTierForCategory(points){
    return tierResult(SEEKER_TIERS, points || 0);
}

/**
 * Owner rank from total contract points (+ light satisfaction weight).
 * Prefer passing totalPoints from the tier doc when available.
 */
function ownerTierForScore(completedContractsOrPoints, avgSatisfaction, totalPoints){
    const points = totalPoints != null
        ? totalPoints
        : (completedContractsOrPoints || 0);
    const score = points + (avgSatisfaction || 0) * OWNER_SATISFACTION_WEIGHT;
    return tierResult(OWNER_TIERS, score);
}

/** Broker rank from total contract points (or legacy closure count). */
function brokerTierForScore(satisfiedClosuresOrPoints, rentToOwnRescues, totalPoints){
    const points = totalPoints != null
        ? totalPoints
        : (satisfiedClosuresOrPoints || 0) + (rentToOwnRescues || 0) * BROKER_RESCUE_BONUS;
    return tierResult(BROKER_TIERS, points);
}

/* -------- broker tier is tracked PER PROPERTY, then summed -------- */
/* A broker's rank reflects every property they've closed deals on,  */
/* not one flat counter -- byProperty looks like:                     */
/*   { [propertyId]: { satisfiedClosures, rentToOwnRescues } }        */
/* This also means a broker's profile can show a per-property         */
/* breakdown (which listings they've actually performed well on),     */
/* the same way a seeker's profile shows a per-category breakdown.    */

function aggregateBrokerScore(byProperty){
    let satisfiedClosures = 0;
    let rentToOwnRescues = 0;
    let totalPoints = 0;
    for(const propertyId in (byProperty || {})){
        const entry = byProperty[propertyId] || {};
        satisfiedClosures += entry.satisfiedClosures || 0;
        rentToOwnRescues += entry.rentToOwnRescues || 0;
        totalPoints += entry.points || 0;
    }
    return { satisfiedClosures, rentToOwnRescues, totalPoints };
}

function brokerTierForProperties(byProperty){
    const { satisfiedClosures, rentToOwnRescues, totalPoints } = aggregateBrokerScore(byProperty);
    return brokerTierForScore(satisfiedClosures, rentToOwnRescues, totalPoints || undefined);
}

/* -------- duration-point helper (§4.4) -------- */
/* monthsSustained can be fractional; this always floors to whole    */
/* points already earned so far. */

/** @deprecated prefer contractPoints({ monthsPaid, classification, ... }) */
function durationPoints(monthsSustained, classification = "bedspace_dorm"){
    return monthlyPointsForClassification(classification) * Math.floor(monthsSustained || 0);
}

/* -------- radius / cooldown / cap lookups, boost-aware -------- */

/** Highest ladder index unlocked by raw points. */
function tierIndexFromPoints(points, ladder) {
    const pts = Number(points) || 0;
    let idx = 0;
    const list = ladder || [];
    for (let i = 0; i < list.length; i++) {
        if (pts >= (Number(list[i].min) || 0)) idx = i;
    }
    return idx;
}

function seekerBoostPackage(packageId){
    const id = Number(packageId) || 0;
    return SEEKER_BOOST_PACKAGES[id] || SEEKER_BOOST_PACKAGES[0];
}

function ownerBoostPackage(packageId){
    const id = Number(packageId) || 0;
    return OWNER_BOOST_PACKAGES[id] || OWNER_BOOST_PACKAGES[0];
}

/** Parse expiresAt from boost slice (Timestamp | Date | string | ms). */
function boostExpiresAt(roleBoost){
    if(!roleBoost || roleBoost.expiresAt == null) return null;
    const raw = roleBoost.expiresAt;
    try {
        if(raw && typeof raw.toDate === "function") return raw.toDate();
        if(raw instanceof Date) return raw;
        if(typeof raw === "number") return new Date(raw);
        if(typeof raw === "string") {
            const d = new Date(raw);
            return Number.isNaN(d.getTime()) ? null : d;
        }
        if(raw.seconds != null) return new Date(Number(raw.seconds) * 1000);
    } catch(_) {}
    return null;
}

/** Active flag + not past expiresAt (refresh capacity when boost expires). */
function isBoostSliceActive(roleBoost){
    if(!roleBoost || !roleBoost.active) return false;
    const exp = boostExpiresAt(roleBoost);
    if(exp && exp.getTime() < Date.now()) return false;
    return true;
}

/** Canonical boost package validator. Legacy package aliases are retired. */
function canonicalBoostPackageId(raw){
    if(typeof raw !== "number" || !Number.isInteger(raw)) return 0;
    return raw >= 0 && raw <= 5 ? raw : 0;
}

/** Resolve a canonical stored boost slice → package id 0–5 (0 if inactive/expired/invalid). */
function resolveBoostPackageId(roleBoost){
    if(!isBoostSliceActive(roleBoost)) return 0;
    return canonicalBoostPackageId(roleBoost.package);
}

/**
 * @param {number} tierIndex 0–4
 * @param {number} seekerPackageId 0–5 (Seeking Boost)
 */
function radiusForTier(tierIndex, seekerPackageId = 0){
    const base = RADIUS_BY_TIER_KM[tierIndex] ?? RADIUS_BY_TIER_KM[0];
    const bonus = seekerBoostPackage(seekerPackageId).radiusBonusKm;
    return base + bonus;
}

function cooldownHoursForTier(tierIndex, seekerPackageId = 0){
    const base = COOLDOWN_BY_TIER_HOURS[tierIndex] ?? COOLDOWN_BY_TIER_HOURS[0];
    const reduce = seekerBoostPackage(seekerPackageId).cooldownReduceH;
    return Math.max(1, base - reduce);
}

function listingCapForBoostPackage(pkg){
    const packageId = canonicalBoostPackageId(pkg);
    return BASE_OWNER_LISTING_CAP + ownerBoostPackage(packageId).listingBonus;
}

function wantedCapForSeekerBoost(packageId){
    return BASE_WANTED_ACTIVE_CAP + seekerBoostPackage(packageId).wantedBonus;
}

function seekerCanSaveProperties(packageId){
    return !!seekerBoostPackage(packageId).canSave;
}

/**
 * Photos per listing from organic tier (all roles that can list).
 * T0–T1: 1 photo; from T2 each tier adds +1 → T2=2 … T5=5.
 * Boost imagesBonus stacks on top (see totalImagesPerListing).
 */
function imagesPerListingForTier(tierIndex) {
    const t = Math.max(0, Number(tierIndex) || 0);
    if (t <= 1) return BASE_IMAGES_PER_LISTING; // 1
    return BASE_IMAGES_PER_LISTING + (t - 1); // T2→2 … T5→5
}

function ownerImagesPerListing(packageId){
    const pkg = ownerBoostPackage(packageId);
    const bonus = pkg.imagesBonus != null ? pkg.imagesBonus : (pkg.imagesPerListing || 0);
    return BASE_IMAGES_PER_LISTING + bonus;
}

/** Tier base + listing-boost bonus */
function totalImagesPerListing(tierIndex, ownerPackageId) {
    const base = imagesPerListingForTier(tierIndex);
    const pkg = ownerBoostPackage(ownerPackageId);
    const bonus = pkg.imagesBonus != null ? pkg.imagesBonus : 0;
    return Math.max(1, base + bonus);
}

/**
 * Active extra listing slots from boosts/{uid}.extraListings.
 * Shape:
 *   { quantity: number, expiresAt?: Timestamp|Date|string, active?: boolean }
 * Expired or inactive → 0. quantity is the number of +1 slots still in force.
 */
function isSubscriptionEntitlementActive(entitlement){
  if (!entitlement || entitlement.active !== true) return false;
  const now = Date.now();
  const parse = raw => {
    if (raw == null) return null;
    try {
      if (raw && typeof raw.toDate === "function") return raw.toDate().getTime();
      if (raw instanceof Date) return raw.getTime();
      if (typeof raw === "number") return raw;
      if (typeof raw === "string") { const d = new Date(raw); return Number.isNaN(d.getTime()) ? null : d.getTime(); }
      if (raw.seconds != null) return Number(raw.seconds) * 1000;
    } catch (_) {}
    return null;
  };
  const starts = parse(entitlement.startsAt);
  const ends = parse(entitlement.endsAt);
  if (starts != null && starts > now) return false;
  if (ends != null && ends <= now) return false;
  return true;
}

function activeExtraListingSlots(extraListings){
    if(!extraListings) return 0;
    if(extraListings.active === false) return 0;
    const qty = Math.max(0, Number(extraListings.quantity) || 0);
    if(qty === 0) return 0;
    if(extraListings.expiresAt){
        let exp = extraListings.expiresAt;
        if(typeof exp.toDate === "function") exp = exp.toDate();
        else exp = new Date(exp);
        if(!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) return 0;
    }
    return qty;
}

/**
 * Full listing cap for a user:
 *   BASE + Listing Boost bonus + active monthly extra slots
 * @param {number|string} ownerPackageId  Listing Boost package 0–5
 * @param {object|null} extraListings     boosts/{uid}.extraListings
 */
/** Free listing slots from organic tier: Tier 0 → 1, Tier 1 → 2, … Tier 5 → 6 */
function listingSlotsFromTier(tierIndex = 0){
    return 1 + Math.max(0, Math.min(5, Number(tierIndex) || 0));
}

/**
 * Total active listing capacity:
 *   organic tier slots + listing-boost package bonus + extra listing slot purchases.
 * Pass tierIndex so profile/stats and createListing stay aligned.
 */
function totalListingCap(ownerPackageId = 0, extraListings = null, tierIndex = 0, subscriptionEntitlement = null){
    if (isSubscriptionEntitlementActive(subscriptionEntitlement)) return Number.POSITIVE_INFINITY;
    const organic = listingSlotsFromTier(tierIndex);
    // listingCapForBoostPackage already includes BASE_OWNER_LISTING_CAP (1).
    // Avoid double-counting base: use boost bonus only + organic.
    const pkg = typeof ownerPackageId === "object" ? ownerPackageId : null;
    const pkgId = pkg ? (pkg.id || 0) : (Number(ownerPackageId) || 0);
    const boostBonus = listingCapForBoostPackage(pkgId) - BASE_OWNER_LISTING_CAP;
    return organic + Math.max(0, boostBonus) + activeExtraListingSlots(extraListings);
}

/* -------- Identity verification (first listing / broker license) -------- */

/** Acceptable government IDs for first property listing (anti-spam). */
const ACCEPTED_ID_TYPES = [
    "ph_national_id",
    "national_id",
    "passport",
    "drivers_license",
    "umid",
    "sss",
    "philhealth",
    "postal",
    "postal_id",
    "prc",
    "prc_license",
    "nbi",
    "other"
];

const ACCEPTED_ID_LABELS = {
    ph_national_id: "Philippine National ID",
    national_id: "Philippine National ID",
    passport: "Passport",
    drivers_license: "Driver's License",
    umid: "UMID",
    sss: "SSS ID",
    philhealth: "PhilHealth ID",
    postal: "Postal ID",
    postal_id: "Postal ID",
    prc: "PRC ID",
    prc_license: "PRC License",
    nbi: "NBI Clearance",
    other: "Other government ID",
};

/** Brokers need one of these on file before acting as licensed broker. */
const BROKER_LICENSE_TYPES = ["prc_license", "broker_certificate"];

/**
 * True when profile has submitted an accepted ID (admin or pipeline marks verified).
 * Expects users/{uid}.idVerification = { status: "verified"|"pending"|"rejected", idType, ... }
 */
function hasVerifiedId(profile){
    if(!profile) return false;
    if(profile.verified === true) return true;
    const v = profile.idVerification;
    if(!v) return false;
    const st = String(v.status || "").toLowerCase();
    // Status alone is enough for listing gate (idType optional / legacy docs)
    return st === "verified" || st === "approved";
}

function hasBrokerLicense(profile){
    if(!profile || !profile.brokerLicense) return false;
    const b = profile.brokerLicense;
    const st = String(b.status || "").toLowerCase();
    if(st !== "verified" && st !== "approved") return false;
    return BROKER_LICENSE_TYPES.includes(b.licenseType) || b.licenseType === "prc_license";
}

/** First listing requires verified ID for every role. */
function canCreateFirstListing(profile, existingListingCount){
    if((existingListingCount || 0) > 0) return { ok: true };
    if(hasVerifiedId(profile)) return { ok: true };
    return {
        ok: false,
        reason: "Submit a valid government ID before your first listing (Passport, UMID, SSS, PhilHealth, NBI, National ID, Postal ID, PRC, or Driver's License)."
    };
}


/**
 * Active package IDs for the independent pin-capacity track.
 * Canonical package maps:
 *   boosts/{uid}.seeker.packages.{3|4|5}
 *   boosts/{uid}.owner.packages.{3|4|5}
 *
 * Canonical package maps only. Legacy single-slice compatibility is retired.
 */
function activeBoostPackageIds(roleBoost, { pinOnly = false } = {}) {
    const ids = new Set();
    const raw = roleBoost || {};
    const map = raw.packages || raw.activePackages || null;
    if (map && typeof map === "object") {
        for (const [key, value] of Object.entries(map)) {
            const id = Number(key);
            if (!Number.isInteger(id) || id < 1 || id > 5) continue;
            if (value === true || (value && typeof value === "object" && isBoostSliceActive(value))) {
                ids.add(id);
            }
        }
    }
    const out = [...ids].sort((a, b) => a - b);
    return pinOnly ? out.filter(id => id >= 3 && id <= 5) : out;
}

function pinBonusForActivePackages(roleBoost) {
    return activeBoostPackageIds(roleBoost, { pinOnly: true }).length;
}

/** Stable slot IDs prevent package 4 from inheriting package 3's coordinate. */
function pinSlotKeysForBoosts(roleBoost, line = "seeker") {
    return activeBoostPackageIds(roleBoost, { pinOnly: true }).map(id => `${line}-${id}`);
}

function pinBonusForSeekerPackage(packageId){
    return Math.max(0, Number(seekerBoostPackage(packageId).pinBonus) || 0);
}
function pinBonusForOwnerPackage(packageId){
    return Math.max(0, Number(ownerBoostPackage(packageId).pinBonus) || 0);
}

/**
 * Pin capacity is independent from listing capacity.
 * Broker uses the existing discovery + supply pin lines, not a Broker Pin.
 */
function maxPinsForAccount({
    role = "seeker",
    tierIndex = 0,
    seekerPackageId = 0,
    ownerPackageId = 0,
    seekerActivePackageIds = null,
    ownerActivePackageIds = null
} = {}){
    const r = String(role || "seeker");
    let n = r === "broker" ? 2 : 1;
    if(Number(tierIndex) >= 3) n += 1;

    const seekerIds = Array.isArray(seekerActivePackageIds)
        ? seekerActivePackageIds.map(Number)
        : (seekerPackageId ? [Number(seekerPackageId)] : []);
    const ownerIds = Array.isArray(ownerActivePackageIds)
        ? ownerActivePackageIds.map(Number)
        : (ownerPackageId ? [Number(ownerPackageId)] : []);

    if(r === "seeker" || r === "broker") {
        n += new Set(seekerIds.filter(id => id >= 3 && id <= 5)).size;
    }
    if(r === "owner" || r === "broker") {
        n += new Set(ownerIds.filter(id => id >= 3 && id <= 5)).size;
    }
    return Math.max(1, n);
}


function seekerTierIndex(points) {
  return tierIndexFromPoints(points, SEEKER_TIERS);
}
function ownerTierIndex(completed, avgSat, totalPoints) {
  return ownerTierForScore(completed, avgSat, totalPoints).index;
}
function brokerTierIndex(closures, rescues, totalPoints) {
  return brokerTierForScore(closures, rescues, totalPoints).index;
}

module.exports = {
  CATEGORIES, SEEKER_TIERS, OWNER_TIERS, BROKER_TIERS,
  categoryOf, contractPoints, durationPoints, aggregateBrokerScore,
  resolveBoostPackageId, totalListingCap, totalImagesPerListing,
  imagesPerListingForTier, listingCapForBoostPackage, wantedCapForSeekerBoost,
  ownerBoostPackage, seekerBoostPackage, tierIndexFromPoints,
  seekerTierIndex, ownerTierIndex, brokerTierIndex,
  BASE_OWNER_LISTING_CAP, BASE_WANTED_ACTIVE_CAP, BASE_IMAGES_PER_LISTING,
  hasVerifiedId, hasBrokerLicense, activeBoostPackageIds, pinBonusForActivePackages,
  maxPinsForAccount, pinSlotKeysForBoosts, pinBonusForSeekerPackage, pinBonusForOwnerPackage, radiusForTier,
  boostExpiresAt, isBoostSliceActive, isSubscriptionEntitlementActive
};
