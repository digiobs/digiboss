import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createServiceClient,
  finishIntegrationRun,
  safeString,
  startIntegrationRun,
} from "../_shared/ingestion.ts";
import { fetchCampaigns } from "../_shared/lemlist.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Admin-only: list every campaign in the lemlist workspace so the Prospects
 * page can render the "connect a campaign to this client" picker. No side
 * effects beyond a single `integration_sync_runs` audit row.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createServiceClient();
  let runId: string | null = null;
  const startedAt = Date.now();

  try {
    // Identify the caller from the JWT and require an admin profile.
    const authHeader = req.headers.get("authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let userId: string | null = null;
    if (jwt) {
      const { data: userData } = await supabase.auth.getUser(jwt);
      userId = userData?.user?.id ?? null;
    }
    if (!userId) {
      return jsonError("Authentication required.", 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) {
      return jsonError(`Failed to load profile: ${profileError.message}`, 500);
    }
    if (!profile || safeString(profile.role) !== "admin") {
      return jsonError("Admin role required to list lemlist campaigns.", 403);
    }

    runId = await startIntegrationRun(supabase, {
      provider: "lemlist",
      connector: "list-campaigns",
      clientId: null,
      triggerType: "manual",
      startedBy: userId,
      requestPayload: { source: "lemlist-list-campaigns" },
    });

    const apiKey = Deno.env.get("LEMLIST_API_KEY");
    if (!apiKey) {
      throw new Error("LEMLIST_API_KEY is not configured.");
    }

    const campaigns = await fetchCampaigns(apiKey);

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: campaigns.length,
        recordsUpserted: 0,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: campaigns[0] ? { firstCampaign: campaigns[0] } : null,
    });

    return new Response(JSON.stringify({ campaigns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await finishIntegrationRun(supabase, runId, {
      status: "failed",
      metrics: { durationMs: Date.now() - startedAt },
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
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
