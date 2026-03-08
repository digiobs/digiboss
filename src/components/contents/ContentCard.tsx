import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, MoreHorizontal, Eye, ThumbsUp, MessageCircle, Share2, Clock, ArrowUpRight, Mail, MousePointerClick } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChannelBadge } from './ChannelBadge';
import type { Content } from '@/hooks/useContents';

function getLatestMetric(c: Content) {
  if (!c.content_metrics?.length) return null;
  return c.content_metrics.reduce((a, b) =>
    new Date(a.measured_at) > new Date(b.measured_at) ? a : b
  );
}

function MetricPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground" title={label}>
      <Icon className="w-3.5 h-3.5" />
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

interface ContentCardProps {
  content: Content;
  showClient?: boolean;
  onViewDetails: (id: string) => void;
}

export function ContentCard({ content, showClient, onViewDetails }: ContentCardProps) {
  const m = getLatestMetric(content);
  const publishedAgo = formatDistanceToNow(new Date(content.published_at), { addSuffix: true, locale: fr });

  const renderMetrics = () => {
    if (!m) return <span className="text-xs text-muted-foreground">Pas de données</span>;

    switch (content.channel) {
      case 'linkedin':
        return (
          <>
            <MetricPill icon={Eye} label="Impressions" value={m.impressions.toLocaleString('fr-FR')} />
            <MetricPill icon={ThumbsUp} label="Likes" value={m.likes} />
            <MetricPill icon={MessageCircle} label="Commentaires" value={m.comments} />
            <MetricPill icon={Share2} label="Partages" value={m.shares} />
            <MetricPill icon={ArrowUpRight} label="Engagement" value={`${m.engagement_rate}%`} />
          </>
        );
      case 'blog':
        return (
          <>
            <MetricPill icon={Eye} label="Vues" value={m.views.toLocaleString('fr-FR')} />
            <MetricPill icon={Clock} label="Temps moyen" value={m.avg_time_on_page ? `${Math.floor(m.avg_time_on_page / 60)}m${m.avg_time_on_page % 60}s` : '—'} />
            <MetricPill icon={ArrowUpRight} label="Rebond" value={m.bounce_rate != null ? `${m.bounce_rate}%` : '—'} />
          </>
        );
      case 'youtube':
        return (
          <>
            <MetricPill icon={Eye} label="Vues" value={m.views.toLocaleString('fr-FR')} />
            <MetricPill icon={Clock} label="Durée moy." value={m.avg_watch_duration ? `${Math.floor(m.avg_watch_duration / 60)}m` : '—'} />
            <MetricPill icon={ThumbsUp} label="Likes" value={m.likes} />
            <MetricPill icon={ArrowUpRight} label="Rétention" value={m.retention_rate != null ? `${m.retention_rate}%` : '—'} />
          </>
        );
      case 'newsletter':
        return (
          <>
            <MetricPill icon={Mail} label="Envois" value={m.sends.toLocaleString('fr-FR')} />
            <MetricPill icon={Eye} label="Ouverture" value={m.open_rate != null ? `${m.open_rate}%` : '—'} />
            <MetricPill icon={MousePointerClick} label="Clics" value={m.click_rate != null ? `${m.click_rate}%` : '—'} />
          </>
        );
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
        {/* Left */}
        <div className="flex flex-col gap-1.5 min-w-[140px] shrink-0">
          <ChannelBadge channel={content.channel} />
          <span className="text-xs text-muted-foreground">{publishedAgo}</span>
          {showClient && content.clients && (
            <span className="text-xs font-medium text-muted-foreground">{content.clients.name}</span>
          )}
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-sm text-foreground line-clamp-2">{content.title}</p>
          {content.body && (
            <p className="text-xs text-muted-foreground line-clamp-1">{content.body}</p>
          )}
          {content.tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {content.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Right — metrics */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {renderMetrics()}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {content.source_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={content.source_url} target="_blank" rel="noopener noreferrer" title="Voir">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(content.id)}>Voir les détails</DropdownMenuItem>
              <DropdownMenuItem>Dupliquer</DropdownMenuItem>
              <DropdownMenuItem>Archiver</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
