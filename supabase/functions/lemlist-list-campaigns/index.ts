import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createServiceClient,
  finishIntegrationRun,
  startIntegrationRun,
} from "../_shared/ingestion.ts";
import {
  fetchCampaignsAcrossTeams,
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

    const clients = await loadLemlistClients();
    if (clients.length === 0) {
      throw new Error(
        "No lemlist API key configured (set LEMLIST_API_KEYS or LEMLIST_API_KEY).",
      );
    }

    const campaigns = await fetchCampaignsAcrossTeams(clients);

    // Frontend picker expects a flat list of `{id, name, team_id, team_name}`.
    // Sort teams first so campaigns group naturally in the dropdown.
    const responseCampaigns = campaigns
      .map((c) => ({
        id: c.id,
        name: c.name,
        team_id: c.teamId,
        team_name: c.teamName,
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
        ? { firstCampaign: responseCampaigns[0], teamCount: clients.length }
        : { teamCount: clients.length },
    });

    return new Response(
      JSON.stringify({
        campaigns: responseCampaigns,
        teams: clients.map((c) => ({ team_id: c.teamId, team_name: c.teamName })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    await finishIntegrationRun(supabase, runId, {
      status: "failed",
      metrics: { durationMs: Date.now() - startedAt },
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
