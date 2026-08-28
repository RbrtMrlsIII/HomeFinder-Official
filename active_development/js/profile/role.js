/* Canonical role resolver for product/profile surfaces. */
import {
  CANONICAL_ROLES,
  normalizeCanonicalRole,
  isProductRole
} from "../canonical-role.js";

export const VALID_ROLES = Object.freeze(CANONICAL_ROLES);

export function normalizeRole(rawAccountType){
    const role = normalizeCanonicalRole(rawAccountType);
    return role || "seeker";
}

let resolvedRole = null;
let resolveRole;
const rolePromise = new Promise(res => { resolveRole = res; });

setTimeout(() => {
    if (resolvedRole == null) {
        resolvedRole = "seeker";
        resolveRole("seeker");
    }
}, 4000);

export function setRole(rawAccountType){
    const role = normalizeRole(rawAccountType);
    resolvedRole = role;
    resolveRole(role);
    return role;
}

export function getRole(){
    if (resolvedRole != null) return Promise.resolve(resolvedRole);
    return rolePromise;
}

export function isProductAccountRole(raw) {
    return isProductRole(normalizeCanonicalRole(raw));
}
