import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlanTaskContentRow } from './useContentTasks';
import type { CalendarEntry } from './useEditorialCalendar';

/**
 * Fetches every action belonging to a client for a given monthly batch:
 * plan_tasks filtered by `period = YYYY-MM` and editorial_calendar filtered
 * by the month's date range. Both queries run in parallel via `useQueries`.
 */

const sb = supabase as unknown as { from: (t: string) => Record<string, unknown> };

function monthBounds(period: string): { first: string; last: string } {
  // period is `YYYY-MM` — derive ISO date bounds without pulling in date-fns.
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-12
  if (!year || !month) {
    const now = new Date();
    return monthBounds(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  // Last day of month = day 0 of next month
  const nextMonth = new Date(Date.UTC(year, month, 0));
  const lastDay = String(nextMonth.getUTCDate()).padStart(2, '0');
  const last = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { first, last };
}

async function fetchPlanTasks(
  clientId: string | null,
  period: string,
): Promise<PlanTaskContentRow[]> {
  if (!clientId) return [];
  const query = sb
    .from('plan_tasks')
    .select('*')
    .eq('client_id', clientId)
    .eq('period', period)
    .not('status', 'eq', 'cancelled')
    .order('task_type', { ascending: true })
    .order('updated_at', { ascending: false });
  const { data, error } = (await query) as unknown as {
    data: PlanTaskContentRow[] | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchEditorialForMonth(
  clientId: string | null,
  period: string,
): Promise<CalendarEntry[]> {
  if (!clientId) return [];
  const { first, last } = monthBounds(period);
  const query = sb
    .from('editorial_calendar')
    .select('*')
    .eq('client_id', clientId)
    .gte('date', first)
    .lte('date', last)
    .order('date', { ascending: true });
  const { data, error } = (await query) as unknown as {
    data: CalendarEntry[] | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface UseMonthlyActionsResult {
  planTasks: PlanTaskContentRow[];
  editorialEntries: CalendarEntry[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useMonthlyActions(options: {
  clientId: string | null;
  period: string;
}): UseMonthlyActionsResult {
  const { clientId, period } = options;

  const STALE_TIME = 2 * 60 * 1000;

  const queries = useQueries({
    queries: [
      {
        queryKey: ['monthly-actions', 'plan-tasks', clientId, period],
        queryFn: () => fetchPlanTasks(clientId, period),
        staleTime: STALE_TIME,
        enabled: Boolean(clientId && period),
      },
      {
        queryKey: ['monthly-actions', 'editorial', clientId, period],
        queryFn: () => fetchEditorialForMonth(clientId, period),
        staleTime: STALE_TIME,
        enabled: Boolean(clientId && period),
      },
    ],
  });

  const [planTasksQ, editorialQ] = queries;

  return {
    planTasks: planTasksQ.data ?? [],
    editorialEntries: editorialQ.data ?? [],
    isLoading: queries.some((q) => q.isLoading) && !queries.some((q) => q.data !== undefined),
    isFetching: queries.some((q) => q.isFetching),
    isError: queries.some((q) => q.isError),
    refetch: () => {
      queries.forEach((q) => q.refetch());
    },
  };
}

/**
 * Mutation to update a plan_task status from the /actions page. Invalidates
 * every cache key that could be displaying this row so the Home, Plan and
 * TypedTasksSection stay in sync.
 */
export function useUpdateActionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; status: string }) => {
      const { id, status } = args;
      const { error } = (await sb
        .from('plan_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)) as unknown as { error: { message: string } | null };
      if (error) throw new Error(error.message);
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-actions'] });
      queryClient.invalidateQueries({ queryKey: ['plan-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['plan-tasks-by-type'] });
      queryClient.invalidateQueries({ queryKey: ['content-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['client-avancement'] });
      queryClient.invalidateQueries({ queryKey: ['journal', 'task'] });
    },
  });
}

/** Current month in the `YYYY-MM` convention used by the period column. */
export function currentPeriod(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
