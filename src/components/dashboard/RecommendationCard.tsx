import { ArrowRight, Zap, Clock, FileText, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Recommendation } from '@/data/mockData';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const impactClass =
    recommendation.impact === 'high'
      ? 'impact-high'
      : recommendation.impact === 'medium'
      ? 'impact-medium'
      : 'impact-low';

  const confidenceColor =
    recommendation.confidence >= 80
      ? 'bg-emerald-500'
      : recommendation.confidence >= 60
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div
      className="recommendation-card animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground leading-tight">
              {recommendation.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {recommendation.description}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={impactClass}>
            {recommendation.impact} impact
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', confidenceColor)}
              style={{ width: `${recommendation.confidence}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {recommendation.confidence}%
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{recommendation.effort} effort</span>
        </div>
      </div>

      {/* Reasons */}
      <ul className="space-y-1 mb-4">
        {recommendation.reasons.map((reason, idx) => (
          <li
            key={idx}
            className="text-sm text-muted-foreground flex items-start gap-2"
          >
            <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
            {reason}
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Button size="sm" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Create task
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          Assign
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground">
          Dismiss
        </Button>
      </div>
    </div>
  );
}
