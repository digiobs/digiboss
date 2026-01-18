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

interface UseMarketNewsResult {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  refetch: (category?: string) => Promise<void>;
}

export function useMarketNews(initialCategory: string = 'marketing'): UseMarketNewsResult {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (category: string = initialCategory) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('market-news', {
        body: { category },
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
  }, [initialCategory]);

  useEffect(() => {
    fetchNews(initialCategory);
  }, [initialCategory, fetchNews]);

  return {
    articles,
    isLoading,
    error,
    refetch: fetchNews,
  };
}
