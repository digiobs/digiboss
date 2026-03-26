import { CreditCard, Linkedin, TrendingUp, TrendingDown, AlertCircle, RefreshCw, MousePointerClick, Eye, Target, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { googleAdsKPIs, googleAdsCampaigns, googleAdsTimeSeries, linkedInAdsStatus } from '@/data/analyticsData';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

const chartConfig = {
  value: { label: 'Clicks', color: 'hsl(38, 92%, 50%)' },
};

export function PaidSection() {
  const { getMetric, hasData } = useReportingMetrics(['paid', 'conversion']);
  const liveClicks = getMetric('ad_clicks', googleAdsKPIs.clicks);
  const liveImpressions = getMetric('impressions', googleAdsKPIs.impressions);
  const liveConversions = getMetric('conversions', googleAdsKPIs.conversions);
  const liveSpend = getMetric('ad_spend', googleAdsKPIs.spend);
  const liveRoas = getMetric('roas', 0);
  const liveCtr = liveImpressions > 0 ? (liveClicks / liveImpressions) * 100 : googleAdsKPIs.ctr;
  const liveConvRate = getMetric('conv_rate', googleAdsKPIs.conversionRate);
  const liveAvgCpc = liveClicks > 0 ? liveSpend / liveClicks : googleAdsKPIs.avgCpc;
  const liveCpa = liveConversions > 0 ? liveSpend / liveConversions : googleAdsKPIs.cpa;

  const googleKPICards = [
    { label: 'Clicks', value: Math.round(liveClicks).toLocaleString(), delta: 0 },
    { label: 'Impressions', value: Math.round(liveImpressions).toLocaleString(), delta: 0 },
    { label: 'CTR', value: `${liveCtr.toFixed(2)}%`, delta: 0 },
    { label: 'Conversions', value: Math.round(liveConversions).toString(), delta: 0 },
    { label: 'Conv. Rate', value: `${liveConvRate.toFixed(2)}%`, delta: 0 },
    { label: 'Spend', value: `€${Math.round(liveSpend).toLocaleString()}`, delta: 0, invertColor: true },
    { label: 'Avg. CPC', value: `€${liveAvgCpc.toFixed(2)}`, delta: 0, invertColor: true },
    { label: 'ROAS', value: liveRoas > 0 ? liveRoas.toFixed(2) : 'NA', delta: 0 },
    { label: 'CPA', value: `€${liveCpa.toFixed(0)}`, delta: 0, invertColor: true },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Paid Performance</h2>
          {hasData && <Badge variant="secondary" className="text-xs">Live data</Badge>}
        </div>
      </div>

      <Tabs defaultValue="google" className="p-5">
        <TabsList className="mb-4">
          <TabsTrigger value="google" className="gap-2">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Google Ads
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="gap-2">
            <Linkedin className="w-4 h-4" />
            LinkedIn Ads
            {!linkedInAdsStatus.connected && (
              <Badge variant="outline" className="ml-1 text-xs px-1.5">NA</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {googleKPICards.map((kpi, index) => {
              const isPositive = kpi.delta > 0;
              const isGoodTrend = kpi.invertColor ? !isPositive : isPositive;
              
              return (
                <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-lg font-bold">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isPositive ? (
                      <TrendingUp className={cn("w-3 h-3", isGoodTrend ? "text-emerald-500" : "text-red-500")} />
                    ) : (
                      <TrendingDown className={cn("w-3 h-3", isGoodTrend ? "text-emerald-500" : "text-red-500")} />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      isGoodTrend ? "text-emerald-600" : "text-red-600"
                    )}>
                      {kpi.delta > 0 ? '+' : ''}{kpi.delta}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clicks Over Time */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Clicks Over Time</h4>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={googleAdsTimeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillAds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { day: 'numeric' })}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(38, 92%, 50%)"
                    strokeWidth={2}
                    fill="url(#fillAds)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Campaigns Table */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Campaign Performance</h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Campaign</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Clicks</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">CTR</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Spend</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {googleAdsCampaigns.map((campaign, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[140px]">{campaign.name}</span>
                            <Badge 
                              variant={campaign.status === 'active' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs",
                                campaign.status === 'paused' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              )}
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">{campaign.clicks.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{campaign.ctr}%</td>
                        <td className="px-3 py-2 text-right">€{campaign.spend.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-medium">{campaign.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="linkedin">
          {/* Integration Error State */}
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">LinkedIn Ads data not available</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Data is currently unavailable for LinkedIn Ads. Reconnect the data source to resume reporting.
            </p>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-left max-w-md mb-6">
              <p className="text-xs font-mono text-muted-foreground">
                <span className="text-amber-500">Status:</span> {linkedInAdsStatus.error}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                <span className="text-amber-500">Code:</span> {linkedInAdsStatus.errorCode}
              </p>
            </div>
            <Button className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reconnect Data Source
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
