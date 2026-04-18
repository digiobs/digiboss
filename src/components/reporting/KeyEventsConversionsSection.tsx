import { Target, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

export function KeyEventsConversionsSection() {
  const { getMetric, hasData } = useReportingMetrics(['conversion']);
  const liveConversions = getMetric('conversions', 0);
  const liveConvRate = getMetric('conv_rate', 0);
  const liveNewLeads = getMetric('new_leads', 0);
  const liveQualifiedLeads = getMetric('qualified_leads', 0);

  const kpiCards = [
    { label: 'Conversions', value: Math.round(liveConversions).toLocaleString() },
    { label: 'Conv. Rate', value: `${liveConvRate.toFixed(2)}%` },
    { label: 'New Leads', value: Math.round(liveNewLeads).toLocaleString() },
    { label: 'Qualified Leads', value: Math.round(liveQualifiedLeads).toLocaleString() },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Key Events & Conversions</h2>
            {hasData && <Badge variant="secondary" className="text-xs">Live</Badge>}
          </div>
          <Badge variant="outline" className="text-xs">
            Conversion = Contact forms
          </Badge>
        </div>
      </div>

      <div className="p-5">
        {hasData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiCards.map((kpi, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No conversion data available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Sync reporting data to populate this section.</p>
          </div>
        )}
      </div>
    </div>
  );
}
