import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem, ContentType, ContentStatus, FunnelStage } from '@/types/content';

export interface PlanTaskContentRow {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  task_nature: string | null;
  idea_source: string | null;
  idea_source_detail: string | null;
  idea_source_url: string | null;
  source_proposal_id: string | null;
  status: string;
  priority: string;
  canal: string | null;
  format: string | null;
  thematique: string | null;
  start_date: string | null;
  due_date: string | null;
  mot_cle_cible: string | null;
  nombre_mots: number | null;
  effort_reserve: number | null;
  resource_links: { type: string; url: string; label: string }[] | null;
  assignee: string | null;
  assignee_ids: { id: string; name: string; wrikeContactId?: string }[] | null;
  tags: string[] | null;
  budget_tache: number | null;
  tarif_catalogue: number | null;
  forfait_mensuel: number | null;
  sous_traitance: number | null;
  marge: number | null;
  sync_to_wrike: boolean | null;
  content_type: string | null;
  content_status: string | null;
  funnel_stage: string | null;
  period: string | null;
  created_at: string;
  updated_at: string;
}

export type ContentItemWithRow = ContentItem & { _row: PlanTaskContentRow };

function planTaskToContentItem(row: PlanTaskContentRow): ContentItemWithRow {
  return {
    id: row.id,
    title: row.title,
    contentType: (row.content_type ?? 'blog-post') as ContentType,
    status: (row.content_status ?? 'idea') as ContentStatus,
    funnelStage: (row.funnel_stage ?? 'awareness') as FunnelStage,
    owner: row.assignee ?? undefined,
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _row: row,
  };
}

export function useContentTasks(clientId?: string) {
  return useQuery({
    queryKey: ['content-tasks', clientId],
    queryFn: async (): Promise<ContentItemWithRow[]> => {
      const query = (supabase as unknown as { from: (table: string) => Record<string, unknown> })
        .from('plan_tasks')
        .select('*')
        .eq('task_type', 'contenu')
        .order('updated_at', { ascending: false }) as Record<string, unknown>;

      const scoped = clientId
        ? (query as { eq: (col: string, val: string) => unknown }).eq('client_id', clientId)
        : query;

      const { data, error } = (await scoped) as unknown as {
        data: PlanTaskContentRow[] | null;
        error: { message: string } | null;
      };

      if (error) throw new Error(error.message);
      return (data ?? []).map(planTaskToContentItem);
    },
    staleTime: 2 * 60 * 1000,
  });
}
