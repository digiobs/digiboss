import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';

export interface LemlistContactRow {
  id: string;
  client_id: string;
  external_contact_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  status: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  current_step: number;
  last_event_type: string | null;
  last_event_at: string | null;
  contacted_at: string | null;
  raw: Record<string, unknown> | null;
  synced_at: string;
}

export interface LemlistContactsStats {
  totalContacts: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  clickRate: number;
  lastSyncedAt: string | null;
}

// The generated supabase types don't yet include the new funnel columns, so
// cast through `unknown` to call them without fighting the type system.
const sb = supabase as unknown as {
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
};

type QueryBuilder = {
  eq: (column: string, value: string) => QueryBuilder;
  order: (column: string, options: { ascending: boolean }) => QueryBuilder;
  limit: (n: number) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const SELECT_COLUMNS =
  'id,client_id,external_contact_id,full_name,email,company,status,campaign_id,campaign_name,emails_sent,emails_opened,emails_clicked,emails_replied,current_step,last_event_type,last_event_at,contacted_at,raw,synced_at';

export function useLemlistContacts() {
  const { currentClient, isAllClientsSelected } = useClient();
  const clientId = currentClient?.id ?? null;
  const scopeKey = isAllClientsSelected ? '__all__' : clientId;

  const query = useQuery<LemlistContactRow[]>({
    queryKey: ['lemlist-contacts', scopeKey],
    enabled: Boolean(clientId),
    queryFn: async () => {
      if (!clientId) return [];
      let builder: QueryBuilder = sb.from('lemlist_contacts_cache').select(SELECT_COLUMNS);
      if (!isAllClientsSelected && clientId !== ALL_CLIENTS_ID) {
        builder = builder.eq('client_id', clientId);
      }
      const result = await builder.order('synced_at', { ascending: false }).limit(500);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return (result.data ?? []) as LemlistContactRow[];
    },
    staleTime: 60_000,
  });

  const stats = useMemo<LemlistContactsStats>(() => {
    const rows = query.data ?? [];
    let sent = 0;
    let opened = 0;
    let clicked = 0;
    let replied = 0;
    let lastSyncedAt: string | null = null;
    for (const row of rows) {
      sent += row.emails_sent ?? 0;
      opened += row.emails_opened ?? 0;
      clicked += row.emails_clicked ?? 0;
      replied += row.emails_replied ?? 0;
      if (!lastSyncedAt || (row.synced_at && row.synced_at > lastSyncedAt)) {
        lastSyncedAt = row.synced_at;
      }
    }
    return {
      totalContacts: rows.length,
      emailsSent: sent,
      openRate: sent > 0 ? opened / sent : 0,
      clickRate: sent > 0 ? clicked / sent : 0,
      replyRate: sent > 0 ? replied / sent : 0,
      lastSyncedAt,
    };
  }, [query.data]);

  return {
    contacts: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
    stats,
  };
}
