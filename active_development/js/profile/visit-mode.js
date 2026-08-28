/* Shared visitor flag — import before loading own profile chrome */
export const visitUid = new URLSearchParams(location.search).get("uid");
export const isVisiting = !!(visitUid && visitUid.length > 10);
