import { useState, useMemo } from 'react';
import { Video, BarChart3 } from 'lucide-react';
import { InsightsTopBar } from '@/components/insights/InsightsTopBar';
import { MeetingInsightsHeader } from '@/components/insights/MeetingInsightsHeader';
import { MeetingsTable } from '@/components/insights/MeetingsTable';
import { MeetingDetailDrawer } from '@/components/insights/MeetingDetailDrawer';
import { InsightFeed } from '@/components/insights/InsightFeed';
import type { InsightsFilters, Meeting } from '@/types/insights';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { useSupabaseMeetings } from '@/hooks/useSupabaseMeetings';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { toast } from 'sonner';

export default function Insights() {
  const { currentClient, isAllClientsSelected } = useClient();
  const { loading: meetingsLoading, meetings, error: meetingsError, refetch } = useSupabaseMeetings();
  const performanceInsights: [] = [];
  const externalInsights: [] = [];
  const opsInsights: [] = [];
  const [syncingTldv, setSyncingTldv] = useState(false);
  const [filters, setFilters] = useState<InsightsFilters>({
    source: 'all',
    theme: 'all',
    impact: 'all',
    status: 'all',
    search: '',
  });

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Calculate totals for header
  const totalNBAs = meetings.reduce((acc, m) => acc + m.nbaCount, 0);
  const totalVerbatims = meetings.reduce((acc, m) => acc + m.verbatims.length, 0);

  // Filter meetings based on search
  const filteredMeetings = useMemo(() => {
    if (filters.source !== 'all' && filters.source !== 'meetings') {
      return [];
    }
    return meetings;
  }, [filters.source, meetings]);

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDrawerOpen(true);
  };

  const handleSyncTldv = async () => {
    setSyncingTldv(true);
    const body = isAllClientsSelected ? { limit: 50 } : { clientId: currentClient?.id, limit: 50 };
    const { data, error } = await supabase.functions.invoke('tldv-sync-transcripts', { body });
    if (error) {
      toast.error(error.message || 'Failed to sync tl;dv transcripts');
      setSyncingTldv(false);
      return;
    }
    toast.success(`tl;dv sync done. Meetings: ${data?.synced ?? 0}, enriched: ${data?.enriched ?? 0}.`);
    refetch();
    setSyncingTldv(false);
  };

  const showMeetings = filters.source === 'all' || filters.source === 'meetings';
  const showFeed = filters.source !== 'meetings';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Meeting intelligence, transcripts, and market research in one place.
          </p>
        </div>
      </div>
      <TabDataStatusBanner tab="insights" />

      {/* Sticky Top Bar */}
      <InsightsTopBar filters={filters} onFiltersChange={setFilters} />

      {/* Block A: Meeting Insights (Priority) */}
      {showMeetings && (
        <section className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {isAllClientsSelected
              ? `Showing all meetings (${meetings.length})`
              : `Showing meetings for ${currentClient?.name ?? 'selected client'} (${meetings.length})`}
          </p>
          {meetingsLoading && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground animate-pulse">
              Loading meetings…
            </div>
          )}
          {meetingsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              Meetings query error: {meetingsError}
            </div>
          )}
          {!meetingsLoading && !meetingsError && meetings.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No meetings found for this client. Try syncing tl;dv or selecting a different client.
            </div>
          )}
          <MeetingInsightsHeader
            meetingsCount={meetings.length}
            totalNBAs={totalNBAs}
            totalVerbatims={totalVerbatims}
          />
          <MeetingsTable
            meetings={filteredMeetings}
            searchQuery={filters.search}
            onMeetingClick={handleMeetingClick}
            onConnectTldv={handleSyncTldv}
            syncingTldv={syncingTldv}
          />
        </section>
      )}

      {/* Block B: Consolidated Insight Feed */}
      {showFeed && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Insight Feed</h2>
              <p className="text-sm text-muted-foreground">
                Performance anomalies, external research, and operational blockers.
              </p>
            </div>
          </div>
          <InsightFeed
            performanceInsights={performanceInsights}
            externalInsights={externalInsights}
            opsInsights={opsInsights}
            filters={filters}
          />
        </section>
      )}

      {/* Meeting Detail Drawer */}
      <MeetingDetailDrawer
        meeting={selectedMeeting}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
