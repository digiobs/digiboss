import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Newspaper,
  ExternalLink,
  Search,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Info,
  Eye,
  Zap,
  Shield,
  BarChart3,
  Globe,
  Users,
  Megaphone,
  MessageCircle,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useVeilleItems } from '@/hooks/useVeilleItems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Severity config
const severityConfig: Record<string, { label: string; icon: typeof AlertTriangle; className: string }> = {
  alert: { label: 'Alerte', icon: AlertTriangle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  warning: { label: 'Attention', icon: AlertCircle, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  opportunity: { label: 'Opportunite', icon: TrendingUp, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  info: { label: 'Info', icon: Info, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

// Skill config
const skillConfig: Record<string, { label: string; icon: typeof Globe }> = {
  veille: { label: 'Veille', icon: Eye },
  market_intelligence: { label: 'Market Intel', icon: Zap },
  seo: { label: 'SEO', icon: Globe },
  ads: { label: 'Ads', icon: Megaphone },
  social: { label: 'Social', icon: MessageCircle },
  concurrence: { label: 'Concurrence', icon: Users },
  reputation: { label: 'Reputation', icon: Shield },
  compliance: { label: 'Compliance', icon: Scale },
};

function getSkillConfig(skill: string) {
  return skillConfig[skill] ?? { label: skill, icon: BarChart3 };
}

function getSeverityConfig(severity: string) {
  return severityConfig[severity] ?? severityConfig.info;
}

export default function Veille() {
  const { clients } = useClient();
  const { isAdmin } = useVisibilityMode();
  const [selectedClientId, setSelectedClientId] = useState<string>(
    isAdmin ? ALL_CLIENTS_ID : (clients[0]?.id ?? ALL_CLIENTS_ID)
  );
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAdmin && selectedClientId === ALL_CLIENTS_ID && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [isAdmin, clients, selectedClientId]);

  const syncMarketNews = async () => {
    setSyncing(true);
    try {
      const payload = selectedClientId === ALL_CLIENTS_ID ? {} : { clientId: selectedClientId };
      const { error } = await supabase.functions.invoke('market-news', { body: payload });
      if (error) throw error;
      toast.success('Veille data synced');
      window.location.reload();
    } catch (error) {
      console.error('market-news sync failed:', error);
      toast.error('Sync veille failed');
    } finally {
      setSyncing(false);
    }
  };

  const clientFilter = selectedClientId === ALL_CLIENTS_ID ? null : selectedClientId;
  const { data: items = [], isLoading } = useVeilleItems({
    clientId: clientFilter,
    skill: selectedSkill,
    severity: selectedSeverity,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.source?.toLowerCase().includes(q) ||
        item.skill.toLowerCase().includes(q) ||
        item.clients?.name?.toLowerCase().includes(q)
    );
  }, [items, search]);

  // Stats
  const stats = useMemo(() => {
    const alerts = items.filter((i) => i.severity === 'alert').length;
    const opportunities = items.filter((i) => i.severity === 'opportunity').length;
    const actionable = items.filter((i) => i.is_actionable).length;
    return { total: items.length, alerts, opportunities, actionable };
  }, [items]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Veille</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Signaux marche, alertes concurrentielles et opportunites detectes par les skills DigiObs.
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" className="gap-2" onClick={syncMarketNews} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Veille'}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total signaux</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-red-500">Alertes</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold text-red-600">{stats.alerts}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-emerald-500">Opportunites</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold text-emerald-600">{stats.opportunities}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-amber-500">Actionnables</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold text-amber-600">{stats.actionable}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            {isAdmin && <SelectItem value={ALL_CLIENTS_ID}>Admin (tous les clients)</SelectItem>}
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSkill} onValueChange={setSelectedSkill}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Skill" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les skills</SelectItem>
            {Object.entries(skillConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Severite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes severites</SelectItem>
            {Object.entries(severityConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un signal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement de la veille...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun signal</h3>
          <p className="text-muted-foreground">
            {search ? 'Aucun signal ne correspond a votre recherche.' : 'Aucun signal pour cette selection.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead className="w-[120px]">Skill</TableHead>
                <TableHead className="w-[120px]">Severite</TableHead>
                <TableHead className="w-[140px]">Client</TableHead>
                <TableHead className="w-[80px]">Score</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const sev = getSeverityConfig(item.severity);
                const SevIcon = sev.icon;
                const sk = getSkillConfig(item.skill);
                const SkillIcon = sk.icon;
                const score = (item.details as Record<string, unknown> | null)?.score;
                const isExpanded = expandedId === item.id;

                return (
                  <TableRow
                    key={item.id}
                    className={cn('cursor-pointer', isExpanded && 'bg-muted/40')}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), 'dd MMM', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          {item.is_actionable && (
                            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="font-medium text-foreground line-clamp-1">
                            {item.title}
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {item.summary}
                            </p>
                            {item.source && (
                              <p className="text-xs text-muted-foreground">
                                Source:{' '}
                                {item.source_url ? (
                                  <a
                                    href={item.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-foreground transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {item.source}
                                    <ExternalLink className="w-3 h-3 inline ml-1 -mt-0.5" />
                                  </a>
                                ) : (
                                  item.source
                                )}
                              </p>
                            )}
                            {(item.details as Record<string, unknown> | null)?.keywords && (
                              <div className="flex flex-wrap gap-1">
                                {(
                                  (item.details as Record<string, unknown>).keywords as string[]
                                ).map((kw) => (
                                  <Badge key={kw} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <SkillIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs">{sk.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={sev.className}>
                        <SevIcon className="w-3 h-3 mr-1" />
                        {sev.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.clients?.name ?? item.client_id}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {typeof score === 'number' ? `${score}/100` : '—'}
                    </TableCell>
                    <TableCell>
                      {item.source_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
