import { useEffect, useState } from 'react';
import { Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, ArrowUp, ArrowDown, Minus, Link2, RefreshCw, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  seoKeywordPositions, 
  seoKeywordDistribution, 
  seoTechnicalHealth,
} from '@/data/analyticsData';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { useGoogleSearchConsole } from '@/hooks/useGoogleSearchConsole';
import { format, subDays } from 'date-fns';

const chartConfig = {
  clicks: { label: 'Clicks', color: 'hsl(142, 76%, 36%)' },
  impressions: { label: 'Impressions', color: 'hsl(221, 83%, 53%)' },
};

export function SEOSection() {
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

  // Check for OAuth callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code && !isConnected) {
      exchangeCode(code).then((success) => {
        if (success) {
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
          fetchSites();
        }
      });
    }
  }, []);

  // Fetch data when connected and site selected
  useEffect(() => {
    if (isConnected && selectedSite) {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 28), 'yyyy-MM-dd');
      fetchAnalytics(startDate, endDate);
    }
  }, [isConnected, selectedSite]);

  // Fetch sites on connection
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

  // Transform queries for chart
  const chartData = queries.slice(0, 10).map((q, index) => ({
    name: q.query.substring(0, 15) + (q.query.length > 15 ? '...' : ''),
    clicks: q.clicks,
    impressions: q.impressions,
  }));

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">SEO Performance</h2>
            <Badge variant="secondary" className="text-xs">Visibility & Rankings</Badge>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-8"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnect}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="h-8 gap-2"
              >
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
          <TabsTrigger value="positions">Position Tracking</TabsTrigger>
          <TabsTrigger value="queries">Best Queries {isConnected && <Badge variant="secondary" className="ml-1 text-[10px]">Live</Badge>}</TabsTrigger>
          <TabsTrigger value="technical">Technical Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Domain Authority & Keywords */}
            <div className="space-y-4">
              {isConnected && totals.clicks > 0 ? (
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Total Clicks (28d)</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold">{totals.clicks.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Impressions</p>
                  <span className="text-xl font-semibold">{totals.impressions.toLocaleString()}</span>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Domain Authority</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold">45</span>
                    <div className="flex items-center text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">+2 pts</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Keywords by Position</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(seoKeywordDistribution).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                      <p className="text-xs text-muted-foreground uppercase">
                        {key.replace('top', 'Top ')}
                      </p>
                      <p className="text-xl font-bold mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {isConnected ? 'Top Queries Performance (GSC Live)' : 'Search Performance (GSC)'}
              </h4>
              {isLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading GSC data...</p>
                  </div>
                </div>
              ) : isConnected && chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      fill="url(#fillClicks)"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : !isConnected ? (
                <div className="h-[220px] flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/10">
                  <div className="text-center space-y-3">
                    <ExternalLink className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Connect Google Search Console to see live data</p>
                    <Button variant="outline" size="sm" onClick={handleConnect} disabled={isConnecting}>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect GSC
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  No data available for selected period
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="positions">
          <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Keyword</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Landing Page</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Position</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Change</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Volume</th>
                </tr>
              </thead>
              <tbody>
                {seoKeywordPositions.map((keyword, index) => (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{keyword.keyword}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                      {keyword.landingPage}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={keyword.currentPosition <= 3 ? "default" : keyword.currentPosition <= 10 ? "secondary" : "outline"}>
                        #{keyword.currentPosition}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className={cn(
                        "flex items-center justify-center gap-1 text-sm font-medium",
                        keyword.change > 0 ? "text-emerald-600" : keyword.change < 0 ? "text-red-600" : "text-muted-foreground"
                      )}>
                        {keyword.change > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : 
                         keyword.change < 0 ? <ArrowDown className="w-3.5 h-3.5" /> : 
                         <Minus className="w-3.5 h-3.5" />}
                        {Math.abs(keyword.change)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {keyword.volume.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Score */}
            <div className="p-5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Site Health Score</span>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-4xl font-bold text-emerald-600">{seoTechnicalHealth.score}%</div>
              <Progress value={seoTechnicalHealth.score} className="mt-3 h-2" />
            </div>

            {/* Issues Summary */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Issues Found</h4>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Errors</span>
                </div>
                <Badge variant="destructive">{seoTechnicalHealth.errors}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Warnings</span>
                </div>
                <Badge className="bg-amber-500">{seoTechnicalHealth.warnings}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Notices</span>
                </div>
                <Badge variant="secondary">{seoTechnicalHealth.notices}</Badge>
              </div>
            </div>

            {/* Category Scores */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Category Scores</h4>
              <div className="space-y-3">
                {seoTechnicalHealth.categories.map((cat, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{cat.name}</span>
                      <span className={cn(
                        "font-medium",
                        cat.score >= 90 ? "text-emerald-600" : cat.score >= 70 ? "text-amber-600" : "text-red-600"
                      )}>
                        {cat.score}%
                      </span>
                    </div>
                    <Progress 
                      value={cat.score} 
                      className={cn(
                        "h-1.5",
                        cat.score >= 90 ? "[&>div]:bg-emerald-500" : cat.score >= 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                      )} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
