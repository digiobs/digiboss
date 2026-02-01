import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Flag, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Milestone, FollowupTask, WorkflowType } from '@/types/followup';
import { cn } from '@/lib/utils';

interface StrategicRoadmapProps {
  milestones: Milestone[];
  tasks: FollowupTask[];
}

const workflowColors: Record<WorkflowType, string> = {
  branding: 'bg-violet-500',
  content: 'bg-blue-500',
  web: 'bg-emerald-500',
  growth: 'bg-amber-500',
};

const typeIcons = {
  milestone: Flag,
  communication: Calendar,
  meeting: MessageSquare,
};

export function StrategicRoadmap({ milestones, tasks }: StrategicRoadmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPrevMonth = () => setCurrentDate(addDays(monthStart, -1));
  const goToNextMonth = () => setCurrentDate(addDays(monthEnd, 1));

  const getMilestonesForDay = (day: Date) =>
    milestones.filter((m) => isSameDay(m.date, day));

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.dueDate && isSameDay(t.dueDate, day));

  const alerts = [
    { type: 'risk', message: 'Deadline risk: LinkedIn Campaign Launch', milestoneId: 'm2' },
    { type: 'capacity', message: 'Resource overload detected for next week' },
  ];

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm"
            >
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-destructive">{alert.message}</span>
              <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs">
                View
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="w-full">
        <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
          {days.map((day) => {
            const dayMilestones = getMilestonesForDay(day);
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            const hasItems = dayMilestones.length > 0 || dayTasks.length > 0;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'w-10 shrink-0 flex flex-col items-center',
                  isToday && 'bg-primary/5 rounded-lg'
                )}
              >
                <span className="text-xs text-muted-foreground mb-1">
                  {format(day, 'EEE')}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="flex flex-col gap-0.5 mt-1 min-h-[60px]">
                  {dayMilestones.map((m) => {
                    const TypeIcon = typeIcons[m.type];
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'w-6 h-6 rounded flex items-center justify-center',
                          workflowColors[m.workflow],
                          m.isAtRisk && 'ring-2 ring-destructive ring-offset-1'
                        )}
                        title={m.title}
                      >
                        <TypeIcon className="h-3 w-3 text-white" />
                      </div>
                    );
                  })}
                  {dayTasks.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5 px-1">
                      {dayTasks.length}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-violet-500" />
          <span>Branding</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Content</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Web</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Growth</span>
        </div>
      </div>
    </div>
  );
}
