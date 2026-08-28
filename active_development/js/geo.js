/* ================================ */
/*  GEO                             */
/* ================================ */
/* Distance math + default map center, shared by every map component. */

/* Haversine distance between two lat/lng points, in kilometers. */
export function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius, km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Manila city center -- DEFAULT fallback map center for anyone who
   hasn't set a search location yet. */
export const DEFAULT_MAP_CENTER = { lat: 14.5995, lng: 120.9842 };
