import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export type Channel = 'linkedin' | 'blog' | 'youtube' | 'newsletter';

export interface Content {
  id: string;
  client_id: string;
  channel: Channel;
  title: string;
  body: string | null;
  published_at: string;
  source_url: string | null;
  tags: string[];
  status: string;
  clients?: { name: string } | null;
  content_metrics?: ContentMetric[];
}

export interface ContentMetric {
  id: string;
  content_id: string;
  measured_at: string;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  avg_time_on_page: number | null;
  bounce_rate: number | null;
  top_traffic_source: string | null;
  avg_watch_duration: number | null;
  retention_rate: number | null;
  sends: number;
  open_rate: number | null;
  click_rate: number | null;
  unsubscribes: number;
}

export function useContents(options: {
  clientId?: string | null;
  channel?: Channel | 'all';
  periodDays?: number;
}) {
  const { clientId, channel = 'all', periodDays = 30 } = options;

  return useQuery({
    queryKey: ['contents', clientId, channel, periodDays],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - periodDays);

      let query = (supabase as any)
        .from('contents')
        .select('*, clients(name), content_metrics(*)')
        .eq('status', 'published')
        .gte('published_at', since.toISOString())
        .order('published_at', { ascending: false })
        .limit(100);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      if (channel !== 'all') {
        query = query.eq('channel', channel);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Content[];
    },
  });
}

export function useContentDetail(contentId: string | null) {
  return useQuery({
    queryKey: ['content-detail', contentId],
    enabled: !!contentId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contents')
        .select('*, clients(name), content_metrics(*)')
        .eq('id', contentId!)
        .single();
      if (error) throw error;
      return data as Content;
    },
  });
}
