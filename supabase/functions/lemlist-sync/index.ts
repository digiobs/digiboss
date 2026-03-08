import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { asArray, asObject, createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

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
};

type Campaign = {
  id: string;
  name: string;
};

type ProspectLeadRow = {
  client_id: string;
  name: string;
  company: string;
  email: string | null;
  score: number;
  stage: string;
  source: string;
  last_activity: string | null;
  fit_score: number;
  intent_score: number;
  engagement_score: number;
  suggested_action: string;
  suggested_channel: "email" | "linkedin" | "call";
};

function normalizeContact(payload: Record<string, unknown>, clientId: string): ContactRow | null {
  const externalId = safeString(payload.id ?? payload._id ?? payload.contactId);
  if (!externalId) return null;

  const firstName = safeString(payload.firstName);
  const lastName = safeString(payload.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || safeString(payload.name);

  return {
    client_id: clientId,
    external_contact_id: externalId,
    full_name: fullName ?? null,
    email: safeString(payload.email),
    company: safeString(payload.company),
    status: safeString(payload.status),
    source: "lemlist",
    contacted_at: safeString(payload.contactedAt),
    raw: payload,
    synced_at: new Date().toISOString(),
  };
}

function scoreFromStatus(status: string | null): number {
  const normalized = safeString(status).toLowerCase();
  if (normalized.includes("reply") || normalized.includes("interested")) return 82;
  if (normalized.includes("open") || normalized.includes("clicked")) return 68;
  if (normalized.includes("contact")) return 56;
  if (normalized.includes("new")) return 44;
  return 40;
}

function stageFromStatus(status: string | null): string {
  const normalized = safeString(status).toLowerCase();
  if (normalized.includes("interested") || normalized.includes("qualified")) return "qualified";
  if (normalized.includes("meeting") || normalized.includes("proposal")) return "proposal";
  if (normalized.includes("won") || normalized.includes("closed")) return "closed";
  if (normalized.includes("open") || normalized.includes("contact")) return "contacted";
  return "new";
}

function toProspectLeadRow(contact: ContactRow): ProspectLeadRow {
  const score = scoreFromStatus(contact.status);
  return {
    client_id: contact.client_id,
    name: contact.full_name || "Unknown Lead",
    company: contact.company || "Unknown",
    email: contact.email,
    score,
    stage: stageFromStatus(contact.status),
    source: "lemlist",
    last_activity: contact.contacted_at,
    fit_score: Math.max(20, Math.min(100, score - 8)),
    intent_score: Math.max(20, Math.min(100, score)),
    engagement_score: Math.max(20, Math.min(100, score + 6)),
    suggested_action: "Follow up with personalized outreach sequence.",
    suggested_channel: "email",
  };
}

async function fetchContacts(apiKey: string, campaignId: string | null, limit: number): Promise<Record<string, unknown>[]> {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (campaignId) qs.set("campaignId", campaignId);

  const response = await fetch(`https://api.lemlist.com/api/leads?${qs.toString()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Lemlist API error ${response.status}`);
  }

  const json = await response.json();
  const rows = asArray(asObject(json)?.["leads"] ?? json);
  return rows.map((item) => asObject(item)).filter((item): item is Record<string, unknown> => Boolean(item));
}

async function fetchCampaigns(apiKey: string): Promise<Campaign[]> {
  const attempts: Array<{ url: string; headers: Record<string, string> }> = [
    {
      url: "https://api.lemlist.com/api/campaigns",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    },
    {
      url: "https://api.lemlist.com/api/campaigns?limit=200",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    },
    {
      url: "https://api.lemlist.com/api/campaigns?offset=0&limit=200",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    },
    {
      url: "https://api.lemlist.com/api/campaigns",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    },
  ];

  let lastError = "No response";
  for (const attempt of attempts) {
    const response = await fetch(attempt.url, { headers: attempt.headers });
    const text = await response.text();
    if (!response.ok) {
      lastError = `status ${response.status} from ${attempt.url}: ${text.slice(0, 240)}`;
      continue;
    }

    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      lastError = `Invalid JSON from ${attempt.url}: ${text.slice(0, 240)}`;
      continue;
    }

    const rows = asArray(asObject(json)?.["campaigns"] ?? json);
    const campaigns = rows
      .map((item) => asObject(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item) => {
        const id = safeString(item.id ?? item._id);
        const name = safeString(item.name ?? item.title);
        if (!id || !name) return null;
        return { id, name };
      })
      .filter((item): item is Campaign => Boolean(item));

    return campaigns;
  }

  throw new Error(`Lemlist campaigns API failed: ${lastError}`);
}

function normalizeText(value: string | null): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
    const limit = Math.min(Math.max(Number(body?.limit ?? 50), 1), 100);
    const apiKey = Deno.env.get("LEMLIST_API_KEY");

    runId = await startIntegrationRun(supabase, {
      provider: "lemlist",
      connector: "contacts",
      clientId,
      triggerType: "manual",
      requestPayload: { limit, clientId, hasApiKey: Boolean(apiKey), bootstrapMappings },
    });

    if (bootstrapMappings) {
      if (!apiKey) {
        throw new Error("LEMLIST_API_KEY is required to bootstrap mappings.");
      }

      const campaigns = await fetchCampaigns(apiKey);
      const { data: clients, error: clientsError } = await supabase.from("clients").select("id,name");
      if (clientsError) throw new Error(`Failed to load clients: ${clientsError.message}`);

      const clientRows = (clients ?? []) as Array<Record<string, unknown>>;
      const normalizedClients = clientRows
        .map((row) => ({
          id: safeString(row.id),
          name: safeString(row.name),
          normalized: normalizeText(safeString(row.name)),
        }))
        .filter((row): row is { id: string; name: string; normalized: string } => Boolean(row.id && row.name));

      const matchedMappings = campaigns.flatMap((campaign) => {
        const normalizedCampaign = normalizeText(campaign.name);
        const matchingClients = normalizedClients.filter(
          (client) =>
            normalizedCampaign.includes(client.normalized) || client.normalized.includes(normalizedCampaign),
        );
        return matchingClients.map((client) => ({
          client_id: client.id,
          provider: "lemlist",
          connector: "campaigns",
          external_account_id: campaign.id,
          external_account_name: campaign.name,
          status: "connected",
          is_active: true,
          mapping_strategy: "name_fallback",
          is_manual_override: false,
          notes: "Auto-mapped from Lemlist campaigns by name similarity.",
          updated_at: new Date().toISOString(),
        }));
      });

      if (matchedMappings.length > 0) {
        const { error: upsertMappingsError } = await supabase
          .from("client_data_mappings")
          .upsert(matchedMappings, { onConflict: "client_id,provider,connector" });
        if (upsertMappingsError) {
          throw new Error(`Failed to upsert Lemlist campaign mappings: ${upsertMappingsError.message}`);
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
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let mappingQuery = supabase
      .from("client_data_mappings")
      .select("client_id,external_account_id,alias_external_ids,mapping_strategy,is_active")
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
        metrics: { recordsFetched: 0, recordsUpserted: 0, recordsFailed: 0, durationMs: Date.now() - startedAt },
      });
      return new Response(JSON.stringify({ synced: 0, message: "No active Lemlist mappings found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const records: ContactRow[] = [];
    for (const mapping of activeMappings) {
      const mappedClientId = safeString(mapping.client_id);
      if (!mappedClientId) continue;
      const campaignId = safeString(mapping.external_account_id);

      let sourceRows: Record<string, unknown>[] = [];
      if (apiKey) {
        sourceRows = await fetchContacts(apiKey, campaignId, limit);
      } else {
        sourceRows = Array.from({ length: Math.min(limit, 10) }).map((_, i) => ({
          id: `${mappedClientId}-mock-${i + 1}`,
          firstName: "Mock",
          lastName: `Lead ${i + 1}`,
          email: `mock.${i + 1}.${mappedClientId}@example.com`,
          company: "Unknown",
          status: "new",
        }));
      }

      sourceRows.forEach((row) => {
        const normalized = normalizeContact(row, mappedClientId);
        if (normalized) records.push(normalized);
      });
    }

    if (records.length > 0) {
      const { error: upsertError } = await supabase
        .from("lemlist_contacts_cache")
        .upsert(records, { onConflict: "client_id,external_contact_id" });
      if (upsertError) throw new Error(`Failed to upsert Lemlist contacts: ${upsertError.message}`);

      const clientIds = [...new Set(records.map((record) => record.client_id).filter(Boolean))];
      const { error: deleteProspectError } = await supabase
        .from("prospect_leads")
        .delete()
        .in("client_id", clientIds)
        .eq("source", "lemlist");
      if (deleteProspectError) {
        throw new Error(`Failed to reset Lemlist prospect leads: ${deleteProspectError.message}`);
      }

      const prospectRows = records.map(toProspectLeadRow);
      if (prospectRows.length > 0) {
        const { error: insertProspectError } = await supabase.from("prospect_leads").insert(prospectRows);
        if (insertProspectError) {
          throw new Error(`Failed to write prospects from Lemlist: ${insertProspectError.message}`);
        }
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
      samplePayload: records[0] ? { external_contact_id: records[0].external_contact_id } : null,
    });

    return new Response(JSON.stringify({ synced: records.length, usedLiveApi: Boolean(apiKey) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
