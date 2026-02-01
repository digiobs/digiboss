import { HomeKPICard } from './HomeKPICard';
import { dashboardKPIs } from '@/data/dashboardData';
import { Button } from '@/components/ui/button';
import { Plug, BarChart3 } from 'lucide-react';

interface HomeKPIStripProps {
  isEmpty?: boolean;
}

export function HomeKPIStrip({ isEmpty = false }: HomeKPIStripProps) {
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {dashboardKPIs.map((kpi) => (
        <HomeKPICard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
