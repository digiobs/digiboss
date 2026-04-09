import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export interface SemrushKeyword {
  keyword: string;
  domain: string;
  position: number | null;
  previousPosition: number | null;
  change: number;
  searchVolume: number;
  trafficPercent: number;
  reportDate: string;
}

export interface PositionHistory {
  date: string;
  keyword: string;
  position: number;
}

export interface GeoMetrics {
  mentionRate: number;
  marketShare: number;
  sentimentPositive: number;
}

export interface SeoKpis {
  seoClicks: number;
  avgPosition: number;
  healthScore: number;
  quickWins: number;
}

export function useSeoGeo() {
  const { currentClient, isAllClientsSelected } = useClient();
  const [keywords, setKeywords] = useState<SemrushKeyword[]>([]);
  const [positionHistory, setPositionHistory] = useState<PositionHistory[]>([]);
  const [geoMetrics, setGeoMetrics] = useState<GeoMetrics>({ mentionRate: 0, marketShare: 0, sentimentPositive: 0 });
  const [seoKpis, setSeoKpis] = useState<SeoKpis>({ seoClicks: 0, avgPosition: 0, healthScore: 0, quickWins: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentClient?.id) return;
    setIsLoading(true);

    try {
      // 1. Fetch Semrush keyword positions (latest date per keyword + previous for change)
      let semrushQuery = supabase
        .from('semrush_domain_metrics')
        .select('keyword, domain, position, search_volume, traffic_percent, report_date')
        .order('report_date', { ascending: false })
        .limit(500);

      if (!isAllClientsSelected) {
        semrushQuery = semrushQuery.eq('client_id', currentClient.id);
      }

      const { data: semrushData, error: semrushError } = await semrushQuery;

      if (!semrushError && semrushData) {
        // Group by keyword, get latest + previous position
        const keywordMap = new Map<string, { latest: typeof semrushData[0]; previous: typeof semrushData[0] | null }>();

        for (const row of semrushData) {
          const key = row.keyword;
          if (!keywordMap.has(key)) {
            keywordMap.set(key, { latest: row, previous: null });
          } else {
            const entry = keywordMap.get(key)!;
            if (row.report_date > entry.latest.report_date) {
              entry.previous = entry.latest;
              entry.latest = row;
            } else if (!entry.previous || row.report_date > entry.previous.report_date) {
              entry.previous = row;
            }
          }
        }

        const mapped: SemrushKeyword[] = Array.from(keywordMap.values()).map(({ latest, previous }) => ({
          keyword: latest.keyword,
          domain: latest.domain,
          position: latest.position,
          previousPosition: previous?.position ?? null,
          change: previous?.position && latest.position
            ? previous.position - latest.position
            : 0,
          searchVolume: latest.search_volume ?? 0,
          trafficPercent: latest.traffic_percent ?? 0,
          reportDate: latest.report_date,
        }));

        mapped.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
        setKeywords(mapped);

        // Build position history for chart
        const history: PositionHistory[] = semrushData
          .filter((r) => r.position !== null)
          .map((r) => ({
            date: r.report_date,
            keyword: r.keyword,
            position: r.position as number,
          }));
        history.sort((a, b) => a.date.localeCompare(b.date));
        setPositionHistory(history);
      }

      // 2. Fetch reporting KPIs for SEO + AI visibility
      let kpiQuery = supabase
        .from('reporting_kpis')
        .select('section, metric_key, value')
        .in('section', ['seo', 'ai-visibility', 'acquisition'])
        .order('period_end', { ascending: false })
        .limit(100);

      if (!isAllClientsSelected) {
        kpiQuery = kpiQuery.eq('client_id', currentClient.id);
      }

      const { data: kpiData, error: kpiError } = await kpiQuery;

      if (!kpiError && kpiData) {
        const kpiMap = new Map<string, number>();
        for (const row of kpiData) {
          const key = `${row.section}:${row.metric_key}`;
          if (!kpiMap.has(key)) {
            kpiMap.set(key, row.value ?? 0);
          }
        }

        setSeoKpis({
          seoClicks: kpiMap.get('acquisition:seo_clicks') ?? 0,
          avgPosition: kpiMap.get('acquisition:avg_position') ?? 0,
          healthScore: kpiMap.get('seo:health_score') ?? 0,
          quickWins: kpiMap.get('seo:quick_wins') ?? 0,
        });

        setGeoMetrics({
          mentionRate: kpiMap.get('ai-visibility:mention_rate') ?? 0,
          marketShare: kpiMap.get('ai-visibility:market_share') ?? 0,
          sentimentPositive: kpiMap.get('ai-visibility:sentiment_positive') ?? 0,
        });
      }
    } catch (err) {
      console.error('useSeoGeo error:', err);
    }

    setIsLoading(false);
  }, [currentClient?.id, isAllClientsSelected]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived stats
  const keywordDistribution = {
    top3: keywords.filter((k) => k.position !== null && k.position <= 3).length,
    top10: keywords.filter((k) => k.position !== null && k.position <= 10).length,
    top20: keywords.filter((k) => k.position !== null && k.position <= 20).length,
    total: keywords.length,
  };

  const avgChange = keywords.length > 0
    ? keywords.reduce((sum, k) => sum + k.change, 0) / keywords.length
    : 0;

  return {
    keywords,
    positionHistory,
    geoMetrics,
    seoKpis,
    keywordDistribution,
    avgChange,
    isLoading,
    refetch: fetchData,
  };
}
