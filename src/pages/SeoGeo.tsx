import { useMemo, useState, useCallback } from 'react';
import {
  Search,
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Sparkles,
  Bot,
  BarChart3,
  Eye,
  MousePointerClick,
  Award,
  Zap,
  ExternalLink,
  RefreshCw,
  CloudDownload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useSeoGeo } from '@/hooks/useSeoGeo';
import { useGoogleSearchConsole } from '@/hooks/useGoogleSearchConsole';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const positionChartConfig = {
  position: { label: 'Position', color: 'hsl(142, 76%, 36%)' },
};

const clicksChartConfig = {
  clicks: { label: 'Clicks', color: 'hsl(142, 76%, 36%)' },
  impressions: { label: 'Impressions', color: 'hsl(221, 83%, 53%)' },
};

// GEO mock data for AI engines (Meteoria placeholder)
const geoEngineData = [
  { engine: 'ChatGPT', mentions: 12, sentiment: 'positive', trend: 'up' },
  { engine: 'Perplexity', mentions: 8, sentiment: 'positive', trend: 'up' },
  { engine: 'Google SGE', mentions: 15, sentiment: 'neutral', trend: 'stable' },
  { engine: 'Claude', mentions: 5, sentiment: 'positive', trend: 'up' },
  { engine: 'Copilot', mentions: 3, sentiment: 'neutral', trend: 'down' },
];

const geoRecommendations = [
  { title: 'Structurer le contenu en FAQ pour les featured snippets', impact: 'high', source: 'Meteoria', effort: 'S' },
  { title: 'Ajouter des données structurées Schema.org sur les pages produit', impact: 'high', source: 'Semrush', effort: 'M' },
  { title: 'Créer du contenu long-format sur les requêtes informationnelles', impact: 'medium', source: 'Search Console', effort: 'L' },
  { title: 'Optimiser les balises title pour les requêtes à forte intention', impact: 'high', source: 'Semrush', effort: 'S' },
  { title: 'Améliorer le maillage interne vers les pages piliers', impact: 'medium', source: 'Semrush', effort: 'M' },
  { title: 'Développer une stratégie de contenu pour les citations IA', impact: 'high', source: 'Meteoria', effort: 'L' },
];

export default function SeoGeo() {
  const {
    keywords,
    positionHistory,
    geoMetrics,
    seoKpis,
    keywordDistribution,
    avgChange,
    isLoading,
    refetch,
  } = useSeoGeo();

  const {
    isConnected: gscConnected,
    queries: gscQueries,
    totals: gscTotals,
    isLoading: gscLoading,
  } = useGoogleSearchConsole();

  const { isAdmin } = useVisibilityMode();
  const { currentClient, isAllClientsSelected } = useClient();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncFromOneDrive = useCallback(async () => {
    setIsSyncing(true);
    try {
      const payload: Record<string, unknown> = { dryRun: false };
      if (!isAllClientsSelected && currentClient?.id) {
        payload.clientId = currentClient.id;
      }
      const { data, error } = await supabase.functions.invoke('onedrive-semrush-sync', { body: payload });
      if (error) throw error;
      const inserted = data?.totalInserted ?? 0;
      toast({
        title: 'Sync OneDrive terminé',
        description: `${inserted} positions Semrush importées depuis les dossiers Claude/seo.`,
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Erreur sync OneDrive',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
    setIsSyncing(false);
  }, [currentClient?.id, isAllClientsSelected, refetch, toast]);

  // Build position evolution chart data
  const positionChartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    for (const item of positionHistory) {
      const dateLabel = format(new Date(item.date), 'MMM yyyy', { locale: fr });
      if (!dateMap.has(dateLabel)) {
        dateMap.set(dateLabel, {});
      }
      dateMap.get(dateLabel)![item.keyword] = item.position;
    }
    return Array.from(dateMap.entries()).map(([date, kws]) => ({ date, ...kws }));
  }, [positionHistory]);

  // Get unique keywords for chart lines
  const chartKeywords = useMemo(() => {
    const uniqueKws = new Set(positionHistory.map((p) => p.keyword));
    return Array.from(uniqueKws).slice(0, 6);
  }, [positionHistory]);

  const lineColors = [
    'hsl(142, 76%, 36%)',
    'hsl(221, 83%, 53%)',
    'hsl(0, 84%, 60%)',
    'hsl(38, 92%, 50%)',
    'hsl(280, 65%, 60%)',
    'hsl(180, 70%, 45%)',
  ];

  // GSC chart data
  const gscChartData = useMemo(() => {
    if (!gscConnected || gscQueries.length === 0) return [];
    return gscQueries.slice(0, 10).map((q) => ({
      name: q.query.length > 18 ? q.query.substring(0, 18) + '…' : q.query,
      clicks: q.clicks,
      impressions: q.impressions,
    }));
  }, [gscConnected, gscQueries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Search className="w-6 h-6" />
            SEO & GEO
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visibilité organique et intelligence artificielle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <div className={cn('w-2 h-2 rounded-full', gscConnected ? 'bg-green-500' : 'bg-muted-foreground')} />
            Search Console
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <div className={cn('w-2 h-2 rounded-full', keywords.length > 0 ? 'bg-green-500' : 'bg-muted-foreground')} />
            Semrush
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Meteoria
          </Badge>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={syncFromOneDrive} disabled={isSyncing} className="gap-1.5 text-xs">
              <CloudDownload className={cn('w-4 h-4', isSyncing && 'animate-pulse')} />
              Sync OneDrive
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="positions" className="gap-1.5">
            <Target className="w-4 h-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="geo" className="gap-1.5">
            <Bot className="w-4 h-4" />
            GEO (IA)
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5">
            <Zap className="w-4 h-4" />
            Actions
          </TabsTrigger>
        </TabsList>

        {/* ==================== OVERVIEW TAB ==================== */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<MousePointerClick className="w-5 h-5 text-green-600" />}
              label="Clicks SEO"
              value={gscConnected ? gscTotals.clicks : seoKpis.seoClicks}
              suffix=""
              trend={gscConnected ? undefined : avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : undefined}
              isLoading={isLoading || gscLoading}
              source={gscConnected ? 'GSC Live' : 'Supabase'}
            />
            <KpiCard
              icon={<Eye className="w-5 h-5 text-blue-600" />}
              label="Impressions"
              value={gscConnected ? gscTotals.impressions : 0}
              suffix=""
              isLoading={isLoading || gscLoading}
              source={gscConnected ? 'GSC Live' : '—'}
            />
            <KpiCard
              icon={<Award className="w-5 h-5 text-purple-600" />}
              label="Position moyenne"
              value={seoKpis.avgPosition > 0 ? seoKpis.avgPosition : keywords.length > 0
                ? +(keywords.reduce((s, k) => s + (k.position ?? 0), 0) / keywords.length).toFixed(1)
                : 0}
              suffix=""
              trend={avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : undefined}
              isLoading={isLoading}
              source="Semrush"
            />
            <KpiCard
              icon={<Target className="w-5 h-5 text-orange-600" />}
              label="Mots-clés Top 10"
              value={keywordDistribution.top10}
              suffix={`/ ${keywordDistribution.total}`}
              isLoading={isLoading}
              source="Semrush"
            />
          </div>

          {/* Position Evolution Chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Évolution des positions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Suivi mensuel des mots-clés principaux</p>
              </div>
              <Badge variant="secondary" className="text-xs">Semrush</Badge>
            </div>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : positionChartData.length > 0 ? (
              <ChartContainer config={positionChartConfig} className="h-[280px] w-full">
                <LineChart data={positionChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    reversed
                    domain={[1, 'auto']}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Position', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {chartKeywords.map((kw, idx) => (
                    <Line
                      key={kw}
                      type="monotone"
                      dataKey={kw}
                      stroke={lineColors[idx % lineColors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée de position disponible
              </div>
            )}
            {/* Legend */}
            {chartKeywords.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
                {chartKeywords.map((kw, idx) => (
                  <div key={kw} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-0.5 rounded" style={{ backgroundColor: lineColors[idx % lineColors.length] }} />
                    {kw}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Keywords distribution + GSC queries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Distribution */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Distribution des positions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Top 3', value: keywordDistribution.top3, color: 'bg-green-500' },
                  { label: 'Top 10', value: keywordDistribution.top10, color: 'bg-blue-500' },
                  { label: 'Top 20', value: keywordDistribution.top20, color: 'bg-amber-500' },
                  { label: 'Total', value: keywordDistribution.total, color: 'bg-purple-500' },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-lg bg-muted/30 border border-border text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <p className="text-2xl font-bold mt-1">{item.value}</p>
                    <div className={cn('w-full h-1 rounded-full mt-2', item.color, 'opacity-30')}>
                      <div
                        className={cn('h-full rounded-full', item.color)}
                        style={{ width: `${keywordDistribution.total > 0 ? (item.value / keywordDistribution.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GSC Top Queries */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Top requêtes</h3>
                <Badge variant="secondary" className="text-xs">
                  {gscConnected ? 'GSC Live' : 'Search Console'}
                </Badge>
              </div>
              {gscLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : gscConnected && gscChartData.length > 0 ? (
                <ChartContainer config={clicksChartConfig} className="h-[220px] w-full">
                  <AreaChart data={gscChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillClicksSeo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="clicks" stroke="hsl(142, 76%, 36%)" strokeWidth={2} fill="url(#fillClicksSeo)" />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/10">
                  <div className="text-center space-y-2">
                    <Globe className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Connectez Google Search Console pour voir les données live</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ==================== POSITIONS TAB ==================== */}
        <TabsContent value="positions" className="space-y-6 mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Suivi des positions</h3>
                <Badge variant="secondary" className="text-xs">{keywords.length} mots-clés</Badge>
              </div>
              <Badge variant="outline" className="text-xs">Semrush</Badge>
            </div>
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : keywords.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Aucun mot-clé suivi. Configurez Semrush dans l'Admin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Mot-clé</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Domaine</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Position</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Évolution</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Volume</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Trafic %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((kw, idx) => (
                      <tr key={`${kw.keyword}-${idx}`} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{kw.domain}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={
                            kw.position !== null && kw.position <= 3 ? 'default' :
                            kw.position !== null && kw.position <= 10 ? 'secondary' : 'outline'
                          }>
                            #{kw.position ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className={cn(
                            'flex items-center justify-center gap-1 text-sm font-medium',
                            kw.change > 0 ? 'text-emerald-600' : kw.change < 0 ? 'text-red-600' : 'text-muted-foreground'
                          )}>
                            {kw.change > 0 ? <ArrowUp className="w-3.5 h-3.5" /> :
                             kw.change < 0 ? <ArrowDown className="w-3.5 h-3.5" /> :
                             <Minus className="w-3.5 h-3.5" />}
                            {kw.change !== 0 ? `${kw.change > 0 ? '+' : ''}${kw.change}` : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {kw.searchVolume.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium">{kw.trafficPercent}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* GSC Queries Table */}
          {gscConnected && gscQueries.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Requêtes Search Console</h3>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Live
                  </Badge>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Requête</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Impressions</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Position moy.</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">CTR</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gscQueries.map((q, idx) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{q.query}</td>
                        <td className="px-4 py-3 text-right">{q.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{q.position}</td>
                        <td className="px-4 py-3 text-right">{q.ctr}%</td>
                        <td className="px-4 py-3 text-right font-medium">{q.clicks.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== GEO TAB ==================== */}
        <TabsContent value="geo" className="space-y-6 mt-6">
          {/* GEO KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Taux de mention IA</span>
                <Bot className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold">
                {geoMetrics.mentionRate > 0 ? `${geoMetrics.mentionRate}%` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Fréquence de citation dans les réponses IA</p>
              {geoMetrics.mentionRate > 0 && <Progress value={geoMetrics.mentionRate} className="mt-3 h-2" />}
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Part de voix IA</span>
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">
                {geoMetrics.marketShare > 0 ? `${geoMetrics.marketShare}%` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Part par rapport aux concurrents</p>
              {geoMetrics.marketShare > 0 && <Progress value={geoMetrics.marketShare} className="mt-3 h-2" />}
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Sentiment positif</span>
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold">
                {geoMetrics.sentimentPositive > 0 ? `${geoMetrics.sentimentPositive}%` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tonalité des mentions IA</p>
              {geoMetrics.sentimentPositive > 0 && <Progress value={geoMetrics.sentimentPositive} className="mt-3 h-2" />}
            </div>
          </div>

          {/* AI Engine Monitoring */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Monitoring par moteur IA</h3>
              </div>
              <Badge variant="outline" className="text-xs gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Meteoria
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Moteur IA</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Mentions</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Sentiment</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {geoEngineData.map((engine) => (
                    <tr key={engine.engine} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                        {engine.engine}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary">{engine.mentions}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          engine.sentiment === 'positive' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0',
                          engine.sentiment === 'neutral' && 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-0',
                          engine.sentiment === 'negative' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0',
                        )}>
                          {engine.sentiment === 'positive' ? 'Positif' : engine.sentiment === 'neutral' ? 'Neutre' : 'Négatif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={cn(
                          'flex items-center justify-center gap-1 text-sm',
                          engine.trend === 'up' && 'text-emerald-600',
                          engine.trend === 'down' && 'text-red-600',
                          engine.trend === 'stable' && 'text-muted-foreground',
                        )}>
                          {engine.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                           engine.trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                           <Minus className="w-4 h-4" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GEO Info */}
          <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-xl border border-purple-500/20 p-5">
            <div className="flex items-start gap-3">
              <Bot className="w-6 h-6 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Qu'est-ce que le GEO ?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Le <strong>Generative Engine Optimization</strong> (GEO) mesure et optimise la visibilité de votre marque
                  dans les réponses des moteurs IA (ChatGPT, Perplexity, Google SGE, etc.). Contrairement au SEO classique,
                  le GEO se concentre sur la façon dont les IA citent et recommandent votre entreprise.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Les données sont fournies par <strong>Meteoria</strong> — configurez votre projet dans l'Admin pour activer le suivi.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ==================== ACTIONS TAB ==================== */}
        <TabsContent value="actions" className="space-y-6 mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Actions SEO & GEO identifiées</h3>
                <Badge variant="secondary" className="text-xs">{geoRecommendations.length}</Badge>
              </div>
            </div>
            <div className="divide-y divide-border">
              {geoRecommendations.map((action, idx) => (
                <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          action.impact === 'high' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0',
                          action.impact === 'medium' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0',
                          action.impact === 'low' && 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-0',
                        )}>
                          {action.impact === 'high' ? 'Impact fort' : action.impact === 'medium' ? 'Impact moyen' : 'Impact faible'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Effort {action.effort}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{action.source}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs shrink-0 gap-1">
                      <Sparkles className="w-3 h-3" />
                      Planifier
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick wins from reporting */}
          {seoKpis.quickWins > 0 && (
            <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl border border-green-500/20 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-foreground">Quick Wins identifiés</h3>
                <Badge className="bg-green-600 text-white text-xs">{seoKpis.quickWins}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Opportunités d'amélioration rapide détectées par l'analyse SEO automatique.
              </p>
            </div>
          )}

          {/* Health Score */}
          {seoKpis.healthScore > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Score de santé SEO</h3>
                </div>
                <span className={cn(
                  'text-2xl font-bold',
                  seoKpis.healthScore >= 80 ? 'text-green-600' :
                  seoKpis.healthScore >= 60 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {seoKpis.healthScore}%
                </span>
              </div>
              <Progress
                value={seoKpis.healthScore}
                className={cn(
                  'h-2',
                  seoKpis.healthScore >= 80 ? '[&>div]:bg-green-500' :
                  seoKpis.healthScore >= 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                )}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// KPI Card component
function KpiCard({
  icon,
  label,
  value,
  suffix,
  trend,
  isLoading,
  source,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  trend?: 'up' | 'down';
  isLoading: boolean;
  source: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        {icon}
        <Badge variant="outline" className="text-[10px]">{source}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-24 mt-1" />
      ) : (
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold">{typeof value === 'number' && value > 100 ? value.toLocaleString() : value}</span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          {trend && (
            <div className={cn('flex items-center text-sm', trend === 'up' ? 'text-emerald-600' : 'text-red-600')}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
