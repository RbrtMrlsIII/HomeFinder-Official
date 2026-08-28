/**
 * Pins model — capacity, slots, active id, optional users.pins map.
 * Primary centers still sync via mapState / mapStateOwner for rules.
 * Extra slots live under users/{uid}.pins[pinId].
 */
import { maxPinsForAccount, activeBoostPackageIds } from "./tiers.js";

export function activePinStorageKey(uid) {
  return `hf_market_active_pin_${uid || "guest"}`;
}

export function readActivePinId(uid) {
  try {
    return localStorage.getItem(activePinStorageKey(uid)) || null;
  } catch (_) {
    return null;
  }
}

export function writeActivePinId(uid, pinId) {
  try {
    if (uid && pinId) localStorage.setItem(activePinStorageKey(uid), pinId);
  } catch (_) {}
}

function centerOf(raw) {
  if (!raw) return null;
  const c = raw.center || raw.lastKnownCenter || raw;
  if (!Number.isFinite(Number(c?.lat)) || !Number.isFinite(Number(c?.lng))) return null;
  return { lat: Number(c.lat), lng: Number(c.lng) };
}

/**
 * @returns {{ id: string, kind: "discovery"|"supply", center: {lat,lng}|null, label: string, stateField?: string, empty?: boolean }[]}
 */
export function buildPinSlots({
  role = "seeker",
  tierIndex = 0,
  seekerPackageId = 0,
  ownerPackageId = 0,
  seekerBoost = null,
  ownerBoost = null,
  mapState = null,
  mapStateOwner = null,
  userPins = null,
} = {}) {
  const r = String(role || "seeker");
  const seekerIds = seekerBoost && typeof seekerBoost === "object"
    ? activeBoostPackageIds(seekerBoost)
    : (Array.isArray(seekerBoost) ? seekerBoost.map(Number) : (seekerPackageId ? [Number(seekerPackageId)] : []));
  const ownerIds = ownerBoost && typeof ownerBoost === "object"
    ? activeBoostPackageIds(ownerBoost)
    : (Array.isArray(ownerBoost) ? ownerBoost.map(Number) : (ownerPackageId ? [Number(ownerPackageId)] : []));

  const max = maxPinsForAccount({
    role: r, tierIndex, seekerPackageId, ownerPackageId,
    seekerActivePackageIds: seekerIds, ownerActivePackageIds: ownerIds
  });

  const discC = centerOf(mapState?.lastKnownCenter);
  const supplyC = centerOf(mapStateOwner?.lastKnownCenter);
  const slots = [];

  if (r === "owner") {
    slots.push({ id:"supply-1", kind:"supply", center:supplyC, label:"Supply pin", stateField:"mapStateOwner", entitlementKey:"base-owner" });
  } else if (r === "seeker") {
    slots.push({ id:"discovery-1", kind:"discovery", center:discC, label:"Search pin", stateField:"mapState", entitlementKey:"base-seeker" });
  } else {
    slots.push({ id:"discovery-1", kind:"discovery", center:discC, label:"Search pin", stateField:"mapState", entitlementKey:"base-seeker" });
    slots.push({ id:"supply-1", kind:"supply", center:supplyC, label:"Supply pin", stateField:"mapStateOwner", entitlementKey:"base-owner" });
  }

  if (Number(tierIndex) >= 3) {
    const raw = userPins?.["tier-3-pin"];
    slots.push({
      id:"tier-3-pin",
      kind:r === "owner" ? "supply" : "discovery",
      center:centerOf(raw),
      label:"Tier 3 pin",
      stateField:r === "owner" ? "mapStateOwner" : "mapState",
      entitlementKey:"tier-3",
      fromUserPins:!!raw
    });
  }

  const addBoostSlots = (ids, line, kind, stateField) => {
    for (const id of ids.filter(n => n >= 3 && n <= 5)) {
      const pinId = `${line}-${id}`;
      const raw = userPins?.[pinId] || null;
      slots.push({
        id:pinId,
        kind,
        center:centerOf(raw),
        label:`${line === "seeker" ? "Seeking" : "Listing"} Boost ${id} pin`,
        stateField,
        entitlementKey:`${line}-${id}`,
        requiredBoostPackage:id,
        fromUserPins:!!raw
      });
    }
  };
  if (r === "seeker" || r === "broker") addBoostSlots(seekerIds, "seeker", "discovery", "mapState");
  if (r === "owner" || r === "broker") addBoostSlots(ownerIds, "owner", "supply", "mapStateOwner");

  // Legacy pin IDs remain visible only while within current capacity.
  const used = new Set(slots.map(s => s.id));
  if (userPins && typeof userPins === "object") {
    for (const [id, raw] of Object.entries(userPins)) {
      if (used.has(id) || slots.length >= max) continue;
      const kind = raw?.kind === "supply" ? "supply" : "discovery";
      if (r === "owner" && kind !== "supply") continue;
      if (r === "seeker" && kind !== "discovery") continue;
      slots.push({
        id, kind, center:centerOf(raw), label:raw?.label || `Pin ${slots.length+1}`,
        stateField:kind === "supply" ? "mapStateOwner" : "mapState",
        fromUserPins:true, legacy:true
      });
    }
  }
  return slots.slice(0, max);
}

export function resolveActivePin(slots, uid, preferredKind = null) {
  if (!slots.length) return null;
  const saved = readActivePinId(uid);
  let active = slots.find((s) => s.id === saved);
  if (!active && preferredKind) {
    active = slots.find((s) => s.kind === preferredKind && s.center);
  }
  if (!active) active = slots.find((s) => s.center) || slots[0];
  if (active && uid) writeActivePinId(uid, active.id);
  return active;
}

export function nextPinWithCenter(slots, currentId) {
  const withC = slots.filter((s) => s.center);
  if (!withC.length) return null;
  const i = withC.findIndex((s) => s.id === currentId);
  return withC[(i + 1) % withC.length] || withC[0];
}

/** Client-side cooldown for users.pins entries (hours from tier table). */
export function userPinCooldownRemainingMs(pinRaw, cooldownHours) {
  if (!pinRaw) return 0;
  let last = pinRaw.lastRelocatedAt;
  try {
    if (last && typeof last.toDate === "function") last = last.toDate();
    else if (last && last.seconds != null) last = new Date(Number(last.seconds) * 1000);
    else if (typeof last === "string" || typeof last === "number") last = new Date(last);
  } catch (_) {
    return 0;
  }
  if (!(last instanceof Date) || Number.isNaN(last.getTime())) return 0;
  const ms = Math.max(0, Number(cooldownHours) || 24) * 3600 * 1000;
  const elapsed = Date.now() - last.getTime();
  if (elapsed < 0) return ms;
  if (elapsed >= ms) return 0;
  return ms - elapsed;
}

export function canMoveUserPin(pinRaw, cooldownHours) {
  return userPinCooldownRemainingMs(pinRaw, cooldownHours) <= 0;
}
