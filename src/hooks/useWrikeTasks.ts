import { useQuery } from '@tanstack/react-query';
import { getTasks, getSubProjects, getWorkflows } from '@/services/wrike';
import { WRIKE_CLIENTS, WrikeTask, WrikeFolder, parseCustomFields } from '@/types/wrike';
import { supabase } from '@/integrations/supabase/client';

interface UseWrikeTasksOptions {
  clientId?: string; // wrikeId filter
  enabled?: boolean;
}

// Client slug → display info for Supabase fallback
const CLIENT_DISPLAY: Record<string, { name: string; sector: string }> = {
  'amarok': { name: 'Amarok', sector: 'industrial' },
  'alibeez': { name: 'AlibeeZ', sector: 'biotech' },
  'mabsilico': { name: 'Mabsilico', sector: 'biotech' },
  'adechotech': { name: 'Adechotech', sector: 'saas' },
  'nerya': { name: 'Nerya', sector: 'medtech' },
  'huck-occitania': { name: 'Huck Occitania', sector: 'industrial' },
  'agro-bio': { name: 'Agro-Bio', sector: 'biotech' },
  'apmonia-therapeutics': { name: 'Apmonia Therapeutics', sector: 'biotech' },
  'bluespine': { name: 'BlueSpine', sector: 'medtech' },
  'board4care': { name: 'Board4care', sector: 'medtech' },
  'alsbom': { name: 'Alsbom', sector: 'industrial' },
  'sra-instruments': { name: 'SRA Instruments', sector: 'industrial' },
  'digiobs': { name: 'DigiObs', sector: 'internal' },
};

const STATUS_TO_WRIKE: Record<string, string> = {
  'backlog': 'Idéation',
  'in_progress': 'En cours de rédaction',
  'review': 'À valider',
  'ready': 'À publier',
  'done': 'Publié',
  'blocked': 'En attente client',
  'cancelled': 'Cancelled',
};

async function fetchSupabaseFallback(): Promise<WrikeTask[]> {
  const { data, error } = await (supabase as unknown as { from: (table: string) => Record<string, unknown> })
    .from('plan_tasks')
    .select('*')
    .not('status', 'eq', 'cancelled')
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((pt: Record<string, unknown>) => {
    const client = CLIENT_DISPLAY[pt.client_id as string] || { name: pt.client_id, sector: 'industrial' };
    return {
      id: pt.wrike_task_id || pt.id,
      title: pt.title,
      status: STATUS_TO_WRIKE[pt.status] || 'Idéation',
      importance: pt.priority === 'high' ? 'High' : pt.priority === 'low' ? 'Low' : 'Normal',
      dates: pt.due_date ? { due: pt.due_date, type: 'Planned' } : undefined,
      clientName: client.name,
      clientSector: client.sector,
      canal: Array.isArray(pt.tags) ? pt.tags[0] : '',
      format: '',
      lienContenuProd: pt.wrike_permalink || undefined,
    } as WrikeTask;
  });
}

export function useWrikeTasks({ clientId, enabled = true }: UseWrikeTasksOptions = {}) {
  return useQuery({
    queryKey: ['wrike-tasks', clientId],
    queryFn: async () => {
      try {
        if (clientId) {
          // Get tasks for a specific client project
          return await getTasks(clientId);
        }
        // Get tasks for all active clients (first 10 for performance)
        const clients = WRIKE_CLIENTS.filter(c => c.sector !== 'internal').slice(0, 10);
        const allTasks: WrikeTask[] = [];

        const results = await Promise.allSettled(
          clients.map(async (client) => {
            const tasks = await getTasks(client.wrikeId);
            return tasks.map((t) => ({
              ...t,
              clientName: client.name,
              clientSector: client.sector,
            }));
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            allTasks.push(...result.value);
          }
        }

        // If Wrike returned nothing, use Supabase fallback
        if (allTasks.length === 0) {
          console.info('[Digiboss] Wrike returned 0 tasks, using Supabase plan_tasks fallback');
          return await fetchSupabaseFallback();
        }

        return allTasks;
      } catch (err) {
        // Wrike proxy failed — fallback to Supabase
        console.warn('[Digiboss] Wrike proxy failed, falling back to Supabase plan_tasks:', err);
        return await fetchSupabaseFallback();
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1, // Retry once, then fallback handles it
  });
}

export function useWrikeSubProjects(clientId: string) {
  return useQuery({
    queryKey: ['wrike-subprojects', clientId],
    queryFn: () => getSubProjects(clientId),
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useWrikeWorkflows() {
  return useQuery({
    queryKey: ['wrike-workflows'],
    queryFn: getWorkflows,
    staleTime: 30 * 60 * 1000, // Workflows rarely change
  });
}
