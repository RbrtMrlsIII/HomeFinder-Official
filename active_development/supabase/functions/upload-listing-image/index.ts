// upload-listing-image — Firebase identity + canonical role required.
// Public listing images are readable by everyone, but browser clients must not
// receive direct write authority to the Supabase storage bucket.
import { verifyFirebaseIdToken, canonicalRole } from "../_shared/firebase-auth.ts";
import { fetchUserDoc } from "../_shared/firestore-rest.ts";
import { SUPABASE_URL, STORAGE_BUCKETS } from "../_shared/supabase-config.ts";
import { isJpegBytes } from "../_shared/jpeg.ts";

const BUCKET = STORAGE_BUCKETS.listingImages;

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, content-type, x-listing-path",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "POST only" }, 405, origin);

  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "unauthenticated", message: "Sign in required." }, 401, origin);

    const payload = await verifyFirebaseIdToken(token);
    const uid = String(payload.sub || "");
    if (!uid) return json({ error: "unauthenticated", message: "Invalid Firebase identity." }, 401, origin);

    const userDoc = await fetchUserDoc(uid);
    const role = canonicalRole(userDoc?.canonicalRole || userDoc?.accountType || userDoc?.role);
    if (!["owner", "broker"].includes(role || "")) {
      return json({ error: "permission-denied", message: "Only owners and brokers may upload listing images." }, 403, origin);
    }

    const path = String(req.headers.get("x-listing-path") || "").trim();
    const pathPattern = new RegExp(`^${uid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[A-Za-z0-9_-]+/\\d+\\.jpg$`);
    if (!pathPattern.test(path)) {
      return json({ error: "invalid-argument", message: "Invalid listing image path." }, 400, origin);
    }

    const body = new Uint8Array(await req.arrayBuffer());
    if (!body.byteLength || body.byteLength > 12 * 1024 * 1024) {
      return json({ error: "invalid-argument", message: "Image must be between 1 byte and 12 MB." }, 400, origin);
    }
    if (!isJpegBytes(body)) {
      return json({ error: "invalid-argument", message: "Only JPEG/JPG image bytes are accepted." }, 400, origin);
    }

    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!serviceKey) return json({ error: "failed-precondition", message: "Storage service is not configured." }, 500, origin);

    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(path)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body,
    });
    if (!up.ok) return json({ error: await up.text() || up.statusText }, 400, origin);

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURI(path)}`;
    return json({ path, url: publicUrl }, 200, origin);
  } catch (error) {
    console.error("upload-listing-image failed", error);
    return json({ error: "upload-failed", message: String(error?.message || error) }, 400, origin);
  }
});
