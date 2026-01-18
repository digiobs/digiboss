import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointerClick,
  Target,
  Sparkles,
  ArrowRight,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const kpiData = [
  {
    label: 'Sessions',
    value: '24,847',
    change: '+12.4%',
    trend: 'up',
    icon: Eye,
  },
  {
    label: 'Leads',
    value: '342',
    change: '+8.2%',
    trend: 'up',
    icon: Users,
  },
  {
    label: 'Conv. Rate',
    value: '3.8%',
    change: '-0.3%',
    trend: 'down',
    icon: Target,
  },
  {
    label: 'Engagement',
    value: '67%',
    change: '+5.1%',
    trend: 'up',
    icon: MousePointerClick,
  },
];

const recommendations = [
  {
    title: 'Boost LinkedIn Ads budget by 20%',
    impact: 'High',
    confidence: 92,
    category: 'Paid',
  },
  {
    title: 'Publish blog on "AI Marketing Trends"',
    impact: 'Medium',
    confidence: 87,
    category: 'Content',
  },
  {
    title: 'Retarget cart abandoners',
    impact: 'High',
    confidence: 85,
    category: 'Conversion',
  },
];

const chartData = [40, 55, 45, 60, 52, 68, 75, 70, 82, 78, 88, 95];

export function InteractiveDashboardPreview() {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions'>('overview');
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);

  return (
    <div className="rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
      {/* Browser Chrome */}
      <div className="bg-sidebar p-3 flex items-center gap-2 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-sidebar-accent/50 text-xs text-sidebar-foreground/60">
            app.digiobs.com/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="bg-sidebar/50 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Good morning, Sarah 👋</h3>
            <p className="text-sm text-muted-foreground">Here's your marketing pulse for today</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'actions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('actions')}
              className="gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              AI Actions
            </Button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {kpiData.map((kpi, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border bg-card transition-all duration-300 cursor-pointer ${
                    hoveredKpi === index
                      ? 'border-primary shadow-lg scale-[1.02]'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onMouseEnter={() => setHoveredKpi(index)}
                  onMouseLeave={() => setHoveredKpi(null)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <kpi.icon className="w-4 h-4 text-muted-foreground" />
                    <span
                      className={`text-xs font-medium flex items-center gap-0.5 ${
                        kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {kpi.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {kpi.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Mini Chart */}
            <div className="p-4 rounded-lg border border-border bg-card mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Traffic Trend</span>
                </div>
                <Badge variant="secondary" className="text-xs">Last 12 weeks</Badge>
              </div>
              <div className="flex items-end gap-1 h-20">
                {chartData.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-all duration-300 cursor-pointer"
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* AI Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Next Best Actions</span>
                <Badge variant="outline" className="ml-auto">3 recommendations</Badge>
              </div>
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            rec.category === 'Paid'
                              ? 'bg-blue-500/10 text-blue-500'
                              : rec.category === 'Content'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-orange-500/10 text-orange-500'
                          }`}
                        >
                          {rec.category}
                        </Badge>
                        <Badge
                          variant={rec.impact === 'High' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-2">{rec.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confidence</span>
                        <Progress value={rec.confidence} className="h-1.5 w-20" />
                        <span className="text-xs font-medium text-primary">{rec.confidence}%</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer hint */}
        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 inline mr-1" />
            AI-powered insights updated in real-time
          </p>
        </div>
      </div>
    </div>
  );
}
