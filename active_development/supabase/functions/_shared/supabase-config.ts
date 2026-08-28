export const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") || "https://hdeqixswsscyvmziinxt.supabase.co";

export const STORAGE_BUCKETS = Object.freeze({
  listingImages: "listing-images",
  kycDocuments: "kyc-documents",
});
