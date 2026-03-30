import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvancementTask {
  id: string;
  client_id: string;
  client_name: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  importance: string;
  assignee: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  resource_links: { type: string; url: string; label: string }[];
  wrike_permalink: string | null;
  wrike_task_id: string | null;
  tags: string[];
  overdue_days: number;
  health_status: string;
  overdue_label: string | null;
}

export interface AvancementKPIs {
  active_count: number;
  overdue_count: number;
  completed_count: number;
  deferred_count: number;
  total_count: number;
  completion_pct: number;
}

export interface TeamMember {
  member: string;
  total_tasks: number;
  overdue_tasks: number;
  active_tasks: number;
}

function computeKPIs(tasks: AvancementTask[]): AvancementKPIs {
  const overdue = tasks.filter((t) => t.health_status === 'overdue').length;
  const onTrack = tasks.filter((t) => t.health_status === 'on_track').length;
  const completed = tasks.filter((t) => t.health_status === 'completed').length;
  const deferred = tasks.filter((t) => t.health_status === 'deferred').length;
  return {
    active_count: overdue + onTrack,
    overdue_count: overdue,
    completed_count: completed,
    deferred_count: deferred,
    total_count: tasks.length,
    completion_pct: tasks.length ? Math.round((100 * completed) / tasks.length) : 0,
  };
}

function computeTeam(tasks: AvancementTask[]): TeamMember[] {
  const map = new Map<string, { total: number; overdue: number; active: number }>();
  tasks
    .filter((t) => t.status !== 'completed' && t.status !== 'cancelled' && t.assignee)
    .forEach((t) => {
      t.assignee!.split(', ').forEach((m) => {
        const entry = map.get(m) || { total: 0, overdue: 0, active: 0 };
        entry.total++;
        if (t.health_status === 'overdue') entry.overdue++;
        if (t.health_status === 'on_track') entry.active++;
        map.set(m, entry);
      });
    });
  return Array.from(map.entries())
    .map(([member, stats]) => ({
      member,
      total_tasks: stats.total,
      overdue_tasks: stats.overdue,
      active_tasks: stats.active,
    }))
    .sort((a, b) => b.overdue_tasks - a.overdue_tasks || b.total_tasks - a.total_tasks);
}

export function useClientAvancement(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-avancement', clientId],
    queryFn: async () => {
      if (!clientId) return { tasks: [], kpis: computeKPIs([]), team: [] };

      const { data, error } = await (supabase as unknown as { from: (table: string) => Record<string, unknown> })
        .from('v_client_avancement')
        .select('*')
        .eq('client_id', clientId) as unknown as { data: AvancementTask[] | null; error: { message: string } | null };

      if (error) throw new Error(error.message);
      const tasks = data || [];
      return {
        tasks,
        kpis: computeKPIs(tasks),
        team: computeTeam(tasks),
      };
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}
