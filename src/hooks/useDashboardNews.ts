import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  imageUrl: string;
  url: string;
  timestamp: string;
  category: 'industry' | 'competitor';
}

interface UseDashboardNewsResult {
  industryNews: NewsArticle[];
  competitorNews: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardNews(competitors?: string[], industry?: string): UseDashboardNewsResult {
  const [industryNews, setIndustryNews] = useState<NewsArticle[]>([]);
  const [competitorNews, setCompetitorNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both types in parallel
      const [industryResponse, competitorResponse] = await Promise.all([
        supabase.functions.invoke('dashboard-news', {
          body: { type: 'industry', industry }
        }),
        supabase.functions.invoke('dashboard-news', {
          body: { type: 'competitor', competitors }
        })
      ]);

      if (industryResponse.error) {
        console.error('Industry news error:', industryResponse.error);
      } else {
        setIndustryNews(industryResponse.data?.articles || []);
      }

      if (competitorResponse.error) {
        console.error('Competitor news error:', competitorResponse.error);
      } else {
        setCompetitorNews(competitorResponse.data?.articles || []);
      }
    } catch (err) {
      console.error('Dashboard news fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setIsLoading(false);
    }
  }, [competitors?.join(','), industry]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return {
    industryNews,
    competitorNews,
    isLoading,
    error,
    refetch: fetchNews,
  };
}
