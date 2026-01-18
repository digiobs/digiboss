import { Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  seoKeywordPositions, 
  seoQueries, 
  seoKeywordDistribution, 
  seoTechnicalHealth,
  sessionsTimeSeries 
} from '@/data/analyticsData';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

const chartConfig = {
  value: { label: 'Clicks', color: 'hsl(142, 76%, 36%)' },
};

export function SEOSection() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">SEO Performance</h2>
          <Badge variant="secondary" className="text-xs">Visibility & Rankings</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="p-5">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positions">Position Tracking</TabsTrigger>
          <TabsTrigger value="queries">Best Queries</TabsTrigger>
          <TabsTrigger value="technical">Technical Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Domain Authority & Keywords */}
            <div className="space-y-4">
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

            {/* Clicks & Impressions Chart */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Search Performance (GSC)</h4>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <AreaChart data={sessionsTimeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillSEO" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
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
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    fill="url(#fillSEO)"
                  />
                </AreaChart>
              </ChartContainer>
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
                {seoQueries.map((query, index) => (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{query.query}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {query.impressions.toLocaleString()}
                        <span className={cn(
                          "text-xs",
                          query.impressionsDelta > 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {query.impressionsDelta > 0 ? '+' : ''}{query.impressionsDelta}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">{query.avgPosition.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right">{query.ctr}%</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {query.clicks.toLocaleString()}
                        <span className={cn(
                          "text-xs",
                          query.clicksDelta > 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {query.clicksDelta > 0 ? '+' : ''}{query.clicksDelta}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
