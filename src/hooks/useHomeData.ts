import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export function useAlerts() {
  const { clients } = useClient();
  const clientIds = clients.map(c => c.id);

  return useQuery({
    queryKey: ['home-alerts', clientIds],
    queryFn: async () => {
      // alerts table doesn't exist, return empty array
      return [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDismissAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      // alerts table doesn't exist, no-op
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

      const [contentsRes, prevContentsRes, metricsRes] = await Promise.all([
        supabase.from('contents').select('id', { count: 'exact' }).gte('published_at', thirtyDaysAgo),
        supabase.from('contents').select('id', { count: 'exact' }).gte('published_at', sixtyDaysAgo).lt('published_at', thirtyDaysAgo),
        supabase.from('content_metrics').select('impressions').gte('measured_at', thirtyDaysAgo),
      ]);

      const contentsCount = contentsRes.count ?? 0;
      const prevContentsCount = prevContentsRes.count ?? 0;
      const totalImpressions = (metricsRes.data ?? []).reduce((sum, m) => sum + ((m as any).impressions ?? 0), 0);

      return {
        activeClients: clientIds.length,
        contentsPublished: contentsCount,
        contentsDelta: prevContentsCount > 0 ? Math.round(((contentsCount - prevContentsCount) / prevContentsCount) * 100) : 0,
        totalImpressions,
        avgHealthScore: 0,
      };
    },
  });
}

export function useHomeNBA() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['home-nba'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const oneWeekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('plan_tasks')
        .select('*, clients(name, id)')
        .in('status', ['in_progress', 'backlog'])
        .eq('priority', 'high')
        .lte('due_date', oneWeekFromNow)
        .order('due_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };

      const { error } = await supabase
        .from('plan_tasks')
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
      // calendar_events table doesn't exist, return empty
      return { events: [], startOfWeek, endOfWeek };
    },
  });
}

export function useClientHealthScores() {
  return useQuery({
    queryKey: ['home-health'],
    queryFn: async () => {
      // client_health_scores table doesn't exist, return empty
      return [];
    },
  });
}

export function useActivityFeed(periodDays: number = 7) {
  const since = new Date(Date.now() - periodDays * 86400000).toISOString();

  return useQuery({
    queryKey: ['home-activity', periodDays],
    queryFn: async () => {
      // activity_feed table doesn't exist, return empty
      return [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useUrgentTasks() {
  return useQuery({
    queryKey: ['home-urgent-tasks'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const oneWeekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('plan_tasks')
        .select('*, clients(name, id)')
        .in('status', ['in_progress', 'backlog'])
        .eq('priority', 'high')
        .lte('due_date', oneWeekFromNow)
        .gte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: ['home-overdue-tasks'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('plan_tasks')
        .select('id, client_id')
        .lt('due_date', today)
        .notIn('status', ['done', 'cancelled']);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useHomeKPIsData() {
  return useQuery({
    queryKey: ['home-kpis-data'],
    queryFn: async () => {
      // home_kpis table exists but may have different structure, compute from plan_tasks
      try {
        const [activeTasks, weekTasks, highPriority, completedMonth] = await Promise.all([
          supabase.from('plan_tasks').select('id', { count: 'exact' }).eq('status', 'in_progress'),
          supabase.from('plan_tasks').select('id', { count: 'exact' }).eq('status', 'in_progress')
            .lte('due_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]),
          supabase.from('plan_tasks').select('id', { count: 'exact' }).eq('priority', 'high'),
          supabase.from('plan_tasks').select('id', { count: 'exact' }).eq('status', 'done')
            .gte('updated_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        ]);

        return {
          total_tasks_active: activeTasks.count ?? 0,
          tasks_due_this_week: weekTasks.count ?? 0,
          high_priority_count: highPriority.count ?? 0,
          completed_this_month: completedMonth.count ?? 0,
        };
      } catch {
        return {
          total_tasks_active: 0,
          tasks_due_this_week: 0,
          high_priority_count: 0,
          completed_this_month: 0,
        };
      }
    },
  });
}

export function useClientTaskHealth() {
  return useQuery({
    queryKey: ['client-task-health'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('plan_tasks')
        .select('client_id, status, clients(name, id)');
      if (error) throw error;

      // Group by client and calculate health metrics
      const grouped = (data ?? []).reduce((acc: Record<string, any>, task: any) => {
        const clientId = task.client_id;
        if (!acc[clientId]) {
          acc[clientId] = {
            client_id: clientId,
            clients: task.clients,
            total: 0,
            overdue: 0,
            in_progress: 0,
            done: 0,
          };
        }
        acc[clientId].total += 1;
        if (task.status === 'done') acc[clientId].done += 1;
        if (task.status === 'in_progress') acc[clientId].in_progress += 1;
        return acc;
      }, {});

      // Calculate health status for each client
      return Object.values(grouped).map((client: any) => {
        let health = 'green';
        if (client.overdue >= 3) health = 'red';
        else if (client.overdue >= 1) health = 'yellow';

        return {
          ...client,
          health,
          completion_rate: client.total > 0 ? Math.round((client.done / client.total) * 100) : 0,
        };
      });
    },
  });
}
