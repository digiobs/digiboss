import { useState, useMemo } from 'react';
import { Lightbulb, BarChart3 } from 'lucide-react';
import { InsightsTopBar } from '@/components/insights/InsightsTopBar';
import { MeetingInsightsHeader } from '@/components/insights/MeetingInsightsHeader';
import { MeetingsTable } from '@/components/insights/MeetingsTable';
import { MeetingDetailDrawer } from '@/components/insights/MeetingDetailDrawer';
import { InsightFeed } from '@/components/insights/InsightFeed';
import type { InsightsFilters, Meeting } from '@/types/insights';
import {
  meetings,
  nbas,
  performanceInsights,
  externalInsights,
  opsInsights,
} from '@/data/insightsData';

export default function Insights() {
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
  const totalNBAs = nbas.length;
  const totalVerbatims = meetings.reduce((acc, m) => acc + m.verbatims.length, 0);

  // Filter meetings based on search
  const filteredMeetings = useMemo(() => {
    if (filters.source !== 'all' && filters.source !== 'meetings') {
      return [];
    }
    return meetings;
  }, [filters.source]);

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDrawerOpen(true);
  };

  const showMeetings = filters.source === 'all' || filters.source === 'meetings';
  const showFeed = filters.source !== 'meetings';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Insights</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Meeting intelligence, performance signals, and market research in one place.
          </p>
        </div>
      </div>

      {/* Sticky Top Bar */}
      <InsightsTopBar filters={filters} onFiltersChange={setFilters} />

      {/* Block A: Meeting Insights (Priority) */}
      {showMeetings && (
        <section className="space-y-4">
          <MeetingInsightsHeader
            meetingsCount={meetings.length}
            totalNBAs={totalNBAs}
            totalVerbatims={totalVerbatims}
          />
          <MeetingsTable
            meetings={filteredMeetings}
            searchQuery={filters.search}
            onMeetingClick={handleMeetingClick}
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
