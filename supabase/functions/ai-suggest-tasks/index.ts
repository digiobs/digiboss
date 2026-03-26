import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, finishIntegrationRun, startIntegrationRun } from "../_shared/ingestion.ts";
import { callClaudeJson } from "../_shared/claude.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let runId: string | null = null;
  let runStartedAt = Date.now();
  let runSupabase: ReturnType<typeof createServiceClient> | null = null;
  try {
    const { currentTasks, context } = await req.json();
    const supabase = createServiceClient();
    runSupabase = supabase;
    runStartedAt = Date.now();
    runId = await startIntegrationRun(supabase, {
      provider: "claude",
      connector: "nba-tasks",
      triggerType: "manual",
      requestPayload: {
        tasksCount: Array.isArray(currentTasks) ? currentTasks.length : 0,
        hasContext: Boolean(context),
      },
    });
    
    const systemPrompt = `You are a marketing strategy AI assistant for DigiObs, a digital marketing platform. 
Your role is to analyze the current marketing tasks and suggest 3-5 new actionable tasks that would help improve marketing performance.

Consider:
- Content marketing (blog posts, case studies, social media)
- SEO optimization
- Paid advertising (LinkedIn, Google Ads)
- Email marketing
- Lead generation and nurturing
- Analytics and reporting
- Brand awareness campaigns

Provide tasks that are specific, actionable, and aligned with modern B2B marketing best practices.`;

    const currentTasksSummary = currentTasks?.length > 0
      ? `Current tasks in the plan:\n${currentTasks
          .map((task: unknown) => {
            const row = task && typeof task === "object" ? (task as Record<string, unknown>) : {};
            const title = typeof row.title === "string" ? row.title : "Untitled task";
            const status = typeof row.status === "string" ? row.status : "unknown";
            const priority = typeof row.priority === "string" ? row.priority : "unknown";
            return `- ${title} (${status}, ${priority} priority)`;
          })
          .join("\n")}`
      : 'No current tasks in the plan.';

    const userPrompt = `${currentTasksSummary}

${context ? `Additional context: ${context}` : ''}

Based on the current state of the marketing plan, suggest 3-5 new tasks that would help achieve marketing goals. Focus on high-impact activities that complement existing tasks.`;

    const schemaPrompt = `
Return STRICT JSON:
{
  "suggestions": [
    {
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "category": "string",
      "estimatedHours": 0,
      "tags": ["string"]
    }
  ]
}
No markdown.
`;
    const { data: claudeResult, modelUsed, rawText } = await callClaudeJson<{
      suggestions?: Array<{
        title?: string;
        description?: string;
        priority?: string;
        category?: string;
        estimatedHours?: number;
        tags?: string[];
      }>;
    }>({
      systemPrompt,
      userPrompt: `${userPrompt}\n\n${schemaPrompt}`,
      maxTokens: 1600,
    });

    const suggestions = Array.isArray(claudeResult?.suggestions) ? claudeResult.suggestions : [];
    const normalized = suggestions
      .filter((item) => item && typeof item.title === "string" && typeof item.description === "string")
      .slice(0, 8)
      .map((item) => ({
        title: item.title as string,
        description: item.description as string,
        priority: item.priority === "low" || item.priority === "high" ? item.priority : "medium",
        category: typeof item.category === "string" ? item.category : "General",
        estimatedHours: typeof item.estimatedHours === "number" ? item.estimatedHours : 2,
        tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : [],
      }));

    await finishIntegrationRun(supabase, runId, {
      status: normalized.length > 0 ? "success" : "partial",
      metrics: {
        recordsFetched: 1,
        recordsUpserted: normalized.length,
        recordsFailed: 0,
        durationMs: Date.now() - runStartedAt,
      },
      samplePayload: {
        modelUsed,
        sampleTitle: normalized[0]?.title ?? null,
        rawText: rawText.slice(0, 160),
      },
    });
    return new Response(JSON.stringify({ suggestions: normalized, model: "claude", modelUsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI suggest tasks error:", error);
    if (runSupabase) {
      await finishIntegrationRun(runSupabase, runId, {
        status: "failed",
        metrics: {
          durationMs: Date.now() - runStartedAt,
        },
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
