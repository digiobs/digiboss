import { format, formatDistanceToNow } from 'date-fns';
import { User, Bot, Zap, BarChart, Link, AlertCircle, CheckCircle, RefreshCw, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityItem, ActorType, SystemHealth } from '@/types/followup';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: ActivityItem[];
  systemHealth: SystemHealth;
}

const actorConfig: Record<ActorType, { icon: React.ElementType; label: string; color: string }> = {
  human: { icon: User, label: 'Team', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  strategy_agent: { icon: Zap, label: 'Strategy Agent', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  analytics_agent: { icon: BarChart, label: 'Analytics Agent', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  orchestration_agent: { icon: Bot, label: 'Orchestration', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

export function ActivityFeed({ activities, systemHealth }: ActivityFeedProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Activity Feed
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-xs gap-1',
              systemHealth.orchestrationStatus === 'active'
                ? 'text-success border-success/30'
                : 'text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                systemHealth.orchestrationStatus === 'active' ? 'bg-success' : 'bg-muted-foreground'
              )}
            />
            {systemHealth.orchestrationStatus === 'active' ? 'Active' : 'Idle'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Last sync: {formatDistanceToNow(systemHealth.lastSync, { addSuffix: true })}
          </span>
          {systemHealth.connectorErrors > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              {systemHealth.connectorErrors} error{systemHealth.connectorErrors > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0 overflow-hidden">
        <ScrollArea className="h-[350px] pr-2">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-3">
              {activities.map((activity) => {
                const config = actorConfig[activity.actor];
                const ActorIcon = config.icon;

                return (
                  <div key={activity.id} className="relative flex gap-3 pl-1">
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10',
                        config.color
                      )}
                    >
                      <ActorIcon className="h-3 w-3" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">
                              {activity.actorName || config.label}
                            </span>
                            {' '}
                            <span className="text-muted-foreground">{activity.action}</span>
                          </p>
                          {activity.sourceLabel && (
                            <button className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                              <Link className="h-3 w-3" />
                              {activity.sourceLabel}
                            </button>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
