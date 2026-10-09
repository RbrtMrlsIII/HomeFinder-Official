// paypal-webhook — public endpoint for PayPal. The PayPal signature is the only authentication.
// Deploy: supabase functions deploy paypal-webhook --no-verify-jwt
import { handleWebhookRequest } from "../_shared/paypal-bridge/http.mjs";
import { getDeps } from "../_shared/paypal-bridge/deps.ts";

Deno.serve(async (req: Request) => {
  try {
    return await handleWebhookRequest(req, getDeps());
  } catch (error) {
    console.error("paypal-webhook", (error as Error)?.message || error);
    return new Response("invalid webhook", { status: 400 });
  }
});
