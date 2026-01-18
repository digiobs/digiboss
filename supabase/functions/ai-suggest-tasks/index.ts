import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentTasks, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
      ? `Current tasks in the plan:\n${currentTasks.map((t: any) => `- ${t.title} (${t.status}, ${t.priority} priority)`).join('\n')}`
      : 'No current tasks in the plan.';

    const userPrompt = `${currentTasksSummary}

${context ? `Additional context: ${context}` : ''}

Based on the current state of the marketing plan, suggest 3-5 new tasks that would help achieve marketing goals. Focus on high-impact activities that complement existing tasks.`;

    console.log("Calling Lovable AI for task suggestions...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_tasks",
              description: "Return 3-5 actionable marketing task suggestions.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Clear, actionable task title" },
                        description: { type: "string", description: "Detailed description of the task" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        category: { type: "string", description: "Marketing category (e.g., Content, SEO, Ads, Email)" },
                        estimatedHours: { type: "number", description: "Estimated hours to complete" },
                        tags: { type: "array", items: { type: "string" } }
                      },
                      required: ["title", "description", "priority", "category"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_tasks" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data).substring(0, 500));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const suggestions = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse from content
    const content = data.choices?.[0]?.message?.content;
    return new Response(JSON.stringify({ suggestions: [], rawContent: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI suggest tasks error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
