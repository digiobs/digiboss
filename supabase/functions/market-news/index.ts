import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { finishIntegrationRun, startIntegrationRun } from "../_shared/ingestion.ts";
import { callClaudeJson } from "../_shared/claude.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  category: string;
  citations: string[];
  imageUrl?: string;
  url?: string;
}

const CACHE_DURATION_HOURS = 4;

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function generateCacheKey(category: string, industry: string, competitors: string[], keywords: string[]): string {
  const parts = [
    "market-news-claude",
    category || "default",
    industry || "default",
    competitors.sort().join(","),
    keywords.sort().join(","),
  ];
  return parts.join("|").toLowerCase();
}

function buildSearchQuery(category: string, industry: string, competitors: string[], keywords: string[]): string {
  if (category === "competitor" && competitors.length > 0) {
    return `Competitor monitoring on: ${competitors.join(", ")}. Focus on launches, strategic moves, pricing, partnerships, and go-to-market changes.`;
  }
  if (category === "industry" && industry) {
    return `Industry monitoring for ${industry}. Focus on recent trends, demand shifts, regulations, and tactical marketing opportunities.`;
  }
  if (keywords.length > 0) {
    return `Track strategic signals around: ${keywords.join(", ")}.`;
  }
  const defaults: Record<string, string> = {
    marketing: "B2B marketing signals: paid media, SEO, content distribution, and attribution shifts.",
    technology: "Technology signals: AI product launches, martech updates, and automation workflows.",
    finance: "Business and finance signals affecting marketing budgets and acquisition efficiency.",
    industry: "Industry signals relevant for growth and demand generation.",
    competitor: "Competitive intelligence signals for adjacent players.",
  };
  return defaults[category] || defaults.marketing;
}

function normalizeArticles(raw: unknown, category: string): NewsArticle[] {
  const rows = asArray(raw);
  return rows
    .map((item, index) => {
      const row = asObject(item);
      if (!row) return null;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      const summary = typeof row.summary === "string" ? row.summary.trim() : "";
      if (!title || !summary) return null;
      const citations = asArray(row.citations).filter((c): c is string => typeof c === "string");
      return {
        id: `news-${Date.now()}-${index}`,
        title,
        summary,
        source: typeof row.source === "string" ? row.source : "Claude AI",
        timestamp: new Date().toISOString(),
        category: typeof row.category === "string" ? row.category : category || "industry",
        citations,
        imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : undefined,
        url: typeof row.url === "string" ? row.url : undefined,
      } satisfies NewsArticle;
    })
    .filter((row): row is NewsArticle => Boolean(row));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let runId: string | null = null;
  let runStartedAt = Date.now();
  let runSupabase: ReturnType<typeof createClient> | null = null;
  try {
    const { category = "marketing", competitors = [], keywords = [], industry = "" } = await req.json();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase runtime secrets");

    const safeCategory = typeof category === "string" ? category : "marketing";
    const safeIndustry = typeof industry === "string" ? industry : "";
    const safeCompetitors = asArray(competitors).filter((x): x is string => typeof x === "string");
    const safeKeywords = asArray(keywords).filter((x): x is string => typeof x === "string");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    runSupabase = supabase;
    runStartedAt = Date.now();
    runId = await startIntegrationRun(supabase, {
      provider: "market-news",
      connector: safeCategory,
      triggerType: "manual",
      requestPayload: {
        industry: safeIndustry,
        competitorsCount: safeCompetitors.length,
        keywordsCount: safeKeywords.length,
      },
    });
    const cacheKey = generateCacheKey(safeCategory, safeIndustry, safeCompetitors, safeKeywords);

    const { data: cachedData, error: cacheError } = await supabase
      .from("news_cache")
      .select("articles, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (!cacheError && cachedData?.expires_at && new Date(cachedData.expires_at) > new Date()) {
      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: {
          recordsFetched: Array.isArray(cachedData.articles) ? cachedData.articles.length : 0,
          recordsUpserted: 0,
          recordsFailed: 0,
          durationMs: Date.now() - runStartedAt,
        },
      });
      return new Response(JSON.stringify({ articles: cachedData.articles, cached: true, model: "claude" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchQuery = buildSearchQuery(safeCategory, safeIndustry, safeCompetitors, safeKeywords);
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
      "citations": ["url1","url2"],
      "url": "primary url or empty string",
      "imageUrl": "optional image url or empty string"
    }
  ]
}
No markdown. No extra keys.
`;

    const { data: claudePayload, modelUsed, rawText } = await callClaudeJson<{ articles: unknown[] }>({
      systemPrompt,
      userPrompt,
    });
    const articles = normalizeArticles(claudePayload?.articles ?? [], safeCategory);

    const finalArticles =
      articles.length > 0
        ? articles
        : [
            {
              id: `news-${Date.now()}-fallback`,
              title: "Veille update",
              summary: rawText.slice(0, 300) || "No structured output returned by Claude.",
              source: "Claude AI",
              timestamp: new Date().toISOString(),
              category: safeCategory,
              citations: [],
              imageUrl: undefined,
              url: undefined,
            },
          ];

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);
    await supabase.from("news_cache").upsert(
      {
        cache_key: cacheKey,
        articles: finalArticles,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "cache_key" },
    );
    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: finalArticles.length,
        recordsUpserted: finalArticles.length,
        recordsFailed: 0,
        durationMs: Date.now() - runStartedAt,
      },
      samplePayload: finalArticles[0] as Record<string, unknown> | undefined,
    });

    return new Response(
      JSON.stringify({
        articles: finalArticles,
        cached: false,
        model: "claude",
        modelUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("market-news error:", error);
    if (runSupabase) {
      await finishIntegrationRun(runSupabase, runId, {
        status: "failed",
        metrics: {
          durationMs: Date.now() - runStartedAt,
        },
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
