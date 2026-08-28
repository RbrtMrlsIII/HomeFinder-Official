/**
 * Runtime route authority index.
 * Canonical machine-readable source: docs/contracts/routes/route-authority.json
 *
 * This module intentionally keeps only the runtime access vocabulary; the
 * JSON contract is the authoritative inventory and verification source.
 */
export const ROUTE_CLASSES = Object.freeze([
  "public", "product", "operations", "verification", "development", "vendor"
]);

export const CANONICAL_ROUTES = Object.freeze({
  "index.html": "public",
  "login.html": "public",
  "register.html": "public",
  "market.html": "product",
  "profile.html": "product",
  "broker-hq.html": "product",
  "admin.html": "operations",
  "moderator.html": "operations",
  "staff.html": "operations",
  "financing.html": "public",
  "privacy.html": "public",
  "terms.html": "public",
  "verify/index.html": "verification"
});
