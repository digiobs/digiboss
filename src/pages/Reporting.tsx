import { BarChart3, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnalyticsTopBar } from '@/components/reporting/AnalyticsTopBar';
import { KPIStrip } from '@/components/reporting/KPIStrip';
import { WebsitePerformanceSection } from '@/components/reporting/WebsitePerformanceSection';
import { KeyEventsConversionsSection } from '@/components/reporting/KeyEventsConversionsSection';
import { LeadsSection } from '@/components/reporting/LeadsSection';
import { AudienceSection } from '@/components/reporting/AudienceSection';
import { ContentPerformanceSection } from '@/components/reporting/ContentPerformanceSection';
import { SEOSection } from '@/components/reporting/SEOSection';
import { SocialSection } from '@/components/reporting/SocialSection';
import { PaidSection } from '@/components/reporting/PaidSection';
import { AIInsightsPanel } from '@/components/reporting/AIInsightsPanel';
import { useDateRange } from '@/contexts/DateRangeContext';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useReportingKpis } from '@/hooks/useReportingKpis';

type ReportingSection =
  | 'all'
  | 'website'
  | 'conversions'
  | 'leads'
  | 'audience'
  | 'content'
  | 'seo'
  | 'social'
  | 'paid';

const VALID_SECTIONS = new Set<ReportingSection>([
  'all',
  'website',
  'conversions',
  'leads',
  'audience',
  'content',
  'seo',
  'social',
  'paid',
]);

export default function Reporting() {
  const { dateRange, setDateRange, compareMode, setCompareMode } = useDateRange();
  const [searchParams] = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const { data: kpiData } = useReportingKpis();

  const activeSection = useMemo<ReportingSection>(() => {
    const raw = (searchParams.get('section') ?? 'all').toLowerCase() as ReportingSection;
    return VALID_SECTIONS.has(raw) ? raw : 'all';
  }, [searchParams]);

  const showSection = (section: Exclude<ReportingSection, 'all'>) =>
    activeSection === 'all' || activeSection === section;

  const syncReportingData = async () => {
    if (!currentClient?.id) return;
    setSyncing(true);
    try {
      const payload = isAllClientsSelected ? {} : { clientId: currentClient.id };
      const { error } = await supabase.functions.invoke('reporting-sync', { body: payload });
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      console.error('reporting sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Performance Digitale</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Decision-grade insights across traffic, engagement, conversions, and ROI.
        </p>
      </div>
      <div className="mb-4">
        <TabDataStatusBanner tab="reporting" />
      </div>
      {isAdmin && (
        <div className="mb-4">
          <Button variant="outline" className="gap-2" onClick={syncReportingData} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing reporting data...' : 'Sync reporting data'}
          </Button>
        </div>
      )}

      {/* Sticky Top Bar */}
      <AnalyticsTopBar 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        compareMode={compareMode}
        onCompareModeChange={setCompareMode}
      />

      {/* Main Content with AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Sections - 3 columns on large screens */}
        <div className="lg:col-span-3 space-y-6">
          {/* 1. At-a-glance KPI Strip */}
          {activeSection === 'all' && (
            <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              At-a-Glance
            </h2>
            <div className="bg-card rounded-xl border border-border p-4">
              <KPIStrip data={kpiData} showCategories={true} />
            </div>
            </section>
          )}

          {/* 2. Website Performance */}
          {showSection('website') && <WebsitePerformanceSection />}

          {/* 3. Key Events & Conversions */}
          {showSection('conversions') && <KeyEventsConversionsSection />}

          {/* 4. Leads (HubSpot) */}
          {showSection('leads') && <LeadsSection />}

          {/* 5. Audience & Targeting */}
          {showSection('audience') && <AudienceSection />}

          {/* 6. Content Performance */}
          {showSection('content') && <ContentPerformanceSection />}

          {/* 7. SEO Performance */}
          {showSection('seo') && <SEOSection />}

          {/* 8. Social Performance */}
          {showSection('social') && <SocialSection />}

          {/* 9. Paid Performance */}
          {showSection('paid') && <PaidSection />}
        </div>

        {/* AI Insights Panel - 1 column on large screens */}
        <div className="lg:col-span-1">
          <AIInsightsPanel />
        </div>
      </div>
    </div>
  );
}
