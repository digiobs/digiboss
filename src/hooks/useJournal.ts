import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { getDeliverableUrl, type Deliverable } from '@/hooks/useDeliverables';

/**
 * Unified activity feed used by the Journal page. Fires one lightweight
 * Supabase query per domain in parallel, normalises each row into a
 * `JournalEntry`, merges them into a single reverse-chronological list.
 *
 * Sources:
 *  - veille (veille_items)
 *  - meeting (tldv_meetings)
 *  - proposal (creative_proposals)
 *  - editorial (editorial_calendar)
 *  - deliverable (deliverables)
 *  - task (plan_tasks)
 */

export type JournalSource =
  | 'veille'
  | 'meeting'
  | 'proposal'
  | 'editorial'
  | 'deliverable'
  | 'task';

export interface JournalEntry {
  /** Globally unique id : `${source}:${row.id}` */
  id: string;
  source: JournalSource;
  /** ISO timestamp used for sorting */
  occurred_at: string;
  /** Pre-parsed epoch ms of `occurred_at` — avoids re-parsing in hot sort/group loops */
  occurred_ts: number;
  title: string;
  subtitle?: string;
  /** Optional deep link to the corresponding destination (Supabase/OneDrive/etc.) */
  href?: string;
  /** Badge label shown on the entry (status, severity, …) */
  badge?: string;
  client_id: string | null;
  client_name?: string | null;
}

/** Parse an ISO string into epoch ms, defaulting to 0 for falsy/invalid input. */
function toTs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

type ClientJoin = { name: string } | null;

interface VeilleRow {
  id: string;
  client_id: string | null;
  title: string | null;
  summary: string | null;
  severity: string | null;
  source: string | null;
  source_url: string | null;
  created_at: string;
  clients?: ClientJoin;
}

interface MeetingRow {
  id: string;
  client_id: string | null;
  name: string | null;
  happened_at: string | null;
  created_at: string | null;
  duration_seconds: number | null;
  meeting_url: string | null;
  participants_count: number | null;
  clients?: ClientJoin;
}

interface ProposalRow {
  id: string;
  client_id: string | null;
  title: string | null;
  status: string | null;
  urgency: string | null;
  source_skill: string | null;
  created_at: string;
  published_at: string | null;
  clients?: ClientJoin;
}

interface EditorialRow {
  id: string;
  client_id: string | null;
  title: string | null;
  status: string | null;
  canal: string | null;
  content_type: string | null;
  date: string | null;
  created_at: string;
  clients?: ClientJoin;
}

type DeliverableRow = Deliverable;

interface TaskRow {
  id: string;
  client_id: string | null;
  title: string | null;
  status: string | null;
  priority: string | null;
  updated_at: string;
  created_at: string;
  clients?: ClientJoin;
}

const sb = supabase as unknown as { from: (t: string) => Record<string, unknown> };

function withClientFilter<T extends Record<string, unknown>>(
  query: T,
  clientId: string | null,
): T {
  if (!clientId) return query;
  const q = query as unknown as { eq: (col: string, val: string) => T };
  return q.eq('client_id', clientId);
}

async function fetchVeille(clientId: string | null): Promise<JournalEntry[]> {
  const base = sb
    .from('veille_items')
    .select('id,client_id,title,summary,severity,source,source_url,created_at,clients(name)')
    .order('created_at', { ascending: false })
    .limit(150);
  const { data, error } = await withClientFilter(base, clientId);
  if (error) throw error;
  return ((data ?? []) as unknown as VeilleRow[]).map((r) => ({
    id: `veille:${r.id}`,
    source: 'veille' as const,
    occurred_at: r.created_at,
    occurred_ts: toTs(r.created_at),
    title: r.title ?? 'Veille',
    subtitle: r.summary ?? r.source ?? undefined,
    href: r.source_url ?? undefined,
    badge: r.severity ?? undefined,
    client_id: r.client_id,
    client_name: r.clients?.name ?? null,
  }));
}

async function fetchMeetings(clientId: string | null): Promise<JournalEntry[]> {
  const base = sb
    .from('tldv_meetings')
    .select('id,client_id,name,happened_at,created_at,duration_seconds,meeting_url,participants_count,clients(name)')
    .order('happened_at', { ascending: false, nullsFirst: false })
    .limit(150);
  const { data, error } = await withClientFilter(base, clientId);
  if (error) throw error;
  return ((data ?? []) as unknown as MeetingRow[]).map((r) => {
    const when = r.happened_at ?? r.created_at ?? new Date().toISOString();
    const minutes = r.duration_seconds ? Math.round(r.duration_seconds / 60) : null;
    const subtitleParts: string[] = [];
    if (minutes != null) subtitleParts.push(`${minutes} min`);
    if (r.participants_count) subtitleParts.push(`${r.participants_count} participants`);
    return {
      id: `meeting:${r.id}`,
      source: 'meeting' as const,
      occurred_at: when,
      occurred_ts: toTs(when),
      title: r.name ?? 'Réunion',
      subtitle: subtitleParts.join(' · ') || undefined,
      href: r.meeting_url ?? undefined,
      client_id: r.client_id,
      client_name: r.clients?.name ?? null,
    };
  });
}

async function fetchProposals(clientId: string | null): Promise<JournalEntry[]> {
  const base = sb
    .from('creative_proposals')
    .select('id,client_id,title,status,urgency,source_skill,created_at,published_at,clients(name)')
    .order('created_at', { ascending: false })
    .limit(150);
  const { data, error } = await withClientFilter(base, clientId);
  if (error) throw error;
  return ((data ?? []) as unknown as ProposalRow[]).map((r) => ({
    id: `proposal:${r.id}`,
    source: 'proposal' as const,
    occurred_at: r.created_at,
    occurred_ts: toTs(r.created_at),
    title: r.title ?? 'Proposition',
    subtitle: r.source_skill ?? undefined,
    badge: r.status ?? undefined,
    client_id: r.client_id,
    client_name: r.clients?.name ?? null,
  }));
}

async function fetchEditorial(clientId: string | null): Promise<JournalEntry[]> {
  const base = sb
    .from('editorial_calendar')
    .select('id,client_id,title,status,canal,content_type,date,created_at,clients(name)')
    .order('created_at', { ascending: false })
    .limit(150);
  const { data, error } = await withClientFilter(base, clientId);
  if (error) throw error;
  return ((data ?? []) as unknown as EditorialRow[]).map((r) => {
    const subtitleParts: string[] = [];
    if (r.canal) subtitleParts.push(r.canal);
    if (r.content_type) subtitleParts.push(r.content_type);
    return {
      id: `editorial:${r.id}`,
      source: 'editorial' as const,
      occurred_at: r.created_at,
      occurred_ts: toTs(r.created_at),
      title: r.title ?? 'Contenu',
      subtitle: subtitleParts.join(' · ') || undefined,
      badge: r.status ?? undefined,
      client_id: r.client_id,
      client_name: r.clients?.name ?? null,
    };
  });
}

async function fetchDeliverables(clientId: string | null): Promise<JournalEntry[]> {
  // Slim select: only the columns the Journal row actually consumes
  // (`getDeliverableUrl` + title/status/skill/filename). The full deliverables
  // row has ~16 columns including `description`, `tags`, `period`, etc. — we
  // don't need them here, and dropping them noticeably cuts payload size.
  const base = sb
    .from('deliverables')
    .select('id,client_id,type,title,status,skill_name,notion_url,sharepoint_url,onedrive_path,filename,created_at,clients(name)')
    .order('created_at', { ascending: false })
    .limit(150);
  const { data, error } = await withClientFilter(base, clientId);
  if (error) throw error;
  return ((data ?? []) as unknown as DeliverableRow[]).map((r) => {
    const dest = getDeliverableUrl(r);
    return {
      id: `deliverable:${r.id}`,
      source: 'deliverable' as const,
      occurred_at: r.created_at,
      occurred_ts: toTs(r.created_at),
      title: r.title ?? r.filename ?? r.type,
      subtitle: r.skill_name ?? r.type,
      href: dest?.url,
      badge: r.status ?? undefined,
      client_id: r.client_id,
      client_name: r.clients?.name ?? null,
    };
  });
}

async function fetchTasks(clientId: string | null): Promise<JournalEntry[]> {
  const base = sb
    .from('plan_tasks')
    .select('id,client_id,title,status,priority,updated_at,created_at,clients(name)')
    .order('updated_at', { ascending: false })
    .limit(150);
  const { data, error } = await withClientFilter(base, clientId);
  if (error) throw error;
  return ((data ?? []) as unknown as TaskRow[]).map((r) => {
    const when = r.updated_at ?? r.created_at;
    return {
      id: `task:${r.id}`,
      source: 'task' as const,
      // tasks mutate over time — use updated_at so status changes bump the entry
      occurred_at: when,
      occurred_ts: toTs(when),
      title: r.title ?? 'Tâche',
      subtitle: r.priority ? `Priorité ${r.priority}` : undefined,
      badge: r.status ?? undefined,
      client_id: r.client_id,
      client_name: r.clients?.name ?? null,
    };
  });
}

export interface UseJournalResult {
  entries: JournalEntry[];
  /** Count of raw entries (before any filtering) per source */
  countsBySource: Record<JournalSource, number>;
  /** True only on the very first load when no source has produced data yet. */
  isLoading: boolean;
  /** True while at least one source is still fetching in the background. */
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useJournal(options?: { clientId?: string | null }): UseJournalResult {
  const { currentClient, isAllClientsSelected } = useClient();
  const filterClientId =
    options?.clientId !== undefined
      ? options.clientId
      : isAllClientsSelected
        ? null
        : currentClient?.id ?? null;

  // 2 min cache: the journal is a historical feed — slightly stale data is fine,
  // and this avoids refetching ~900 rows every time the page mounts.
  const STALE_TIME = 2 * 60 * 1000;

  const queries = useQueries({
    queries: [
      { queryKey: ['journal', 'veille', filterClientId],      queryFn: () => fetchVeille(filterClientId),      staleTime: STALE_TIME },
      { queryKey: ['journal', 'meeting', filterClientId],     queryFn: () => fetchMeetings(filterClientId),    staleTime: STALE_TIME },
      { queryKey: ['journal', 'proposal', filterClientId],    queryFn: () => fetchProposals(filterClientId),   staleTime: STALE_TIME },
      { queryKey: ['journal', 'editorial', filterClientId],   queryFn: () => fetchEditorial(filterClientId),   staleTime: STALE_TIME },
      { queryKey: ['journal', 'deliverable', filterClientId], queryFn: () => fetchDeliverables(filterClientId),staleTime: STALE_TIME },
      { queryKey: ['journal', 'task', filterClientId],        queryFn: () => fetchTasks(filterClientId),       staleTime: STALE_TIME },
    ],
  });

  const [veilleQ, meetingQ, proposalQ, editorialQ, deliverableQ, taskQ] = queries;

  const entries = useMemo<JournalEntry[]>(() => {
    const all: JournalEntry[] = [
      ...(veilleQ.data ?? []),
      ...(meetingQ.data ?? []),
      ...(proposalQ.data ?? []),
      ...(editorialQ.data ?? []),
      ...(deliverableQ.data ?? []),
      ...(taskQ.data ?? []),
    ];
    // Use precomputed occurred_ts to avoid O(n log n) Date allocations.
    return all.sort((a, b) => b.occurred_ts - a.occurred_ts);
  }, [veilleQ.data, meetingQ.data, proposalQ.data, editorialQ.data, deliverableQ.data, taskQ.data]);

  const countsBySource = useMemo<Record<JournalSource, number>>(
    () => ({
      veille: veilleQ.data?.length ?? 0,
      meeting: meetingQ.data?.length ?? 0,
      proposal: proposalQ.data?.length ?? 0,
      editorial: editorialQ.data?.length ?? 0,
      deliverable: deliverableQ.data?.length ?? 0,
      task: taskQ.data?.length ?? 0,
    }),
    [veilleQ.data, meetingQ.data, proposalQ.data, editorialQ.data, deliverableQ.data, taskQ.data],
  );

  // Progressive rendering: only block the UI on the *initial* load when no
  // source has produced any data yet. Once at least one source returns, we
  // render whatever's available and let the rest stream in. This avoids the
  // slowest of the 6 parallel queries holding the whole page hostage.
  const anyDataReady = queries.some((q) => q.data !== undefined);
  const isLoading = !anyDataReady && queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);

  return {
    entries,
    countsBySource,
    isLoading,
    isFetching,
    isError: queries.some((q) => q.isError),
    refetch: () => {
      queries.forEach((q) => q.refetch());
    },
  };
}
