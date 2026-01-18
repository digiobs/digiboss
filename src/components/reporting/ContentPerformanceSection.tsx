import { FileText, TrendingUp, Eye, MousePointerClick, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { contentPerformanceData, sessionsTimeSeries } from '@/data/analyticsData';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

const chartConfig = {
  value: { label: 'Sessions', color: 'hsl(280, 65%, 60%)' },
};

export function ContentPerformanceSection() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Content Performance</h2>
          <Badge variant="secondary" className="text-xs">What drives outcomes</Badge>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Trend Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Content Sessions</h3>
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">+15.2%</span>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={sessionsTimeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillContent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280, 65%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(280, 65%, 60%)" stopOpacity={0} />
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
                  stroke="hsl(280, 65%, 60%)"
                  strokeWidth={2}
                  fill="url(#fillContent)"
                />
              </AreaChart>
            </ChartContainer>
          </div>

          {/* Right: Top Pages Table */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Pages by Performance</h3>
            <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Page</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        Views
                      </div>
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Avg. Time</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        Events
                      </div>
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Target className="w-3.5 h-3.5" />
                        Conv.
                      </div>
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Entry %</th>
                  </tr>
                </thead>
                <tbody>
                  {contentPerformanceData.slice(0, 6).map((page, index) => (
                    <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs truncate block max-w-[200px]" title={page.page}>
                          {page.page}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{page.views.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{page.avgEngagement}</td>
                      <td className="px-3 py-2 text-right">{page.keyEvents}</td>
                      <td className="px-3 py-2 text-right">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            page.conversions >= 40 ? "impact-high" : 
                            page.conversions >= 20 ? "impact-medium" : ""
                          )}
                        >
                          {page.conversions}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{page.entryRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
