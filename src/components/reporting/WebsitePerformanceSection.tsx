import { Activity, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

export function WebsitePerformanceSection() {
  const { getMetric, hasData } = useReportingMetrics(['website', 'conversion']);
  const liveSessions = getMetric('sessions', 0);
  const liveImpressions = getMetric('impressions', 0);
  const liveConversions = getMetric('conversions', 0);
  const liveConvRate = getMetric('conv_rate', 0);

  const indicators = [
    { label: 'Sessions', value: Math.round(liveSessions).toLocaleString() },
    { label: 'Impressions', value: Math.round(liveImpressions).toLocaleString() },
    { label: 'Conversions', value: Math.round(liveConversions).toLocaleString() },
    { label: 'Conv. Rate', value: `${liveConvRate.toFixed(2)}%` },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Website Performance</h2>
          {hasData && <Badge variant="secondary" className="text-xs">Live</Badge>}
        </div>
      </div>

      <div className="p-5">
        {hasData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {indicators.map((indicator, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border">
                <span className="text-sm text-muted-foreground">{indicator.label}</span>
                <p className="text-2xl font-bold mt-1">{indicator.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No website data available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Sync reporting data to populate this section.</p>
          </div>
        )}
      </div>
    </div>
  );
}
