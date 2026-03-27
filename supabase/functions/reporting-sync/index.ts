import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReportingKpiRow = {
  client_id: string;
  section: string;
  metric_key: string;
  label: string;
  value: number;
  unit: string | null;
  period_start: string;
  period_end: string;
};

const METRIC_KEY_ALIASES: Record<string, string> = {
  ad_clicks: "clicks",
  click: "clicks",
  ad_spend: "cost",
  spend: "cost",
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function canonicalMetricKey(value: unknown): string | null {
  const key = safeString(value)?.toLowerCase();
  if (!key) return null;
  return METRIC_KEY_ALIASES[key] ?? key;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createServiceClient();
  const startedAt = Date.now();
  let runId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const clientId = safeString(body?.clientId);
    const periodEnd = safeString(body?.periodEnd) ?? new Date().toISOString().slice(0, 10);
    const periodStart =
      safeString(body?.periodStart) ??
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);

    runId = await startIntegrationRun(supabase, {
      provider: "supermetrics",
      connector: "reporting_kpis",
      clientId,
      triggerType: "manual",
      requestPayload: { clientId, periodStart, periodEnd },
    });

    let supermetricsQuery = supabase
      .from("supermetrics_channel_metrics")
      .select("client_id,metric_key,metric_value")
      .gte("period_start", periodStart)
      .lte("period_end", periodEnd);
    let leadsQuery = supabase
      .from("prospect_leads")
      .select("client_id,id,stage")
      .gte("created_at", `${periodStart}T00:00:00.000Z`)
      .lte("created_at", `${periodEnd}T23:59:59.999Z`);
    let lemlistQuery = supabase
      .from("lemlist_contacts_cache")
      .select("client_id,external_contact_id")
      .gte("synced_at", `${periodStart}T00:00:00.000Z`)
      .lte("synced_at", `${periodEnd}T23:59:59.999Z`);
    let semrushQuery = supabase
      .from("semrush_domain_metrics")
      .select("client_id,position")
      .gte("report_date", periodStart)
      .lte("report_date", periodEnd);

    if (clientId) {
      supermetricsQuery = supermetricsQuery.eq("client_id", clientId);
      leadsQuery = leadsQuery.eq("client_id", clientId);
      lemlistQuery = lemlistQuery.eq("client_id", clientId);
      semrushQuery = semrushQuery.eq("client_id", clientId);
    }

    const [{ data: smRows, error: smError }, { data: leadRows, error: leadError }, { data: lemlistRows, error: llError }, { data: seoRows, error: seoError }] =
      await Promise.all([supermetricsQuery, leadsQuery, lemlistQuery, semrushQuery]);

    if (smError) throw new Error(`Failed to load supermetrics rows: ${smError.message}`);
    if (leadError) throw new Error(`Failed to load prospect leads: ${leadError.message}`);
    if (llError) throw new Error(`Failed to load lemlist rows: ${llError.message}`);
    if (seoError) throw new Error(`Failed to load semrush rows: ${seoError.message}`);

    const metricByClient = new Map<string, Record<string, number>>();
    for (const row of smRows ?? []) {
      const id = safeString(row.client_id);
      const metricKey = canonicalMetricKey(row.metric_key);
      if (!id || !metricKey) continue;
      const current = metricByClient.get(id) ?? {};
      current[metricKey] = (current[metricKey] ?? 0) + toNumber(row.metric_value);
      metricByClient.set(id, current);
    }

    const leadStatsByClient = new Map<string, { total: number; qualified: number }>();
    for (const row of leadRows ?? []) {
      const id = safeString(row.client_id);
      if (!id) continue;
      const stage = safeString(row.stage) ?? "";
      const current = leadStatsByClient.get(id) ?? { total: 0, qualified: 0 };
      current.total += 1;
      if (stage === "qualified" || stage === "proposal" || stage === "closed") current.qualified += 1;
      leadStatsByClient.set(id, current);
    }

    const lemlistCountByClient = new Map<string, number>();
    for (const row of lemlistRows ?? []) {
      const id = safeString(row.client_id);
      if (!id) continue;
      lemlistCountByClient.set(id, (lemlistCountByClient.get(id) ?? 0) + 1);
    }

    const seoPosByClient = new Map<string, { sum: number; count: number }>();
    for (const row of seoRows ?? []) {
      const id = safeString(row.client_id);
      if (!id) continue;
      const position = toNumber(row.position);
      const current = seoPosByClient.get(id) ?? { sum: 0, count: 0 };
      if (position > 0) {
        current.sum += position;
        current.count += 1;
      }
      seoPosByClient.set(id, current);
    }

    const clientIds = new Set<string>([
      ...metricByClient.keys(),
      ...leadStatsByClient.keys(),
      ...lemlistCountByClient.keys(),
      ...seoPosByClient.keys(),
    ]);

    const rows: ReportingKpiRow[] = [];
    for (const id of clientIds) {
      const metrics = metricByClient.get(id) ?? {};
      const leadStats = leadStatsByClient.get(id) ?? { total: 0, qualified: 0 };
      const semrushStats = seoPosByClient.get(id) ?? { sum: 0, count: 0 };
      const avgPosition = semrushStats.count > 0 ? semrushStats.sum / semrushStats.count : 0;
      const conversionCount = metrics.conversions ?? 0;
      const clickCount = metrics.clicks ?? 0;
      const conversionRate = clickCount > 0 ? Math.min(100, (conversionCount / clickCount) * 100) : 0;

      rows.push(
        { client_id: id, section: "website", metric_key: "impressions", label: "Impressions", value: metrics.impressions ?? 0, unit: "count", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "paid", metric_key: "ad_clicks", label: "Ad Clicks", value: clickCount, unit: "count", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "paid", metric_key: "ad_spend", label: "Ad Spend", value: metrics.cost ?? 0, unit: "currency", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "paid", metric_key: "roas", label: "ROAS", value: metrics.roas ?? 0, unit: "ratio", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "conversion", metric_key: "conversions", label: "Conversions", value: conversionCount, unit: "count", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "conversion", metric_key: "conv_rate", label: "Conv. Rate", value: conversionRate, unit: "percent", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "conversion", metric_key: "new_leads", label: "New Leads", value: leadStats.total, unit: "count", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "conversion", metric_key: "qualified_leads", label: "Qualified Leads", value: leadStats.qualified, unit: "count", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "social", metric_key: "li_impressions", label: "LI Impressions", value: metrics.impressions ?? 0, unit: "count", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "social", metric_key: "li_followers", label: "LI Followers", value: lemlistCountByClient.get(id) ?? 0, unit: "count", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "acquisition", metric_key: "seo_clicks", label: "SEO Clicks", value: clickCount, unit: "count", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "acquisition", metric_key: "avg_position", label: "Avg Position", value: avgPosition, unit: "ratio", period_start: periodStart, period_end: periodEnd },
        // P7: Strategy section (placeholder — populated by future PMF skill)
        { client_id: id, section: "strategy", metric_key: "pmf_score", label: "Score PMF", value: 0, unit: "score", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "strategy", metric_key: "pmf_clarity", label: "Clarté douleur", value: 0, unit: "score", period_start: periodStart, period_end: periodEnd },
        // P8: SEO health section
        { client_id: id, section: "seo", metric_key: "health_score", label: "Score Santé SEO", value: avgPosition > 0 ? Math.round(Math.max(0, 100 - avgPosition * 2)) : 0, unit: "score", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "seo", metric_key: "quick_wins", label: "Quick Wins", value: 0, unit: "count", period_start: periodStart, period_end: periodEnd },
        // P9: AI visibility section (placeholder — populated by future Meteoria integration)
        { client_id: id, section: "ai-visibility", metric_key: "mention_rate", label: "Taux de mention IA", value: 0, unit: "percent", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "ai-visibility", metric_key: "market_share", label: "Part de voix IA", value: 0, unit: "percent", period_start: periodStart, period_end: periodEnd },
        { client_id: id, section: "ai-visibility", metric_key: "sentiment_positive", label: "Sentiment positif", value: 0, unit: "percent", period_start: periodStart, period_end: periodEnd },
      );
    }

    if (rows.length > 0) {
      const { error: upsertError } = await supabase.from("reporting_kpis").upsert(rows, {
        onConflict: "client_id,section,metric_key,period_start,period_end",
      });
      if (upsertError) throw new Error(`Failed to upsert reporting KPIs: ${upsertError.message}`);
    }

    // P1: Auto-upsert hero KPIs into home_kpis after each reporting run
    const homeKpiRows: { client_id: string; key: string; label: string; value: string; delta: number | null; trend: string | null }[] = [];
    for (const id of clientIds) {
      const metrics = metricByClient.get(id) ?? {};
      const semrushStats = seoPosByClient.get(id) ?? { sum: 0, count: 0 };
      const avgPos = semrushStats.count > 0 ? semrushStats.sum / semrushStats.count : 0;
      const seoHealthScore = avgPos > 0 ? Math.round(Math.max(0, 100 - avgPos * 2)) : 0;
      const clickCount = metrics.clicks ?? 0;

      homeKpiRows.push(
        { client_id: id, key: "sessions", label: "Sessions", value: String(metrics.impressions ?? 0), delta: null, trend: null },
        { client_id: id, key: "seo_clicks", label: "SEO Clicks", value: String(clickCount), delta: null, trend: null },
        { client_id: id, key: "li_impressions", label: "LinkedIn Impressions", value: String(metrics.impressions ?? 0), delta: null, trend: null },
        { client_id: id, key: "health_score", label: "Score Santé", value: String(seoHealthScore), delta: null, trend: null },
      );
    }
    if (homeKpiRows.length > 0) {
      const { error: homeError } = await supabase.from("home_kpis").upsert(homeKpiRows, {
        onConflict: "client_id,key",
      });
      if (homeError) console.error("home_kpis upsert warning:", homeError.message);
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: (smRows?.length ?? 0) + (leadRows?.length ?? 0) + (lemlistRows?.length ?? 0) + (seoRows?.length ?? 0),
        recordsUpserted: rows.length,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: rows[0] ? { section: rows[0].section, metric_key: rows[0].metric_key } : null,
    });

    return new Response(
      JSON.stringify({ synced: rows.length, homeKpis: homeKpiRows.length, periodStart, periodEnd, clients: clientIds.size }),
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

