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
      // Edge function returns 200 even on error (with `{error: "..."}` in
      // the body) so supabase.functions.invoke() surfaces the real message
      // instead of a generic "non-2xx" wrapper.
      const body = data as { campaigns?: RawCampaign[]; error?: string } | null;
      if (error || body?.error) {
        const detail =
          body?.error ||
          (error instanceof Error ? error.message : null) ||
          'Failed to list lemlist campaigns.';
        throw new Error(detail);
      }
      const raw = body?.campaigns ?? [];
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
