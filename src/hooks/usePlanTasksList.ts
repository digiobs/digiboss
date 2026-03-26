import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export interface PlanTask {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  due_date: string | null;
  tags: string[] | null;
  source_module: string | null;
  wrike_task_id: string | null;
  wrike_permalink: string | null;
  created_at: string;
  updated_at: string;
  clients?: { name: string } | null;
}

export function usePlanTasksList() {
  const { currentClient, isAllClientsSelected } = useClient();
  const clientId = isAllClientsSelected ? null : currentClient?.id ?? null;

  return useQuery({
    queryKey: ['plan-tasks-list', clientId],
    queryFn: async () => {
      let query = supabase
        .from('plan_tasks')
        .select('id,client_id,title,description,status,priority,assignee,due_date,tags,source_module,wrike_task_id,wrike_permalink,created_at,updated_at,clients(name)')
        .not('status', 'eq', 'cancelled')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(200);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PlanTask[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
