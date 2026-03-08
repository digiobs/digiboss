import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export function useAlerts() {
  const { clients } = useClient();
  const clientIds = clients.map(c => c.id);

  return useQuery({
    queryKey: ['home-alerts', clientIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, clients(name, color)')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDismissAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home-alerts'] }),
  });
}

export function useHomeKPIs() {
  const { clients } = useClient();
  const clientIds = clients.map(c => c.id);

  return useQuery({
    queryKey: ['home-kpis', clientIds],
    queryFn: async () => {
      // Get contents count (30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();

      const [contentsRes, prevContentsRes, metricsRes, healthRes] = await Promise.all([
        supabase.from('contents').select('id', { count: 'exact' }).gte('published_at', thirtyDaysAgo),
        supabase.from('contents').select('id', { count: 'exact' }).gte('published_at', sixtyDaysAgo).lt('published_at', thirtyDaysAgo),
        supabase.from('content_metrics').select('impressions').gte('measured_at', thirtyDaysAgo),
        supabase.from('client_health_scores').select('overall_score'),
      ]);

      const contentsCount = contentsRes.count ?? 0;
      const prevContentsCount = prevContentsRes.count ?? 0;
      const totalImpressions = (metricsRes.data ?? []).reduce((sum, m) => sum + (m.impressions ?? 0), 0);
      const healthScores = healthRes.data ?? [];
      const avgHealth = healthScores.length > 0
        ? Math.round(healthScores.reduce((s, h) => s + h.overall_score, 0) / healthScores.length)
        : 0;

      return {
        activeClients: clientIds.length,
        contentsPublished: contentsCount,
        contentsDelta: prevContentsCount > 0 ? Math.round(((contentsCount - prevContentsCount) / prevContentsCount) * 100) : 0,
        totalImpressions,
        avgHealthScore: avgHealth,
      };
    },
  });
}

export function useHomeNBA() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['home-nba'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('next_best_actions')
        .select('*, clients(name, color)')
        .eq('status', 'active')
        .order('priority_score', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'actioned') updates.actioned_at = new Date().toISOString();
      if (status === 'dismissed') updates.dismissed_at = new Date().toISOString();

      const { error } = await supabase
        .from('next_best_actions')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home-nba'] }),
  });

  return { ...query, updateStatus };
}

export function useCalendarEvents(weekOffset: number = 0) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);

  return useQuery({
    queryKey: ['home-calendar', weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, clients(name, color)')
        .gte('scheduled_at', startOfWeek.toISOString())
        .lt('scheduled_at', endOfWeek.toISOString())
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return { events: data ?? [], startOfWeek, endOfWeek };
    },
  });
}

export function useClientHealthScores() {
  return useQuery({
    queryKey: ['home-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_health_scores')
        .select('*, clients(name, color)')
        .order('overall_score', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActivityFeed(periodDays: number = 7) {
  const since = new Date(Date.now() - periodDays * 86400000).toISOString();

  return useQuery({
    queryKey: ['home-activity', periodDays],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*, clients(name, color)')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
