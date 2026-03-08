import { useState } from 'react';
import { HomeKPIStrip } from '@/components/home/HomeKPIStrip';
import { HomeWeeklySummary } from '@/components/home/HomeWeeklySummary';
import { HomeNextBestActions } from '@/components/home/HomeNextBestActions';
import { HomePlanSnapshot } from '@/components/home/HomePlanSnapshot';
import { SignalsPanel } from '@/components/home/SignalsPanel';
import { ContentPipelinePanel } from '@/components/home/ContentPipelinePanel';
import { DataHealthWidget } from '@/components/home/DataHealthWidget';
import { type NextBestAction } from '@/data/dashboardData';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';

export default function Home() {
  const [selectedAction, setSelectedAction] = useState<NextBestAction | null>(null);

  const highlightedActionIds = selectedAction ? [selectedAction.id] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Home</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Your marketing cockpit: priorities, plan, and performance at a glance.
        </p>
      </div>
      <TabDataStatusBanner tab="home" />

      {/* KPI Strip - Full Width */}
      <HomeKPIStrip />

      {/* What Changed This Week - Full Width */}
      <HomeWeeklySummary />

      {/* 3-Column Plan Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Next Best Actions (Primary) */}
        <div className="lg:col-span-5">
          <HomeNextBestActions
            selectedAction={selectedAction}
            onSelectAction={setSelectedAction}
          />
        </div>

        {/* Column 2: Plan Snapshot */}
        <div className="lg:col-span-4">
          <HomePlanSnapshot highlightedActionIds={highlightedActionIds} />
        </div>

        {/* Column 3: Supporting Panels */}
        <div className="lg:col-span-3 space-y-4">
          <SignalsPanel />
          <ContentPipelinePanel />
          <DataHealthWidget />
        </div>
      </div>
    </div>
  );
}
