import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { toast } from 'sonner';

export interface LemlistMapping {
  id: string;
  client_id: string;
  external_account_id: string;
  external_account_name: string | null;
  external_workspace_id: string | null;
  is_active: boolean;
  updated_at: string | null;
}

/** Shape accepted by `connect` — matches what the picker emits. */
export interface LemlistPickableCampaign {
  id: string;
  name: string;
  team_id: string | null;
  team_name: string | null;
}

const sb = supabase as unknown as {
  from: (table: string) => {
    select: (c: string) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: boolean) => {
              maybeSingle: () => Promise<{
                data: LemlistMapping | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    };
    upsert: (
      row: Record<string, unknown>,
      opts?: { onConflict?: string },
    ) => Promise<{ error: { message: string } | null }>;
    update: (patch: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export function useLemlistCampaignMapping() {
  const { currentClient, isAllClientsSelected } = useClient();
  const clientId = currentClient?.id ?? null;
  const queryClient = useQueryClient();

  const query = useQuery<LemlistMapping | null>({
    queryKey: ['lemlist-campaign-mapping', clientId],
    enabled: Boolean(clientId) && !isAllClientsSelected,
    queryFn: async () => {
      if (!clientId) return null;
      const result = await sb
        .from('client_data_mappings')
        .select(
          'id,client_id,external_account_id,external_account_name,external_workspace_id,is_active,updated_at',
        )
        .eq('client_id', clientId)
        .eq('provider', 'lemlist')
        .eq('connector', 'campaigns')
        .eq('is_active', true)
        .maybeSingle();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 30_000,
  });

  const connect = useMutation({
    mutationFn: async (campaign: LemlistPickableCampaign) => {
      if (!clientId || isAllClientsSelected) {
        throw new Error('Sélectionnez un client avant de connecter une campagne.');
      }
      const now = new Date().toISOString();
      const upsertResult = await sb.from('client_data_mappings').upsert(
        {
          client_id: clientId,
          provider: 'lemlist',
          connector: 'campaigns',
          external_account_id: campaign.id,
          external_account_name: campaign.name,
          // Store the lemlist team id so lemlist-sync can route to the right
          // API key when multiple LEMLIST_API_KEYS are configured.
          external_workspace_id: campaign.team_id,
          status: 'connected',
          is_active: true,
          mapping_strategy: 'manual_picker',
          is_manual_override: true,
          updated_at: now,
        },
        { onConflict: 'client_id,provider,connector' },
      );
      if (upsertResult.error) throw new Error(upsertResult.error.message);

      // Immediately trigger a sync so the cache populates without a second
      // click. We intentionally don't await errors loudly — the picker only
      // needs the mapping row to exist; the toast below surfaces sync errors.
      const invoke = await supabase.functions.invoke('lemlist-sync', {
        body: { clientId, limit: 200 },
      });
      if (invoke.error) {
        throw new Error(invoke.error.message || 'Sync lemlist failed.');
      }
    },
    onSuccess: async () => {
      toast.success('Campagne lemlist connectée.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['lemlist-campaign-mapping', clientId] }),
        queryClient.invalidateQueries({ queryKey: ['lemlist-contacts'] }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Connexion échouée.');
    },
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const mappingId = query.data?.id;
      if (!mappingId) throw new Error('Aucune campagne connectée.');
      const result = await sb
        .from('client_data_mappings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', mappingId);
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: async () => {
      toast.success('Campagne lemlist déconnectée.');
      await queryClient.invalidateQueries({ queryKey: ['lemlist-campaign-mapping', clientId] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Déconnexion échouée.');
    },
  });

  return {
    mapping: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
    connect,
    disconnect,
  };
}
