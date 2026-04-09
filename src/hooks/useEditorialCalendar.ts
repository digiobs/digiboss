import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export interface CalendarEntry {
  id: string;
  client_id: string;
  date: string;
  time_slot: string | null;
  canal: string;
  content_type: string;
  title: string;
  pilier: string | null;
  status: string;
  serie_id: string | null;
  serie_episode: number | null;
  serie_total: number | null;
  source_skill: string | null;
  source_proposal_id: string | null;
  deliverable_id: string | null;
  owner: string | null;
  notes: string | null;
  tags: string[];
  marronnier: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

const sb = supabase as unknown as { from: (t: string) => Record<string, unknown> };

export function useEditorialCalendar() {
  const { currentClient, isAllClientsSelected } = useClient();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!currentClient?.id) return;
    setIsLoading(true);

    let query = sb
      .from('editorial_calendar')
      .select('*')
      .order('date', { ascending: true });

    if (!isAllClientsSelected) {
      query = query.eq('client_id', currentClient.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('editorial_calendar query error:', error);
    } else {
      setEntries((data ?? []) as CalendarEntry[]);
    }
    setIsLoading(false);
  }, [currentClient?.id, isAllClientsSelected]);

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('editorial-calendar-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'editorial_calendar' }, () => {
        fetchEntries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEntries]);

  const updateEntry = useCallback(async (entryId: string, updates: Partial<CalendarEntry>) => {
    const { error } = await sb
      .from('editorial_calendar')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', entryId);

    if (error) {
      console.error('Error updating calendar entry:', error);
      throw error;
    }
    await fetchEntries();
  }, [fetchEntries]);

  const moveEntry = useCallback(async (entryId: string, newDate: string) => {
    await updateEntry(entryId, { date: newDate } as Partial<CalendarEntry>);
  }, [updateEntry]);

  const updateEntryStatus = useCallback(async (entryId: string, status: string) => {
    await updateEntry(entryId, { status } as Partial<CalendarEntry>);
  }, [updateEntry]);

  // Group entries by date for calendar view
  const entriesByDate = entries.reduce<Record<string, CalendarEntry[]>>((acc, entry) => {
    const dateKey = entry.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  // Group entries by month
  const entriesByMonth = entries.reduce<Record<string, CalendarEntry[]>>((acc, entry) => {
    const monthKey = entry.date.substring(0, 7); // YYYY-MM
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(entry);
    return acc;
  }, {});

  const stats = {
    total: entries.length,
    byStatus: {
      idee: entries.filter((e) => e.status === 'idee').length,
      brouillon: entries.filter((e) => e.status === 'brouillon').length,
      valide: entries.filter((e) => e.status === 'valide').length,
      programme: entries.filter((e) => e.status === 'programme').length,
      publie: entries.filter((e) => e.status === 'publie').length,
    },
    byCanal: entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.canal] = (acc[e.canal] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    entries,
    entriesByDate,
    entriesByMonth,
    stats,
    isLoading,
    updateEntry,
    moveEntry,
    updateEntryStatus,
    refetch: fetchEntries,
  };
}
