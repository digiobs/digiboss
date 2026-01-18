import { BarChart3 } from 'lucide-react';
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
import { kpiStripData } from '@/data/analyticsData';
import { useDateRange } from '@/contexts/DateRangeContext';

export default function Reporting() {
  const { dateRange, setDateRange, compareMode, setCompareMode } = useDateRange();

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
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              At-a-Glance
            </h2>
            <div className="bg-card rounded-xl border border-border p-4">
              <KPIStrip data={kpiStripData} showCategories={true} />
            </div>
          </section>

          {/* 2. Website Performance */}
          <WebsitePerformanceSection />

          {/* 3. Key Events & Conversions */}
          <KeyEventsConversionsSection />

          {/* 4. Leads (HubSpot) */}
          <LeadsSection />

          {/* 5. Audience & Targeting */}
          <AudienceSection />

          {/* 6. Content Performance */}
          <ContentPerformanceSection />

          {/* 7. SEO Performance */}
          <SEOSection />

          {/* 8. Social Performance */}
          <SocialSection />

          {/* 9. Paid Performance */}
          <PaidSection />
        </div>

        {/* AI Insights Panel - 1 column on large screens */}
        <div className="lg:col-span-1">
          <AIInsightsPanel />
        </div>
      </div>
    </div>
  );
}
