import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createServiceClient,
  finishIntegrationRun,
  safeString,
  startIntegrationRun,
} from "../_shared/ingestion.ts";
import {
  fetchCampaignsAcrossTeams,
  fetchLeadsForCampaign,
  type LemlistLead,
  type LemlistTeamClient,
  loadLemlistClients,
  normalizeText,
} from "../_shared/lemlist.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ContactRow = {
  client_id: string;
  external_contact_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  status: string | null;
  source: string;
  contacted_at: string | null;
  raw: Record<string, unknown>;
  synced_at: string;
  campaign_id: string | null;
  campaign_name: string | null;
  team_id: string | null;
  team_name: string | null;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  current_step: number;
  last_event_type: string | null;
  last_event_at: string | null;
};

function toContactRow(
  lead: LemlistLead,
  clientId: string,
  campaignId: string | null,
  campaignName: string | null,
  teamId: string | null,
  teamName: string | null,
): ContactRow {
  return {
    client_id: clientId,
    external_contact_id: lead.externalId,
    full_name: lead.fullName,
    email: lead.email,
    company: lead.company,
    status: lead.status,
    source: "lemlist",
    contacted_at: lead.contactedAt,
    raw: lead.raw,
    synced_at: new Date().toISOString(),
    campaign_id: campaignId,
    campaign_name: campaignName,
    team_id: teamId,
    team_name: teamName,
    emails_sent: lead.emailsSent,
    emails_opened: lead.emailsOpened,
    emails_clicked: lead.emailsClicked,
    emails_replied: lead.emailsReplied,
    current_step: lead.currentStep,
    last_event_type: lead.lastEventType,
    last_event_at: lead.lastEventAt,
  };
}

/**
 * Pick the right lemlist API client for a mapping. The mapping row stores the
 * team id in `external_workspace_id`; when it's missing (old mappings created
 * before multi-team support) we fall back to the first configured client,
 * which mirrors the legacy single-key behaviour.
 */
function pickTeamClient(
  clients: LemlistTeamClient[],
  workspaceId: string | null,
): LemlistTeamClient | null {
  if (clients.length === 0) return null;
  if (workspaceId) {
    const match = clients.find((c) => c.teamId === workspaceId);
    if (match) return match;
  }
  return clients[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let runId: string | null = null;
  const startedAt = Date.now();
  const supabase = createServiceClient();
  try {
    const body = await req.json().catch(() => ({}));
    const clientId = safeString(body?.clientId);
    const bootstrapMappings = Boolean(body?.bootstrapMappings);
    const limit = Math.min(Math.max(Number(body?.limit ?? 100), 1), 500);

    // Resolve every configured lemlist team up-front. loadLemlistClients()
    // already handles LEMLIST_API_KEYS (JSON) → LEMLIST_API_KEY fallback, so a
    // non-empty result guarantees we have at least one usable API key.
    const teamClients = await loadLemlistClients();
    const hasLiveApi = teamClients.length > 0;

    runId = await startIntegrationRun(supabase, {
      provider: "lemlist",
      connector: "contacts",
      clientId,
      triggerType: "manual",
      requestPayload: {
        limit,
        clientId,
        hasApiKey: hasLiveApi,
        teamCount: teamClients.length,
        bootstrapMappings,
      },
    });

    if (bootstrapMappings) {
      if (!hasLiveApi) {
        throw new Error(
          "LEMLIST_API_KEYS or LEMLIST_API_KEY is required to bootstrap mappings.",
        );
      }

      const campaigns = await fetchCampaignsAcrossTeams(teamClients);
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id,name");
      if (clientsError) throw new Error(`Failed to load clients: ${clientsError.message}`);

      const clientRows = (clients ?? []) as Array<Record<string, unknown>>;
      const normalizedClients = clientRows
        .map((row) => ({
          id: safeString(row.id),
          name: safeString(row.name),
          normalized: normalizeText(safeString(row.name)),
        }))
        .filter((row): row is { id: string; name: string; normalized: string } =>
          Boolean(row.id && row.name),
        );

      const matchedMappings = campaigns.flatMap((campaign) => {
        const normalizedCampaign = normalizeText(campaign.name);
        const normalizedTeam = normalizeText(campaign.teamName ?? "");
        // Prefer team-name matches so multi-team setups route to the right
        // workspace, then fall back to campaign-name similarity.
        const matchingClients = normalizedClients.filter((client) => {
          if (!client.normalized) return false;
          if (
            normalizedTeam &&
            (normalizedTeam.includes(client.normalized) ||
              client.normalized.includes(normalizedTeam))
          ) {
            return true;
          }
          return (
            normalizedCampaign.includes(client.normalized) ||
            client.normalized.includes(normalizedCampaign)
          );
        });
        return matchingClients.map((client) => ({
          client_id: client.id,
          provider: "lemlist",
          connector: "campaigns",
          external_account_id: campaign.id,
          external_account_name: campaign.name,
          external_workspace_id: campaign.teamId,
          status: "connected",
          is_active: true,
          mapping_strategy: "name_fallback",
          is_manual_override: false,
          notes: campaign.teamName
            ? `Auto-mapped from Lemlist team « ${campaign.teamName} » by name similarity.`
            : "Auto-mapped from Lemlist campaigns by name similarity.",
          updated_at: new Date().toISOString(),
        }));
      });

      if (matchedMappings.length > 0) {
        const { error: upsertMappingsError } = await supabase
          .from("client_data_mappings")
          .upsert(matchedMappings, { onConflict: "client_id,provider,connector" });
        if (upsertMappingsError) {
          throw new Error(
            `Failed to upsert Lemlist campaign mappings: ${upsertMappingsError.message}`,
          );
        }
      }

      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: {
          recordsFetched: campaigns.length,
          recordsUpserted: matchedMappings.length,
          recordsFailed: 0,
          durationMs: Date.now() - startedAt,
        },
        samplePayload: campaigns[0] ? { firstCampaign: campaigns[0] } : null,
      });

      return new Response(
        JSON.stringify({
          campaignsFound: campaigns.length,
          mappingsUpserted: matchedMappings.length,
          campaigns,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let mappingQuery = supabase
      .from("client_data_mappings")
      .select(
        "client_id,external_account_id,external_account_name,external_workspace_id,alias_external_ids,mapping_strategy,is_active",
      )
      .eq("provider", "lemlist")
      .eq("connector", "campaigns")
      .eq("is_active", true);
    if (clientId) mappingQuery = mappingQuery.eq("client_id", clientId);
    const { data: mappings, error: mappingError } = await mappingQuery;
    if (mappingError) throw new Error(`Failed to load lemlist mappings: ${mappingError.message}`);
    const activeMappings = (mappings ?? []) as Array<Record<string, unknown>>;
    if (activeMappings.length === 0) {
      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: {
          recordsFetched: 0,
          recordsUpserted: 0,
          recordsFailed: 0,
          durationMs: Date.now() - startedAt,
        },
      });
      return new Response(
        JSON.stringify({ synced: 0, message: "No active Lemlist mappings found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const records: ContactRow[] = [];
    for (const mapping of activeMappings) {
      const mappedClientId = safeString(mapping.client_id);
      if (!mappedClientId) continue;
      const campaignId = safeString(mapping.external_account_id);
      const campaignName = safeString(mapping.external_account_name);
      const workspaceId = safeString(mapping.external_workspace_id);

      // Route to the right API key based on the team id stored on the mapping.
      // Falls back to the first configured team if we can't find a match.
      const teamClient = pickTeamClient(teamClients, workspaceId);

      if (!teamClient) {
        // No live API key at all: seed a few obvious mocks so the UI isn't
        // empty in dev. These go through the same columns as real data so the
        // table renders correctly.
        for (let i = 1; i <= Math.min(limit, 5); i += 1) {
          records.push({
            client_id: mappedClientId,
            external_contact_id: `${mappedClientId}-mock-${i}`,
            full_name: `Mock Lead ${i}`,
            email: `mock.${i}.${mappedClientId}@example.com`,
            company: "Mock Co",
            status: "new",
            source: "lemlist",
            contacted_at: null,
            raw: { mock: true },
            synced_at: new Date().toISOString(),
            campaign_id: campaignId,
            campaign_name: campaignName,
            team_id: workspaceId || null,
            team_name: null,
            emails_sent: 0,
            emails_opened: 0,
            emails_clicked: 0,
            emails_replied: 0,
            current_step: 0,
            last_event_type: null,
            last_event_at: null,
          });
        }
        continue;
      }

      if (!campaignId) continue;
      const leads = await fetchLeadsForCampaign(teamClient.apiKey, campaignId, limit);
      leads.forEach((lead) => {
        records.push(
          toContactRow(
            lead,
            mappedClientId,
            campaignId,
            campaignName,
            teamClient.teamId,
            teamClient.teamName,
          ),
        );
      });
    }

    if (records.length > 0) {
      const { error: upsertError } = await supabase
        .from("lemlist_contacts_cache")
        .upsert(records, { onConflict: "client_id,external_contact_id" });
      if (upsertError) {
        throw new Error(`Failed to upsert Lemlist contacts: ${upsertError.message}`);
      }
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: records.length,
        recordsUpserted: records.length,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: records[0]
        ? { external_contact_id: records[0].external_contact_id }
        : null,
    });

    return new Response(
      JSON.stringify({
        synced: records.length,
        usedLiveApi: hasLiveApi,
        teamCount: teamClients.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    await finishIntegrationRun(supabase, runId, {
      status: "failed",
      metrics: { durationMs: Date.now() - startedAt },
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
