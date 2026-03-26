import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  Clock,
  Copy,
  Eye,
  FileText,
  Info,
  Image,
  Link,
  Linkedin,
  Mail,
  MoreHorizontal,
  PenLine,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useVisibilityMode } from "@/hooks/useVisibilityMode";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TabDataStatusBanner } from "@/components/data/TabDataStatusBanner";
import { supabase } from "@/integrations/supabase/client";
import { ALL_CLIENTS_ID, useClient } from "@/contexts/ClientContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Channel = "linkedin" | "blog" | "youtube" | "newsletter";
type RangePreset = "7d" | "30d" | "90d" | "custom";
type RecommendationStatus = "active" | "dismissed" | "postponed" | "converted";

type ContentRow = {
  id: string;
  client_id: string;
  channel: Channel;
  title: string;
  body: string | null;
  published_at: string;
  source_url: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  status: string;
};

type MetricsRow = {
  id: string;
  content_id: string;
  measured_at: string;
  impressions: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  engagement_rate: number | null;
  avg_time_on_page: number | null;
  bounce_rate: number | null;
  top_traffic_source: string | null;
  avg_watch_duration: number | null;
  retention_rate: number | null;
  sends: number | null;
  open_rate: number | null;
  click_rate: number | null;
  unsubscribes: number | null;
};

type RecommendationRow = {
  id: string;
  client_id: string;
  channel: Channel;
  title: string;
  rationale: string;
  brief: Record<string, unknown>;
  priority_score: number;
  score_breakdown: Record<string, unknown>;
  context_tags: string[] | null;
  supporting_metrics: Record<string, unknown>;
  status: RecommendationStatus;
};

type ContentItem = {
  content: ContentRow;
  metrics: MetricsRow | null;
};

const channelColors: Record<Channel, { bg: string; text: string; label: string }> = {
  linkedin: { bg: "#EFF6FF", text: "#0A66C2", label: "LinkedIn" },
  blog: { bg: "#ECFDF5", text: "#059669", label: "Blog" },
  youtube: { bg: "#FEF2F2", text: "#DC2626", label: "YouTube" },
  newsletter: { bg: "#F5F3FF", text: "#7C3AED", label: "Newsletter" },
};

function channelIcon(channel: Channel) {
  if (channel === "linkedin") return Linkedin;
  if (channel === "blog") return FileText;
  if (channel === "youtube") return Play;
  return Mail;
}

function mediaTypeIcon(mediaType: string) {
  const normalized = mediaType.toUpperCase();
  if (normalized === "IMAGE") return Image;
  if (normalized === "VIDEO") return Play;
  if (normalized === "ARTICLE") return Link;
  return null;
}

function atMidnight(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatIsoDate(date: Date) {
  return date.toISOString();
}

function toFrenchDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelative(value: string) {
  const now = atMidnight(new Date());
  const target = atMidnight(new Date(value));
  const diff = Math.round((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Il y a 1 jour";
  if (diff <= 7) return `Il y a ${diff} jours`;
  return toFrenchDate(value);
}

function metricNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value;
}

function percentDelta(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export default function Contenus() {
  const queryClient = useQueryClient();
  const { clients, currentClient } = useClient();
  const { isAdmin } = useVisibilityMode();
  const [selectedClientId, setSelectedClientId] = useState<string>(
    isAdmin ? ALL_CLIENTS_ID : (clients[0]?.id ?? ALL_CLIENTS_ID)
  );
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAdmin && selectedClientId === ALL_CLIENTS_ID && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [isAdmin, clients, selectedClientId]);

  const syncLinkedIn = async () => {
    setSyncing(true);
    try {
      const payload = selectedClientId === ALL_CLIENTS_ID ? {} : { clientId: selectedClientId };
      const { error } = await supabase.functions.invoke('fetch-linkedin-posts', { body: payload });
      if (error) throw error;
      toast.success('Content data synced');
      queryClient.invalidateQueries({ queryKey: ["contenus"] });
    } catch (err) {
      console.error('content sync failed:', err);
      toast.error('Content sync failed');
    } finally {
      setSyncing(false);
    }
  };
  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [channel, setChannel] = useState<Channel | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationRow | null>(null);
  const [dismissAnimatingIds, setDismissAnimatingIds] = useState<string[]>([]);
  const [postponedLocal, setPostponedLocal] = useState<RecommendationRow[]>([]);

  const activeClientId = selectedClientId === ALL_CLIENTS_ID ? null : selectedClientId;

  const range = useMemo(() => {
    const end = new Date();
    if (rangePreset === "custom" && customStart && customEnd) {
      const startDate = new Date(`${customStart}T00:00:00.000Z`);
      const endDate = new Date(`${customEnd}T23:59:59.999Z`);
      const dayCount = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return { start: startDate, end: endDate, dayCount };
    }
    const days = rangePreset === "7d" ? 7 : rangePreset === "90d" ? 90 : 30;
    const start = addDays(end, -(days - 1));
    return { start, end, dayCount: days };
  }, [rangePreset, customStart, customEnd]);

  const previousRange = useMemo(() => {
    const prevEnd = addDays(range.start, -1);
    const prevStart = addDays(prevEnd, -(range.dayCount - 1));
    return { start: prevStart, end: prevEnd };
  }, [range.start, range.dayCount]);

  const { data: items = [], isLoading: contentsLoading } = useQuery({
    queryKey: ["contenus", activeClientId, channel, range.start.toISOString(), range.end.toISOString()],
    queryFn: async (): Promise<ContentItem[]> => {
      let query = supabase
        .from("contents")
        .select("id,client_id,channel,title,body,published_at,source_url,tags,metadata,status")
        .eq("status", "published")
        .gte("published_at", formatIsoDate(range.start))
        .lte("published_at", formatIsoDate(range.end))
        .order("published_at", { ascending: false })
        .limit(100);

      if (activeClientId) query = query.eq("client_id", activeClientId);
      if (channel !== "all") query = query.eq("channel", channel);

      const { data: contentRows, error: contentError } = await query;
      if (contentError) throw new Error(contentError.message);
      const typedRows = (contentRows ?? []) as unknown as ContentRow[];
      if (typedRows.length === 0) return [];

      const ids = typedRows.map((row) => row.id);
      const { data: metricsRows, error: metricsError } = await supabase
        .from("content_metrics")
        .select("*")
        .in("content_id", ids)
        .order("measured_at", { ascending: false });

      if (metricsError) throw new Error(metricsError.message);
      const latestByContent = new Map<string, MetricsRow>();
      ((metricsRows ?? []) as unknown as MetricsRow[]).forEach((row) => {
        if (!latestByContent.has(row.content_id)) latestByContent.set(row.content_id, row);
      });

      return typedRows.map((content) => ({
        content,
        metrics: latestByContent.get(content.id) ?? null,
      }));
    },
  });

  const { data: previousItems = [] } = useQuery({
    queryKey: ["contenus-previous", activeClientId, channel, previousRange.start.toISOString(), previousRange.end.toISOString()],
    queryFn: async (): Promise<ContentItem[]> => {
      let query = supabase
        .from("contents")
        .select("id,client_id,channel,title,body,published_at,source_url,tags,metadata,status")
        .eq("status", "published")
        .gte("published_at", formatIsoDate(previousRange.start))
        .lte("published_at", formatIsoDate(previousRange.end))
        .order("published_at", { ascending: false })
        .limit(100);
      if (activeClientId) query = query.eq("client_id", activeClientId);
      if (channel !== "all") query = query.eq("channel", channel);
      const { data: contentRows, error: contentError } = await query;
      if (contentError) return [];
      const typedRows = (contentRows ?? []) as unknown as ContentRow[];
      if (!typedRows.length) return [];

      const { data: metricsRows } = await supabase
        .from("content_metrics")
        .select("*")
        .in("content_id", typedRows.map((row) => row.id))
        .order("measured_at", { ascending: false });
      const latestByContent = new Map<string, MetricsRow>();
      ((metricsRows ?? []) as unknown as MetricsRow[]).forEach((row) => {
        if (!latestByContent.has(row.content_id)) latestByContent.set(row.content_id, row);
      });
      return typedRows.map((content) => ({ content, metrics: latestByContent.get(content.id) ?? null }));
    },
  });

  const { data: detailMetrics = [], isLoading: detailLoading } = useQuery({
    queryKey: ["content-details", selectedContent?.content.id],
    enabled: Boolean(selectedContent?.content.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_metrics")
        .select("*")
        .eq("content_id", selectedContent!.content.id)
        .order("measured_at", { ascending: true })
        .limit(90);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as MetricsRow[];
    },
  });

  const { data: recommendations = [], isLoading: recLoading } = useQuery({
    queryKey: ["content-recommendations", activeClientId],
    queryFn: async (): Promise<RecommendationRow[]> => {
      let query = supabase
        .from("content_recommendations")
        .select("*")
        .eq("status", "active")
        .order("priority_score", { ascending: false })
        .limit(6);
      if (activeClientId) query = query.eq("client_id", activeClientId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as RecommendationRow[];
    },
  });

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const title = item.content.title.toLowerCase();
      const body = (item.content.body ?? "").toLowerCase();
      const tags = (item.content.tags ?? []).join(" ").toLowerCase();
      return title.includes(q) || body.includes(q) || tags.includes(q);
    });
  }, [items, search]);

  const previousSummary = useMemo(() => {
    const published = previousItems.length;
    const impressions = previousItems.reduce((acc, item) => {
      const m = item.metrics;
      return acc + (metricNumber(m?.impressions) > 0 ? metricNumber(m?.impressions) : metricNumber(m?.views));
    }, 0);
    const engagement = previousItems.reduce((acc, item) => acc + metricNumber(item.metrics?.engagement_rate), 0);
    const engagementAvg = previousItems.length > 0 ? engagement / previousItems.length : 0;
    return { published, impressions, engagementAvg };
  }, [previousItems]);

  const summary = useMemo(() => {
    const published = filteredItems.length;
    const impressions = filteredItems.reduce((acc, item) => {
      const m = item.metrics;
      return acc + (metricNumber(m?.impressions) > 0 ? metricNumber(m?.impressions) : metricNumber(m?.views));
    }, 0);
    const engagement = filteredItems.reduce((acc, item) => acc + metricNumber(item.metrics?.engagement_rate), 0);
    const engagementAvg = filteredItems.length > 0 ? engagement / filteredItems.length : 0;
    const bestContent = [...filteredItems].sort(
      (a, b) => metricNumber(b.metrics?.engagement_rate) - metricNumber(a.metrics?.engagement_rate),
    )[0];
    return {
      published,
      impressions,
      engagementAvg,
      bestContent,
      deltaPublished: percentDelta(published, previousSummary.published),
      deltaImpressions: percentDelta(impressions, previousSummary.impressions),
      deltaEngagement: percentDelta(engagementAvg, previousSummary.engagementAvg),
    };
  }, [filteredItems, previousSummary]);

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_recommendations")
        .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content-recommendations"] }),
  });

  const postponeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_recommendations")
        .update({ status: "postponed" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_recommendations")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content-recommendations"] }),
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("generate-recommendations", {
        body: { client_id: activeClientId },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["content-recommendations"] });
      toast.success("Suggestions refreshed");
    },
    onError: (error: Error) => {
      toast.error(`Refresh failed: ${error.message}`);
    },
  });

  const visibleRecommendations = useMemo(() => {
    return recommendations.filter((rec) => !dismissAnimatingIds.includes(rec.id) && !postponedLocal.some((p) => p.id === rec.id));
  }, [recommendations, dismissAnimatingIds, postponedLocal]);

  const engagementSeries = useMemo(() => {
    const buckets = new Map<string, Record<string, any>>();
    filteredItems.forEach((item) => {
      const date = new Date(item.content.published_at);
      const key = range.dayCount <= 7 ? toFrenchDate(item.content.published_at) : `${date.getDate()}/${date.getMonth() + 1}`;
      if (!buckets.has(key)) {
        buckets.set(key, {
          name: key,
          linkedinVolume: 0,
          blogVolume: 0,
          youtubeVolume: 0,
          newsletterVolume: 0,
          linkedinEngagement: 0,
          blogEngagement: 0,
          youtubeEngagement: 0,
          newsletterEngagement: 0,
          linkedinCount: 0,
          blogCount: 0,
          youtubeCount: 0,
          newsletterCount: 0,
        });
      }
      const row = buckets.get(key)!;
      const c = item.content.channel;
      const e = metricNumber(item.metrics?.engagement_rate);
      row[`${c}Volume`] += 1;
      row[`${c}Engagement`] += e;
      row[`${c}Count`] += 1;
    });

    return Array.from(buckets.values()).map((row) => ({
      name: row.name,
      linkedinVolume: row.linkedinVolume,
      blogVolume: row.blogVolume,
      youtubeVolume: row.youtubeVolume,
      newsletterVolume: row.newsletterVolume,
      linkedinEngagement: row.linkedinCount > 0 ? row.linkedinEngagement / row.linkedinCount : 0,
      blogEngagement: row.blogCount > 0 ? row.blogEngagement / row.blogCount : 0,
      youtubeEngagement: row.youtubeCount > 0 ? row.youtubeEngagement / row.youtubeCount : 0,
      newsletterEngagement: row.newsletterCount > 0 ? row.newsletterEngagement / row.newsletterCount : 0,
    }));
  }, [filteredItems, range.dayCount]);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients],
  );

  const detailsChartData = detailMetrics.map((row) => ({
    date: new Date(row.measured_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    impressions: metricNumber(row.impressions) > 0 ? metricNumber(row.impressions) : metricNumber(row.views),
    engagement: metricNumber(row.engagement_rate),
  }));

  const recBrief = asObject(selectedRecommendation?.brief);
  const recBreakdown = asObject(selectedRecommendation?.score_breakdown);
  const recMetrics = asObject(selectedRecommendation?.supporting_metrics);
  const recKeyPoints = Array.isArray(recBrief.key_points) ? (recBrief.key_points as string[]) : [];
  const recReferences = Array.isArray(recBrief.references) ? (recBrief.references as string[]) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Contenus & Performances</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Derniers contenus publiés et performance par canal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button variant="outline" className="gap-2" onClick={syncLinkedIn} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Contenus'}
            </Button>
          )}
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && <SelectItem value={ALL_CLIENTS_ID}>Admin (tous les clients)</SelectItem>}
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rangePreset} onValueChange={(v) => setRangePreset(v as RangePreset)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7j</SelectItem>
              <SelectItem value="30d">30j</SelectItem>
              <SelectItem value="90d">90j</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>
          {rangePreset === "custom" && (
            <>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-[160px]" />
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-[160px]" />
            </>
          )}
        </div>
      </div>

      <TabDataStatusBanner tab="content" />

      <Tabs value={channel} onValueChange={(v) => setChannel(v as Channel | "all")}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={FileText}
          label="Contenus publiés"
          value={summary.published.toLocaleString()}
          delta={summary.deltaPublished}
        />
        <KpiCard
          icon={Eye}
          label="Impressions totales"
          value={summary.impressions.toLocaleString()}
          delta={summary.deltaImpressions}
        />
        <KpiCard
          icon={TrendingUp}
          label="Engagement moyen"
          value={`${summary.engagementAvg.toFixed(2)}%`}
          delta={summary.deltaEngagement}
        />
        <KpiCard
          icon={Award}
          label="Meilleur contenu"
          value={summary.bestContent ? summary.bestContent.content.title : "NA"}
          subValue={summary.bestContent ? channelColors[summary.bestContent.content.channel].label : "Aucun"}
          delta={0}
        />
      </div>

      <div className="flex gap-3 items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un contenu, tag, accroche..."
          className="max-w-md"
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Feed des contenus</h2>
        {contentsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center space-y-3">
            <p className="font-medium">Aucun contenu publié sur cette période</p>
            <p className="text-sm text-muted-foreground">Les 100 derniers contenus seront chargés ici dès synchronisation.</p>
            <Button variant="outline" disabled>Ajouter un contenu</Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <ContentFeedCard
                key={item.content.id}
                item={item}
                showClient={selectedClientId === ALL_CLIENTS_ID}
                clientName={clientNameById.get(item.content.client_id) ?? item.content.client_id}
                onOpenDetails={() => setSelectedContent(item)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h3 className="font-semibold text-amber-900">Next Best Actions</h3>
            </div>
            <p className="text-sm text-amber-800/80 mt-1">
              Contenus recommandés par l&apos;IA, basés sur vos performances et votre calendrier éditorial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-xs">
              <Zap className="w-3 h-3" />
              Powered by Claude
            </Badge>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
              <RefreshCw className={cn("w-4 h-4", refreshMutation.isPending && "animate-spin")} />
              Rafraichir les suggestions
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-sm">
                  <p>Score = Performance passee (30%) + Fraicheur pilier (25%) + Tendance (20%) + Calendrier (15%) + Diversite canal (10%).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {recLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <p className="text-sm text-muted-foreground">L&apos;IA analyse vos donnees...</p>
          </div>
        ) : visibleRecommendations.length === 0 && postponedLocal.length === 0 ? (
          <div className="bg-white/70 border border-amber-200 rounded-lg p-6 text-center text-sm text-amber-900/80">
            Pas de recommandations pour l&apos;instant. Publiez plus de contenus pour que l&apos;IA puisse analyser vos performances.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRecommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                priorityIndex={index + 1}
                dimmed={false}
                dismissing={dismissAnimatingIds.includes(rec.id)}
                onCreate={() => {
                  setSelectedRecommendation(rec);
                  convertMutation.mutate(rec.id);
                }}
                onIgnore={() => {
                  setDismissAnimatingIds((prev) => [...prev, rec.id]);
                  window.setTimeout(() => {
                    dismissMutation.mutate(rec.id);
                    setDismissAnimatingIds((prev) => prev.filter((id) => id !== rec.id));
                  }, 260);
                }}
                onLater={() => {
                  setPostponedLocal((prev) => [...prev, { ...rec, status: "postponed" }]);
                  postponeMutation.mutate(rec.id);
                }}
                onDetails={() => setSelectedRecommendation(rec)}
              />
            ))}
            {postponedLocal.map((rec, index) => (
              <RecommendationCard
                key={`postponed-${rec.id}`}
                recommendation={rec}
                priorityIndex={visibleRecommendations.length + index + 1}
                dimmed={true}
                dismissing={false}
                onCreate={() => setSelectedRecommendation(rec)}
                onIgnore={() => {}}
                onLater={() => {}}
                onDetails={() => setSelectedRecommendation(rec)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Volume de publication</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="linkedinVolume" stackId="a" fill={channelColors.linkedin.text} name="LinkedIn" />
                <Bar dataKey="blogVolume" stackId="a" fill={channelColors.blog.text} name="Blog" />
                <Bar dataKey="youtubeVolume" stackId="a" fill={channelColors.youtube.text} name="YouTube" />
                <Bar dataKey="newsletterVolume" stackId="a" fill={channelColors.newsletter.text} name="Newsletter" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Engagement par canal</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="linkedinEngagement" stroke={channelColors.linkedin.text} name="LinkedIn" />
                <Line type="monotone" dataKey="blogEngagement" stroke={channelColors.blog.text} name="Blog" />
                <Line type="monotone" dataKey="youtubeEngagement" stroke={channelColors.youtube.text} name="YouTube" />
                <Line type="monotone" dataKey="newsletterEngagement" stroke={channelColors.newsletter.text} name="Newsletter" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Sheet open={Boolean(selectedContent)} onOpenChange={(open) => !open && setSelectedContent(null)}>
        <SheetContent className="w-[92vw] sm:max-w-2xl overflow-y-auto">
          {selectedContent && (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle>{selectedContent.content.title}</SheetTitle>
              </SheetHeader>
              <p className="text-sm text-muted-foreground">{selectedContent.content.body || "Aucun texte detaille disponible."}</p>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Evolution sur 7 jours</h4>
                <div className="h-[220px]">
                  {detailLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={detailsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="impressions" stroke="#2563EB" />
                        <Line type="monotone" dataKey="engagement" stroke="#F59E0B" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <tbody>
                    <MetricRow label="Impressions" value={metricNumber(selectedContent.metrics?.impressions) || metricNumber(selectedContent.metrics?.views)} />
                    <MetricRow label="Likes" value={metricNumber(selectedContent.metrics?.likes)} />
                    <MetricRow label="Commentaires" value={metricNumber(selectedContent.metrics?.comments)} />
                    <MetricRow label="Partages" value={metricNumber(selectedContent.metrics?.shares)} />
                    <MetricRow label="Engagement" value={`${metricNumber(selectedContent.metrics?.engagement_rate).toFixed(2)}%`} />
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                {selectedContent.content.source_url ? (
                  <Button asChild>
                    <a href={selectedContent.content.source_url} target="_blank" rel="noreferrer">
                      Voir la source
                    </a>
                  </Button>
                ) : (
                  <Button disabled>Voir la source</Button>
                )}
                <Button variant="outline" disabled>Creer un contenu similaire</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedRecommendation)} onOpenChange={(open) => !open && setSelectedRecommendation(null)}>
        <SheetContent className="w-[92vw] sm:max-w-xl overflow-y-auto">
          {selectedRecommendation && (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle>Brief de contenu</SheetTitle>
              </SheetHeader>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Canal:</span>
                  <Badge style={{ backgroundColor: channelColors[selectedRecommendation.channel].bg, color: channelColors[selectedRecommendation.channel].text }}>
                    {channelColors[selectedRecommendation.channel].label}
                  </Badge>
                </div>
                <p><span className="text-muted-foreground">Client:</span> {clientNameById.get(selectedRecommendation.client_id) ?? selectedRecommendation.client_id}</p>
                <p><span className="text-muted-foreground">Titre suggere:</span> {selectedRecommendation.title}</p>
                <p><span className="text-muted-foreground">Angle:</span> {String(recBrief.angle ?? "NA")}</p>
                <div>
                  <p className="text-muted-foreground mb-1">Points cles:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {recKeyPoints.length > 0 ? recKeyPoints.map((point) => <li key={point}>{point}</li>) : <li>NA</li>}
                  </ul>
                </div>
                <p><span className="text-muted-foreground">Ton recommande:</span> {String(recBrief.tone ?? "NA")}</p>
                <p><span className="text-muted-foreground">Longueur suggeree:</span> {String(recBrief.suggested_length ?? "NA")}</p>
                <p><span className="text-muted-foreground">CTA suggere:</span> {String(recBrief.suggested_cta ?? "NA")}</p>
                <div>
                  <p className="text-muted-foreground mb-1">References:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {recReferences.length > 0 ? recReferences.map((ref) => <li key={ref}>{ref}</li>) : <li>NA</li>}
                  </ul>
                </div>
              </div>
              <Separator />
              <div className="rounded-lg border p-3 text-xs text-muted-foreground space-y-1">
                <p>Performance passee: {String(recBreakdown.past_performance ?? "NA")}</p>
                <p>Fraicheur pilier: {String(recBreakdown.pillar_freshness ?? "NA")}</p>
                <p>Tendance: {String(recBreakdown.trend ?? "NA")}</p>
                <p>Calendrier: {String(recBreakdown.calendar ?? "NA")}</p>
                <p>Diversite canal: {String(recBreakdown.diversity ?? "NA")}</p>
                <p>Metriques d'appui: {JSON.stringify(recMetrics)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const text = JSON.stringify(recBrief, null, 2);
                    navigator.clipboard.writeText(text);
                    toast.success("Brief copie");
                  }}
                >
                  <Copy className="w-4 h-4" />
                  Copier le brief
                </Button>
                <Button disabled>Ouvrir dans l'editeur</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delta: number;
  subValue?: string;
}) {
  const positive = delta >= 0;
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-xl font-bold mt-2 line-clamp-2">{value}</p>
      {subValue ? <p className="text-xs text-muted-foreground mt-1">{subValue}</p> : null}
      <Badge className={cn("mt-2", positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
        {positive ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
      </Badge>
    </div>
  );
}

function ContentFeedCard({
  item,
  showClient,
  clientName,
  onOpenDetails,
}: {
  item: ContentItem;
  showClient: boolean;
  clientName: string;
  onOpenDetails: () => void;
}) {
  const channel = item.content.channel;
  const colors = channelColors[channel];
  const Icon = channelIcon(channel);
  const metrics = item.metrics;
  const metadata = asObject(item.content.metadata);
  const mediaType = String(metadata.media_type ?? "TEXT").toUpperCase();
  const MediaIcon = mediaTypeIcon(mediaType);
  const visibleTags = channel === "linkedin" ? (item.content.tags ?? []).slice(0, 3) : (item.content.tags ?? []);

  return (
    <article className="bg-card border rounded-xl p-4 transition-colors hover:bg-muted/20">
      <div className="flex flex-col xl:flex-row xl:items-start gap-4">
        <div className="min-w-[170px] space-y-2">
          <div className="flex items-center gap-1.5">
            <Badge style={{ backgroundColor: colors.bg, color: colors.text }} className="gap-1">
              <Icon className="w-3 h-3" />
              {colors.label}
            </Badge>
            {channel === "linkedin" && MediaIcon ? (
              <Badge variant="outline" className="gap-1">
                <MediaIcon className="w-3 h-3" />
                {mediaType}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{formatRelative(item.content.published_at)}</p>
          {showClient && <p className="text-xs text-muted-foreground">{clientName}</p>}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold line-clamp-2">{item.content.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.content.body || "Aucun apercu disponible."}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {visibleTags.map((tag) => (
              <Badge key={`${item.content.id}-${tag}`} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="xl:min-w-[360px]">
          <InlineMetrics channel={channel} metrics={metrics} />
        </div>

        <div className="flex items-center gap-2">
          {item.content.source_url ? (
            <Button asChild variant="outline" size="sm">
              <a href={item.content.source_url} target="_blank" rel="noreferrer">Voir</a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>Voir</Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenDetails}>Voir les details</DropdownMenuItem>
              <DropdownMenuItem>Dupliquer</DropdownMenuItem>
              <DropdownMenuItem>Archiver</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}

function InlineMetrics({ channel, metrics }: { channel: Channel; metrics: MetricsRow | null }) {
  const m = metrics;
  const entry = (label: string, value: string | number) => (
    <div className="text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );

  if (!m) {
    return <p className="text-sm text-muted-foreground">NA</p>;
  }

  if (channel === "linkedin") {
    return (
      <div className="grid grid-cols-5 gap-2">
        {entry("Impressions", metricNumber(m.impressions).toLocaleString())}
        {entry("Likes", metricNumber(m.likes))}
        {entry("Commentaires", metricNumber(m.comments))}
        {entry("Partages", metricNumber(m.shares))}
        {entry("Engagement", `${metricNumber(m.engagement_rate).toFixed(2)}%`)}
      </div>
    );
  }
  if (channel === "blog") {
    return (
      <div className="grid grid-cols-4 gap-2">
        {entry("Vues", metricNumber(m.views).toLocaleString())}
        {entry("Temps moyen", `${metricNumber(m.avg_time_on_page)}s`)}
        {entry("Taux rebond", `${metricNumber(m.bounce_rate).toFixed(2)}%`)}
        {entry("Source", m.top_traffic_source ?? "NA")}
      </div>
    );
  }
  if (channel === "youtube") {
    return (
      <div className="grid grid-cols-5 gap-2">
        {entry("Vues", metricNumber(m.views).toLocaleString())}
        {entry("Duree moy", `${metricNumber(m.avg_watch_duration)}s`)}
        {entry("Likes", metricNumber(m.likes))}
        {entry("Commentaires", metricNumber(m.comments))}
        {entry("Retention", `${metricNumber(m.retention_rate).toFixed(2)}%`)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {entry("Envois", metricNumber(m.sends))}
      {entry("Ouverture", `${metricNumber(m.open_rate).toFixed(2)}%`)}
      {entry("Clic", `${metricNumber(m.click_rate).toFixed(2)}%`)}
      {entry("Desabo", metricNumber(m.unsubscribes))}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  priorityIndex,
  dimmed,
  dismissing,
  onCreate,
  onIgnore,
  onLater,
  onDetails,
}: {
  recommendation: RecommendationRow;
  priorityIndex: number;
  dimmed: boolean;
  dismissing: boolean;
  onCreate: () => void;
  onIgnore: () => void;
  onLater: () => void;
  onDetails: () => void;
}) {
  const color = channelColors[recommendation.channel];
  const Icon = channelIcon(recommendation.channel);
  const supporting = asObject(recommendation.supporting_metrics);

  return (
    <div
      className={cn(
        "bg-white/80 border rounded-lg p-3 transition-all",
        dimmed && "opacity-60",
        dismissing && "translate-x-4 opacity-0",
      )}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[110px_1fr_240px_220px] gap-3 items-start">
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">
            {priorityIndex}
          </div>
          <Badge style={{ backgroundColor: color.bg, color: color.text }} className="gap-1">
            <Icon className="w-3 h-3" />
            {color.label}
          </Badge>
          <p className="text-xs text-muted-foreground">Score: {recommendation.priority_score}/100</p>
        </div>
        <div>
          <p className="font-semibold">{recommendation.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{recommendation.rationale}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(recommendation.context_tags ?? []).map((tag) => (
              <Badge key={`${recommendation.id}-${tag}`} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          {Object.entries(supporting).slice(0, 3).map(([key, value]) => (
            <p key={key}>{key.replace(/_/g, " ")}: {String(value)}</p>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button className="gap-2" size="sm" onClick={onCreate}>
            <PenLine className="w-4 h-4" />
            Creer ce contenu
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={onIgnore}>
            <X className="w-4 h-4" />
            Ignorer
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={onLater}>
            <Clock className="w-4 h-4" />
            Plus tard
          </Button>
          <Button variant="link" size="sm" className="justify-start px-0" onClick={onDetails}>
            Voir les details
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-2 text-muted-foreground">{label}</td>
      <td className="px-3 py-2 text-right font-medium">{value}</td>
    </tr>
  );
}

