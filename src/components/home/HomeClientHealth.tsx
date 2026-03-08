import { HeartPulse, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useClientHealthScores } from '@/hooks/useHomeData';
import { cn } from '@/lib/utils';

function healthColor(score: number) {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-amber-700';
  return 'text-red-700';
}

function progressColor(score: number) {
  if (score >= 80) return '[&>div]:bg-green-500';
  if (score >= 60) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

const TrendIcon = ({ trend }: { trend: string | null }) => {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
};

const scoreLabels: Record<string, string> = {
  publication_regularity: 'Publi.',
  seo: 'SEO',
  linkedin: 'LinkedIn',
  ads: 'Ads',
  leads: 'Leads',
  relationship: 'Relation',
};

export function HomeClientHealth() {
  const { data: scores, isLoading } = useClientHealthScores();

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Santé des clients</h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            <p className="font-semibold mb-1">Comment c'est calculé :</p>
            <ul className="space-y-0.5">
              <li>Régularité publication (25%)</li>
              <li>Performances SEO (20%)</li>
              <li>Engagement LinkedIn (20%)</li>
              <li>Performance Ads (15%)</li>
              <li>Génération de leads (10%)</li>
              <li>Fraîcheur relation (10%)</li>
            </ul>
          </TooltipContent>
        </Tooltip>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : !scores || scores.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Aucun score de santé disponible
        </p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {scores.map((s: any) => {
            const breakdown = (s.score_breakdown as Record<string, number>) || {};

            return (
              <div key={s.id} className="p-3 rounded-lg border border-border bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{s.clients?.name}</span>
                    <TrendIcon trend={s.trend} />
                  </div>
                  <span className={cn('font-bold text-sm', healthColor(s.overall_score))}>
                    {s.overall_score}/100
                  </span>
                </div>
                <Progress value={s.overall_score} className={cn('h-2', progressColor(s.overall_score))} />
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(breakdown).map(([key, val]) => (
                    <Badge key={key} variant="outline" className="text-[10px] px-1.5 py-0">
                      {scoreLabels[key] || key}: {val as number}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
