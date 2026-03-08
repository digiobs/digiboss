import { useState } from 'react';
import {
  Sparkles, RefreshCw, PenLine, BarChart3, Video,
  Search, Rocket, FileEdit, ArrowRight, Clock, X, Wand2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useHomeNBA } from '@/hooks/useHomeData';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const actionTypeConfig: Record<string, { icon: typeof PenLine; color: string; label: string }> = {
  publish_content: { icon: PenLine, color: 'text-blue-600', label: 'Publier un contenu' },
  analyze_performance: { icon: BarChart3, color: 'text-purple-600', label: 'Analyser les performances' },
  prepare_meeting: { icon: Video, color: 'text-green-600', label: 'Préparer la réunion' },
  check_seo: { icon: Search, color: 'text-orange-600', label: 'Vérifier le SEO' },
  optimize_campaign: { icon: Rocket, color: 'text-pink-600', label: 'Optimiser campagne' },
  update_notion: { icon: FileEdit, color: 'text-muted-foreground', label: 'Mettre à jour Notion' },
};

const channelColors: Record<string, string> = {
  linkedin: 'bg-blue-50 text-[#0A66C2] border-blue-200',
  blog: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  youtube: 'bg-red-50 text-red-600 border-red-200',
  newsletter: 'bg-violet-50 text-violet-600 border-violet-200',
};

function PriorityCircle({ score }: { score: number }) {
  const color =
    score > 80 ? 'bg-red-500' : score > 50 ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', color)}>
      {score}
    </div>
  );
}

export function HomeNBASection() {
  const { data: actions, isLoading, updateStatus } = useHomeNBA();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke('generate-recommendations', {
        body: { type: 'nba' },
      });
      qc.invalidateQueries({ queryKey: ['home-nba'] });
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  };

  const handleAction = (action: any) => {
    updateStatus.mutate({ id: action.id, status: 'actioned' });
    if (action.navigate_to) navigate(action.navigate_to);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-foreground">Vos priorités du jour</h2>
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">IA</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : !actions || actions.length === 0 ? (
        <div className="text-center py-8">
          <Wand2 className="w-10 h-10 text-amber-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Tout est à jour ! Aucune action prioritaire pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action: any) => {
            const config = actionTypeConfig[action.action_type] || actionTypeConfig.publish_content;
            const Icon = config.icon;
            const metrics = action.supporting_metrics as Record<string, unknown> | null;

            return (
              <div
                key={action.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg border border-amber-100 p-4 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <PriorityCircle score={action.priority_score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {action.clients && (
                        <Badge variant="outline" className="text-xs">
                          {action.clients.name}
                        </Badge>
                      )}
                      {action.channel && (
                        <Badge variant="outline" className={cn('text-xs', channelColors[action.channel])}>
                          {action.channel}
                        </Badge>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className={cn('text-xs gap-1', config.color)}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Type d'action</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="font-medium text-sm text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {action.rationale}
                    </p>
                    {metrics && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(metrics).map(([key, val]) => (
                          <span key={key} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            {key.replace(/_/g, ' ')}: {String(val)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => updateStatus.mutate({ id: action.id, status: 'dismissed' })}
                  >
                    <X className="w-3 h-3 mr-1" /> Ignorer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => updateStatus.mutate({ id: action.id, status: 'postponed' })}
                  >
                    <Clock className="w-3 h-3 mr-1" /> Plus tard
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => handleAction(action)}
                  >
                    Agir <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
