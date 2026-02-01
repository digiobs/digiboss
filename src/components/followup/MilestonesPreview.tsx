import { format, isWithinInterval, addDays } from 'date-fns';
import { Calendar, Flag, MessageSquare, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Milestone, WorkflowType } from '@/types/followup';
import { cn } from '@/lib/utils';

interface MilestonesPreviewProps {
  milestones: Milestone[];
}

const workflowColors: Record<WorkflowType, string> = {
  branding: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  content: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  web: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  growth: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const typeIcons = {
  milestone: Flag,
  communication: Calendar,
  meeting: MessageSquare,
};

export function MilestonesPreview({ milestones }: MilestonesPreviewProps) {
  const now = new Date();
  const in7Days = addDays(now, 7);
  
  const upcomingMilestones = milestones
    .filter((m) => isWithinInterval(m.date, { start: now, end: in7Days }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const atRiskCount = milestones.filter((m) => m.isAtRisk).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Upcoming in 7 days
          </CardTitle>
          {atRiskCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {atRiskCount} at risk
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[140px]">
          {upcomingMilestones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No milestones in the next 7 days
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingMilestones.map((milestone) => {
                const TypeIcon = typeIcons[milestone.type];
                return (
                  <div
                    key={milestone.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg border transition-colors hover:bg-muted/50',
                      milestone.isAtRisk && 'border-destructive/30 bg-destructive/5'
                    )}
                  >
                    <TypeIcon className={cn('h-4 w-4', milestone.isAtRisk ? 'text-destructive' : 'text-muted-foreground')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">{format(milestone.date, 'EEE, MMM d')}</p>
                    </div>
                    <Badge variant="secondary" className={cn('text-xs shrink-0', workflowColors[milestone.workflow])}>
                      {milestone.workflow}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
