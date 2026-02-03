import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  title: string;
  keywords?: string[];
  brandTone?: string[];
  context?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const { title, keywords = [], brandTone = [], context = "" }: GenerateRequest = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const keywordsText = keywords.length > 0 
      ? `Target keywords to include naturally: ${keywords.join(", ")}` 
      : "";
    
    const toneText = brandTone.length > 0 
      ? `Brand tone guidelines: ${brandTone.join("; ")}` 
      : "";

    const systemPrompt = `You are an expert B2B content marketing writer. Generate high-quality, SEO-optimized blog post content.
${toneText}
Always provide actionable insights and concrete examples. Structure content with clear headings and bullet points where appropriate.`;

    const userPrompt = `Write a comprehensive blog post about: "${title}"

${keywordsText}
${context ? `Additional context: ${context}` : ""}

Please generate:
1. A compelling meta description (max 160 characters)
2. An engaging introduction paragraph that hooks the reader
3. The main body content with 3-4 sections, each with a clear heading
4. A conclusion with actionable takeaways
5. A call-to-action

Format the response as JSON with these fields:
- metaDescription: string
- introduction: string
- body: string (with markdown formatting for headings)
- conclusion: string
- callToAction: string`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Try to parse JSON from the response
    let parsedContent;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr.trim());
    } catch {
      // If JSON parsing fails, return raw content
      parsedContent = {
        metaDescription: "",
        introduction: "",
        body: content,
        conclusion: "",
        callToAction: "",
      };
    }

    return new Response(
      JSON.stringify({ 
        content: parsedContent,
        citations 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating content:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
