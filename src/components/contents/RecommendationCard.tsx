import { PenLine, X, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChannelBadge } from './ChannelBadge';
import type { ContentRecommendation } from '@/hooks/useContentRecommendations';

interface Props {
  recommendation: ContentRecommendation;
  rank: number;
  onConvert: () => void;
  onDismiss: () => void;
  onPostpone: () => void;
}

const rankColors = ['bg-amber-500', 'bg-amber-400', 'bg-amber-300', 'bg-muted', 'bg-muted', 'bg-muted'];

export function RecommendationCard({ recommendation: rec, rank, onConvert, onDismiss, onPostpone }: Props) {
  const isPostponed = rec.status === 'postponed';

  return (
    <Card className={`transition-all duration-300 ${isPostponed ? 'opacity-50' : 'hover:shadow-md'}`}>
      <CardContent className="p-4 flex flex-col md:flex-row md:items-start gap-4">
        {/* Col 1 — Priority & Channel */}
        <div className="flex flex-col items-center gap-2 shrink-0 min-w-[60px]">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${rankColors[rank - 1] || 'bg-muted'}`}>
            {rank}
          </div>
          <ChannelBadge channel={rec.channel} />
          <span className="text-[10px] text-muted-foreground">Score : {rec.priority_score}/100</span>
        </div>

        {/* Col 2 — Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="font-semibold text-sm text-foreground line-clamp-1">{rec.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{rec.rationale}</p>
          {rec.context_tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {rec.context_tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Col 3 — Supporting metrics */}
        {rec.supporting_metrics && (
          <div className="flex flex-col gap-1 shrink-0 min-w-[160px]">
            {Object.entries(rec.supporting_metrics).map(([key, value]) => (
              <p key={key} className="text-[11px] text-muted-foreground">
                {key} : <span className="font-medium text-foreground">{value}</span>
              </p>
            ))}
          </div>
        )}

        {/* Col 4 — Actions */}
        <div className="flex md:flex-col gap-1.5 shrink-0">
          <Button size="sm" onClick={onConvert} className="text-xs gap-1">
            <PenLine className="w-3.5 h-3.5" /> Créer
          </Button>
          <Button variant="outline" size="sm" onClick={onPostpone} className="text-xs gap-1">
            <Clock className="w-3.5 h-3.5" /> Plus tard
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs gap-1">
            <X className="w-3.5 h-3.5" /> Ignorer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
