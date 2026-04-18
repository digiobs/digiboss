import { useEffect, useState } from 'react';
import { Search, TrendingUp, Link2, RefreshCw, ExternalLink, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { useGoogleSearchConsole } from '@/hooks/useGoogleSearchConsole';
import { format, subDays } from 'date-fns';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

const chartConfig = {
  clicks: { label: 'Clicks', color: 'hsl(142, 76%, 36%)' },
  impressions: { label: 'Impressions', color: 'hsl(221, 83%, 53%)' },
};

export function SEOSection() {
  const { getMetric, hasData: hasReportingData } = useReportingMetrics(['acquisition']);
  const liveSeoClicks = getMetric('seo_clicks', 0);
  const liveAvgPosition = getMetric('avg_position', 0);

  const {
    isConnected,
    isLoading,
    sites,
    selectedSite,
    queries,
    totals,
    getAuthUrl,
    exchangeCode,
    fetchSites,
    fetchAnalytics,
    selectSite,
    disconnect,
  } = useGoogleSearchConsole();

  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !isConnected) {
      exchangeCode(code).then((success) => {
        if (success) {
          window.history.replaceState({}, '', window.location.pathname);
          fetchSites();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (isConnected && selectedSite) {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 28), 'yyyy-MM-dd');
      fetchAnalytics(startDate, endDate);
    }
  }, [isConnected, selectedSite]);

  useEffect(() => {
    if (isConnected && sites.length === 0) {
      fetchSites();
    }
  }, [isConnected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      setIsConnecting(false);
    }
  };

  const handleRefresh = () => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), 28), 'yyyy-MM-dd');
    fetchAnalytics(startDate, endDate);
  };

  const chartData = queries.slice(0, 10).map((q) => ({
    name: q.query.substring(0, 15) + (q.query.length > 15 ? '...' : ''),
    clicks: q.clicks,
    impressions: q.impressions,
  }));

  const hasAnyData = isConnected || hasReportingData;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">SEO Performance</h2>
            {hasAnyData && (
              <Badge variant="secondary" className="text-xs">
                {isConnected ? 'GSC Live' : 'Synced'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                {sites.length > 0 && (
                  <Select value={selectedSite || ''} onValueChange={selectSite}>
                    <SelectTrigger className="w-[280px] h-8 text-xs">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.siteUrl} value={site.siteUrl} className="text-xs">
                          {site.siteUrl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading} className="h-8">
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="sm" onClick={disconnect} className="h-8 text-xs text-muted-foreground">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleConnect} disabled={isConnecting} className="h-8 gap-2">
                <Link2 className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect Google Search Console'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="p-5">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queries">
            Queries {isConnected && <Badge variant="secondary" className="ml-1 text-[10px]">Live</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isConnected && totals.clicks > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Total Clicks (28d)</p>
                <span className="text-3xl font-bold">{totals.clicks.toLocaleString()}</span>
                <p className="text-sm text-muted-foreground mt-2">Impressions</p>
                <span className="text-xl font-semibold">{totals.impressions.toLocaleString()}</span>
              </div>

              <div className="lg:col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Top Queries Performance</h4>
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="clicks" stroke="hsl(142, 76%, 36%)" strokeWidth={2} fill="url(#fillClicks)" />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                    No data available for selected period
                  </div>
                )}
              </div>
            </div>
          ) : hasReportingData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">SEO Clicks</p>
                <p className="text-2xl font-bold">{Math.round(liveSeoClicks).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Avg. Position</p>
                <p className="text-2xl font-bold">{liveAvgPosition > 0 ? liveAvgPosition.toFixed(1) : 'NA'}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No SEO data available yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Connect Google Search Console or sync reporting data.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="queries">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isConnected && queries.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Query</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Impressions</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Avg. Pos</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">CTR</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((query, index) => (
                    <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{query.query}</td>
                      <td className="px-3 py-2 text-right">{query.impressions.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{query.position}</td>
                      <td className="px-3 py-2 text-right">{query.ctr}%</td>
                      <td className="px-3 py-2 text-right font-medium">{query.clicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !isConnected ? (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/10">
              <div className="text-center space-y-3">
                <Search className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Connect Google Search Console to see your top queries</p>
                <Button variant="outline" onClick={handleConnect} disabled={isConnecting}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Google Search Console
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No query data available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
