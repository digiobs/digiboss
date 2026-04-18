import { CreditCard, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

export function PaidSection() {
  const { getMetric, hasData } = useReportingMetrics(['paid', 'conversion']);
  const liveClicks = getMetric('ad_clicks', 0);
  const liveImpressions = getMetric('impressions', 0);
  const liveConversions = getMetric('conversions', 0);
  const liveSpend = getMetric('ad_spend', 0);
  const liveRoas = getMetric('roas', 0);
  const liveConvRate = getMetric('conv_rate', 0);
  const liveCtr = liveImpressions > 0 ? (liveClicks / liveImpressions) * 100 : 0;
  const liveAvgCpc = liveClicks > 0 ? liveSpend / liveClicks : 0;
  const liveCpa = liveConversions > 0 ? liveSpend / liveConversions : 0;

  const kpiCards = [
    { label: 'Clicks', value: Math.round(liveClicks).toLocaleString() },
    { label: 'Impressions', value: Math.round(liveImpressions).toLocaleString() },
    { label: 'CTR', value: `${liveCtr.toFixed(2)}%` },
    { label: 'Conversions', value: Math.round(liveConversions).toString() },
    { label: 'Conv. Rate', value: `${liveConvRate.toFixed(2)}%` },
    { label: 'Spend', value: `EUR ${Math.round(liveSpend).toLocaleString()}` },
    { label: 'Avg. CPC', value: liveClicks > 0 ? `EUR ${liveAvgCpc.toFixed(2)}` : 'NA' },
    { label: 'ROAS', value: liveRoas > 0 ? liveRoas.toFixed(2) : 'NA' },
    { label: 'CPA', value: liveConversions > 0 ? `EUR ${liveCpa.toFixed(0)}` : 'NA' },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Paid Performance</h2>
          {hasData && <Badge variant="secondary" className="text-xs">Live</Badge>}
        </div>
      </div>

      <div className="p-5">
        {hasData ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
            {kpiCards.map((kpi, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-lg font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No paid ads data available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Sync reporting data to populate this section.</p>
          </div>
        )}
      </div>
    </div>
  );
}
