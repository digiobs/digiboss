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
  skill: string;
  severity: string;
  is_actionable: boolean;
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
      const VALID_SKILLS = ["veille","market_intelligence","seo","ads","social","concurrence","reputation","compliance"];
      const VALID_SEVERITIES = ["alert","warning","opportunity","info"];
      const rawSkill = typeof row.skill === "string" ? row.skill : "";
      const rawSeverity = typeof row.severity === "string" ? row.severity : "";
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
        skill: VALID_SKILLS.includes(rawSkill) ? rawSkill : "veille",
        severity: VALID_SEVERITIES.includes(rawSeverity) ? rawSeverity : "info",
        is_actionable: typeof row.is_actionable === "boolean" ? row.is_actionable : false,
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
    const { category = "marketing", competitors = [], keywords = [], industry = "", clientId } = await req.json();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase runtime secrets");

    const safeCategory = typeof category === "string" ? category : "marketing";
    let safeIndustry = typeof industry === "string" ? industry : "";
    let safeCompetitors = asArray(competitors).filter((x): x is string => typeof x === "string");
    let safeKeywords = asArray(keywords).filter((x): x is string => typeof x === "string");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // When called from Veille page with a clientId, enrich context from client_configs
    if (clientId) {
      const { data: config } = await supabase
        .from("client_configs")
        .select("industry, competitors, market_news_keywords")
        .eq("client_id", clientId)
        .maybeSingle();

      if (config) {
        if (!safeIndustry && typeof config.industry === "string" && config.industry.trim()) {
          safeIndustry = config.industry.trim();
        }
        const cfgComp = asArray(config.competitors).filter((x): x is string => typeof x === "string");
        const cfgKw = asArray(config.market_news_keywords).filter((x): x is string => typeof x === "string");
        safeCompetitors = [...new Set([...safeCompetitors, ...cfgComp])];
        safeKeywords = [...new Set([...safeKeywords, ...cfgKw])];
      }
    }

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
      // Cache hit — but if veille_items is empty for this client, backfill from cache
      if (clientId) {
        const { count } = await supabase
          .from("veille_items")
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId);

        if (!count || count === 0) {
          const cachedArticles = normalizeArticles(
            Array.isArray(cachedData.articles) ? cachedData.articles : [],
            safeCategory,
          );
          if (cachedArticles.length > 0) {
            const rows = cachedArticles.map((a) => ({
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
                citations: a.citations || [],
              },
            }));
            await supabase.from("veille_items").insert(rows);
          }
        }
      }

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
              skill: "veille",
              severity: "info",
              is_actionable: false,
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

    // Persist veille items into the veille_items table so the Veille page can display them
    if (clientId && finalArticles.length > 0) {
      const veilleRows = finalArticles.map((a) => ({
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
          citations: a.citations || [],
        },
      }));

      const { error: insertError } = await supabase
        .from("veille_items")
        .insert(veilleRows);

      if (insertError) {
        console.error("Failed to insert veille_items:", insertError);
      }
    }

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
