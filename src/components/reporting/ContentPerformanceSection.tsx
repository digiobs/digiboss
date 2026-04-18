import { FileText, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

export function ContentPerformanceSection() {
  const { getMetric, hasData } = useReportingMetrics(['website', 'conversion']);
  const liveSessions = getMetric('sessions', 0);
  const liveImpressions = getMetric('impressions', 0);
  const liveConversions = getMetric('conversions', 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Content Performance</h2>
          {hasData && <Badge variant="secondary" className="text-xs">Live</Badge>}
        </div>
      </div>

      <div className="p-5">
        {hasData ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Sessions</p>
              <p className="text-2xl font-bold">{Math.round(liveSessions).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Impressions</p>
              <p className="text-2xl font-bold">{Math.round(liveImpressions).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Conversions</p>
              <p className="text-2xl font-bold">{Math.round(liveConversions).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No content performance data available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Sync reporting data to populate this section.</p>
          </div>
        )}
      </div>
    </div>
  );
}
