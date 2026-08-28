/**
 * Canonical HomeFinder role vocabulary.
 *
 * Current roles:
 * owner, seeker, broker, staff, moderator, admin
 *
 * Legacy aliases are normalized at the boundary and must not propagate.
 */
export const CANONICAL_ROLES = Object.freeze([
  "owner", "seeker", "broker", "staff", "moderator", "admin"
]);

const ALIASES = Object.freeze({
  landlord: "owner",
  property_owner: "owner",
  lessor: "owner",
  super: "admin"
});

export function normalizeCanonicalRole(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (CANONICAL_ROLES.includes(value)) return value;
  return ALIASES[value] || null;
}

export function isCanonicalRole(value) {
  return CANONICAL_ROLES.includes(String(value ?? "").toLowerCase());
}

export function isProductRole(value) {
  return ["owner", "seeker", "broker"].includes(String(value ?? "").toLowerCase());
}

export function isOperationsRole(value) {
  return ["staff", "moderator", "admin"].includes(String(value ?? "").toLowerCase());
}

export function canonicalRoleFromData(data = {}, fallback = null) {
  return normalizeCanonicalRole(
    data?.canonicalRole ?? data?.accountType ?? data?.role ?? fallback
  );
}
