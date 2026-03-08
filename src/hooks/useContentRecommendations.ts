import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContentRecommendation {
  id: string;
  client_id: string;
  channel: 'linkedin' | 'blog' | 'youtube' | 'newsletter';
  title: string;
  rationale: string;
  brief: {
    angle?: string;
    key_points?: string[];
    tone?: string;
    suggested_length?: string;
    suggested_cta?: string;
    references?: { title: string; url?: string; impressions?: number }[];
  } | null;
  priority_score: number;
  score_breakdown: {
    past_performance?: number;
    pillar_freshness?: number;
    trend?: number;
    calendar?: number;
    diversity?: number;
  } | null;
  context_tags: string[];
  supporting_metrics: Record<string, string | number> | null;
  status: 'active' | 'dismissed' | 'postponed' | 'converted';
  generated_at: string;
  dismissed_at: string | null;
  converted_at: string | null;
  created_at: string;
  clients?: { name: string; color: string } | null;
}

export function useContentRecommendations(clientId?: string | null) {
  return useQuery({
    queryKey: ['content-recommendations', clientId],
    queryFn: async () => {
      let query = supabase
        .from('content_recommendations')
        .select('*, clients(name, color)')
        .in('status', ['active', 'postponed'])
        .order('priority_score', { ascending: false })
        .limit(6);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ContentRecommendation[];
    },
  });
}

export function useUpdateRecommendationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'dismissed' | 'postponed' | 'converted' }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'dismissed') updates.dismissed_at = new Date().toISOString();
      if (status === 'converted') updates.converted_at = new Date().toISOString();

      const { error } = await supabase
        .from('content_recommendations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-recommendations'] });
    },
  });
}

export function useRefreshRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { client_id: clientId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-recommendations'] });
    },
  });
}
