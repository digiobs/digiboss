import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createServiceClient,
  finishIntegrationRun,
  startIntegrationRun,
} from "../_shared/ingestion.ts";
import { fetchCampaigns } from "../_shared/lemlist.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * List every campaign across all configured lemlist workspaces so the Prospects
 * picker can render the "connect a campaign to this client" dropdown. Read-only
 * — the only side effect is a single `integration_sync_runs` audit row.
 *
 * Auth note: JWT verification is disabled in config.toml. The endpoint only
 * returns campaign names (not sensitive); write-side authorization lives in RLS
 * on client_data_mappings.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createServiceClient();
  let runId: string | null = null;
  const startedAt = Date.now();

  try {
    runId = await startIntegrationRun(supabase, {
      provider: "lemlist",
      connector: "list-campaigns",
      clientId: null,
      triggerType: "manual",
      requestPayload: { source: "lemlist-list-campaigns" },
    });

    // Two paths:
    //   1. LEMLIST_API_KEYS set → multi-team via lemlist-multi.ts
    //   2. Only LEMLIST_API_KEY  → single-key via lemlist.ts (original code)
    const multiKeyRaw = Deno.env.get("LEMLIST_API_KEYS");
    const legacyKey = Deno.env.get("LEMLIST_API_KEY");

    type CampaignRow = {
      id: string;
      name: string;
      team_id: string | null;
      team_name: string | null;
    };
    let responseCampaigns: CampaignRow[];

    if (multiKeyRaw && multiKeyRaw.trim()) {
      // Multi-team: dynamic import so compilation issues in lemlist-multi.ts
      // can never break the single-key path.
      const { loadLemlistClients, fetchCampaignsAcrossTeams } = await import(
        "../_shared/lemlist-multi.ts"
      );
      const clients = await loadLemlistClients();
      if (clients.length === 0) {
        throw new Error(
          "LEMLIST_API_KEYS is set but no valid key could be resolved.",
        );
      }
      const campaigns = await fetchCampaignsAcrossTeams(clients);
      responseCampaigns = campaigns.map(
        (c: { id: string; name: string; teamId: string; teamName: string }) => ({
          id: c.id,
          name: c.name,
          team_id: c.teamId ?? null,
          team_name: c.teamName ?? null,
        }),
      );
    } else if (legacyKey) {
      // Single-key: exact same code path as before multi-team support.
      const campaigns = await fetchCampaigns(legacyKey);
      responseCampaigns = campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        team_id: null as string | null,
        team_name: null as string | null,
      }));
    } else {
      throw new Error(
        "No lemlist API key configured. Set LEMLIST_API_KEY (or " +
          "LEMLIST_API_KEYS for multi-team) in Supabase Edge Function secrets.",
      );
    }

    responseCampaigns.sort((a, b) => {
      const teamCmp = (a.team_name ?? "").localeCompare(b.team_name ?? "");
      if (teamCmp !== 0) return teamCmp;
      return a.name.localeCompare(b.name);
    });

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: responseCampaigns.length,
        recordsUpserted: 0,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: responseCampaigns[0]
        ? { firstCampaign: responseCampaigns[0] }
        : null,
    });

    return new Response(
      JSON.stringify({ campaigns: responseCampaigns }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lemlist-list-campaigns]", message);
    await finishIntegrationRun(supabase, runId, {
      status: "failed",
      metrics: { durationMs: Date.now() - startedAt },
      errorMessage: message,
    });
    // Return 200 so supabase.functions.invoke() surfaces the error body
    // instead of a generic "Edge Function returned a non-2xx status code".
    return new Response(JSON.stringify({ campaigns: [], error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
