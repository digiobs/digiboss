import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  category: string;
  citations: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category } = await req.json();
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not configured');
      throw new Error('Perplexity API key is not configured');
    }

    // Build the search query based on category
    const categoryQueries: Record<string, string> = {
      'marketing': 'latest B2B marketing trends, digital marketing news, advertising industry updates',
      'technology': 'latest technology news, AI developments, software industry updates',
      'finance': 'latest finance news, stock market updates, business financial news',
      'industry': 'B2B industry news, SaaS trends, enterprise software updates',
      'competitor': 'marketing technology company news, martech competitor updates',
    };

    const searchQuery = query || categoryQueries[category] || categoryQueries['marketing'];
    
    console.log(`Fetching market news for query: ${searchQuery}`);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: `You are a market intelligence analyst. Provide 5 recent news articles about the requested topic. For each article, provide a title, a 2-3 sentence summary, the source name, and categorize it as one of: marketing, technology, finance, industry, or competitor. Format your response as a JSON array.` 
          },
          { 
            role: 'user', 
            content: `Find the latest news about: ${searchQuery}. Return exactly 5 news items as a JSON array with objects containing: title, summary, source, category. Only return the JSON array, no other text.` 
          }
        ],
        search_recency_filter: 'week',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];
    
    console.log('Raw Perplexity response:', content);

    // Parse the news articles from the response
    let articles: NewsArticle[] = [];
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        articles = parsed.map((item: any, index: number) => ({
          id: `news-${Date.now()}-${index}`,
          title: item.title || 'Untitled',
          summary: item.summary || item.description || '',
          source: item.source || 'Various sources',
          timestamp: new Date().toISOString(),
          category: item.category || category || 'industry',
          citations: citations.slice(index * 2, index * 2 + 2) || [],
        }));
      }
    } catch (parseError) {
      console.error('Error parsing news articles:', parseError);
      // Fallback: create a single article from the response
      articles = [{
        id: `news-${Date.now()}-0`,
        title: 'Market Intelligence Update',
        summary: content.slice(0, 300),
        source: 'Perplexity AI',
        timestamp: new Date().toISOString(),
        category: category || 'industry',
        citations: citations,
      }];
    }

    console.log(`Returning ${articles.length} articles`);

    return new Response(
      JSON.stringify({ articles, citations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in market-news function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
