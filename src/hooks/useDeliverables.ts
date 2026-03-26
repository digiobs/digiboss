import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export interface Deliverable {
  id: string;
  client_id: string;
  type: string;
  title: string | null;
  description: string | null;
  status: string;
  skill_name: string | null;
  channel: string | null;
  sub_type: string | null;
  notion_url: string | null;
  filename: string | null;
  period: string | null;
  tags: string[] | null;
  sharepoint_url: string | null;
  onedrive_path: string | null;
  created_at: string;
  clients?: { name: string } | null;
}

export function useDeliverables(options?: { type?: string; clientId?: string | null }) {
  const { currentClient, isAllClientsSelected } = useClient();
  const filterType = options?.type;
  const filterClientId = options?.clientId !== undefined ? options.clientId : (isAllClientsSelected ? null : currentClient?.id);

  return useQuery({
    queryKey: ['deliverables', filterClientId, filterType],
    queryFn: async () => {
      let query = supabase
        .from('deliverables')
        .select('id,client_id,type,title,description,status,skill_name,channel,sub_type,notion_url,sharepoint_url,onedrive_path,filename,period,tags,created_at,clients(name)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filterClientId) {
        query = query.eq('client_id', filterClientId);
      }
      if (filterType && filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Deliverable[];
    },
  });
}
