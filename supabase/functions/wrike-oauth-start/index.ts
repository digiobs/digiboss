import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WRIKE_AUTHORIZE_URL = "https://login.wrike.com/oauth2/authorize/v4";

/**
 * Step 1/3 of the OAuth dance. The UI calls this when the admin clicks
 * "Connect Wrike". We generate a CSRF state, persist it, and return the
 * fully-formed Wrike authorize URL. The UI then redirects the user there.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const WRIKE_OAUTH_CLIENT_ID = Deno.env.get("WRIKE_OAUTH_CLIENT_ID");
    const WRIKE_OAUTH_REDIRECT_URI = Deno.env.get("WRIKE_OAUTH_REDIRECT_URI");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("Missing Supabase runtime secrets", 500);
    }
    if (!WRIKE_OAUTH_CLIENT_ID) {
      return jsonError(
        "WRIKE_OAUTH_CLIENT_ID not configured. Create a Wrike OAuth app and set this secret.",
        500,
      );
    }
    if (!WRIKE_OAUTH_REDIRECT_URI) {
      return jsonError(
        "WRIKE_OAUTH_REDIRECT_URI not configured (e.g. https://app.example.com/oauth/wrike/callback).",
        500,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const redirectTo: string | null = body?.redirectTo ?? null;

    // Try to identify the admin user from the JWT for audit trail.
    const authHeader = req.headers.get("authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let userId: string | null = null;
    if (jwt) {
      const { data: userData } = await supabase.auth.getUser(jwt);
      userId = userData?.user?.id ?? null;
    }

    // CSRF state (cryptographic, single-use).
    const state = crypto.randomUUID() + "." + crypto.randomUUID();

    const { error: insertError } = await supabase
      .from("app_integration_oauth_states")
      .insert({
        state,
        provider: "wrike",
        created_by: userId,
        redirect_to: redirectTo,
      });
    if (insertError) {
      return jsonError(`Failed to store state: ${insertError.message}`, 500);
    }

    // Purge expired states opportunistically.
    await supabase
      .from("app_integration_oauth_states")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .then(() => undefined)
      .catch(() => undefined);

    const url = new URL(WRIKE_AUTHORIZE_URL);
    url.searchParams.set("client_id", WRIKE_OAUTH_CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", WRIKE_OAUTH_REDIRECT_URI);
    url.searchParams.set("state", state);
    // Wrike doesn't require explicit scopes: the app's permissions are
    // configured in the OAuth app settings on Wrike's side.

    return new Response(
      JSON.stringify({ authorizeUrl: url.toString(), state }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[wrike-oauth-start] unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
});

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
