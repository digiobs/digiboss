import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  category: string;
  citations: string[];
}

interface MarketNewsConfig {
  competitors?: string[];
  keywords?: string[];
  industry?: string;
}

interface UseMarketNewsResult {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  refetch: (category?: string, config?: MarketNewsConfig) => Promise<void>;
}

export function useMarketNews(initialCategory: string = 'marketing', config?: MarketNewsConfig): UseMarketNewsResult {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (category: string = initialCategory, newsConfig?: MarketNewsConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('market-news', {
        body: { 
          category,
          competitors: newsConfig?.competitors || config?.competitors,
          keywords: newsConfig?.keywords || config?.keywords,
          industry: newsConfig?.industry || config?.industry,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setArticles(data?.articles || []);
    } catch (err) {
      console.error('Error fetching market news:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market news');
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [initialCategory, config?.competitors?.join(','), config?.keywords?.join(','), config?.industry]);

  useEffect(() => {
    fetchNews(initialCategory, config);
  }, [initialCategory, fetchNews]);

  return {
    articles,
    isLoading,
    error,
    refetch: fetchNews,
  };
}
