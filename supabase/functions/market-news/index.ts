import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createServiceClient,
  finishIntegrationRun,
  safeString,
  asArray,
  asObject,
  startIntegrationRun,
} from "../_shared/ingestion.ts";
import { callClaudeJson } from "../_shared/claude.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VeilleArticle {
  title: string;
  summary: string;
  source: string;
  category: string;
  skill: string;
  severity: string;
  is_actionable: boolean;
  citations: string[];
  url?: string;
}

type ClientConfig = {
  client_id: string;
  industry: string | null;
  competitors: unknown;
  market_news_keywords: unknown;
};

const VALID_SKILLS = new Set([
  "veille",
  "market_intelligence",
  "seo",
  "ads",
  "social",
  "concurrence",
  "reputation",
  "compliance",
]);
const VALID_SEVERITIES = new Set(["alert", "warning", "opportunity", "info"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeStringArray(value: unknown): string[] {
  return asArray(value).filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function buildSearchQuery(industry: string, competitors: string[], keywords: string[]): string {
  const parts: string[] = [];
  if (competitors.length > 0) {
    parts.push(`Competitor monitoring on: ${competitors.join(", ")}. Focus on launches, strategic moves, pricing, partnerships, and go-to-market changes.`);
  }
  if (industry) {
    parts.push(`Industry monitoring for ${industry}. Focus on recent trends, demand shifts, regulations, and tactical marketing opportunities.`);
  }
  if (keywords.length > 0) {
    parts.push(`Track strategic signals around: ${keywords.join(", ")}.`);
  }
  if (parts.length > 0) return parts.join("\n");
  return "B2B marketing signals: paid media, SEO, content distribution, and attribution shifts.";
}

function normalizeArticles(raw: unknown): VeilleArticle[] {
  return asArray(raw)
    .map((item) => {
      const row = asObject(item);
      if (!row) return null;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      const summary = typeof row.summary === "string" ? row.summary.trim() : "";
      if (!title || !summary) return null;
      const rawSkill = typeof row.skill === "string" ? row.skill : "";
      const rawSeverity = typeof row.severity === "string" ? row.severity : "";
      return {
        title,
        summary,
        source: typeof row.source === "string" ? row.source : "Claude AI",
        category: typeof row.category === "string" ? row.category : "industry",
        skill: VALID_SKILLS.has(rawSkill) ? rawSkill : "veille",
        severity: VALID_SEVERITIES.has(rawSeverity) ? rawSeverity : "info",
        is_actionable: typeof row.is_actionable === "boolean" ? row.is_actionable : false,
        citations: safeStringArray(row.citations),
        url: typeof row.url === "string" && row.url ? row.url : undefined,
      } satisfies VeilleArticle;
    })
    .filter((row): row is VeilleArticle => Boolean(row));
}

// ---------------------------------------------------------------------------
// Generate veille articles for a single client via Claude
// ---------------------------------------------------------------------------

async function generateForClient(
  industry: string,
  competitors: string[],
  keywords: string[],
): Promise<{ articles: VeilleArticle[]; modelUsed: string }> {
  const searchQuery = buildSearchQuery(industry, competitors, keywords);

  const systemPrompt =
    "You are a market intelligence analyst. Produce concise, tactical French monitoring insights for a marketing team.";

  const userPrompt = `
Create 5 monitoring items for this context:
${searchQuery}

Return STRICT JSON object with this exact schema:
{
  "articles": [
    {
      "title": "string",
      "summary": "2-3 concise sentences with actionable signal",
      "source": "publisher or platform name",
      "category": "marketing|technology|finance|industry|competitor",
      "skill": "veille|market_intelligence|seo|ads|social|concurrence|reputation|compliance",
      "severity": "alert|warning|opportunity|info",
      "is_actionable": true or false,
      "citations": ["url1","url2"],
      "url": "primary url or empty string"
    }
  ]
}
Skill: veille=general watch, market_intelligence=market signals, seo=SEO signals, ads=paid media, social=social media, concurrence=competitor moves, reputation=brand reputation, compliance=legal/regulatory.
Severity: alert=urgent threat, warning=needs attention, opportunity=growth potential, info=general awareness.
No markdown. No extra keys.
`;

  const { data: payload, modelUsed, rawText } = await callClaudeJson<{ articles: unknown[] }>({
    systemPrompt,
    userPrompt,
  });

  const articles = normalizeArticles(payload?.articles ?? []);

  if (articles.length > 0) return { articles, modelUsed };

  // Fallback: return single info item from raw text
  return {
    articles: [
      {
        title: "Veille update",
        summary: rawText.slice(0, 300) || "No structured output returned by Claude.",
        source: "Claude AI",
        category: "industry",
        skill: "veille",
        severity: "info",
        is_actionable: false,
        citations: [],
      },
    ],
    modelUsed,
  };
}

// ---------------------------------------------------------------------------
// Persist articles into veille_items (delete-then-insert per client to dedup)
// ---------------------------------------------------------------------------

async function upsertVeilleItems(
  supabase: ReturnType<typeof createServiceClient>,
  clientId: string,
  articles: VeilleArticle[],
): Promise<number> {
  if (articles.length === 0) return 0;

  // Remove previous market-news items for this client to avoid duplicates
  await supabase
    .from("veille_items")
    .delete()
    .eq("client_id", clientId)
    .eq("details->>source_function", "market-news");

  const rows = articles.map((a) => ({
    client_id: clientId,
    title: a.title,
    summary: a.summary,
    skill: a.skill,
    source: a.source || null,
    source_url: a.url || null,
    severity: a.severity,
    is_actionable: a.is_actionable,
    details: {
      source_function: "market-news",
      category: a.category,
      citations: a.citations,
    },
  }));

  const { error } = await supabase.from("veille_items").insert(rows);
  if (error) {
    console.error("Failed to insert veille_items:", error);
    return 0;
  }
  return rows.length;
}

// ---------------------------------------------------------------------------
// Main handler — mirrors the tldv-sync-meetings pattern
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let runId: string | null = null;
  const startedAt = Date.now();
  const supabase = createServiceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const filterClientId = safeString(body?.clientId);

    runId = await startIntegrationRun(supabase, {
      provider: "market-news",
      connector: "veille-sync",
      clientId: filterClientId,
      triggerType: "manual",
      requestPayload: { filterClientId },
    });

    // Load client configs — either one client or all active clients with configs
    let configs: ClientConfig[];
    if (filterClientId) {
      const { data, error } = await supabase
        .from("client_configs")
        .select("client_id, industry, competitors, market_news_keywords")
        .eq("client_id", filterClientId);
      if (error) throw new Error(`Failed to load client_configs: ${error.message}`);
      configs = (data ?? []) as ClientConfig[];
    } else {
      // All clients mode — fetch every config that has at least one useful field
      const { data, error } = await supabase
        .from("client_configs")
        .select("client_id, industry, competitors, market_news_keywords");
      if (error) throw new Error(`Failed to load client_configs: ${error.message}`);
      configs = (data ?? []) as ClientConfig[];
    }

    // If a specific client was requested but has no config, still generate with defaults
    if (configs.length === 0 && filterClientId) {
      configs = [{ client_id: filterClientId, industry: null, competitors: null, market_news_keywords: null }];
    }

    let totalFetched = 0;
    let totalUpserted = 0;
    let clientsSynced = 0;

    for (const config of configs) {
      const industry = typeof config.industry === "string" ? config.industry.trim() : "";
      const competitors = safeStringArray(config.competitors);
      const keywords = safeStringArray(config.market_news_keywords);

      const { articles } = await generateForClient(industry, competitors, keywords);
      totalFetched += articles.length;

      const upserted = await upsertVeilleItems(supabase, config.client_id, articles);
      totalUpserted += upserted;
      clientsSynced += 1;
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: totalFetched,
        recordsUpserted: totalUpserted,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
    });

    return new Response(
      JSON.stringify({ fetched: totalFetched, upserted: totalUpserted, clientsSynced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("market-news error:", error);
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
