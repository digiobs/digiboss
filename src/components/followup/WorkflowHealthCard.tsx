import { Palette, FileText, Globe, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { WorkflowHealth, WorkflowType } from '@/types/followup';
import { cn } from '@/lib/utils';

interface WorkflowHealthCardProps {
  health: WorkflowHealth;
}

const workflowConfig: Record<WorkflowType, { icon: React.ElementType; label: string; color: string }> = {
  branding: { icon: Palette, label: 'Branding', color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400' },
  content: { icon: FileText, label: 'Content', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  web: { icon: Globe, label: 'Web', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
  growth: { icon: TrendingUp, label: 'Growth', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
};

const riskColors = {
  green: 'bg-success',
  amber: 'bg-warning',
  red: 'bg-destructive',
};

export function WorkflowHealthCard({ health }: WorkflowHealthCardProps) {
  const config = workflowConfig[health.workflow];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium">{config.label}</span>
          </div>
          <div className={cn('h-2.5 w-2.5 rounded-full', riskColors[health.risk])} title={`Risk: ${health.risk}`} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{health.progress}%</span>
          </div>
          <Progress value={health.progress} className="h-1.5" />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{health.currentPhase}</span>
          {health.blockers > 0 && (
            <Badge variant="outline" className="text-xs gap-1 text-destructive border-destructive/30">
              <AlertTriangle className="h-3 w-3" />
              {health.blockers} blocker{health.blockers > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
