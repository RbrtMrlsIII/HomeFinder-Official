// paypal-record-approval — Firebase ID token required. Verifies the PayPal subscription with PayPal,
// proves it belongs to the signed-in account (custom_id or email), binds it once, and activates it.
// Deploy: supabase functions deploy paypal-record-approval --no-verify-jwt
import { handleApprovalRequest } from "../_shared/paypal-bridge/http.mjs";
import { getDeps } from "../_shared/paypal-bridge/deps.ts";

Deno.serve(async (req: Request) => {
  try {
    return await handleApprovalRequest(req, getDeps());
  } catch (error) {
    console.error("paypal-record-approval", (error as Error)?.message || error);
    return new Response(JSON.stringify({ error: { code: "internal", message: "Server misconfigured." } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
