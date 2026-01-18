import { Target, MousePointerClick, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  keyEventsTimeSeries, 
  keyEventsByName, 
  channelConversions,
  landingPageConversions,
  zeroConversionPages 
} from '@/data/analyticsData';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const chartConfig = {
  value: { label: 'Key Events', color: 'hsl(142, 76%, 36%)' },
};

export function KeyEventsConversionsSection() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Key Events & Conversions</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Conversion = Contact forms
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="events" className="p-5">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="events">Key Events</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="pages">Landing Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events Time Series */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Key Events Over Time</h3>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={keyEventsTimeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#fillEvents)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Events Table */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Event Breakdown</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Event Name</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Count</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyEventsByName.map((event, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs">{event.name}</td>
                        <td className="px-3 py-2 text-right font-medium">{event.count}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{event.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Conversions Table */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Conversions by Channel</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Channel</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Conversions</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelConversions.map((channel, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ backgroundColor: channel.color }}
                            />
                            {channel.channel}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{channel.conversions}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{channel.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pie Chart */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Conversion Sources</h3>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelConversions}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="share"
                      nameKey="channel"
                    >
                      {channelConversions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ payload }) => {
                        if (payload && payload[0]) {
                          return (
                            <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {channelConversions.slice(0, 4).map((channel, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: channel.color }}
                    />
                    <span className="text-muted-foreground">{channel.channel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* High Converting Pages */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-medium">Top Converting Pages</h3>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Page</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Sessions</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Conv.</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingPageConversions.slice(0, 6).map((page, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs truncate max-w-[180px]" title={page.page}>
                          {page.page}
                        </td>
                        <td className="px-3 py-2 text-right">{page.sessions.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-medium">{page.conversions}</td>
                        <td className="px-3 py-2 text-right">
                          <Badge variant="secondary" className={cn(
                            "text-xs",
                            page.convRate > 1.5 ? "impact-high" : page.convRate > 1 ? "impact-medium" : ""
                          )}>
                            {page.convRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Zero Conversion Pages (Opportunities) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-medium">Opportunity Pages (0 Conversions)</h3>
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-amber-100/50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Page</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Sessions</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zeroConversionPages.map((page, index) => (
                      <tr key={index} className="border-b border-amber-200 dark:border-amber-900/50 last:border-0 hover:bg-amber-100/30 dark:hover:bg-amber-900/20">
                        <td className="px-3 py-2 font-mono text-xs truncate max-w-[180px]" title={page.page}>
                          {page.page}
                        </td>
                        <td className="px-3 py-2 text-right">{page.sessions.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{page.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 These pages have traffic but no conversions. Consider adding CTAs or forms.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
