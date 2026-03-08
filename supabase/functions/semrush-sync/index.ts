import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SemrushMetricRow = {
  client_id: string;
  domain: string;
  keyword: string;
  position: number;
  search_volume: number;
  traffic_percent: number;
  report_date: string;
  raw: Record<string, unknown>;
  synced_at: string;
};

async function fetchSemrushDomain(apiKey: string, domain: string, limit: number): Promise<SemrushMetricRow[]> {
  const endpoint =
    `https://api.semrush.com/?type=domain_organic&key=${encodeURIComponent(apiKey)}` +
    `&display_limit=${limit}&display_sort=tr_desc&export_columns=Ph,Po,Nq,Tr&domain=${encodeURIComponent(domain)}`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`SEMrush API error ${response.status}`);
  const text = await response.text();
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const rows = lines.slice(1);
  return rows.slice(0, limit).map((line) => {
    const [keyword, positionRaw, searchVolumeRaw, trafficRaw] = line.split(";");
    return {
      client_id: "",
      domain,
      keyword: keyword ?? "",
      position: Number(positionRaw) || 0,
      search_volume: Number(searchVolumeRaw) || 0,
      traffic_percent: Number(trafficRaw) || 0,
      report_date: new Date().toISOString().slice(0, 10),
      raw: { line },
      synced_at: new Date().toISOString(),
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createServiceClient();
  const startedAt = Date.now();
  let runId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const clientId = safeString(body?.clientId);
    const limit = Math.min(Math.max(Number(body?.limit ?? 20), 1), 100);
    const apiKey = Deno.env.get("SEMRUSH_API_KEY");

    runId = await startIntegrationRun(supabase, {
      provider: "semrush",
      connector: "domain_organic",
      clientId,
      triggerType: "manual",
      requestPayload: { limit, hasApiKey: Boolean(apiKey) },
    });

    let mappingQuery = supabase
      .from("client_data_mappings")
      .select("client_id,external_account_id,is_active")
      .eq("provider", "semrush")
      .eq("connector", "account")
      .eq("is_active", true);
    if (clientId) mappingQuery = mappingQuery.eq("client_id", clientId);
    const { data: mappings, error: mappingError } = await mappingQuery;
    if (mappingError) throw new Error(`Failed to load SEMrush mappings: ${mappingError.message}`);
    const activeMappings = (mappings ?? []) as Array<Record<string, unknown>>;

    const rows: SemrushMetricRow[] = [];
    for (const mapping of activeMappings) {
      const mappedClientId = safeString(mapping.client_id);
      const domain = safeString(mapping.external_account_id);
      if (!mappedClientId || !domain) continue;

      const sourceRows = apiKey
        ? await fetchSemrushDomain(apiKey, domain, limit)
        : Array.from({ length: Math.min(limit, 5) }).map((_, i) => ({
            client_id: mappedClientId,
            domain,
            keyword: `mock keyword ${i + 1}`,
            position: i + 1,
            search_volume: 1000 - i * 50,
            traffic_percent: 5 - i * 0.4,
            report_date: new Date().toISOString().slice(0, 10),
            raw: { mock: true },
            synced_at: new Date().toISOString(),
          }));

      sourceRows.forEach((row) => {
        rows.push({ ...row, client_id: mappedClientId });
      });
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("semrush_domain_metrics").insert(rows);
      if (insertError) throw new Error(`Failed to insert SEMrush rows: ${insertError.message}`);
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: rows.length,
        recordsUpserted: rows.length,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: rows[0] ? { domain: rows[0].domain, keyword: rows[0].keyword } : null,
    });

    return new Response(JSON.stringify({ synced: rows.length, usedLiveApi: Boolean(apiKey) }), {
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
