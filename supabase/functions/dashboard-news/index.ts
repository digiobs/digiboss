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
    const { type, industry, competitors, keywords } = await req.json();
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Perplexity API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching ${type} news for industry: ${industry}, competitors: ${competitors}, keywords: ${keywords}`);

    let searchPrompt = "";
    
    if (type === "industry") {
      const industryContext = industry || "B2B marketing";
      const keywordContext = keywords?.length > 0 ? keywords.join(", ") : "";
      
      searchPrompt = `Find the 5 most recent and important news, trends, and updates about the ${industryContext} industry from the last 7 days.
${keywordContext ? `Focus on topics related to: ${keywordContext}` : ''}

For each article, provide:
1. A compelling title
2. A 2-3 sentence summary explaining why this matters for ${industryContext} professionals
3. The source/publication name
4. The article URL

Format as JSON array with fields: title, summary, source, url`;

    } else if (type === "competitor") {
      const competitorList = competitors?.length > 0 
        ? competitors.join(", ") 
        : "major industry players";
      
      searchPrompt = `Find the latest news and updates about these companies from the last 14 days: ${competitorList}

Look for:
- Product launches and feature updates
- Pricing changes
- Partnerships and acquisitions
- Leadership changes
- Market positioning changes
- Major announcements

For each piece of news, provide:
1. A title mentioning the specific company
2. A 2-3 sentence summary of the update and its implications
3. The source/publication
4. The article URL

Format as JSON array with fields: title, summary, source, url`;
    } else {
      searchPrompt = "Latest B2B marketing news and trends";
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
            content: "You are a market intelligence analyst. Always respond with valid JSON arrays. Provide real, recent news with accurate source attribution. For imageUrl, use a relevant Unsplash image URL in format https://images.unsplash.com/photo-[relevant-id]?w=400."
          },
          {
            role: "user",
            content: searchPrompt
          }
        ],
        temperature: 0.3,
        search_recency_filter: type === "industry" ? "week" : "month",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to fetch news", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    console.log("Perplexity response received, parsing articles...");

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
          imageUrl: article.imageUrl || article.image_url || article.image || getDefaultImage(type, index),
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
        title: type === "industry" ? `${industry || 'Industry'} Update` : "Competitor Update",
        summary: content.substring(0, 200),
        source: "Perplexity AI",
        imageUrl: getDefaultImage(type, 0),
        url: citations[0] || "#",
        timestamp: new Date().toISOString(),
        category: type as 'industry' | 'competitor',
      }];
    }

    console.log(`Returning ${articles.length} ${type} articles`);

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

function getDefaultImage(type: string, index: number): string {
  const industryImages = [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
    "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400",
  ];
  const competitorImages = [
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400",
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400",
  ];
  
  const images = type === "industry" ? industryImages : competitorImages;
  return images[index % images.length];
}
