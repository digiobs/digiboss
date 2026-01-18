import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  imageUrl: string;
  url: string;
  timestamp: string;
  category: 'industry' | 'competitor';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, query, competitors } = await req.json();
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Perplexity API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let searchPrompt = "";
    
    if (type === "industry") {
      searchPrompt = `Find the 5 most recent and important B2B marketing news, trends, and updates from the last 7 days. Focus on:
- Digital marketing trends
- Marketing technology updates
- B2B lead generation strategies
- Content marketing insights
- Marketing automation news

For each article, provide:
1. A compelling title
2. A 2-3 sentence summary
3. The source/publication name
4. A relevant image URL (if available, use real image URLs from the source)
5. The article URL

Format as JSON array with fields: title, summary, source, imageUrl, url`;
    } else if (type === "competitor") {
      const competitorList = competitors?.join(", ") || "HubSpot, Marketo, Salesforce Marketing Cloud, Mailchimp, ActiveCampaign";
      searchPrompt = `Find the latest news and updates about these companies from the last 14 days: ${competitorList}

Look for:
- Product launches and feature updates
- Pricing changes
- Partnerships and acquisitions
- Leadership changes
- Market positioning changes

For each piece of news, provide:
1. A title mentioning the company
2. A 2-3 sentence summary of the update
3. The source/publication
4. A relevant image URL (company logo or article image if available)
5. The article URL

Format as JSON array with fields: title, summary, source, imageUrl, url`;
    } else {
      searchPrompt = query || "Latest B2B marketing news and trends";
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a marketing intelligence assistant. Always respond with valid JSON arrays. For imageUrl, use placeholder URLs in format https://images.unsplash.com/photo-[id]?w=400 if you can't find real images. Never use broken or made-up URLs."
          },
          {
            role: "user",
            content: searchPrompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch news", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Parse the JSON response
    let articles: NewsArticle[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        articles = parsed.map((article: any, index: number) => ({
          id: `${type}-${Date.now()}-${index}`,
          title: article.title || "Untitled",
          summary: article.summary || article.description || "",
          source: article.source || "Unknown",
          imageUrl: article.imageUrl || article.image_url || article.image || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400`,
          url: article.url || article.link || citations[index] || "#",
          timestamp: new Date().toISOString(),
          category: type as 'industry' | 'competitor',
        }));
      }
    } catch (parseError) {
      console.error("Failed to parse Perplexity response:", parseError);
      // Create a single article from the text response
      articles = [{
        id: `${type}-${Date.now()}-0`,
        title: type === "industry" ? "Latest Marketing News" : "Competitor Update",
        summary: content.substring(0, 200),
        source: "Perplexity AI",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400",
        url: citations[0] || "#",
        timestamp: new Date().toISOString(),
        category: type as 'industry' | 'competitor',
      }];
    }

    return new Response(
      JSON.stringify({ articles, citations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Dashboard news error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
