import { canonicalRoleFromData } from "../canonical-role.js";
import { isVisiting } from "./visit-mode.js";
import { getOrganicPointsTotal, getWantedRevealProgress, POINTS, WANTED_REVEAL_DAILY_CAP } from "../points-ledger.js";
import { listPropertyListingsForOwner } from "../collections.js";
import { getMapState, formatCooldown } from "../radius-cooldown.js";

function updateTierPointsUi(tierList, currentIndex, score) {
    const ptsEl = document.getElementById("tier-points-line");
    const pills = document.getElementById("tier-ladder-pills");
    const scoreNum = Number(score) || 0;
    const cur = tierList[currentIndex] || tierList[0];
    const next = tierList[currentIndex + 1];
    if (ptsEl) {
        if (next) {
            ptsEl.textContent = `${scoreNum} pts · ${cur.name} → ${next.name} at ${next.min} pts`;
        } else {
            ptsEl.textContent = `${scoreNum} pts · Max tier (${cur.name})`;
        }
    }
    if (pills) {
        pills.innerHTML = tierList.map((t, i) =>
            `<span class="tier-pill ${i === currentIndex ? "is-current" : ""} ${i < currentIndex ? "is-done" : ""}" title="${t.min}+ pts">${t.name.replace("Tier ", "T")}</span>`
        ).join("");
    }
}

/* ==================================== */
/*  PERKS                               */
/* ==================================== */
/* Progression tier system, rewired onto the real tier engine in    */
/* ../tiers.js (see docs/CONTRACT-TIER-SYSTEM.md):                   */
/*   - seeker: a per-category ladder (bedspace/residential/          */
/*     commercial/industrial), headline shows the leading category   */
/*   - owner: completed deals + satisfaction average                 */
/*   - broker: tracked PER PROPERTY, summed for the ladder lookup    */
/* Tier data itself is written by Cloud Functions to                 */
/* users/{uid}/tier/{role} -- until those are deployed, that doc     */
/* just doesn't exist yet, and everything below safely defaults to   */
/* index 0 ("Tier 0" for every role -- see CONTRACT-TIER-SYSTEM.md §3;*/
/* comment used to say "Newcomer"/"Casual Host"/"Associate Broker",   */
/* an older named-rank ladder that no longer matches the code).       */
/*                                                                     */
/* Role comes from ./role.js's getRole() (set once by profile-data.js)*/
/* rather than this file re-fetching users/{uid} itself.              */
/*                                                                     */
/* Exports if (!isVisiting) refreshPerks() so listing-form.js and active-listings.js  */
/* can re-run it whenever a listing is created or deleted (this only */
/* re-reads the owner's listing count for display purposes now --    */
/* listing count no longer drives owner TIER, only their listing     */
/* CAP via boost, see below). Also exports getOwnerListingCapStatus()*/
/* so listing-form.js can enforce that same cap before submit.       */

import { user, db } from "./core.js";
import { getRole } from "./role.js";
import { doc, getDoc, setDoc, collection, query, where, getDocs }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    BASE_OWNER_LISTING_CAP,
    BASE_WANTED_ACTIVE_CAP,
    BROKER_TIERS,
    CATEGORIES,
    OWNER_TIERS,
    SEEKER_TIERS,
    activeExtraListingSlots,
    brokerTierForProperties,
    cooldownHoursForTier,
    listingCapForBoostPackage,
    listingSlotsFromTier,
    totalImagesPerListing,
    ownerBoostPackage,
    ownerTierForScore,
    radiusForTier,
    resolveBoostPackageId, boostExpiresAt, maxPinsForAccount,
    seekerBoostPackage,
    totalListingCap,
    wantedCapForSeekerBoost,
    tierIndexFromPoints
} from "../tiers.js";
import { renderBoostPackagesList, refreshBoostCatalog } from "./boost-order.js";
import { lockBodyScroll, unlockBodyScroll } from "./body-scroll-lock.js";

/* Display copy for each tier card -- js/tiers.js intentionally only
   carries the scoring thresholds, not UI copy, so that lives here. */
const TIER_COPY = {
    owner: [
        { cap: "Free default listing capacity", perk: "Standard Market placement · 1 map pin" },
        { cap: "Growing portfolio footprint", perk: "Basic traffic signals" },
        { cap: "Stronger discovery weight", perk: "Priority in category browse" },
        { cap: "Premier placement signals", perk: "+1 map pin slot (2 total with base)" },
        { cap: "Featured-ready visibility", perk: "Advanced listing tools" },
        { cap: "Top-tier marketplace presence", perk: "Homepage-class exposure path" }
    ],
    seeker: [
        { cap: "Browse within pin radius", perk: "Standard search access · 1 map pin" },
        { cap: "Trusted activity signals", perk: "Faster owner responses" },
        { cap: "Stronger match priority", perk: "Saved search foundation" },
        { cap: "High-intent seeker rank", perk: "+1 map pin slot (2 total with base)" },
        { cap: "Power seeker standing", perk: "Wider organic radius path" },
        { cap: "Elite client standing", perk: "Negotiation assistance path" }
    ],
    broker: [
        { cap: "Market visibility (free)", perk: "Standard deal tools" },
        { cap: "Active field presence", perk: "Case assignment weight" },
        { cap: "Established closer", perk: "Rescue eligibility path" },
        { cap: "Senior deal flow", perk: "Featured broker signals" },
        { cap: "Principal standing", perk: "Priority mediation path" },
        { cap: "Master-tier standing", perk: "Top commission track path" }
    ]
};

const CATEGORY_LABELS = {
    bedspace: "Bedspace",
    residential: "Residential",
    commercial: "Commercial",
    industrial: "Industrial"
};

async function getTierDoc(role) {
    const snap = await getDoc(doc(db, "users", user.uid, "tier", role));
    return snap.exists() ? snap.data() : {};
}

async function getBoostDoc() {
    // firestore.rules: allow read: if isOwnerOf(uid) -- fine to read our own
    const snap = await getDoc(doc(db, "boosts", user.uid));
    return snap.exists() ? snap.data() : {};
}

async function getOwnerListingCount() {
    const rows = await listPropertyListingsForOwner(db, user.uid, { collection, query, where, getDocs });
    return rows.filter(({ data }) => {
        const s = String(data.status || "active").toLowerCase();
        return s !== "closed" && s !== "deleted";
    }).length;
}

/* Reused by ownerProgress() below (display) and listing-form.js         */
/* (submit-time enforcement) so the cap logic lives in exactly one place. */
export async function getOwnerListingCapStatus() {
    const boostDoc = await getBoostDoc();
    const packageId = resolveBoostPackageId(boostDoc.owner);
    const extraSlots = activeExtraListingSlots(boostDoc.extraListings);
    let tierIdx = 0;
    let roleHint = "owner";
    try {
        const profileSnap0 = await getDoc(doc(db, "users", user.uid));
        if (profileSnap0.exists() && canonicalRoleFromData(profileSnap0.data()) === "broker") roleHint = "broker";
    } catch (_) {}
    try {
        const tr = await getDoc(doc(db, "users", user.uid, "tier", roleHint));
        if (tr.exists()) tierIdx = Number(tr.data().highestIndex || tr.data().index || 0);
    } catch (_) {}
    let subscriptionEntitlement = null;
    try {
        const entSnap = await getDoc(doc(db, "subscriptionEntitlements", user.uid));
        subscriptionEntitlement = entSnap.exists() ? entSnap.data() : null;
    } catch (_) {}
    let listingCap = totalListingCap(packageId, boostDoc.extraListings, tierIdx, subscriptionEntitlement);

    // admin.html-only lever: numeric override wins when set
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const override = profileSnap.exists() ? profileSnap.data().listingCapOverride : null;
    if (override != null) listingCap = override;

    const activeListings = await getOwnerListingCount();

    // Ongoing contracts spend 1 listing-cap slot each (all roles as ownerId).
    // Restored when contract leaves "active"; spent again if renewed.
    let activeContracts = 0;
    try {
        const cq = query(
            collection(db, "contracts"),
            where("ownerId", "==", user.uid),
            where("status", "==", "active")
        );
        const cs = await getDocs(cq);
        activeContracts = cs.size;
    } catch (e) {
        console.warn("Could not count active contracts for listing cap:", e);
    }

    const slotsUsed = activeListings + activeContracts;
    return {
        activeListings,
        activeContracts,
        slotsUsed,
        listingCap,
        effectivePackage: packageId,
        packageId,
        extraSlots,
        atCap: slotsUsed >= listingCap
    };
}

/* -------- per-role progress computation -------- */
/* Each returns the same shape so the rendering code below doesn't   */
/* need to branch on role: { tierList, currentIndex, headline, meta } */

async function seekerProgress() {
    const tierDoc = await getTierDoc("seeker");
    const byCategory = tierDoc.byCategory || {};
    const tierIndexByCategory = tierDoc.tierIndexByCategory || {};
    const highestIndex = tierDoc.highestIndex || 0;

    // headline category = whichever one is actually at the highest
    // tier (ties broken by raw count) -- so "reach the max tier for
    // bedspace" shows up as the bedspace category specifically
    let leadingCategory = CATEGORIES[0];
    let bestCount = -1;
    for (const cat of CATEGORIES) {
        const idx = tierIndexByCategory[cat] || 0;
        const count = byCategory[cat] || 0;
        if (idx > (tierIndexByCategory[leadingCategory] || 0) ||
            (idx === (tierIndexByCategory[leadingCategory] || 0) && count > bestCount)) {
            leadingCategory = cat;
            bestCount = count;
        }
    }

    const count = byCategory[leadingCategory] || 0;
    const breakdown = CATEGORIES.map(cat =>
        `${CATEGORY_LABELS[cat]}: ${SEEKER_TIERS[tierIndexByCategory[cat] || 0].name}`
    ).join(" · ");

    const totalPoints = Number(tierDoc.totalPoints) || Object.values(tierDoc.byCategory || {}).reduce((a, b) => a + (Number(b) || 0), 0) || 0;
    const fromPts = tierIndexFromPoints(totalPoints, SEEKER_TIERS);
    const currentIndex = Math.max(highestIndex || 0, fromPts);
    return {
        totalPoints,
        tierList: SEEKER_TIERS,
        currentIndex,
        headline: `${count} pts · ${CATEGORY_LABELS[leadingCategory]}`,
        breakdown
    };
}

async function ownerProgress() {
    const tierDoc = await getTierDoc("owner");
    const completedContracts = tierDoc.completedContracts || 0;
    const totalPoints = tierDoc.totalPoints || 0;
    const satisfactionCount = tierDoc.satisfactionCount || 0;
    const avgSatisfaction = satisfactionCount > 0 ? tierDoc.satisfactionSum / satisfactionCount : 0;

    const result = ownerTierForScore(completedContracts, avgSatisfaction, totalPoints);
    // Prefer points ladder so Admin totalPoints adjustments actually change rank
    const fromPts = tierIndexFromPoints(totalPoints, OWNER_TIERS);
    result.index = Math.max(result.index || 0, fromPts, Number(tierDoc.highestIndex) || 0);
    const { activeListings, activeContracts, slotsUsed, listingCap, effectivePackage, extraSlots } = await getOwnerListingCapStatus();

    const capBits = [];
    if(effectivePackage) capBits.push(`Listing Boost ${effectivePackage}`);
    if(extraSlots) capBits.push(`+${extraSlots} extra slot${extraSlots === 1 ? "" : "s"}`);
    const capNote = capBits.length ? ` (${capBits.join(", ")})` : " (free default)";

    return {
        tierList: OWNER_TIERS,
        currentIndex: result.index,
        totalPoints,
        headline: satisfactionCount > 0
            ? `${totalPoints} pts · ${completedContracts} deal${completedContracts === 1 ? "" : "s"} · ${avgSatisfaction.toFixed(1)}★`
            : `${totalPoints} pts · ${completedContracts} deal${completedContracts === 1 ? "" : "s"}`,
        breakdown: `Listing slots: ${slotsUsed}/${listingCap} (${activeListings} listed + ${activeContracts || 0} under contract)` + capNote
    };
}

async function brokerProgress() {
    const tierDoc = await getTierDoc("broker");
    const byProperty = tierDoc.byProperty || {};
    const result = brokerTierForProperties(byProperty);
    // prefer the server-precomputed index if it exists (kept identical
    // to result.index once Cloud Functions have run at least once)
    const pts = Number(tierDoc.totalPoints) || Number(result.score) || 0;
    const fromPts = tierIndexFromPoints(pts, BROKER_TIERS);
    const currentIndex = Math.max(
        typeof tierDoc.highestIndex === "number" ? tierDoc.highestIndex : 0,
        result.index || 0,
        fromPts
    );

    const propertyCount = Object.keys(byProperty).length;
    const boostDoc = await getBoostDoc();
    const brokerBoost = boostDoc.broker;
    const infoUnlocked = !!(brokerBoost && brokerBoost.active);

    const breakdown = propertyCount > 0
        ? Object.entries(byProperty)
            .map(([propId, entry]) => `${propId.slice(0, 6)}…: ${entry.satisfiedClosures || 0} closure(s)${entry.rentToOwnRescues ? `, ${entry.rentToOwnRescues} rescue(s)` : ""}`)
            .join(" · ")
        : "No properties handled yet";

    return {
        tierList: BROKER_TIERS,
        currentIndex,
        totalPoints: pts,
        headline: `${result.score} pts across ${propertyCount} propert${propertyCount === 1 ? "y" : "ies"}` +
            (infoUnlocked ? " · Full info unlocked (boosted)" : " · Limited info (not boosted).") + " · ",
        breakdown
    };
}


function paintTierCards(tierList, currentIndex, copy) {
    const mount = document.getElementById("tier-cards-mount");
    if (mount && tierList?.length && !document.getElementById("tier-card-1")) {
        mount.innerHTML = tierList.map((tier, index) => `
          <article class="tier-card" id="tier-card-${index + 1}" data-asset="profile-tier-card">
            <div class="tier-icon-circle"><i class="bx ${tier.icon || "bx-circle"}"></i></div>
            <h4>${tier.name || ("Tier " + index)}</h4>
            <p class="tier-requirement"></p>
            <ul class="tier-perks-list"><li></li><li></li></ul>
          </article>`).join("");
    }
    (tierList || []).forEach((tier, index) => {
        const card = document.getElementById("tier-card-" + (index + 1));
        if (!card) return;
        const unlocked = index <= currentIndex;
        card.classList.toggle("active", index === currentIndex);
        card.classList.toggle("unlocked", unlocked);
        const icon = card.querySelector(".tier-icon-circle i");
        if (icon && tier.icon) icon.className = "bx " + (tier.icon || "bx-circle");
        const h4 = card.querySelector("h4");
        if (h4) h4.textContent = tier.name;
        const reqText = card.querySelector(".tier-requirement");
        if (reqText) {
            reqText.textContent = unlocked
                ? "✓ Rank Requirement Unlocked"
                : `Requires ${tier.min}+ points`;
            reqText.style.color = unlocked ? "#10B981" : "";
        }
        const lis = card.querySelectorAll(".tier-perks-list li");
        const iconClass = unlocked ? "bx-check-circle" : "bx-circle";
        const row = (copy && copy[index]) || { cap: "Progress via completed contracts", perk: "See boost packages for extra perks" };
        if (lis[0]) lis[0].innerHTML = `<i class='bx ${iconClass}'></i> ${row.cap}`;
        if (lis[1]) lis[1].innerHTML = `<i class='bx ${iconClass}'></i> ${row.perk}`;
    });
}


async function renderPinCapacityCard(role, tierIndex, boostDoc) {
  const mount = document.getElementById("capability-stats");
  if (!mount) return;
  let host = document.getElementById("profile-pin-slots");
  if (!host) {
    host = document.createElement("div");
    host.id = "profile-pin-slots";
    host.className = "profile-pin-slots panel-subcard";
    host.setAttribute("data-asset", "profile-pin-slots");
    mount.parentNode?.insertBefore(host, mount.nextSibling);
  }

  const sPkg = resolveBoostPackageId(boostDoc?.seeker);
  const oPkg = resolveBoostPackageId(boostDoc?.owner);
  let tIdx = Number(tierIndex) || 0;
  try {
    const tr = await getDoc(doc(db, "users", user.uid, "tier", role === "broker" ? "broker" : role === "owner" ? "owner" : "seeker"));
    if (tr.exists()) tIdx = Number(tr.data().highestIndex || tr.data().index || tIdx) || tIdx;
  } catch (_) {}

  const maxP = maxPinsForAccount({
    role: role || "seeker",
    tierIndex: tIdx,
    seekerPackageId: sPkg,
    ownerPackageId: oPkg,
    seekerActivePackageIds: boostDoc?.seeker?.packages ? Object.keys(boostDoc.seeker.packages).map(Number) : null,
    ownerActivePackageIds: boostDoc?.owner?.packages ? Object.keys(boostDoc.owner.packages).map(Number) : null,
  });

  const se = boostExpiresAt(boostDoc?.seeker);
  const oe = boostExpiresAt(boostDoc?.owner);
  const expBits = [
    se && sPkg ? `Seeking Boost until ${se.toLocaleDateString()}` : null,
    oe && oPkg ? `Listing Boost until ${oe.toLocaleDateString()}` : null,
  ].filter(Boolean);

  let pinsMap = {};
  let activeId = null;
  try {
    const us = await getDoc(doc(db, "users", user.uid));
    if (us.exists()) {
      const d = us.data() || {};
      pinsMap = d.pins && typeof d.pins === "object" ? d.pins : {};
      activeId = d.activePinId || null;
    }
  } catch (_) {}
  try {
    const localA = localStorage.getItem(`hf_market_active_pin_${user.uid}`);
    if (!activeId && localA) activeId = localA;
  } catch (_) {}

  const fmtCoord = (c) => {
    if (!c || !Number.isFinite(Number(c.lat)) || !Number.isFinite(Number(c.lng))) return null;
    return `${Number(c.lat).toFixed(4)}, ${Number(c.lng).toFixed(4)}`;
  };

  let rows = [];
  try {
    const disc = await getMapState(user.uid, tIdx, sPkg, "mapState");
    const supply = await getMapState(user.uid, tIdx, 0, "mapStateOwner");
    if (role !== "owner") {
      const c = disc?.lastKnownCenter;
      const cool = disc && disc.canRelocate === false ? formatCooldown(disc.cooldownRemainingMs || 0) : null;
      rows.push({
        id: "discovery-1",
        label: "Search pin",
        has: !!(c && Number.isFinite(Number(c.lat))),
        coord: fmtCoord(c),
        cool,
        ready: !(disc && disc.canRelocate === false),
      });
    }
    if (role === "owner" || role === "broker") {
      const c = supply?.lastKnownCenter;
      const cool = supply && supply.canRelocate === false ? formatCooldown(supply.cooldownRemainingMs || 0) : null;
      rows.push({
        id: "supply-1",
        label: role === "owner" ? "Supply pin" : "Portfolio / supply pin",
        has: !!(c && Number.isFinite(Number(c.lat))),
        coord: fmtCoord(c),
        cool,
        ready: !(supply && supply.canRelocate === false),
      });
    }
  } catch (e) {
    console.warn("pin panel mapState", e);
  }

  for (const [id, raw] of Object.entries(pinsMap)) {
    if (rows.some((r) => r.id === id)) continue;
    const c = raw?.center || raw?.lastKnownCenter || raw;
    const has = !!(c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng)));
    rows.push({
      id,
      label: raw?.label || `Extra pin · ${id}`,
      has,
      coord: has ? fmtCoord(c) : null,
      cool: null,
      ready: true,
    });
  }

  /* Empty capacity slots (visual placeholders up to maxP) */
  while (rows.length < maxP) {
    rows.push({
      id: `empty-${rows.length + 1}`,
      label: `Open slot ${rows.length + 1}`,
      has: false,
      coord: null,
      cool: null,
      ready: true,
      emptySlot: true,
    });
  }

  if (!activeId && rows.find((r) => r.has)) {
    activeId = rows.find((r) => r.has).id;
  }

  const used = rows.filter((r) => r.has && !r.emptySlot).length;
  const listHtml = rows
    .map((r) => {
      const isA = !r.emptySlot && r.id === activeId;
      let status = "Empty";
      if (r.has) {
        if (r.cool) status = `Cooldown · ${r.cool}`;
        else if (r.ready) status = "Ready to move";
        else status = "Set";
      }
      const coordLine = r.coord ? `<span class="profile-pin-row-coord">${r.coord}</span>` : "";
      const btn = r.emptySlot
        ? `<a class="btn-text" href="market.html">Set on Market</a>`
        : `<button type="button" class="btn-text profile-pin-set-active" data-pin-id="${r.id}" ${isA ? "disabled" : ""}>${isA ? "Active" : "Set active"}</button>`;
      return `<div class="profile-pin-row${isA ? " is-active" : ""}${r.emptySlot ? " is-empty" : ""}" data-pin-id="${r.id}">
        <div class="profile-pin-row-main">
          <span class="profile-pin-row-label">${r.label}</span>
          <span class="profile-pin-row-st" data-state="${r.has ? (r.cool ? "cool" : "ready") : "empty"}">${status}</span>
        </div>
        ${coordLine}
        <div class="profile-pin-row-actions">${btn}</div>
      </div>`;
    })
    .join("");

  const roleNote =
    role === "broker"
      ? "Broker service pins also live in Broker HQ. This panel tracks Market search / supply capacity."
      : role === "owner"
        ? "Owners use a supply pin for Wanted discovery on Market."
        : "Seekers use a search pin for property discovery on Market.";

  host.innerHTML = `
    <div class="profile-pin-slots-head">
      <p class="field-label">Map pins · <strong>${used}/${maxP}</strong></p>
      <p class="field-hint">Base 1 · Tier 3+ adds 1 · Boost pkg 4–5 add pin slots · max 3. Cooldown is per pin. Logout clears this device’s pin cache for your account only.</p>
      ${expBits.length ? `<p class="profile-pin-boost-exp">${expBits.join(" · ")}</p>` : ""}
      <p class="field-hint">${roleNote}</p>
    </div>
    <div class="profile-pin-list">${listHtml || `<p class="field-hint">No pin data yet.</p>`}</div>
    <p class="field-hint profile-pin-slots-foot">Open <a href="market.html">Market</a> to drop, move, or fly to a pin. <em>My pin</em> only centers the map — it does not use GPS.</p>`;

  host.querySelectorAll(".profile-pin-set-active").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-pin-id");
      if (!id || !user?.uid) return;
      try {
        localStorage.setItem(`hf_market_active_pin_${user.uid}`, id);
      } catch (_) {}
      try {
        const { setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        await setDoc(doc(db, "users", user.uid), { activePinId: id }, { merge: true });
      } catch (e) {
        console.warn("set active pin", e);
      }
      try {
        await renderPinCapacityCard(role, tIdx, boostDoc);
      } catch (_) {}
    });
  });
}


async function updateBoostButtonState(boostDoc, role) {
    const btn = document.getElementById("boost-btn");
    if (!btn) return;
    const s = resolveBoostPackageId(boostDoc?.seeker);
    const o = resolveBoostPackageId(boostDoc?.owner);
    const parts = [];
    if ((role === "seeker" || role === "broker") && s > 0) parts.push("S" + s);
    if ((role === "owner" || role === "broker") && o > 0) parts.push("L" + o);

    /* Pending orders (SoT: pay ≠ unlock) */
    let pendingParts = [];
    try {
        if (user?.uid) {
            const snap = await getDocs(query(collection(db, "boostOrders"), where("uid", "==", user.uid)));
            snap.forEach((d) => {
                const data = d.data() || {};
                const st = String(data.status || "").toLowerCase();
                if (!["pending", "pending_payment"].includes(st)) return;
                const kind = data.kind === "owner" ? "L" : "S";
                const pid = Number(data.packageId) || 0;
                if (pid) pendingParts.push(`${kind}${pid}…`);
            });
        }
    } catch (_) {}

    const active = parts.length > 0;
    const pending = pendingParts.length > 0;
    if (active || pending) {
        const label = [];
        if (parts.length) label.push(parts.join(" · "));
        if (pendingParts.length) label.push("pending " + pendingParts.join(" "));
        const expBits = [];
        try {
            const se = boostExpiresAt(boostDoc?.seeker);
            const oe = boostExpiresAt(boostDoc?.owner);
            if (se && s) expBits.push(`S until ${se.toLocaleDateString()}`);
            if (oe && o) expBits.push(`L until ${oe.toLocaleDateString()}`);
        } catch (_) {}
        const expStr = expBits.length ? ` · ${expBits.join(" · ")}` : "";
        btn.innerHTML = `<i class='bx bx-rocket'></i> Boost pkgs · ${label.join(" · ")}${expStr}`;
        btn.classList.toggle("is-boosted", active);
        btn.classList.toggle("is-boost-pending", pending && !active);
        btn.title = active
            ? (`Active packages (not tier rank).${expStr ? " " + expBits.join(". ") + "." : ""} Pending = paid/awaiting verify — perks off until approved.`)
            : "Pending verification — payment does not unlock perks yet. Tap for catalog.";
    } else {
        btn.innerHTML = `<i class='bx bx-rocket'></i> Boost pkgs`;
        btn.classList.remove("is-boosted", "is-boost-pending");
        btn.title = "View boost packages — pay stays pending until verified";
    }
}

async function updateCapabilityStats(role, tierIndex, boostDoc, portfolioTierIndexOverride) {
    const mount = document.getElementById("capability-stats");
    if (!mount) return;
    const sPkg = resolveBoostPackageId(boostDoc?.seeker);
    const oPkg = resolveBoostPackageId(boostDoc?.owner);
    const baseRadius = radiusForTier(tierIndex, 0);
    const fullRadius = radiusForTier(tierIndex, sPkg);
    const rBonus = fullRadius - baseRadius;
    const baseCd = cooldownHoursForTier(tierIndex, 0);
    const fullCd = cooldownHoursForTier(tierIndex, sPkg);
    // Portfolio direction (owner/broker "wanted discovery" pin) uses the
    // OWNER-ladder tier index, not the search/discovery-ladder index --
    // for brokers these are two different ladders (SoT §11/§12; see
    // js/market-map.js's discoveryTierIndex vs portfolioTierIndex). Prior
    // code reused `tierIndex` (the broker/search ladder) for both rows,
    // which could show the wrong cooldown hours for a broker's Portfolio row.
    const portfolioTierIndex = portfolioTierIndexOverride != null ? portfolioTierIndexOverride : tierIndex;
    const wantedBase = BASE_WANTED_ACTIVE_CAP || 1;
    const wantedCap = wantedCapForSeekerBoost ? wantedCapForSeekerBoost(sPkg) : (wantedBase + (seekerBoostPackage(sPkg).wantedBonus || 0));

    // Live cooldown status (not just the theoretical window) -- reads the
    // same users/{uid}.mapState / mapStateOwner the Market map actually
    // gates relocation against (js/radius-cooldown.js:getMapState), so
    // this row can't silently disagree with what Market enforces.
    let searchLive = null;
    let portfolioLive = null;
    try {
        if ((role === "seeker" || role === "broker") && user?.uid) {
            searchLive = await getMapState(user.uid, tierIndex, sPkg, "mapState");
        }
        if ((role === "owner" || role === "broker") && user?.uid) {
            portfolioLive = await getMapState(user.uid, portfolioTierIndex, 0, "mapStateOwner");
        }
    } catch (_) { /* live status is a nice-to-have; static window still renders below */ }

    let html = `<div class="cap-stat-grid">`;
    if (role === "seeker" || role === "broker") {
        html += `<div class="cap-stat"><span class="cap-label">Search pin radius</span>
          <span class="cap-value">${baseRadius} km${rBonus > 0 ? ` <span class="cap-boost">+${rBonus} km boost</span>` : ""}</span></div>`;
        html += `<div class="cap-stat"><span class="cap-label">Wanted posts</span>
          <span class="cap-value">up to ${wantedCap}${sPkg ? ` <span class="cap-boost">(boost ${sPkg})</span>` : ""}</span></div>`;
        const liveTxt = searchLive ? (searchLive.cooldownRemainingMs > 0 ? formatCooldown(searchLive.cooldownRemainingMs) : "Ready now") : null;
        html += `<div class="cap-stat cap-stat-wide"><span class="cap-label">Search pin cooldown</span>
          <div class="cooldown-bar-wrap" title="${fullCd}h theoretical window after pin relocate">
            <div class="cooldown-bar-track"><div class="cooldown-bar-fill" style="width:${Math.min(100, (fullCd/72)*100)}%"></div></div>
            <span class="cooldown-bar-time">${fullCd}h window${fullCd < baseCd ? ` <span class="cap-boost">(${baseCd - fullCd}h faster)</span>` : ""}${liveTxt ? ` · <strong>${liveTxt}</strong>` : ""}</span>
          </div></div>`;
    }
    if (role === "owner" || role === "broker") {
        const ownCd = cooldownHoursForTier(portfolioTierIndex, 0);
        const liveTxt = portfolioLive ? (portfolioLive.cooldownRemainingMs > 0 ? formatCooldown(portfolioLive.cooldownRemainingMs) : "Ready now") : null;
        html += `<div class="cap-stat cap-stat-wide"><span class="cap-label">${role === "seeker" ? "Search pin cooldown" : "Portfolio pin cooldown"}</span>
          <div class="cooldown-bar-wrap" title="${ownCd}h after portfolio pin relocate (owner ladder)">
            <div class="cooldown-bar-track"><div class="cooldown-bar-fill" style="width:${Math.min(100, (ownCd/72)*100)}%"></div></div>
            <span class="cooldown-bar-time">${ownCd}h window${liveTxt ? ` · <strong>${liveTxt}</strong>` : ""}</span>
          </div></div>`;
    }
    if (role === "owner" || role === "broker") {
        html += `<div class="cap-stat" id="cap-listing-slots"><span class="cap-label">Listing slots</span>
          <span class="cap-value">…</span></div>`;
        html += `<div class="cap-stat" id="cap-listing-images"><span class="cap-label">Images / listing</span>
          <span class="cap-value">…</span></div>`;
        html += `<div class="cap-stat"><span class="cap-label">Listing boost</span>
          <span class="cap-value">${oPkg ? `Package ${oPkg} <span class="cap-boost">active</span>` : (role === "broker" ? "None — order Listing Boost" : "None")}</span></div>`;
    }
    if (role === "broker" && sPkg) {
        html += `<div class="cap-stat"><span class="cap-label">Seeking boost</span>
          <span class="cap-value">Package ${sPkg} <span class="cap-boost">active</span></span></div>`;
    }
    html += `</div>`;
    mount.innerHTML = html;
    if (role === "owner" || role === "broker") {
        getOwnerListingCapStatus().then(st => {
            const el = document.querySelector("#cap-listing-slots .cap-value");
            if (el) el.innerHTML = `${st.slotsUsed}/${st.listingCap} <span class="cap-boost">used / cap</span>`;
            const im = document.querySelector("#cap-listing-images .cap-value");
            if (im) {
                import("../tiers.js").then(T => {
                    const pkgId = st.effectivePackage || 0;
                    im.textContent = "up to " + T.totalImagesPerListing(tierIndex, pkgId);
                });
            }
        }).catch(() => {});
    }
}

export async function refreshPerks() {
    if (isVisiting) return;
    const panel = document.getElementById("panel-perks");
    if (!panel) return;

    // Immediate UI so cards never sit on "Loading…" if getRole/network stalls
    try {
        const ladder = (SEEKER_TIERS || []).length ? SEEKER_TIERS : [{ name: "Tier 0", min: 0 }, { name: "Tier 1", min: 20 }];
        paintTierCards(ladder, 0, TIER_COPY.seeker);
        const prog = document.getElementById("current-tier-progress-text");
        if (prog && /Loading/i.test(prog.textContent || "")) prog.textContent = "Loading rank…";
    } catch (_) {}

    try {
    const role = await Promise.race([
        getRole(),
        new Promise(r => setTimeout(() => r("seeker"), 5000))
    ]);
    const boostDocEarly = await getBoostDoc().catch(() => ({}));

    const progress = role === "owner" ? await ownerProgress()
        : role === "broker" ? await brokerProgress()
        : await seekerProgress();

    const { tierList, currentIndex: rawIndex, headline, breakdown, totalPoints } = progress;
    const currentIndex = Math.max(0, Math.min((tierList?.length || 1) - 1, Number(rawIndex) || 0));
    const headerChip = document.getElementById("header-tier-chip") || document.getElementById("tier-chip");
    if (headerChip) {
        headerChip.textContent = "T" + currentIndex;
        headerChip.className = "tier-chip-circle t" + currentIndex;
        headerChip.title = (tierList[currentIndex]?.name || ("Tier " + currentIndex));
    }

    const currentTier = tierList[currentIndex] || tierList[0];
    const nextTier = tierList[currentIndex + 1];
    const copy = TIER_COPY[role] || TIER_COPY.seeker;
    const pts = totalPoints != null ? totalPoints : (currentTier?.min || 0);

    const rankTitleEl = document.getElementById("user-rank-title");
    if (rankTitleEl) rankTitleEl.textContent = currentTier.name;
    const avatarTierLabel = document.getElementById("avatar-tier-label");
    if (avatarTierLabel) avatarTierLabel.textContent = currentTier.name;
    document.getElementById("current-tier-progress-text").textContent = headline;

    const progressFill = document.getElementById("perk-progress-fill");
    const nextLabel = document.getElementById("next-tier-target-label");

    if (nextTier) {
        const span = Math.max(1, nextTier.min - currentTier.min);
        const into = Math.max(0, Math.min(span, pts - currentTier.min));
        const pct = ((currentIndex + into / span) / (tierList.length - 1)) * 100;
        progressFill.style.width = `${Math.min(100, pct)}%`;
        nextLabel.textContent = `Next: ${nextTier.name} (${nextTier.min} pts)`;
    } else {
        progressFill.style.width = "100%";
        nextLabel.textContent = "Highest rank reached!";
    }
    updateTierPointsUi(tierList, currentIndex, pts);

    // small per-category/per-property breakdown line -- created once,
    // reused on every refresh
    let breakdownEl = document.getElementById("perks-breakdown-line");
    if (!breakdownEl) {
        breakdownEl = document.createElement("div");
        breakdownEl.id = "perks-breakdown-line";
        breakdownEl.className = "profile-perks-breakdown field-hint";
        document.querySelector(".rank-progress-container")?.appendChild(breakdownEl);
    }
    breakdownEl.textContent = breakdown;

    // avatar ring reflects current tier
    const avatar = document.getElementById("profile-avatar");
    if (avatar) {
        avatar.className = avatar.className.replace(/tier-ring-\d/g, "").trim();
        avatar.classList.add("profile-avatar", "tier-ring-" + currentIndex);
    }

        paintTierCards(tierList, currentIndex, copy);
    await updateBoostButtonState(boostDocEarly, role);
    // Portfolio pin cooldown must use the OWNER ladder even for a broker
    // (see updateCapabilityStats comment) -- reuses the same ownerProgress()
    // this file already has, so no new data source is introduced.
    let portfolioTierIndex = currentIndex;
    if (role === "broker") {
        try {
            const ownerSide = await ownerProgress();
            portfolioTierIndex = ownerSide.currentIndex;
        } catch (_) { /* fall back to broker-ladder index if owner tier doc unavailable */ }
    }
    await updateCapabilityStats(role, currentIndex, boostDocEarly, portfolioTierIndex);

    // Phase 8 organic points strip
    try {
        let host = document.getElementById("organic-points-strip");
        if (!host) {
            const rank = document.querySelector(".profile-rank-block") || document.getElementById("perks-content");
            if (rank) {
                host = document.createElement("div");
                host.id = "organic-points-strip";
                host.className = "organic-points-strip";
                host.setAttribute("data-asset", "profile-organic-points");
                rank.appendChild(host);
            }
        }
        if (host && user?.uid) {
            const total = await getOrganicPointsTotal(user.uid);
            const rev = await getWantedRevealProgress(user.uid);
            host.innerHTML = `<div class="organic-points-inner">
              <span class="op-total"><i class="bx bx-coin"></i> Organic points: <strong>${total}</strong></span>
              <span class="op-reveal field-hint">Wanted reveals today: ${rev.used}/${rev.cap} (+${POINTS.WANTED_REVEAL} each · max ${WANTED_REVEAL_DAILY_CAP}/day)</span>
            </div>`;
        }
    } catch (e) { console.warn("organic points ui", e); }
    } catch (err) {
        console.error("refreshPerks failed:", err);
        const rankTitleEl = document.getElementById("user-rank-title");
        if (rankTitleEl) rankTitleEl.textContent = "Tier 0";
        const prog = document.getElementById("current-tier-progress-text");
        if (prog) prog.textContent = "0 pts · start completing contracts to rank up";
        const { BROKER_TIERS: BT, OWNER_TIERS: OT, SEEKER_TIERS: ST } = await import("../tiers.js").catch(() => ({}));
        const ladder = BT || OT || ST || [{ name: "Tier 0", min: 0 }, { name: "Tier 1", min: 20 }];
        paintTierCards(ladder, 0, TIER_COPY.broker || TIER_COPY.seeker);
        updateTierPointsUi(ladder, 0, 0);
    }
}

if (!isVisiting) refreshPerks();

/* -------- BOOST BUTTON -------- */
/* boosts/{uid} can only ever be written by a trusted backend (see
   firestore.rules -- "allow write: if false" for direct client writes,
   payment webhook only). There's no payment integration yet (see
   docs/CONTRACT-TIER-SYSTEM.md's known-gaps list), so this is
   deliberately an honest status readout + waitlist point, not a fake
   purchase flow that would either silently no-op or require weakening
   that security rule. */

const BOOST_PITCH = {
    owner: `Owner boosts (PayPal): Extra slots → Full Listing Desk add listing capacity and images only. Market access stays free — boosts never unlock browsing. Higher packs replace lower ones (not refundable).`,
    seeker: `Seeker boosts (PayPal): optional reach only — more radius, wanted slots, shorter pin cooldown. Core market browse stays free.`,
    broker: `Brokers see both Seeker and Owner PayPal boost catalogs. Buy independently. Higher pack replaces lower on the same side.`
};

function showBoostToast(message, type = "info"){
    const container = document.getElementById("toast-container");
    if(!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "bx-check-circle" : "bx-info-circle";
    toast.innerHTML = `<i class='bx ${icon}'></i><div><strong>Boost</strong><p>${message}</p></div>`;
    container.appendChild(toast);
    setTimeout(()=>{ toast.classList.add("leaving"); setTimeout(()=> toast.remove(), 300); }, 5500);
}

function openBoostModal() {
    const modal = document.getElementById("boost-packages-modal");
    if (!modal) {
        showBoostToast("Boost panel missing from page.");
        return;
    }
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.classList.add("active", "is-open");
    document.documentElement.classList.add("profile-modal-open");
    lockBodyScroll();
    renderBoostPackages();
}

function closeBoostModal() {
    const modal = document.getElementById("boost-packages-modal");
    modal?.classList.remove("active", "is-open");
    document.documentElement.classList.remove("profile-modal-open");
    unlockBodyScroll();
}

async function renderBoostPackages() {
    /* Single catalog UI: PayPal labels + dual list for brokers (boost-order.js) */
    await renderBoostPackagesList();
}

const boostBtn = document.getElementById("boost-btn");
if (boostBtn) {
    boostBtn.addEventListener("click", () => openBoostModal());
}
document.getElementById("boost-packages-close")?.addEventListener("click", closeBoostModal);
document.getElementById("boost-packages-backdrop")?.addEventListener("click", closeBoostModal);
