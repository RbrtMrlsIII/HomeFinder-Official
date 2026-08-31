/**
 * HomeFinder controlled inter-house navigation.
 * This is a logical transport layer, not physical SH3D traversal.
 * Physical travel never changes authenticated identity or role.
 */
import { routeAccess } from "./route-access-contract.js";

export const INTER_HOUSE_TRANSITIONS = Object.freeze({
  "house-1": Object.freeze(["house-2", "house-3"]),
  "house-2": Object.freeze(["house-1"]),
  "house-3": Object.freeze(["house-1"])
});

const DESTINATIONS = Object.freeze({
  "house-1": Object.freeze({
    guest: "index.html", owner: "index.html", seeker: "index.html", broker: "index.html",
    admin: "index.html", moderator: "index.html", staff: "index.html"
  }),
  "house-2": Object.freeze({
    guest: "login.html", owner: "profile.html", seeker: "profile.html", broker: "broker-hq.html",
    admin: "admin.html", moderator: "moderator.html", staff: "staff.html"
  }),
  "house-3": Object.freeze({
    guest: "login.html", owner: "market.html", seeker: "market.html", broker: "broker-hq.html",
    admin: "admin.html", moderator: "moderator.html", staff: "staff.html"
  })
});

export function canTravelBetween(fromHouse, toHouse) {
  return Array.isArray(INTER_HOUSE_TRANSITIONS[fromHouse]) &&
    INTER_HOUSE_TRANSITIONS[fromHouse].includes(toHouse);
}

export function destinationFor(house, role = "guest") {
  const destinations = DESTINATIONS[house];
  return destinations?.[role] ?? "login.html";
}

/**
 * Convert an application-root route vocabulary entry into a root-relative
 * href. The 3D viewer lives several directories below the application root,
 * so a bare "login.html" would resolve under the viewer folder.
 *
 * 5.5G.6M.3: this is the smallest routing correction that preserves the
 * existing role × house destination model.
 */
export function toApplicationHref(route) {
  if (route == null) return route;
  const value = String(route).trim();
  if (!value) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

export function planInterHouseTransition(fromHouse, toHouse, role = "guest") {
  if (fromHouse === toHouse) {
    return { allowed: true, mode: "same-house", fromHouse, toHouse, role, route: destinationFor(toHouse, role), legs: [] };
  }

  if ((fromHouse === "house-2" && toHouse === "house-3") ||
      (fromHouse === "house-3" && toHouse === "house-2")) {
    return {
      allowed: false,
      mode: "forbidden-direct",
      fromHouse, toHouse, role,
      route: null,
      legs: []
    };
  }

  if (!canTravelBetween(fromHouse, toHouse)) {
    return { allowed: false, mode: "unknown-transition", fromHouse, toHouse, role, route: null, legs: [] };
  }

  const route = destinationFor(toHouse, role);
  const access = routeAccess(route, role);
  return {
    allowed: access.allowed,
    mode: access.allowed ? "controlled-transport" : "access-denied",
    fromHouse,
    toHouse,
    role,
    route: access.allowed ? route : access.redirect,
    legs: [{ from: fromHouse, to: toHouse, route: access.allowed ? route : access.redirect }],
    access
  };
}

export function planJourney(fromHouse, toHouse, role = "guest") {
  if (fromHouse === toHouse) return planInterHouseTransition(fromHouse, toHouse, role);
  if ((fromHouse === "house-2" && toHouse === "house-3") ||
      (fromHouse === "house-3" && toHouse === "house-2")) {
    const first = planInterHouseTransition(fromHouse, "house-1", role);
    const second = planInterHouseTransition("house-1", toHouse, role);
    return {
      allowed: first.allowed && second.allowed,
      mode: "hub-routed",
      fromHouse, toHouse, role,
      legs: [first, second]
    };
  }
  return planInterHouseTransition(fromHouse, toHouse, role);
}

if (typeof window !== "undefined") {
  window.HomeFinderInterHouseNavigation = Object.freeze({
    canTravelBetween,
    destinationFor,
    toApplicationHref,
    planInterHouseTransition,
    planJourney
  });
}
