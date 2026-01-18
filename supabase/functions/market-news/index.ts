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
    const { category, competitors, keywords, industry } = await req.json();
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not configured');
      throw new Error('Perplexity API key is not configured');
    }

    console.log(`Fetching market news - category: ${category}, industry: ${industry}, competitors: ${competitors}, keywords: ${keywords}`);

    // Build customized search query based on client config
    let searchQuery = '';
    
    if (category === 'competitor' && competitors?.length > 0) {
      searchQuery = `Latest news about ${competitors.join(', ')}: product updates, announcements, market moves, partnerships`;
    } else if (category === 'industry' && industry) {
      const keywordContext = keywords?.length > 0 ? ` focusing on ${keywords.join(', ')}` : '';
      searchQuery = `Latest ${industry} industry news and trends${keywordContext}`;
    } else if (keywords?.length > 0) {
      searchQuery = `Latest news about ${keywords.join(', ')}`;
    } else {
      // Default category queries
      const categoryQueries: Record<string, string> = {
        'marketing': 'latest B2B marketing trends, digital marketing news, advertising industry updates',
        'technology': 'latest technology news, AI developments, software industry updates',
        'finance': 'latest finance news, stock market updates, business financial news',
        'industry': industry ? `${industry} industry news and updates` : 'B2B industry news, SaaS trends, enterprise software updates',
        'competitor': competitors?.length > 0 ? `news about ${competitors.join(', ')}` : 'marketing technology company news, martech competitor updates',
      };
      searchQuery = categoryQueries[category] || categoryQueries['marketing'];
    }
    
    console.log(`Search query: ${searchQuery}`);

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
            content: `You are a market intelligence analyst specializing in ${industry || 'business'}. Provide 5 recent news articles about the requested topic. For each article, provide a title, a 2-3 sentence summary explaining the significance, the source name, and categorize it appropriately. Format your response as a JSON array.` 
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];
    
    console.log('Raw Perplexity response received');

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
        title: `${industry || 'Market'} Intelligence Update`,
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
