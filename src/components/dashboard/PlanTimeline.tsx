import { useState } from 'react';
import { cn } from '@/lib/utils';
import { planItems, type PlanItem } from '@/data/dashboardData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CalendarDays,
  MapPin,
  Plus,
  FileText,
  Flag,
  Users,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import { format, isToday, isTomorrow, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface PlanTimelineProps {
  highlightedActionIds: string[];
}

type ViewMode = 'week' | 'month' | 'roadmap';

const itemTypeConfig = {
  task: { icon: CheckCircle2, color: 'text-blue-500' },
  content: { icon: FileText, color: 'text-emerald-500' },
  milestone: { icon: Flag, color: 'text-purple-500' },
  meeting: { icon: Users, color: 'text-amber-500' },
};

const statusConfig = {
  pending: { icon: Circle, className: 'text-muted-foreground' },
  'in-progress': { icon: Clock, className: 'text-amber-500' },
  completed: { icon: CheckCircle2, className: 'text-emerald-500' },
};

export function PlanTimeline({ highlightedActionIds }: PlanTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const today = new Date();
  const todayItems = planItems.filter((item) => isToday(new Date(item.dueDate)));
  const thisWeekItems = planItems.filter((item) => {
    const itemDate = new Date(item.dueDate);
    return (
      !isToday(itemDate) &&
      isWithinInterval(itemDate, {
        start: startOfDay(today),
        end: endOfDay(addDays(today, 6)),
      })
    );
  });
  const nextWeekItems = planItems.filter((item) => {
    const itemDate = new Date(item.dueDate);
    return isWithinInterval(itemDate, {
      start: startOfDay(addDays(today, 7)),
      end: endOfDay(addDays(today, 13)),
    });
  });

  const isHighlighted = (item: PlanItem) =>
    item.relatedActionIds?.some((id) => highlightedActionIds.includes(id));

  const renderItem = (item: PlanItem) => {
    const typeConfig = itemTypeConfig[item.type];
    const StatusIcon = statusConfig[item.status].icon;
    const TypeIcon = typeConfig.icon;
    const highlighted = isHighlighted(item);

    return (
      <div
        key={item.id}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg transition-all',
          'hover:bg-muted/50 cursor-pointer',
          highlighted && 'bg-primary/10 ring-1 ring-primary/30'
        )}
      >
        <StatusIcon className={cn('w-4 h-4 shrink-0', statusConfig[item.status].className)} />
        <TypeIcon className={cn('w-4 h-4 shrink-0', typeConfig.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {item.channel && <span>{item.channel}</span>}
            {item.owner && (
              <>
                <span>•</span>
                <span>{item.owner}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Button
            variant={viewMode === 'week' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'roadmap' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode('roadmap')}
          >
            Roadmap
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Task
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Content
          </Button>
        </div>
      </div>

      {/* Timeline sections */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Today */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold">Today</h4>
            <Badge variant="secondary" className="text-[10px]">
              {todayItems.length}
            </Badge>
          </div>
          <div className="space-y-1 pl-6">
            {todayItems.length > 0 ? (
              todayItems.map(renderItem)
            ) : (
              <p className="text-xs text-muted-foreground py-2">No tasks scheduled for today</p>
            )}
          </div>
        </div>

        {/* This Week */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">This Week</h4>
            <Badge variant="secondary" className="text-[10px]">
              {thisWeekItems.length}
            </Badge>
          </div>
          <div className="space-y-1 pl-6">
            {thisWeekItems.length > 0 ? (
              thisWeekItems.map(renderItem)
            ) : (
              <p className="text-xs text-muted-foreground py-2">No upcoming tasks this week</p>
            )}
          </div>
        </div>

        {/* Next Week Preview */}
        <div className="opacity-70">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">Next Week</h4>
            <Badge variant="outline" className="text-[10px]">
              {nextWeekItems.length}
            </Badge>
          </div>
          <div className="space-y-1 pl-6">
            {nextWeekItems.slice(0, 3).map((item) => (
              <div key={item.id} className="text-xs text-muted-foreground py-1">
                {item.title}
              </div>
            ))}
            {nextWeekItems.length > 3 && (
              <p className="text-xs text-muted-foreground">+{nextWeekItems.length - 3} more</p>
            )}
          </div>
        </div>
      </div>

      {/* Drop zone hint */}
      <div className="mt-4 pt-3 border-t border-dashed border-border">
        <p className="text-xs text-muted-foreground text-center">
          Drag actions here to schedule
        </p>
      </div>
    </div>
  );
}
