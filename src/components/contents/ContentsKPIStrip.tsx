import { FileText, Eye, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Content } from '@/hooks/useContents';

function getLatestMetric(c: Content) {
  if (!c.content_metrics?.length) return null;
  return c.content_metrics.reduce((a, b) =>
    new Date(a.measured_at) > new Date(b.measured_at) ? a : b
  );
}

export function ContentsKPIStrip({ contents, isLoading }: { contents: Content[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const totalPublished = contents.length;
  const totalImpressions = contents.reduce((sum, c) => {
    const m = getLatestMetric(c);
    return sum + (m?.impressions || 0) + (m?.views || 0);
  }, 0);
  const avgEngagement = contents.length
    ? contents.reduce((sum, c) => {
        const m = getLatestMetric(c);
        return sum + (m?.engagement_rate || 0);
      }, 0) / contents.length
    : 0;

  let bestContent = contents[0];
  let bestRate = 0;
  contents.forEach(c => {
    const m = getLatestMetric(c);
    if (m && m.engagement_rate > bestRate) {
      bestRate = m.engagement_rate;
      bestContent = c;
    }
  });

  const kpis = [
    { label: 'Contenus publiés', value: totalPublished.toString(), icon: FileText, color: 'text-primary' },
    { label: 'Impressions totales', value: totalImpressions.toLocaleString('fr-FR'), icon: Eye, color: 'text-blue-500' },
    { label: 'Engagement moyen', value: `${avgEngagement.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Meilleur contenu', value: bestContent?.title?.slice(0, 40) || '—', subtitle: bestContent ? `${bestContent.channel} · ${bestRate.toFixed(1)}%` : '', icon: Award, color: 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground truncate max-w-[180px]">{kpi.value}</p>
                  {kpi.subtitle && <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>}
                </div>
                <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
