import { TrendingUp, TrendingDown, Activity, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { sessionsTimeSeries } from '@/data/analyticsData';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const chartConfig = {
  value: { label: 'Current Period', color: 'hsl(221, 83%, 53%)' },
  previousValue: { label: 'Previous Period', color: 'hsl(215, 16%, 70%)' },
};

export function WebsitePerformanceSection() {
  const { getMetric, hasData } = useReportingMetrics(['website', 'conversion']);
  const liveImpressions = getMetric('impressions', 0);
  const liveConversions = getMetric('conversions', 0);
  const liveConvRate = getMetric('conv_rate', 0);

  const qualityIndicators = [
    hasData
      ? { label: 'Impressions', value: Math.round(liveImpressions).toLocaleString(), delta: 0, isGood: true }
      : { label: 'Bounce Rate', value: '42.3%', delta: -8.1, isGood: true },
    hasData
      ? { label: 'Conversions', value: Math.round(liveConversions).toLocaleString(), delta: 0, isGood: true }
      : { label: 'Avg. Session Duration', value: '2m 34s', delta: -5.3, isGood: false },
    hasData
      ? { label: 'Conv. Rate', value: `${liveConvRate.toFixed(2)}%`, delta: 0, isGood: true }
      : { label: 'Pages / Session', value: '2.8', delta: 4.2, isGood: true },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Website Performance</h2>
            <Badge variant="secondary" className="text-xs">{hasData ? 'Traffic Live' : 'Traffic & Engagement'}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5">
        {/* Left: Trend Chart */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Sessions Over Time</h3>
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <AreaChart data={sessionsTimeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillPrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215, 16%, 70%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(215, 16%, 70%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="previousValue"
                stroke="hsl(215, 16%, 70%)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#fillPrevious)"
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                fill="url(#fillCurrent)"
              />
            </AreaChart>
          </ChartContainer>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-primary rounded" />
              <span>Current period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-muted-foreground/50 rounded" style={{ borderStyle: 'dashed' }} />
              <span>Previous period</span>
            </div>
          </div>
        </div>

        {/* Right: Quality Indicators */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Quality Indicators</h3>
          
          {qualityIndicators.map((indicator, index) => (
            <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{indicator.label}</span>
                <div className="flex items-center gap-1">
                  {indicator.isGood ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    indicator.isGood ? "text-emerald-600" : "text-red-600"
                  )}>
                    {indicator.delta > 0 ? '+' : ''}{indicator.delta}%
                  </span>
                </div>
              </div>
              <p className="text-xl font-bold mt-1">{indicator.value}</p>
            </div>
          ))}

          {/* AI Traffic Health Card */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Traffic Health</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Weekend dip normal. Monday spike (+22%) driven by newsletter campaign. 
              Overall trend healthy with 12% growth vs previous period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
