import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LemlistCampaign {
  id: string;
  name: string;
  team_id: string | null;
  team_name: string | null;
}

type RawCampaign = {
  id?: unknown;
  name?: unknown;
  team_id?: unknown;
  team_name?: unknown;
};

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
      const raw = (data as { campaigns?: RawCampaign[] } | null)?.campaigns ?? [];
      return raw
        .map((c): LemlistCampaign | null => {
          const id = typeof c?.id === 'string' ? c.id : null;
          const name = typeof c?.name === 'string' ? c.name : null;
          if (!id || !name) return null;
          return {
            id,
            name,
            team_id: typeof c.team_id === 'string' ? c.team_id : null,
            team_name: typeof c.team_name === 'string' ? c.team_name : null,
          };
        })
        .filter((c): c is LemlistCampaign => Boolean(c));
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
