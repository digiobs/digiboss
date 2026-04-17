import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Video, Clock, BarChart3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCalendarEvents } from '@/hooks/useHomeData';
import { cn } from '@/lib/utils';
import { format, isSameDay, isToday, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

const eventTypeConfig: Record<string, { icon: typeof FileText; color: string }> = {
  content_planned: { icon: FileText, color: 'text-blue-600' },
  meeting: { icon: Video, color: 'text-green-600' },
  deadline: { icon: Clock, color: 'text-red-600' },
  report_due: { icon: BarChart3, color: 'text-purple-600' },
};

const channelEmoji: Record<string, string> = {
  linkedin: '🔵',
  blog: '🟢',
  youtube: '🔴',
  newsletter: '🟣',
};

export function HomeCalendarWeek() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data, isLoading } = useCalendarEvents(weekOffset);

  const days: Date[] = [];
  if (data?.startOfWeek) {
    for (let i = 0; i < 5; i++) {
      const d = new Date(data.startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
  } else {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Cette semaine</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(o => o - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setWeekOffset(0)}>
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(o => o + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {days.map((day) => {
            const dayEvents = (data?.events ?? []).filter((e: { scheduled_at: string }) =>
              isSameDay(new Date(e.scheduled_at), day)
            );
            const today = isToday(day);
            const past = isBefore(day, new Date()) && !today;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'rounded-lg px-3 py-2',
                  today && 'bg-blue-50 border-l-4 border-blue-500',
                  past && 'opacity-60'
                )}
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  {format(day, 'EEE d MMM', { locale: fr })}
                </p>
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Journée libre</p>
                ) : (
                  <div className="space-y-1">
                    {dayEvents.map((event: { id: string; event_type: string; scheduled_at: string; title: string; channel?: string }) => {
                      const cfg = eventTypeConfig[event.event_type] || eventTypeConfig.content_planned;
                      const Icon = cfg.icon;
                      const time = format(new Date(event.scheduled_at), 'HH:mm');

                      return (
                        <div key={event.id} className="flex items-center gap-2 text-sm">
                          {event.channel && (
                            <span className="text-xs">{channelEmoji[event.channel] || '📄'}</span>
                          )}
                          <Icon className={cn('w-3.5 h-3.5 shrink-0', cfg.color)} />
                          <span className="truncate text-foreground text-xs">{event.title}</span>
                          {event.clients && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                              {event.clients.name}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">[{time}]</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
