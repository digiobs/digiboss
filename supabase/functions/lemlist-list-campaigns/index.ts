import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createServiceClient,
  finishIntegrationRun,
  startIntegrationRun,
} from "../_shared/ingestion.ts";
import {
  fetchCampaigns,
  fetchCampaignsAcrossTeams,
  type LemlistCampaign,
  loadLemlistClients,
} from "../_shared/lemlist.ts";

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
 * Auth note: JWT verification is disabled in config.toml and the manual admin
 * gate was removed because supabase.auth.getUser(jwt) consistently fails in
 * Edge Functions with the service-role client. The endpoint only returns
 * campaign names which are not sensitive; write-side authorization lives in RLS
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
    //   1. LEMLIST_API_KEYS is set → multi-team: resolve teams via /api/team
    //      and aggregate campaigns across all workspaces.
    //   2. Only LEMLIST_API_KEY → legacy single-key: fetch campaigns directly
    //      without calling /api/team (the endpoint that broke single-key
    //      setups). This preserves the exact behaviour that was working before
    //      multi-team support was introduced.
    const multiKeyRaw = Deno.env.get("LEMLIST_API_KEYS");
    const legacyKey = Deno.env.get("LEMLIST_API_KEY");

    let campaigns: LemlistCampaign[];

    if (multiKeyRaw && multiKeyRaw.trim()) {
      // Multi-team path.
      const clients = await loadLemlistClients();
      if (clients.length === 0) {
        throw new Error(
          "LEMLIST_API_KEYS is set but no valid key could be resolved.",
        );
      }
      campaigns = await fetchCampaignsAcrossTeams(clients);
    } else if (legacyKey) {
      // Single-key path — no /api/team call.
      campaigns = await fetchCampaigns(legacyKey);
    } else {
      throw new Error(
        "No lemlist API key configured. Set LEMLIST_API_KEY (or " +
          "LEMLIST_API_KEYS for multi-team) in Supabase Edge Function secrets.",
      );
    }

    // Frontend picker expects `{id, name, team_id, team_name}`.
    const responseCampaigns = campaigns
      .map((c) => ({
        id: c.id,
        name: c.name,
        team_id: c.teamId ?? null,
        team_name: c.teamName ?? null,
      }))
      .sort((a, b) => {
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
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
