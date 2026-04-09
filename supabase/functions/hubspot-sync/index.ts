import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type HubSpotContact = {
  id: string;
  properties: Record<string, string | null>;
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

const LIFECYCLE_TO_STAGE: Record<string, string> = {
  subscriber: "new",
  lead: "new",
  marketingqualifiedlead: "contacted",
  salesqualifiedlead: "qualified",
  opportunity: "proposal",
  customer: "closed",
  evangelist: "closed",
};

const LIFECYCLE_TO_SCORE: Record<string, number> = {
  subscriber: 30,
  lead: 45,
  marketingqualifiedlead: 60,
  salesqualifiedlead: 75,
  opportunity: 85,
  customer: 95,
  evangelist: 90,
};

function contactToProspect(contact: HubSpotContact, clientId: string): ProspectLeadRow {
  const p = contact.properties;
  const firstName = (p.firstname ?? "").trim();
  const lastName = (p.lastname ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Contact HubSpot";
  const lifecycle = (p.lifecyclestage ?? "lead").toLowerCase();
  const score = LIFECYCLE_TO_SCORE[lifecycle] ?? 40;

  return {
    client_id: clientId,
    name,
    company: (p.company ?? "").trim() || "Non renseigne",
    email: safeString(p.email),
    score,
    stage: LIFECYCLE_TO_STAGE[lifecycle] ?? "new",
    source: "hubspot",
    last_activity: p.lastmodifieddate ?? p.createdate ?? null,
    fit_score: Math.max(20, Math.min(100, score - 5)),
    intent_score: Math.max(20, Math.min(100, score)),
    engagement_score: Math.max(20, Math.min(100, score + 5)),
    suggested_action: lifecycle === "opportunity"
      ? "Envoyer une proposition commerciale."
      : lifecycle === "salesqualifiedlead"
        ? "Planifier un appel de qualification."
        : "Continuer le nurturing par email.",
    suggested_channel: lifecycle === "salesqualifiedlead" || lifecycle === "opportunity" ? "call" : "email",
  };
}

async function fetchHubSpotContacts(accessToken: string, limit: number): Promise<HubSpotContact[]> {
  const properties = "firstname,lastname,email,company,lifecyclestage,hs_lead_status,lastmodifieddate,createdate";
  const url = `https://api.hubapi.com/crm/v3/objects/contacts?limit=${limit}&properties=${properties}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HubSpot API error ${response.status}: ${text.slice(0, 300)}`);
  }
  const json = await response.json();
  return (json.results ?? []) as HubSpotContact[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let runId: string | null = null;
  const startedAt = Date.now();
  const supabase = createServiceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const clientId = safeString(body?.clientId);
    const limit = Math.min(Math.max(Number(body?.limit ?? 100), 1), 100);
    const accessToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN");

    runId = await startIntegrationRun(supabase, {
      provider: "hubspot",
      connector: "contacts",
      clientId,
      triggerType: "manual",
      requestPayload: { limit, hasToken: Boolean(accessToken) },
    });

    // Find active HubSpot mappings
    let mappingQuery = supabase
      .from("client_data_mappings")
      .select("client_id,external_account_id,is_active")
      .eq("provider", "hubspot")
      .eq("connector", "crm")
      .eq("is_active", true);
    if (clientId) mappingQuery = mappingQuery.eq("client_id", clientId);
    const { data: mappings, error: mappingError } = await mappingQuery;
    if (mappingError) throw new Error(`Failed to load HubSpot mappings: ${mappingError.message}`);
    const activeMappings = (mappings ?? []) as Array<Record<string, unknown>>;

    if (activeMappings.length === 0) {
      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: { recordsFetched: 0, recordsUpserted: 0, durationMs: Date.now() - startedAt },
      });
      return new Response(JSON.stringify({ synced: 0, message: "No active HubSpot mappings found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allProspects: ProspectLeadRow[] = [];
    const clientIds: string[] = [];

    for (const mapping of activeMappings) {
      const mappedClientId = safeString(mapping.client_id);
      if (!mappedClientId) continue;
      clientIds.push(mappedClientId);

      let contacts: HubSpotContact[];
      if (accessToken) {
        contacts = await fetchHubSpotContacts(accessToken, limit);
      } else {
        // Mock contacts when no token
        contacts = Array.from({ length: Math.min(limit, 8) }).map((_, i) => ({
          id: `hs-mock-${mappedClientId}-${i + 1}`,
          properties: {
            firstname: "Contact",
            lastname: `HubSpot ${i + 1}`,
            email: `contact${i + 1}.${mappedClientId}@example.com`,
            company: `Entreprise ${i + 1}`,
            lifecyclestage: ["lead", "marketingqualifiedlead", "salesqualifiedlead", "opportunity"][i % 4],
            lastmodifieddate: new Date(Date.now() - i * 86400000).toISOString(),
            createdate: new Date(Date.now() - (i + 7) * 86400000).toISOString(),
            hs_lead_status: null,
          },
        }));
      }

      contacts.forEach((contact) => {
        allProspects.push(contactToProspect(contact, mappedClientId));
      });
    }

    if (allProspects.length > 0) {
      // Delete existing hubspot prospects for these clients
      const { error: deleteError } = await supabase
        .from("prospect_leads")
        .delete()
        .in("client_id", clientIds)
        .eq("source", "hubspot");
      if (deleteError) throw new Error(`Failed to reset HubSpot prospects: ${deleteError.message}`);

      // Insert fresh batch
      const { error: insertError } = await supabase.from("prospect_leads").insert(allProspects);
      if (insertError) throw new Error(`Failed to insert HubSpot prospects: ${insertError.message}`);
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: allProspects.length,
        recordsUpserted: allProspects.length,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: allProspects[0] ? { name: allProspects[0].name, company: allProspects[0].company } : null,
    });

    return new Response(JSON.stringify({ synced: allProspects.length, usedLiveApi: Boolean(accessToken) }), {
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
