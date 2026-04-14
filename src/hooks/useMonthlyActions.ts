import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlanTaskContentRow } from './useContentTasks';
import type { CalendarEntry } from './useEditorialCalendar';
import type { CreativeProposal } from './useCreativeProposals';

/**
 * Fetches every action belonging to a client for a given range of monthly
 * batches:
 *   - plan_tasks filtered by `period IN (…YYYY-MM…)`
 *   - editorial_calendar filtered by the oldest-month → newest-month range
 *   - creative_proposals so the /actions page can merge pending propositions
 *     next to the month in which they were raised.
 *
 * The `periods` array is expected to be sorted newest → oldest. The hook
 * returns every row indexed by period so the page can render one "package"
 * per month in the same order.
 */

const sb = supabase as unknown as { from: (t: string) => Record<string, unknown> };

function monthBounds(period: string): { first: string; last: string } {
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-12
  if (!year || !month) {
    const now = new Date();
    return monthBounds(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = new Date(Date.UTC(year, month, 0));
  const lastDay = String(nextMonth.getUTCDate()).padStart(2, '0');
  const last = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { first, last };
}

async function fetchPlanTasks(
  clientId: string | null,
  periods: string[],
): Promise<PlanTaskContentRow[]> {
  if (!clientId || periods.length === 0) return [];
  const query = sb
    .from('plan_tasks')
    .select('*')
    .eq('client_id', clientId)
    .in('period', periods)
    .not('status', 'eq', 'cancelled')
    .order('period', { ascending: false })
    .order('task_type', { ascending: true })
    .order('updated_at', { ascending: false });
  const { data, error } = (await query) as unknown as {
    data: PlanTaskContentRow[] | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchEditorialForPeriods(
  clientId: string | null,
  periods: string[],
): Promise<CalendarEntry[]> {
  if (!clientId || periods.length === 0) return [];
  // Derive the widest bounds covering every requested period.
  const firsts = periods.map((p) => monthBounds(p).first).sort();
  const lasts = periods.map((p) => monthBounds(p).last).sort();
  const first = firsts[0];
  const last = lasts[lasts.length - 1];
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

async function fetchProposalsForClient(
  clientId: string | null,
): Promise<CreativeProposal[]> {
  if (!clientId) return [];
  const query = sb
    .from('creative_proposals')
    .select('*')
    .eq('client_id', clientId)
    .not('status', 'in', '(archived,rejected)')
    .order('created_at', { ascending: false });
  const { data, error } = (await query) as unknown as {
    data: CreativeProposal[] | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface UseMonthlyActionsResult {
  planTasks: PlanTaskContentRow[];
  editorialEntries: CalendarEntry[];
  proposals: CreativeProposal[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useMonthlyActions(options: {
  clientId: string | null;
  /** Monthly batches to show, newest first (e.g. current + 5 previous months). */
  periods: string[];
}): UseMonthlyActionsResult {
  const { clientId, periods } = options;

  const STALE_TIME = 2 * 60 * 1000;
  const periodsKey = periods.join(',');

  const queries = useQueries({
    queries: [
      {
        queryKey: ['monthly-actions', 'plan-tasks', clientId, periodsKey],
        queryFn: () => fetchPlanTasks(clientId, periods),
        staleTime: STALE_TIME,
        enabled: Boolean(clientId && periods.length > 0),
      },
      {
        queryKey: ['monthly-actions', 'editorial', clientId, periodsKey],
        queryFn: () => fetchEditorialForPeriods(clientId, periods),
        staleTime: STALE_TIME,
        enabled: Boolean(clientId && periods.length > 0),
      },
      {
        queryKey: ['monthly-actions', 'proposals', clientId],
        queryFn: () => fetchProposalsForClient(clientId),
        staleTime: STALE_TIME,
        enabled: Boolean(clientId),
      },
    ],
  });

  const [planTasksQ, editorialQ, proposalsQ] = queries;

  return {
    planTasks: (planTasksQ.data as PlanTaskContentRow[] | undefined) ?? [],
    editorialEntries: (editorialQ.data as CalendarEntry[] | undefined) ?? [],
    proposals: (proposalsQ.data as CreativeProposal[] | undefined) ?? [],
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

/**
 * Build a range of `count` monthly batches starting from `anchor` (inclusive)
 * going back in time. Returned newest-first, so the /actions page can render
 * the current month at the top and older packages below it.
 */
export function buildPeriodRange(
  anchor: string = currentPeriod(),
  count: number = 6,
): string[] {
  const [yStr, mStr] = anchor.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  if (!year || !month) return [currentPeriod()];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    // month - i (1-indexed) -> use Date constructor which handles rollover.
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    out.push(`${y}-${m}`);
  }
  return out;
}

/** Extract the monthly batch id of a proposal from its `created_at`. */
export function proposalPeriod(proposal: { created_at: string }): string {
  const d = new Date(proposal.created_at);
  if (Number.isNaN(d.getTime())) return currentPeriod();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
