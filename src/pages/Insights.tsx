import { useState } from 'react';
import { Video, RefreshCw } from 'lucide-react';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { Button } from '@/components/ui/button';
import { MeetingsTable } from '@/components/insights/MeetingsTable';
import { MeetingDetailDrawer } from '@/components/insights/MeetingDetailDrawer';
import type { Meeting } from '@/types/insights';
import { useSupabaseMeetings } from '@/hooks/useSupabaseMeetings';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { toast } from 'sonner';

export default function Insights() {
  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const { loading: meetingsLoading, meetings, error: meetingsError, refetch } = useSupabaseMeetings();
  const [syncingTldv, setSyncingTldv] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDrawerOpen(true);
  };

  const handleSyncTldv = async () => {
    setSyncingTldv(true);
    const body = isAllClientsSelected ? { limit: 50 } : { clientId: currentClient?.id, limit: 50 };

    // Step 1: fetch the latest meetings list from tl;dv API into Supabase
    const list = await supabase.functions.invoke('tldv-sync-meetings', { body });
    if (list.error) {
      toast.error(list.error.message || 'Failed to list tl;dv meetings');
      setSyncingTldv(false);
      return;
    }
    const upserted = (list.data as { upserted?: number } | null)?.upserted ?? 0;

    // Step 2: enrich transcripts, highlights and AI summaries
    const { data, error } = await supabase.functions.invoke('tldv-sync-transcripts', { body });
    if (error) {
      toast.error(error.message || 'Failed to sync tl;dv transcripts');
      setSyncingTldv(false);
      return;
    }
    toast.success(`tl;dv sync done. New: ${upserted}, meetings: ${data?.synced ?? 0}, enriched: ${data?.enriched ?? 0}.`);
    refetch();
    setSyncingTldv(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Meeting intelligence and transcripts from tl;dv.
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" className="gap-2" onClick={handleSyncTldv} disabled={syncingTldv}>
            <RefreshCw className={`w-4 h-4 ${syncingTldv ? 'animate-spin' : ''}`} />
            {syncingTldv ? 'Syncing tl;dv...' : 'Sync tl;dv'}
          </Button>
        )}
      </div>

      {/* Client scope info */}
      <p className="text-xs text-muted-foreground">
        {isAllClientsSelected
          ? `Showing all meetings (${meetings.length})`
          : `Showing meetings for ${currentClient?.name ?? 'selected client'} (${meetings.length})`}
      </p>

      {/* Loading / Error states */}
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

      {/* Meetings Table */}
      <MeetingsTable
        meetings={meetings}
        searchQuery=""
        onMeetingClick={handleMeetingClick}
        onConnectTldv={handleSyncTldv}
        syncingTldv={syncingTldv}
      />

      {/* Meeting Detail Drawer */}
      <MeetingDetailDrawer
        meeting={selectedMeeting}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
