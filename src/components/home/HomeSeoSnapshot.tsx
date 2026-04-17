import { useSeoGeo } from "@/hooks/useSeoGeo";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Search, Target } from "lucide-react";

export function HomeSeoSnapshot() {
  const { keywordDistribution, seoKpis, avgChange, isLoading } = useSeoGeo();

  if (isLoading) {
    return <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (keywordDistribution.total === 0 && seoKpis.avgPosition === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">Aucune donnee SEO disponible</div>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-card/50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            Top 3
          </div>
          <p className="text-lg font-semibold">{keywordDistribution.top3}</p>
        </div>
        <div className="rounded-lg border bg-card/50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            Top 10
          </div>
          <p className="text-lg font-semibold">{keywordDistribution.top10}</p>
        </div>
        <div className="rounded-lg border bg-card/50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Search className="h-3 w-3" />
            Position moy.
          </div>
          <p className="text-lg font-semibold">
            {seoKpis.avgPosition > 0 ? seoKpis.avgPosition.toFixed(1) : keywordDistribution.total > 0 ? "-" : "N/A"}
          </p>
        </div>
        <div className="rounded-lg border bg-card/50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Search className="h-3 w-3" />
            Mots-cles
          </div>
          <p className="text-lg font-semibold">{keywordDistribution.total}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <span className="text-xs text-muted-foreground">Variation moyenne</span>
        <Badge
          variant={avgChange > 0 ? "default" : avgChange < 0 ? "destructive" : "secondary"}
          className="gap-1 text-xs"
        >
          {avgChange > 0 ? <TrendingUp className="h-3 w-3" /> : avgChange < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {avgChange > 0 ? "+" : ""}
          {avgChange.toFixed(1)}
        </Badge>
      </div>
    </div>
  );
}
