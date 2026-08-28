/* Client route vocabulary. Backend rules remain authoritative.
 * Canonical inventory: docs/contracts/routes/route-authority.json.
 */
export const PUBLIC_ROUTES=Object.freeze([
  "index.html","login.html","register.html","financing.html","privacy.html","terms.html"
]);
export const MARKET_ROLES=Object.freeze(["guest","owner","seeker"]);
export const PRODUCT_ROUTES=Object.freeze({
  "profile.html":["owner","seeker"],
  "broker-hq.html":["broker"]
});
export const OPS_ROUTES=Object.freeze({
  "admin.html":"admin",
  "moderator.html":"moderator",
  "staff.html":"staff"
});
export const VERIFICATION_ROUTES=Object.freeze({
  "verify/index.html":"admin"
});
const OPS_HOME=Object.freeze({staff:"staff.html",moderator:"moderator.html",admin:"admin.html"});
const OPS_ROLES=Object.freeze(Object.keys(OPS_HOME));

function isOpsRole(role){return OPS_ROLES.includes(role);}

function normalizeRoute(route){
  const raw=String(route||"").split("#")[0].split("?")[0].replace(/^\.\//,"");
  return raw.replace(/^\/+/, "");
}

export function routeAccess(route,role="guest"){
  const normalized=normalizeRoute(route);
  const page=normalized.split("/").pop();

  if(PUBLIC_ROUTES.includes(normalized))
    return {allowed:true,mode:"public",redirect:null};

  if(normalized==="market.html")
    return MARKET_ROLES.includes(role)
      ? {allowed:true,mode:"role-aware",redirect:null}
      : {allowed:false,mode:"market-denied",redirect:role==="admin"?"admin.html":role==="moderator"?"moderator.html":role==="staff"?"staff.html":role==="broker"?"broker-hq.html":"login.html"};

  if(Object.hasOwn(PRODUCT_ROUTES,normalized))
    return PRODUCT_ROUTES[normalized].includes(role)
      ? {allowed:true,mode:"authenticated",redirect:null}
      : {allowed:false,mode:"denied",redirect:role==="guest"?"login.html":isOpsRole(role)?OPS_HOME[role]:(role==="broker"?"broker-hq.html":"profile.html")};

  if(Object.hasOwn(OPS_ROUTES,normalized)){
    const needed=OPS_ROUTES[normalized];
    return role===needed
      ? {allowed:true,mode:"ops",redirect:null}
      : {allowed:false,mode:"ops-denied",redirect:role==="guest"?"login.html":isOpsRole(role)?OPS_HOME[role]:role==="broker"?"broker-hq.html":"profile.html"};
  }

  if(Object.hasOwn(VERIFICATION_ROUTES,normalized)){
    const needed=VERIFICATION_ROUTES[normalized];
    return role===needed
      ? {allowed:true,mode:"verification",redirect:null}
      : {allowed:false,mode:"verification-denied",redirect:role==="guest"?"login.html":isOpsRole(role)?OPS_HOME[role]:role==="broker"?"broker-hq.html":"profile.html"};
  }

  // Vendor/development surfaces are not application routes. They must not
  // silently inherit public access merely because their basename is index.html.
  if(normalized.startsWith("3d/") || normalized.startsWith("verify/vendor/"))
    return {allowed:false,mode:"non-product-surface",redirect:"index.html"};

  return {allowed:false,mode:"unknown",redirect:role==="guest"?"login.html":isOpsRole(role)?OPS_HOME[role]:role==="broker"?"broker-hq.html":"profile.html"};
}

export function marketDestination(role){return role==="broker"?"broker-hq.html":"market.html";}
