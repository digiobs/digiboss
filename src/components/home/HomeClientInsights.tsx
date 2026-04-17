import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVeilleItems } from '@/hooks/useVeilleItems';
import { useSupabaseMeetings } from '@/hooks/useSupabaseMeetings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Video,
  ArrowRight,
  ChevronRight,
  Zap,
  ExternalLink,
} from 'lucide-react';

interface InsightItem {
  id: string;
  type: 'opportunity' | 'meeting_decision' | 'meeting_action' | 'alert';
  title: string;
  description: string;
  soWhat?: string;
  source: string;
  sourceUrl?: string | null;
  date: string;
  actions?: string[];
  skill?: string;
}

const TYPE_CONFIG = {
  opportunity: { icon: Lightbulb, label: 'Opportunite', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20' },
  meeting_decision: { icon: Video, label: 'Decision meeting', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/20' },
  meeting_action: { icon: Zap, label: 'Action meeting', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/20' },
  alert: { icon: AlertTriangle, label: 'Alerte', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/20' },
};

export function HomeClientInsights() {
  const navigate = useNavigate();
  const { data: veilleItems, isLoading: veilleLoading } = useVeilleItems();
  const { meetings, loading: meetingsLoading } = useSupabaseMeetings();

  const insights = useMemo<InsightItem[]>(() => {
    const result: InsightItem[] = [];

    const opportunities = (veilleItems ?? [])
      .filter((v) => v.severity === 'opportunity')
      .slice(0, 4);
    for (const item of opportunities) {
      result.push({
        id: `veille-opp-${item.id}`,
        type: 'opportunity',
        title: item.title,
        description: item.summary,
        source: item.source,
        sourceUrl: item.source_url,
        date: item.generated_at || item.created_at,
        skill: item.skill,
      });
    }

    const alerts = (veilleItems ?? [])
      .filter((v) => v.severity === 'alert' || v.severity === 'warning')
      .slice(0, 2);
    for (const item of alerts) {
      result.push({
        id: `veille-alert-${item.id}`,
        type: 'alert',
        title: item.title,
        description: item.summary,
        source: item.source,
        sourceUrl: item.source_url,
        date: item.generated_at || item.created_at,
        skill: item.skill,
      });
    }

    const recentMeetings = meetings.slice(0, 3);
    for (const meeting of recentMeetings) {
      if (meeting.aiSummary) {
        const decisions = meeting.aiSummary.decisions ?? [];
        if (decisions.length > 0) {
          result.push({
            id: `meeting-dec-${meeting.id}`,
            type: 'meeting_decision',
            title: `Decisions : ${meeting.title}`,
            description: decisions.slice(0, 3).join(' / '),
            source: 'tl;dv',
            date: meeting.date,
          });
        }
        const actionItems = meeting.aiSummary.actionItems ?? [];
        if (actionItems.length > 0) {
          result.push({
            id: `meeting-act-${meeting.id}`,
            type: 'meeting_action',
            title: `Actions : ${meeting.title}`,
            description: actionItems
              .slice(0, 3)
              .map((a) => (typeof a === 'string' ? a : (a as { text?: string }).text ?? ''))
              .join(' / '),
            actions: actionItems
              .slice(0, 3)
              .map((a) => (typeof a === 'string' ? a : (a as { text?: string }).text ?? '')),
            source: 'tl;dv',
            date: meeting.date,
          });
        }
      }
    }

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result.slice(0, 6);
  }, [veilleItems, meetings]);

  const isLoading = veilleLoading || meetingsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Chargement des insights...
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
        <Lightbulb className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Aucun insight disponible pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const config = TYPE_CONFIG[insight.type];
          const Icon = config.icon;
          const dateStr = new Date(insight.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          });

          return (
            <Card key={insight.id} className="border-border/60 transition-shadow hover:shadow-md">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bgColor} ${config.color}`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                </div>

                <div>
                  <p className="text-sm font-medium leading-snug line-clamp-2">{insight.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                    {insight.description}
                  </p>
                </div>

                {insight.actions && insight.actions.length > 0 && (
                  <div className="space-y-1">
                    {insight.actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        <span className="line-clamp-1">{action}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    {insight.skill && (
                      <Badge variant="secondary" className="text-[10px]">
                        {insight.skill}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">{insight.source}</span>
                  </div>
                  {insight.sourceUrl && (
                    <a
                      href={insight.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/veille')}>
          <TrendingUp className="h-3 w-3" />
          Toute la veille
          <ChevronRight className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/meetings')}>
          <Video className="h-3 w-3" />
          Tous les meetings
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
