import { useState } from 'react';
import {
  Activity, FileText, BarChart3, Video, Rocket,
  TrendingUp, AlertTriangle, FileEdit, UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActivityFeed } from '@/hooks/useHomeData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const eventIcons: Record<string, typeof FileText> = {
  content_published: FileText,
  report_delivered: BarChart3,
  meeting_held: Video,
  campaign_started: Rocket,
  campaign_ended: Rocket,
  seo_movement: TrendingUp,
  performance_alert: AlertTriangle,
  notion_updated: FileEdit,
  lead_acquired: UserPlus,
};

const eventEmoji: Record<string, string> = {
  content_published: '📝',
  report_delivered: '📊',
  meeting_held: '📞',
  campaign_started: '🚀',
  campaign_ended: '🏁',
  seo_movement: '📈',
  performance_alert: '⚠️',
  notion_updated: '📋',
  lead_acquired: '🎯',
};

export function HomeActivityFeed() {
  const [period, setPeriod] = useState(7);
  const { data: events, isLoading } = useActivityFeed(period);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Activité récente</h2>
        </div>
        <Tabs value={String(period)} onValueChange={(v) => setPeriod(Number(v))}>
          <TabsList className="h-7">
            <TabsTrigger value="1" className="text-xs px-2 h-6">Aujourd'hui</TabsTrigger>
            <TabsTrigger value="7" className="text-xs px-2 h-6">7j</TabsTrigger>
            <TabsTrigger value="30" className="text-xs px-2 h-6">30j</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Pas encore d'activité enregistrée
        </p>
      ) : (
        <ScrollArea className="max-h-[350px]">
          <div className="space-y-1 pr-2">
            {events.map((event: Record<string, unknown>) => {
              const emoji = eventEmoji[event.event_type] || '📄';
              const timeAgo = formatDistanceToNow(new Date(event.created_at), {
                addSuffix: true,
                locale: fr,
              });

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xs mt-0.5 shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">
                      {event.message}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                      {event.clients && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {event.clients.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
