import { Linkedin, Users, Eye, MousePointerClick, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

export function SocialSection() {
  const { getMetric, hasData } = useReportingMetrics(['social', 'paid']);
  const liveFollowers = getMetric('li_followers', 0);
  const liveNewFollowers = getMetric('li_new_followers', 0);
  const liveImpressions = getMetric('li_impressions', 0);
  const liveClicks = getMetric('ad_clicks', 0);

  const kpiCards = [
    { label: 'Followers', value: Math.round(liveFollowers).toLocaleString(), icon: Users },
    { label: 'New Followers', value: liveNewFollowers > 0 ? `+${Math.round(liveNewFollowers).toLocaleString()}` : '0', icon: Users },
    { label: 'Impressions', value: Math.round(liveImpressions).toLocaleString(), icon: Eye },
    { label: 'Clicks', value: Math.round(liveClicks).toLocaleString(), icon: MousePointerClick },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Linkedin className="w-5 h-5 text-[#0A66C2]" />
          <h2 className="font-semibold">Social Performance</h2>
          {hasData && <Badge variant="secondary" className="text-xs">Live</Badge>}
        </div>
      </div>

      <div className="p-5">
        {hasData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpiCards.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{kpi.label}</span>
                  </div>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No social data available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Sync reporting data to populate this section.</p>
          </div>
        )}
      </div>
    </div>
  );
}
