import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Quote,
  Video,
  Linkedin,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { ContentItem, contentTypeLabels } from '@/types/content';

interface ContentCalendarProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
}

const contentTypeIcons: Record<string, React.ElementType> = {
  'blog-post': FileText,
  'testimonial': Quote,
  'webinar': Video,
  'linkedin-post': Linkedin,
  'landing-page': Layout,
};

const contentTypeColors: Record<string, string> = {
  'blog-post': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'testimonial': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  'webinar': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'linkedin-post': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  'landing-page': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
};

export function ContentCalendar({ items, onItemClick }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const getItemsForDay = (day: Date) => {
    return items.filter(item => {
      const date = item.scheduledDate || item.dueDate || item.publishedDate;
      return date && isSameDay(new Date(date), day);
    });
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-border bg-muted/30">
        {Object.entries(contentTypeLabels).map(([type, label]) => {
          const Icon = contentTypeIcons[type] || FileText;
          return (
            <div key={type} className="flex items-center gap-1.5 text-xs">
              <div className={cn(
                "w-5 h-5 rounded flex items-center justify-center",
                contentTypeColors[type]
              )}>
                <Icon className="w-3 h-3" />
              </div>
              <span className="text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div 
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayItems = getItemsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] p-1.5 border-b border-r border-border",
                !isCurrentMonth && "bg-muted/30",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1",
                isToday && "bg-primary text-primary-foreground font-medium",
                !isToday && !isCurrentMonth && "text-muted-foreground/50",
                !isToday && isCurrentMonth && "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => {
                  const Icon = contentTypeIcons[item.contentType] || FileText;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className={cn(
                        "w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors hover:opacity-80",
                        contentTypeColors[item.contentType]
                      )}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
                {dayItems.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1">
                    +{dayItems.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
