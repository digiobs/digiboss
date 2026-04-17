import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorialCalendar } from '@/hooks/useEditorialCalendar';
import { useSupabaseMeetings } from '@/hooks/useSupabaseMeetings';
import { useClientAvancement } from '@/hooks/useClientAvancement';
import { useClient } from '@/contexts/ClientContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Video,
  Clock,
  Pen,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday, isBefore, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: 'content' | 'meeting' | 'task';
  status?: string;
  canal?: string;
  time?: string;
}

const TYPE_ICON = {
  content: FileText,
  meeting: Video,
  task: Clock,
};

const TYPE_COLOR = {
  content: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  meeting: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  task: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
};

const CANAL_ICON: Record<string, typeof Send> = {
  linkedin: Send,
  blog: Pen,
  youtube: Video,
  newsletter: Send,
};

const STATUS_INDICATOR: Record<string, { color: string; label: string }> = {
  idee: { color: 'bg-gray-400', label: 'Idee' },
  brouillon: { color: 'bg-yellow-400', label: 'Brouillon' },
  valide: { color: 'bg-blue-400', label: 'Valide' },
  programme: { color: 'bg-purple-400', label: 'Programme' },
  publie: { color: 'bg-green-500', label: 'Publie' },
};

export function HomeClientCalendar() {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const { currentClient, isAllClientsSelected } = useClient();
  const { entries, isLoading: calLoading } = useEditorialCalendar();
  const { meetings, loading: meetingsLoading } = useSupabaseMeetings();
  const { data: avancementData } = useClientAvancement(
    isAllClientsSelected ? undefined : currentClient?.id
  );

  const weekStart = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    return addWeeks(start, weekOffset);
  }, [weekOffset]);

  const days = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];

    for (const entry of entries) {
      const entryDate = new Date(entry.date + 'T00:00:00');
      if (days.some((d) => isSameDay(d, entryDate))) {
        result.push({
          id: `cal-${entry.id}`,
          date: entryDate,
          title: entry.title,
          type: 'content',
          status: entry.status,
          canal: entry.canal,
          time: entry.time_slot ?? undefined,
        });
      }
    }

    for (const meeting of meetings) {
      const meetingDate = new Date(meeting.date);
      if (days.some((d) => isSameDay(d, meetingDate))) {
        result.push({
          id: `meet-${meeting.id}`,
          date: meetingDate,
          title: meeting.title,
          type: 'meeting',
          time: format(meetingDate, 'HH:mm'),
        });
      }
    }

    const tasks = avancementData?.tasks ?? [];
    for (const task of tasks) {
      if (!task.due_date) continue;
      const taskDate = new Date(task.due_date + 'T00:00:00');
      if (days.some((d) => isSameDay(d, taskDate))) {
        result.push({
          id: `task-${task.id}`,
          date: taskDate,
          title: task.title,
          type: 'task',
          status: task.status,
        });
      }
    }

    return result;
  }, [entries, meetings, avancementData, days]);

  const isLoading = calLoading || meetingsLoading;
  const weekLabel = `${format(days[0], 'd MMM', { locale: fr })} — ${format(days[4], 'd MMM yyyy', { locale: fr })}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">{weekLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((o) => o - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setWeekOffset(0)}>
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((o) => o + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(e.date, day));
            const today = isToday(day);
            const past = isBefore(day, new Date()) && !today;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'rounded-lg px-3 py-2.5 transition-colors',
                  today && 'bg-primary/5 border-l-4 border-primary',
                  past && !today && 'opacity-50',
                )}
              >
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  {format(day, 'EEEE d MMMM', { locale: fr })}
                </p>

                {dayEvents.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground/60">Rien de prevu</p>
                ) : (
                  <div className="space-y-1.5">
                    {dayEvents.map((event) => {
                      const Icon = TYPE_ICON[event.type];
                      const colorClass = TYPE_COLOR[event.type];
                      const CanalIcon = event.canal ? CANAL_ICON[event.canal] : null;
                      const statusInfo = event.status ? STATUS_INDICATOR[event.status] : null;

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm',
                            colorClass,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {CanalIcon && <CanalIcon className="h-3 w-3 shrink-0 opacity-60" />}
                          <span className="truncate text-xs font-medium">{event.title}</span>
                          {statusInfo && (
                            <span className={cn('ml-auto h-2 w-2 shrink-0 rounded-full', statusInfo.color)} title={statusInfo.label} />
                          )}
                          {event.type === 'task' && event.status === 'done' && (
                            <CheckCircle2 className="ml-auto h-3 w-3 shrink-0 text-green-500" />
                          )}
                          {event.time && (
                            <span className="ml-auto shrink-0 text-[10px] opacity-60">{event.time}</span>
                          )}
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

      <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 px-3 py-2">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-blue-500" /> Contenus
          </span>
          <span className="flex items-center gap-1">
            <Video className="h-3 w-3 text-green-500" /> Meetings
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-orange-500" /> Taches
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => navigate('/actions')}>
          Calendrier complet
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
