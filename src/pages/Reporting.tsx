import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const channelPerformance = [
  { channel: 'LinkedIn Ads', leads: 127, cost: 4320, cpl: 34, conversion: 3.2, trend: 'up' },
  { channel: 'Google Ads', leads: 89, cost: 6780, cpl: 76, conversion: 2.1, trend: 'down' },
  { channel: 'Organic Search', leads: 156, cost: 0, cpl: 0, conversion: 4.8, trend: 'up' },
  { channel: 'Email', leads: 43, cost: 250, cpl: 5.8, conversion: 8.2, trend: 'up' },
  { channel: 'Referral', leads: 28, cost: 0, cpl: 0, conversion: 12.4, trend: 'neutral' },
];

const keyTakeaways = [
  'LinkedIn remains the top-performing paid channel with CPL 25% below target',
  'Google Ads CPA increased 15% - recommend pausing 3 underperforming ad groups',
  'Organic search traffic up 18% following recent blog optimizations',
];

const questionsToInvestigate = [
  'Why did email open rates drop from 22% to 18% this week?',
  'What content types convert best from LinkedIn traffic?',
  'Are we seeing seasonality effects on Google Ads performance?',
];

export default function Reporting() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Reporting</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Decision-grade insights, not vanity metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="7d">
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Channel Performance</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Channel
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Leads
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Cost
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                CPL
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Conv. Rate
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {channelPerformance.map((channel) => (
              <tr key={channel.channel} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{channel.channel}</td>
                <td className="px-4 py-3 text-right">{channel.leads}</td>
                <td className="px-4 py-3 text-right">${channel.cost.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {channel.cpl > 0 ? `$${channel.cpl}` : '—'}
                </td>
                <td className="px-4 py-3 text-right">{channel.conversion}%</td>
                <td className="px-4 py-3 text-right">
                  <Badge
                    variant="secondary"
                    className={
                      channel.trend === 'up'
                        ? 'impact-high'
                        : channel.trend === 'down'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'impact-low'
                    }
                  >
                    {channel.trend === 'up' ? '↑' : channel.trend === 'down' ? '↓' : '→'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Takeaways */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Key Takeaways</h3>
          </div>
          <ul className="space-y-3">
            {keyTakeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                {takeaway}
              </li>
            ))}
          </ul>
        </div>

        {/* Questions to Investigate */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">Questions to Investigate</h3>
          </div>
          <ul className="space-y-3">
            {questionsToInvestigate.map((question, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs shrink-0">
                  ?
                </span>
                {question}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Customer Journey Visualization Placeholder */}
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Customer Journey Visualization</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Sankey-style visualization showing user flow from first touch to conversion.
        </p>
        <Button variant="outline">Connect Analytics</Button>
      </div>
    </div>
  );
}
