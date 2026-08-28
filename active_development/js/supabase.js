/* ================================ */
/*  SUPABASE (photo storage only)   */
/* ================================ */
/* Firestore + Auth stay on Firebase. Images go to Supabase Storage. */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://hdeqixswsscyvmziinxt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_eYi4sF7k_Y8_WOKUDgUNFg_s7sulNr2";
export const SUPABASE_FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Public listing photos (marketplace can read). */
export const BUCKET_LISTINGS = "listing-images";

/** Private KYC / PRC documents; access is exclusively through trusted Edge Functions. */
export const BUCKET_KYC = "kyc-documents";

/**
 * Compress an image File to JPEG blob for upload.
 * @param {File} file
 * @param {number} maxSide
 * @param {number} quality 0–1
 * @returns {Promise<Blob>}
 */
export async function compressImageFile(file, maxSide = 1600, quality = 0.82) {
    if (!file) throw new Error("Please choose an image file.");
    const t = (file.type || "").toLowerCase();
    const n = (file.name || "").toLowerCase();
    const ok = /^image\/(jpeg|jpg|png|webp)$/i.test(t)
        || /\.(jpe?g|png|webp)$/i.test(n);
    if (!ok) throw new Error("Please choose a JPG/JPEG image (PNG/WebP may be converted to JPEG before upload).");
    if (t.includes("heic") || t.includes("heif")) {
        throw new Error("HEIC is not supported — use JPG or PNG in the camera/gallery settings.");
    }
    if (file.size === 0) {
        throw new Error("That file is empty (0 bytes) — try picking it again from your gallery.");
    }
    if (file.size > 12 * 1024 * 1024) {
        throw new Error("Image must be under 12 MB before compress.");
    }
    const bitmap = await decodeToBitmapSource(file);
    const srcW = bitmap.width, srcH = bitmap.height;
    const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
    const w = Math.round(srcW * scale);
    const h = Math.round(srcH * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    if (bitmap.close) bitmap.close(); // release ImageBitmap memory, no-op on <img>
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Compress failed"))),
            "image/jpeg",
            quality
        );
    });
}

/**
 * createImageBitmap() is strict and throws "The source image could not be
 * decoded" on some real-world Android gallery/screenshot files it doesn't
 * like (certain color profiles, progressive encodes, or files handed back
 * by a photo picker before they're fully materialized) even though the
 * exact same bytes decode fine as a plain <img>. Try the fast path first;
 * on failure, retry once via <img> + object URL, which is more forgiving.
 * Both paths return something drawImage() accepts (ImageBitmap or
 * HTMLImageElement), each with .width/.height.
 */
async function decodeToBitmapSource(file) {
    try {
        return await createImageBitmap(file);
    } catch (bitmapErr) {
        console.warn("createImageBitmap failed, retrying via <img>:", bitmapErr);
        try {
            return await decodeViaImageElement(file);
        } catch (imgErr) {
            console.warn("Fallback <img> decode also failed:", imgErr);
            throw new Error("The source image could not be decoded.");
        }
    }
}

function decodeViaImageElement(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image element decode failed")); };
        img.src = url;
    });
}

/**
 * Upload a blob to a bucket path. Returns public URL when bucket is public,
 * otherwise returns the storage path (and a short-lived signed URL if possible).
 *
 * @param {string} bucket
 * @param {string} path  e.g. "{uid}/id-123.jpg"
 * @param {Blob} blob
 * @param {{ upsert?: boolean, publicBucket?: boolean }} opts
 */
export async function uploadListingImageViaEdge(firebaseIdToken, path, blob) {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/upload-listing-image`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${firebaseIdToken}`,
            "Content-Type": "image/jpeg",
            "x-listing-path": path
        },
        body: blob
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText || "Listing image upload failed");
    return { path: data.path, url: data.url || null };
}

/**
 * Listing photo path: listing-images/{ownerUid}/{listingIdOrTemp}/{n}.jpg
 */
export function listingImagePath(ownerUid, folderId, index) {
    return `${ownerUid}/${folderId}/${index}.jpg`;
}

/**
 * KYC path: kyc-documents/{uid}/gov-id.jpg | prc.jpg
 */
export function kycImagePath(uid, kind) {
    const safe = kind === "broker" ? "prc" : "gov-id";
    return `${uid}/${safe}-${Date.now()}.jpg`;
}


/**
 * KYC upload through Edge Function (service_role). Direct anon upload
 * is blocked by RLS on kyc-documents after hardening.
 * @param {string} firebaseIdToken
 * @param {Blob} blob
 * @param {"id"|"broker"} kind
 */
export async function uploadKycViaEdge(firebaseIdToken, blob, kind = "id") {
    const url = `${SUPABASE_FUNCTIONS_BASE_URL}/upload-kyc-document`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${firebaseIdToken}`,
            "Content-Type": "image/jpeg",
            "x-kyc-kind": kind === "broker" ? "broker" : "id",
        },
        body: blob,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || res.statusText || "KYC upload failed");
    }
    return { path: data.path, url: null };
}
