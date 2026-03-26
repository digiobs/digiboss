import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WrikeTask } from '@/types/wrike';

// Maps plan_tasks rows to WrikeTask format for Kanban compatibility
interface PlanTask {
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
}

// Map plan_tasks status to Wrike kanban status strings
const STATUS_TO_WRIKE: Record<string, string> = {
  'backlog': 'Idéation',
  'in_progress': 'En cours de rédaction',
  'review': 'À valider',
  'ready': 'À publier',
  'done': 'Publié',
  'blocked': 'En attente client',
  'cancelled': 'Cancelled',
};

// Map client_id slugs to display names and sectors
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

function planTaskToWrikeTask(pt: PlanTask): WrikeTask {
  const client = CLIENT_DISPLAY[pt.client_id] || { name: pt.client_id, sector: 'industrial' };
  return {
    id: pt.wrike_task_id || pt.id,
    title: pt.title,
    status: STATUS_TO_WRIKE[pt.status] || 'Idéation',
    importance: pt.priority === 'high' ? 'High' : pt.priority === 'low' ? 'Low' : 'Normal',
    dates: pt.due_date ? { due: pt.due_date, type: 'Planned' } : undefined,
    clientName: client.name,
    clientSector: client.sector,
    // Store extra fields for enhanced display
    canal: Array.isArray(pt.tags) ? pt.tags[0] : '',
    format: '',
    lienContenuProd: pt.wrike_permalink || undefined,
  };
}

export function usePlanTasks(clientId?: string) {
  return useQuery({
    queryKey: ['plan-tasks', clientId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('plan_tasks')
        .select('*')
        .not('status', 'eq', 'cancelled')
        .order('updated_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as any[]).map(planTaskToWrikeTask);
    },
    staleTime: 2 * 60 * 1000,
  });
}
