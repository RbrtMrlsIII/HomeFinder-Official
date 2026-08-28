/* HomeFinder Patch 37 — Authority Contract
 *
 * Client-side authority vocabulary only. This module is a UI/navigation gate
 * and smoke-test helper. It MUST NOT be treated as backend security.
 * Backend enforcement remains in Firestore rules / callable functions.
 */

export const PRODUCT_ROLES = Object.freeze(["owner", "seeker", "broker"]);
export const OPS_ROLES = Object.freeze(["staff", "moderator", "admin"]);

export const OPS_HOME = Object.freeze({
  staff: "staff.html",
  moderator: "moderator.html",
  admin: "admin.html"
});

export const CAPABILITIES = Object.freeze({
  "ops.staffTasks": Object.freeze(["staff", "admin"]),
  "ops.moderatorTasks": Object.freeze(["moderator", "admin"]),
  "ops.adminTasks": Object.freeze(["admin"]),
  "admin.manageUser": Object.freeze(["admin"]),
  "admin.grantBoost": Object.freeze(["admin"]),
  "admin.grantSubscription": Object.freeze(["admin"]),
  "ops.supportTicketManagement": Object.freeze(["staff", "moderator", "admin"]),
  "ops.boostOrderReview": Object.freeze(["staff", "moderator", "admin"]),
  "ops.assistanceRequestRead": Object.freeze(["staff", "moderator", "admin"]),
  "ops.reportModeration": Object.freeze(["staff", "moderator", "admin"]),
  "ops.kycReferenceInspection": Object.freeze(["admin"]),
  "ops.boostInspection": Object.freeze(["staff", "moderator", "admin"]),
  "ops.contractRead": Object.freeze(["staff", "moderator", "admin"]),
  "ops.notificationResolution": Object.freeze(["staff", "moderator", "admin"]),
  "broker.hq": Object.freeze(["broker"])
});

export function hasCapability(role, capability) {
  return !!role && (CAPABILITIES[capability] || []).includes(role);
}

export function consoleVisibleForRole(role, consoleRole) {
  return role === consoleRole;
}

export function expectedOpsHome(role) {
  return OPS_HOME[role] || "profile.html";
}

export function isOpsRole(role) {
  return OPS_ROLES.includes(role);
}

export function isProductRole(role) {
  return PRODUCT_ROLES.includes(role);
}


export const ROUTE_VISIBILITY=Object.freeze({
  guest:["index.html","login.html","register.html","market.html","financing.html","privacy.html","terms.html"],
  seeker:["index.html","market.html","profile.html","financing.html","privacy.html","terms.html"],
  owner:["index.html","market.html","profile.html","financing.html","privacy.html","terms.html"],
  broker:["index.html","profile.html","broker-hq.html","privacy.html","terms.html"],
  staff:["staff.html","privacy.html","terms.html"],
  moderator:["moderator.html","privacy.html","terms.html"],
  admin:["admin.html","privacy.html","terms.html"]
});
export function routeVisibleForRole(role,route){const page=String(route||"").split("?")[0].split("/").pop();return (ROUTE_VISIBILITY[role]||[]).includes(page);}
