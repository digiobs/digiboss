// Shared helper that returns a valid Wrike access token for every
// Wrike edge function in this project. The token is stored globally in
// `app_integration_tokens` (provider = 'wrike') and refreshed lazily
// when it gets close to expiration.
//
// Fallback: if no row is present in the table, we fall back to the
// legacy `WRIKE_ACCESS_TOKEN` env var so existing deployments keep
// working during the OAuth migration.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const WRIKE_TOKEN_URL = "https://login.wrike.com/oauth2/token";
const DEFAULT_HOST = "www.wrike.com";
const REFRESH_WINDOW_MS = 60 * 1000; // refresh if the token expires in < 60s

export type WrikeTokenBundle = {
  token: string;
  apiHost: string; // e.g. www.wrike.com — always without scheme
  apiBase: string; // e.g. https://www.wrike.com/api/v4
  source: "oauth" | "env";
};

type AppIntegrationTokenRow = {
  provider: string;
  access_token: string;
  refresh_token: string | null;
  api_host: string | null;
  expires_at: string | null;
};

function buildApiBase(host: string | null | undefined): { apiHost: string; apiBase: string } {
  const apiHost = (host ?? DEFAULT_HOST).replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return { apiHost, apiBase: `https://${apiHost}/api/v4` };
}

function makeServiceClient(): SupabaseClient {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase runtime secrets missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Refresh a Wrike access token using its refresh token. Updates the row
 * in `app_integration_tokens` and returns the fresh access token.
 */
async function refreshWrikeToken(
  supabase: SupabaseClient,
  row: AppIntegrationTokenRow,
): Promise<AppIntegrationTokenRow> {
  const clientId = Deno.env.get("WRIKE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("WRIKE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error(
      "Cannot refresh Wrike token: WRIKE_OAUTH_CLIENT_ID / WRIKE_OAUTH_CLIENT_SECRET not configured",
    );
  }
  if (!row.refresh_token) {
    throw new Error("Cannot refresh Wrike token: no refresh_token stored");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
  });

  const resp = await fetch(WRIKE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Wrike token refresh failed [${resp.status}]: ${text.slice(0, 500)}`);
  }
  const json = (await resp.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    host?: string;
    expires_in?: number;
    scope?: string;
  };

  const expiresAt = json.expires_in
    ? new Date(Date.now() + json.expires_in * 1000).toISOString()
    : null;

  const next: AppIntegrationTokenRow = {
    provider: "wrike",
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? row.refresh_token,
    api_host: json.host ?? row.api_host,
    expires_at: expiresAt,
  };

  const { error } = await supabase
    .from("app_integration_tokens")
    .update({
      access_token: next.access_token,
      refresh_token: next.refresh_token,
      api_host: next.api_host,
      expires_at: next.expires_at,
      token_type: json.token_type ?? "bearer",
      scope: json.scope ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("provider", "wrike");
  if (error) {
    console.warn("[wrike-token] failed to persist refreshed token:", error.message);
  }

  return next;
}

/**
 * Returns a valid Wrike access token and the correct API base URL.
 * Refreshes the token if it is about to expire.
 */
export async function getWrikeToken(
  supabaseArg?: SupabaseClient,
): Promise<WrikeTokenBundle> {
  const supabase = supabaseArg ?? makeServiceClient();

  const { data, error } = await supabase
    .from("app_integration_tokens")
    .select("provider, access_token, refresh_token, api_host, expires_at")
    .eq("provider", "wrike")
    .maybeSingle();

  if (error) {
    console.warn("[wrike-token] DB lookup failed, falling back to env:", error.message);
  }

  let row = data as AppIntegrationTokenRow | null;

  if (row?.access_token) {
    const expiresAtMs = row.expires_at ? new Date(row.expires_at).getTime() : Infinity;
    if (Number.isFinite(expiresAtMs) && expiresAtMs - Date.now() < REFRESH_WINDOW_MS) {
      try {
        row = await refreshWrikeToken(supabase, row);
      } catch (err) {
        console.warn("[wrike-token] refresh failed, using stale token:", err);
      }
    }
    const { apiHost, apiBase } = buildApiBase(row.api_host);
    return { token: row.access_token, apiHost, apiBase, source: "oauth" };
  }

  // Legacy fallback: permanent token stored as an env var.
  const envToken = Deno.env.get("WRIKE_ACCESS_TOKEN");
  if (envToken) {
    const { apiHost, apiBase } = buildApiBase(DEFAULT_HOST);
    return { token: envToken, apiHost, apiBase, source: "env" };
  }

  throw new Error(
    "No Wrike credentials: connect Wrike from /settings/integrations or set WRIKE_ACCESS_TOKEN",
  );
}
