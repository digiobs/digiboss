import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlanTaskContentRow } from './useContentTasks';
import type { TaskType } from '@/types/tasks';

/**
 * Generic hook to fetch plan_tasks filtered by task_type. Returns the raw
 * row shape so callers can feed it directly into <CreateTaskDialog task={...} />
 * for editing, or render it as a compact list.
 *
 * Query key: ['plan-tasks-by-type', taskType, clientId]
 */
export function usePlanTasksByType(taskType: TaskType, clientId?: string) {
  return useQuery({
    queryKey: ['plan-tasks-by-type', taskType, clientId],
    queryFn: async (): Promise<PlanTaskContentRow[]> => {
      const query = (supabase as unknown as { from: (table: string) => Record<string, unknown> })
        .from('plan_tasks')
        .select('*')
        .eq('task_type', taskType)
        .not('status', 'eq', 'cancelled')
        .order('updated_at', { ascending: false }) as Record<string, unknown>;

      const scoped = clientId
        ? (query as { eq: (col: string, val: string) => unknown }).eq('client_id', clientId)
        : query;

      const { data, error } = (await scoped) as unknown as {
        data: PlanTaskContentRow[] | null;
        error: { message: string } | null;
      };

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
