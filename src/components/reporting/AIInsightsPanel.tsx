import { Sparkles, TrendingUp, AlertTriangle, Zap, ChevronRight, Plus, FileText, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { aiInsights, aiActions } from '@/data/analyticsData';
import { cn } from '@/lib/utils';
import { useReportingMetrics } from '@/hooks/useReportingMetrics';

const impactColors = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const effortLabels = {
  S: 'Small',
  M: 'Medium',
  L: 'Large',
};

export function AIInsightsPanel() {
  const { getMetric, hasData } = useReportingMetrics(['website', 'paid', 'conversion', 'acquisition']);
  const changes = hasData
    ? [
        {
          type: 'change' as const,
          title: `Traffic synced: ${Math.round(getMetric('impressions', 0)).toLocaleString()} impressions`,
          description: 'Latest reporting sync reflects current multichannel visibility.',
        },
        {
          type: 'change' as const,
          title: `Paid synced: ${Math.round(getMetric('ad_clicks', 0)).toLocaleString()} clicks`,
          description: 'Paid performance is now computed from reporting_kpis and connector ingestions.',
        },
      ]
    : aiInsights.filter(i => i.type === 'change');
  const impacts = hasData
    ? [
        {
          type: 'impact' as const,
          title: `Conversion rate at ${getMetric('conv_rate', 0).toFixed(2)}%`,
          description: 'Funnel health is calculated from synced clicks/conversions across current period.',
        },
        {
          type: 'impact' as const,
          title: `Average SEO position ${getMetric('avg_position', 0).toFixed(2)}`,
          description: 'SEO trends are now fed from acquisition metrics in Supabase.',
        },
      ]
    : aiInsights.filter(i => i.type === 'impact');
  const actionsToShow = hasData
    ? [
        {
          type: 'action' as const,
          title: 'Run reporting sync weekly',
          description: 'Keep reporting_kpis fresh for all tabs and client scopes.',
          impact: 'high' as const,
          confidence: 96,
          effort: 'S' as const,
        },
        {
          type: 'action' as const,
          title: 'Connect missing paid/social accounts',
          description: 'Replace remaining NA metrics by completing provider mappings.',
          impact: 'medium' as const,
          confidence: 84,
          effort: 'M' as const,
        },
      ]
    : aiActions;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden lg:sticky lg:top-20">
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">AI Insights</h2>
            <p className="text-xs text-muted-foreground">
              {hasData ? 'Updated from live reporting sync' : 'Updated with current filters'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* What Changed */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">What Changed</h3>
          </div>
          <div className="space-y-2">
            {changes.map((insight, index) => (
              <div key={index} className="p-2.5 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Why It Matters */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Why It Matters</h3>
          </div>
          <div className="space-y-2">
            {impacts.map((insight, index) => (
              <div key={index} className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Next Best Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Next Best Actions</h3>
          </div>
          <div className="space-y-3">
            {actionsToShow.map((action, index) => (
              <div 
                key={index} 
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                  index === 0 
                    ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" 
                    : "bg-muted/30 border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium">{action.title}</p>
                  <Badge className={cn("text-xs shrink-0", impactColors[action.impact || 'low'])}>
                    {action.impact}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{action.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-medium">{action.confidence}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Effort:</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {effortLabels[action.effort || 'M']}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <Progress value={action.confidence} className="h-1 mt-2" />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Plus className="w-4 h-4" />
            Create task in Plan
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <FileText className="w-4 h-4" />
            Generate report
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <UserPlus className="w-4 h-4" />
            Assign owner
          </Button>
        </div>
      </div>
    </div>
  );
}
