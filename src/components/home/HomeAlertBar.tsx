import { AlertTriangle, Info, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAlerts, useDismissAlert, useOverdueTasks } from '@/hooks/useHomeData';
import { cn } from '@/lib/utils';

export function HomeAlertBar() {
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: overdueTasks, isLoading: tasksLoading } = useOverdueTasks();
  const dismiss = useDismissAlert();
  const isLoading = alertsLoading || tasksLoading;

  // Create alert from overdue tasks if any
  const overdueAlert = (overdueTasks && overdueTasks.length > 0) ? [{
    id: 'overdue-tasks',
    message: `${overdueTasks.length} tâche${overdueTasks.length > 1 ? 's' : ''} en retard`,
    type: 'critical',
  }] : [];

  const allAlerts = [...(alerts || []), ...overdueAlert];

  if (isLoading || !allAlerts || allAlerts.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {allAlerts.map((alert: any) => {
        const isCritical = alert.type === 'critical';
        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border shrink-0 animate-fade-in',
              isCritical
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            )}
          >
            {isCritical ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span className="text-sm whitespace-nowrap">{alert.message}</span>
            {alert.clients && (
              <Badge variant="outline" className="text-xs shrink-0">
                {alert.clients.name}
              </Badge>
            )}
            {alert.id !== 'overdue-tasks' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
                onClick={() => dismiss.mutate(alert.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
