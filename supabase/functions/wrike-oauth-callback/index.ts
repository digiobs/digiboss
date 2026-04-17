import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WRIKE_TOKEN_URL = "https://login.wrike.com/oauth2/token";

/**
 * Step 3/3 of the OAuth dance. Called from the browser callback page
 * (/oauth/wrike/callback) with `{ code, state }`. We validate the state
 * against `app_integration_oauth_states`, exchange the code for tokens
 * at Wrike, and upsert `app_integration_tokens` (provider='wrike').
 *
 * This function is invoked via supabase.functions.invoke, so JWT is
 * verified normally — the callback page only loads for signed-in users.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const WRIKE_OAUTH_CLIENT_ID = Deno.env.get("WRIKE_OAUTH_CLIENT_ID");
    const WRIKE_OAUTH_CLIENT_SECRET = Deno.env.get("WRIKE_OAUTH_CLIENT_SECRET");
    const WRIKE_OAUTH_REDIRECT_URI = Deno.env.get("WRIKE_OAUTH_REDIRECT_URI");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("Missing Supabase runtime secrets", 500);
    }
    if (!WRIKE_OAUTH_CLIENT_ID || !WRIKE_OAUTH_CLIENT_SECRET || !WRIKE_OAUTH_REDIRECT_URI) {
      return jsonError(
        "Wrike OAuth app not configured (WRIKE_OAUTH_CLIENT_ID / _SECRET / _REDIRECT_URI).",
        500,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const code: string | undefined = body?.code;
    const state: string | undefined = body?.state;
    if (!code || !state) {
      return jsonError("code and state are required", 400);
    }

    // 1. Validate state (CSRF) and consume it.
    const { data: stateRow, error: stateError } = await supabase
      .from("app_integration_oauth_states")
      .select("state, provider, created_by, expires_at")
      .eq("state", state)
      .eq("provider", "wrike")
      .maybeSingle();

    if (stateError) {
      return jsonError(`State lookup failed: ${stateError.message}`, 500);
    }
    if (!stateRow) {
      return jsonError("Invalid or unknown state", 400);
    }
    if (new Date(stateRow.expires_at as string).getTime() < Date.now()) {
      return jsonError("OAuth state expired, please retry", 400);
    }

    // Burn the state immediately so it can't be replayed.
    await supabase
      .from("app_integration_oauth_states")
      .delete()
      .eq("state", state);

    // 2. Exchange the authorization code for an access token.
    const tokenParams = new URLSearchParams({
      client_id: WRIKE_OAUTH_CLIENT_ID,
      client_secret: WRIKE_OAUTH_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: WRIKE_OAUTH_REDIRECT_URI,
    });

    const tokenResp = await fetch(WRIKE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });
    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      return jsonError(
        `Wrike token exchange failed [${tokenResp.status}]: ${text.slice(0, 500)}`,
        502,
      );
    }
    const tokenJson = (await tokenResp.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      host?: string;
      expires_in?: number;
      scope?: string;
    };

    if (!tokenJson.access_token) {
      return jsonError("Wrike did not return an access_token", 502);
    }

    const expiresAt = tokenJson.expires_in
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : null;

    // 3. Persist. Upsert on provider so re-connecting overwrites the row.
    const { error: upsertError } = await supabase
      .from("app_integration_tokens")
      .upsert(
        {
          provider: "wrike",
          access_token: tokenJson.access_token,
          refresh_token: tokenJson.refresh_token ?? null,
          token_type: tokenJson.token_type ?? "bearer",
          api_host: tokenJson.host ?? "www.wrike.com",
          expires_at: expiresAt,
          scope: tokenJson.scope ?? null,
          connected_by: stateRow.created_by as string | null,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider" },
      );
    if (upsertError) {
      return jsonError(`Failed to persist token: ${upsertError.message}`, 500);
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        api_host: tokenJson.host ?? "www.wrike.com",
        expires_at: expiresAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[wrike-oauth-callback] unhandled error:", error);
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
