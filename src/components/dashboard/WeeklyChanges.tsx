import { Sparkles, TrendingUp, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { weeklyChanges, type ChangeType } from '@/data/dashboardData';
import { Badge } from '@/components/ui/badge';

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

export function WeeklyChanges() {
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
          const Icon = config.icon;
          
          return (
            <div
              key={change.id}
              className="group flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Badge variant="secondary" className={cn("shrink-0 text-[10px] px-1.5 py-0", config.className)}>
                {config.label}
              </Badge>
              <p className="text-sm text-foreground flex-1 leading-snug">{change.text}</p>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
