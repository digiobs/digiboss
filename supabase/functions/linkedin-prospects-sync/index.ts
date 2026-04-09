import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

type ContentRow = {
  id: string;
  client_id: string;
  title: string | null;
  body: string | null;
  published_at: string | null;
  source_url: string | null;
};

type MetricRow = {
  content_id: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagement_rate: number;
  measured_at: string;
};

function engagementToScore(metrics: MetricRow): number {
  const interactions = (metrics.likes ?? 0) + (metrics.comments ?? 0) * 3 + (metrics.shares ?? 0) * 2;
  if (interactions >= 50) return 85;
  if (interactions >= 20) return 72;
  if (interactions >= 10) return 60;
  if (interactions >= 5) return 48;
  return 35;
}

function contentToProspect(content: ContentRow, metrics: MetricRow): ProspectLeadRow {
  const score = engagementToScore(metrics);
  const title = (content.title ?? content.body ?? "").slice(0, 80).trim() || "Publication LinkedIn";
  const interactions = (metrics.likes ?? 0) + (metrics.comments ?? 0) + (metrics.shares ?? 0);

  return {
    client_id: content.client_id,
    name: `LinkedIn: ${title}`,
    company: `${interactions} interactions (${metrics.likes}♥ ${metrics.comments}💬 ${metrics.shares}↗)`,
    email: null,
    score,
    stage: score >= 70 ? "qualified" : score >= 50 ? "contacted" : "new",
    source: "linkedin",
    last_activity: metrics.measured_at ?? content.published_at,
    fit_score: Math.max(20, Math.min(100, score - 5)),
    intent_score: Math.max(20, Math.min(100, Math.round(score * (metrics.engagement_rate > 3 ? 1.1 : 0.9)))),
    engagement_score: Math.max(20, Math.min(100, score + 10)),
    suggested_action: score >= 70
      ? "Fort engagement — exploiter ce sujet pour du contenu cible."
      : "Audience engagee — relancer avec du contenu similaire.",
    suggested_channel: "linkedin",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let runId: string | null = null;
  const startedAt = Date.now();
  const supabase = createServiceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const clientId = safeString(body?.clientId);
    const minInteractions = Math.max(Number(body?.minInteractions ?? 3), 1);

    runId = await startIntegrationRun(supabase, {
      provider: "linkedin",
      connector: "engagement",
      clientId,
      triggerType: "manual",
      requestPayload: { minInteractions },
    });

    // Fetch LinkedIn contents
    let contentQuery = supabase
      .from("contents")
      .select("id,client_id,title,body,published_at,source_url")
      .eq("channel", "linkedin")
      .order("published_at", { ascending: false })
      .limit(200);
    if (clientId) contentQuery = contentQuery.eq("client_id", clientId);
    const { data: contents, error: contentError } = await contentQuery;
    if (contentError) throw new Error(`Failed to load LinkedIn contents: ${contentError.message}`);
    const contentRows = (contents ?? []) as ContentRow[];

    if (contentRows.length === 0) {
      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: { recordsFetched: 0, recordsUpserted: 0, durationMs: Date.now() - startedAt },
      });
      return new Response(JSON.stringify({ synced: 0, message: "No LinkedIn content found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch metrics for these contents
    const contentIds = contentRows.map((c) => c.id);
    const { data: metrics, error: metricsError } = await supabase
      .from("content_metrics")
      .select("content_id,likes,comments,shares,impressions,engagement_rate,measured_at")
      .in("content_id", contentIds)
      .order("measured_at", { ascending: false });
    if (metricsError) throw new Error(`Failed to load content metrics: ${metricsError.message}`);
    const metricRows = (metrics ?? []) as MetricRow[];

    // Get latest metrics per content
    const latestMetrics = new Map<string, MetricRow>();
    for (const m of metricRows) {
      if (!latestMetrics.has(m.content_id)) {
        latestMetrics.set(m.content_id, m);
      }
    }

    // Filter for posts with minimum engagement and build prospects
    const prospects: ProspectLeadRow[] = [];
    const clientIds = new Set<string>();

    for (const content of contentRows) {
      const metric = latestMetrics.get(content.id);
      if (!metric) continue;
      const total = (metric.likes ?? 0) + (metric.comments ?? 0) + (metric.shares ?? 0);
      if (total < minInteractions) continue;

      clientIds.add(content.client_id);
      prospects.push(contentToProspect(content, metric));
    }

    if (prospects.length > 0) {
      // Delete existing linkedin prospects for these clients
      const { error: deleteError } = await supabase
        .from("prospect_leads")
        .delete()
        .in("client_id", [...clientIds])
        .eq("source", "linkedin");
      if (deleteError) throw new Error(`Failed to reset LinkedIn prospects: ${deleteError.message}`);

      // Insert fresh batch
      const { error: insertError } = await supabase.from("prospect_leads").insert(prospects);
      if (insertError) throw new Error(`Failed to insert LinkedIn prospects: ${insertError.message}`);
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: contentRows.length,
        recordsUpserted: prospects.length,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: prospects[0] ? { name: prospects[0].name } : null,
    });

    return new Response(JSON.stringify({ synced: prospects.length, totalPosts: contentRows.length }), {
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
