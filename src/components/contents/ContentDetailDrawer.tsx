import { ExternalLink, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChannelBadge } from './ChannelBadge';
import { useContentDetail, type Channel } from '@/hooks/useContents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  contentId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ContentDetailDrawer({ contentId, open, onClose }: Props) {
  const { data: content, isLoading } = useContentDetail(contentId);

  const chartData = content?.content_metrics
    ?.sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map(m => ({
      date: format(new Date(m.measured_at), 'dd MMM', { locale: fr }),
      impressions: m.impressions + m.views,
      engagement: m.engagement_rate,
    })) || [];

  const latestMetric = content?.content_metrics?.length
    ? content.content_metrics.reduce((a, b) =>
        new Date(a.measured_at) > new Date(b.measured_at) ? a : b
      )
    : null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading || !content ? (
          <div className="space-y-4 pt-8">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <ChannelBadge channel={content.channel as Channel} />
                <Badge variant="secondary">{format(new Date(content.published_at), 'dd MMMM yyyy', { locale: fr })}</Badge>
              </div>
              <SheetTitle className="text-lg">{content.title}</SheetTitle>
            </SheetHeader>

            {/* Body */}
            {content.body && (
              <div className="prose prose-sm max-w-none text-muted-foreground mb-6 whitespace-pre-wrap text-sm">
                {content.body}
              </div>
            )}

            {/* Chart */}
            {chartData.length > 1 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Évolution</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Impressions" />
                      <Line type="monotone" dataKey="engagement" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Engagement %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Metrics table */}
            {latestMetric && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Métriques détaillées</h4>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Métrique</TableHead><TableHead className="text-right">Valeur</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestMetric.impressions > 0 && <TableRow><TableCell>Impressions</TableCell><TableCell className="text-right">{latestMetric.impressions.toLocaleString('fr-FR')}</TableCell></TableRow>}
                    {latestMetric.views > 0 && <TableRow><TableCell>Vues</TableCell><TableCell className="text-right">{latestMetric.views.toLocaleString('fr-FR')}</TableCell></TableRow>}
                    {latestMetric.likes > 0 && <TableRow><TableCell>Likes</TableCell><TableCell className="text-right">{latestMetric.likes}</TableCell></TableRow>}
                    {latestMetric.comments > 0 && <TableRow><TableCell>Commentaires</TableCell><TableCell className="text-right">{latestMetric.comments}</TableCell></TableRow>}
                    {latestMetric.shares > 0 && <TableRow><TableCell>Partages</TableCell><TableCell className="text-right">{latestMetric.shares}</TableCell></TableRow>}
                    <TableRow><TableCell>Taux d'engagement</TableCell><TableCell className="text-right">{latestMetric.engagement_rate}%</TableCell></TableRow>
                    {latestMetric.avg_time_on_page != null && <TableRow><TableCell>Temps moyen sur page</TableCell><TableCell className="text-right">{Math.floor(latestMetric.avg_time_on_page / 60)}m {latestMetric.avg_time_on_page % 60}s</TableCell></TableRow>}
                    {latestMetric.bounce_rate != null && <TableRow><TableCell>Taux de rebond</TableCell><TableCell className="text-right">{latestMetric.bounce_rate}%</TableCell></TableRow>}
                    {latestMetric.top_traffic_source && <TableRow><TableCell>Source de trafic</TableCell><TableCell className="text-right">{latestMetric.top_traffic_source}</TableCell></TableRow>}
                    {latestMetric.avg_watch_duration != null && <TableRow><TableCell>Durée moy. visionnée</TableCell><TableCell className="text-right">{Math.floor(latestMetric.avg_watch_duration / 60)}m</TableCell></TableRow>}
                    {latestMetric.retention_rate != null && <TableRow><TableCell>Taux de rétention</TableCell><TableCell className="text-right">{latestMetric.retention_rate}%</TableCell></TableRow>}
                    {latestMetric.sends > 0 && <TableRow><TableCell>Envois</TableCell><TableCell className="text-right">{latestMetric.sends.toLocaleString('fr-FR')}</TableCell></TableRow>}
                    {latestMetric.open_rate != null && <TableRow><TableCell>Taux d'ouverture</TableCell><TableCell className="text-right">{latestMetric.open_rate}%</TableCell></TableRow>}
                    {latestMetric.click_rate != null && <TableRow><TableCell>Taux de clic</TableCell><TableCell className="text-right">{latestMetric.click_rate}%</TableCell></TableRow>}
                    {latestMetric.unsubscribes > 0 && <TableRow><TableCell>Désabonnements</TableCell><TableCell className="text-right">{latestMetric.unsubscribes}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {content.source_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={content.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" /> Voir la source
                  </a>
                </Button>
              )}
              <Button variant="secondary" size="sm" disabled>
                <Sparkles className="w-4 h-4 mr-1" /> Créer un contenu similaire
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
