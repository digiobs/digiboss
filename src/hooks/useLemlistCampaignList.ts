import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LemlistCampaign {
  id: string;
  name: string;
}

export function useLemlistCampaignList(enabled: boolean) {
  const query = useQuery<LemlistCampaign[]>({
    queryKey: ['lemlist-campaign-list'],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('lemlist-list-campaigns', {
        body: {},
      });
      if (error) throw new Error(error.message || 'Failed to list lemlist campaigns.');
      const raw = (data as { campaigns?: LemlistCampaign[] } | null)?.campaigns ?? [];
      return raw.filter((c): c is LemlistCampaign => Boolean(c?.id && c?.name));
    },
  });

  return {
    campaigns: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
