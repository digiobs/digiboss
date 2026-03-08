import { useState } from 'react';
import { Sparkles, Zap, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useContentRecommendations,
  useUpdateRecommendationStatus,
  useRefreshRecommendations,
} from '@/hooks/useContentRecommendations';
import { RecommendationCard } from './RecommendationCard';
import { BriefDrawer } from './BriefDrawer';
import type { ContentRecommendation } from '@/hooks/useContentRecommendations';

interface Props {
  clientId?: string | null;
}

export function NBASection({ clientId }: Props) {
  const { data: recommendations = [], isLoading } = useContentRecommendations(clientId);
  const updateStatus = useUpdateRecommendationStatus();
  const refresh = useRefreshRecommendations();
  const [briefItem, setBriefItem] = useState<ContentRecommendation | null>(null);

  const activeRecs = recommendations.filter(r => r.status === 'active');
  const postponedRecs = recommendations.filter(r => r.status === 'postponed');
  const sortedRecs = [...activeRecs, ...postponedRecs];

  const handleDismiss = (id: string) => {
    updateStatus.mutate({ id, status: 'dismissed' });
  };

  const handlePostpone = (id: string) => {
    updateStatus.mutate({ id, status: 'postponed' });
  };

  const handleConvert = (rec: ContentRecommendation) => {
    updateStatus.mutate({ id: rec.id, status: 'converted' });
    setBriefItem(rec);
  };

  const handleRefresh = () => {
    if (clientId) {
      refresh.mutate(clientId);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-foreground">Next Best Actions</span>
        </div>
        <p className="text-sm text-muted-foreground">L'IA analyse vos données...</p>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (sortedRecs.length === 0) {
    return (
      <div className="rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-foreground">Next Best Actions</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Pas de recommandations pour l'instant. Publiez plus de contenus pour que l'IA puisse analyser vos performances.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-foreground">Next Best Actions</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  <p className="font-semibold mb-1">Comment c'est calculé</p>
                  <ul className="space-y-0.5">
                    <li>Performance passée : 30%</li>
                    <li>Fraîcheur du pilier : 25%</li>
                    <li>Tendance sectorielle : 20%</li>
                    <li>Calendrier éditorial : 15%</li>
                    <li>Diversité canal : 10%</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Zap className="w-3 h-3" /> Powered by AI
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={!clientId || refresh.isPending}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refresh.isPending ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Contenus recommandés par l'IA, basés sur vos performances et votre calendrier éditorial
        </p>

        {/* Cards */}
        <div className="space-y-3">
          {sortedRecs.map((rec, idx) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              rank={idx + 1}
              onConvert={() => handleConvert(rec)}
              onDismiss={() => handleDismiss(rec.id)}
              onPostpone={() => handlePostpone(rec.id)}
            />
          ))}
        </div>
      </div>

      {/* Brief drawer */}
      <BriefDrawer
        recommendation={briefItem}
        open={!!briefItem}
        onClose={() => setBriefItem(null)}
      />
    </>
  );
}
