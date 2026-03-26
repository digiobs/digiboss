import { HomeKPICard } from './HomeKPICard';
import { dashboardKPIs } from '@/data/dashboardData';
import { Button } from '@/components/ui/button';
import { Plug, BarChart3 } from 'lucide-react';
import type { KPIData } from '@/data/analyticsData';

interface HomeKPIStripProps {
  isEmpty?: boolean;
  reportingKpis?: KPIData[];
}

export function HomeKPIStrip({ isEmpty = false, reportingKpis }: HomeKPIStripProps) {
  const hasRealData = reportingKpis && reportingKpis.length > 0;

  if (isEmpty) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Connect your data to unlock KPIs</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Link GA4, Search Console, HubSpot, and Ads to populate performance metrics.
          </p>
          <Button className="gap-2">
            <Plug className="w-4 h-4" />
            Connect integrations
          </Button>
        </div>
      </div>
    );
  }

  if (hasRealData) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {reportingKpis.map((kpi, idx) => (
          <HomeKPICard
            key={`real-${idx}`}
            kpi={{
              id: `real-${idx}`,
              label: kpi.label,
              value: String(kpi.value),
              delta: kpi.delta,
              deltaLabel: kpi.deltaLabel,
              trend: kpi.delta > 0 ? 'up' : kpi.delta < 0 ? 'down' : 'neutral',
              sparklineData: [0],
              category: kpi.category === 'website' ? 'traffic'
                : kpi.category === 'conversion' ? 'leads'
                : kpi.category === 'paid' ? 'paid'
                : kpi.category === 'social' ? 'engagement'
                : 'seo',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {dashboardKPIs.map((kpi) => (
        <HomeKPICard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
