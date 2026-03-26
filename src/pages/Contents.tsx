import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useContents, type Channel } from '@/hooks/useContents';
import { ContentsKPIStrip } from '@/components/contents/ContentsKPIStrip';
import { ContentCard } from '@/components/contents/ContentCard';
import { ContentDetailDrawer } from '@/components/contents/ContentDetailDrawer';
import { ContentsSummaryCharts } from '@/components/contents/ContentsSummaryCharts';
import { NBASection } from '@/components/contents/NBASection';

type ChannelFilter = Channel | 'all';
type PeriodFilter = '7' | '30' | '90';

export default function Contents() {
  const { clients, currentClient, setCurrentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('30');
  const selectedClientId = currentClient?.id ?? ALL_CLIENTS_ID;
  const [detailId, setDetailId] = useState<string | null>(null);

  const effectiveClientId = isAllClientsSelected ? null : (currentClient?.id ?? null);

  const { data: contents = [], isLoading } = useContents({
    clientId: effectiveClientId,
    channel: channelFilter,
    periodDays: Number(period),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contenus & Performances</h1>
          <p className="text-sm text-muted-foreground">Suivi des contenus publiés et de leurs métriques</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Client selector */}
          <Select
            value={selectedClientId}
            onValueChange={(id) => {
              const c = id === ALL_CLIENTS_ID ? ALL_CLIENTS_CLIENT : clients.find((cl) => cl.id === id) ?? null;
              setCurrentClient(c);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && <SelectItem value={ALL_CLIENTS_ID}>Admin (tous les clients)</SelectItem>}
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period */}
          <Select value={period} onValueChange={v => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Channel filter tabs */}
      <Tabs value={channelFilter} onValueChange={v => setChannelFilter(v as ChannelFilter)}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPIs */}
      <ContentsKPIStrip contents={contents} isLoading={isLoading} />

      {/* Content feed */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Aucun contenu publié sur cette période</h3>
            <p className="text-sm text-muted-foreground mb-4">Les contenus apparaîtront ici une fois ajoutés.</p>
            <Button variant="outline" disabled>
              <Plus className="w-4 h-4 mr-1" /> Ajouter un contenu
            </Button>
          </div>
        ) : (
          contents.map(c => (
            <ContentCard
              key={c.id}
              content={c}
              showClient={isAllClientsSelected}
              onViewDetails={setDetailId}
            />
          ))
        )}
      </div>

      {/* Next Best Actions */}
      <NBASection clientId={effectiveClientId} />

      {/* Summary charts */}
      {contents.length > 0 && (
        <ContentsSummaryCharts contents={contents} isLoading={isLoading} />
      )}

      {/* Detail drawer */}
      <ContentDetailDrawer
        contentId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
