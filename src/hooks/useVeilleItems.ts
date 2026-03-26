import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export interface VeilleItem {
  id: string;
  client_id: string;
  title: string;
  summary: string;
  skill: string;
  source: string;
  source_url: string | null;
  severity: 'alert' | 'warning' | 'opportunity' | 'info';
  details: Record<string, unknown> | null;
  is_read: boolean;
  is_actionable: boolean;
  generated_at: string;
  created_at: string;
  clients?: { name: string } | null;
}

export function useVeilleItems(options?: {
  skill?: string | null;
  severity?: string | null;
  clientId?: string | null;
}) {
  const { currentClient, isAllClientsSelected } = useClient();
  const filterClientId =
    options?.clientId !== undefined
      ? options.clientId
      : isAllClientsSelected
        ? null
        : currentClient?.id ?? null;
  const filterSkill = options?.skill && options.skill !== 'all' ? options.skill : null;
  const filterSeverity = options?.severity && options.severity !== 'all' ? options.severity : null;

  return useQuery({
    queryKey: ['veille-items', filterClientId, filterSkill, filterSeverity],
    queryFn: async () => {
      let query = supabase
        .from('veille_items')
        .select('id,client_id,title,summary,skill,source,source_url,severity,details,is_read,is_actionable,generated_at,created_at,clients(name)')
        .order('created_at', { ascending: false })
        .limit(300);

      if (filterClientId) {
        query = query.eq('client_id', filterClientId);
      }
      if (filterSkill) {
        query = query.eq('skill', filterSkill);
      }
      if (filterSeverity) {
        query = query.eq('severity', filterSeverity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as VeilleItem[];
    },
  });
}
