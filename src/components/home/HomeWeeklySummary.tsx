import { Sparkles, TrendingUp, AlertTriangle, Info, ExternalLink, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { weeklyChanges, type ChangeType } from '@/data/dashboardData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const changeTypeConfig: Record<ChangeType, { icon: typeof TrendingUp; label: string; className: string }> = {
  opportunity: {
    icon: TrendingUp,
    label: 'Opportunity',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  risk: {
    icon: AlertTriangle,
    label: 'Risk',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  info: {
    icon: Info,
    label: 'Info',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

interface HomeWeeklySummaryProps {
  isEmpty?: boolean;
}

export function HomeWeeklySummary({ isEmpty = false }: HomeWeeklySummaryProps) {
  if (isEmpty) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">What changed this week?</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Wand2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-sm mb-1">No highlights yet</h4>
          <p className="text-xs text-muted-foreground mb-4 max-w-[240px] mx-auto">
            Once data syncs and insights are available, DigiObs will summarize what matters here.
          </p>
          <Button variant="outline" size="sm" className="text-xs">
            Generate first insights
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">What changed this week?</h3>
          <p className="text-xs text-muted-foreground">AI-generated summary</p>
        </div>
      </div>

      <div className="space-y-2">
        {weeklyChanges.map((change) => {
          const config = changeTypeConfig[change.type];
          
          return (
            <div
              key={change.id}
              className="group flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Badge variant="secondary" className={cn('shrink-0 text-[10px] px-1.5 py-0', config.className)}>
                {config.label}
              </Badge>
              <p className="text-sm text-foreground flex-1 leading-snug">{change.text}</p>
              <button className="shrink-0 text-[10px] text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                See evidence
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
