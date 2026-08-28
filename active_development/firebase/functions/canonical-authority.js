const CANONICAL_ROLES = new Set([
  "owner", "seeker", "broker", "staff", "moderator", "admin"
]);

const ROLE_ALIASES = Object.freeze({
  landlord: "owner",
  property_owner: "owner",
  lessor: "owner",
  super: "admin"
});

function normalizeCanonicalRole(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (CANONICAL_ROLES.has(value)) return value;
  return ROLE_ALIASES[value] || null;
}

async function canonicalRoleForUser(db, uid) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return normalizeCanonicalRole(data.canonicalRole || data.accountType || data.role);
}

module.exports = { normalizeCanonicalRole, canonicalRoleForUser };
