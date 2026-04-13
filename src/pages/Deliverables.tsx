import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FileCheck,
  ExternalLink,
  Search,
  FileText,
  BarChart3,
  PenLine,
  Globe,
  Newspaper,
  Zap,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useDeliverables, getDeliverableUrl, type Deliverable } from '@/hooks/useDeliverables';

const typeConfig: Record<string, { label: string; icon: typeof FileText; className: string }> = {
  'seo-strategy': { label: 'SEO Strategy', icon: Globe, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'analyse-pmf': { label: 'Analyse PMF', icon: BarChart3, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'rapport-performance': { label: 'Rapport Performance', icon: BarChart3, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  'content-post': { label: 'Post', icon: PenLine, className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  'content-article': { label: 'Article', icon: FileText, className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  'veille': { label: 'Veille', icon: Newspaper, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'orchestrateur': { label: 'Orchestrateur', icon: Zap, className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
  'campagne': { label: 'Campagne', icon: Layers, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  'audit-seo': { label: 'Audit SEO', icon: Globe, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'architecture-site': { label: 'Architecture Site', icon: Layers, className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

function getTypeConfig(type: string) {
  return typeConfig[type] ?? { label: type, icon: FileText, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' };
}

const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

export default function Deliverables() {
  const { clients, currentClient, setCurrentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const selectedClientId = currentClient?.id ?? ALL_CLIENTS_ID;
  const [selectedType, setSelectedType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const clientFilter = isAllClientsSelected ? null : (currentClient?.id ?? null);
  const { data: deliverables = [], isLoading, refetch } = useDeliverables({ clientId: clientFilter, type: selectedType });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return deliverables;
    const q = search.toLowerCase();
    return deliverables.filter(
      (d) =>
        d.title?.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.skill_name?.toLowerCase().includes(q) ||
        d.clients?.name?.toLowerCase().includes(q)
    );
  }, [deliverables, search]);

  // Stats
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deliverables.forEach((d) => {
      counts[d.type] = (counts[d.type] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [deliverables]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    deliverables.forEach((d) => types.add(d.type));
    return Array.from(types).sort();
  }, [deliverables]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Livrables</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Tous les outputs produits par les skills DigiObs — rapports, audits, contenus, analyses.
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold">{deliverables.length}</p>
          </CardContent>
        </Card>
        {typeCounts.slice(0, 3).map(([type, count]) => {
          const config = getTypeConfig(type);
          return (
            <Card key={type} className="border-border/60">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">{config.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-2xl font-semibold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={selectedClientId}
          onValueChange={(id) => {
            const c = id === ALL_CLIENTS_ID ? ALL_CLIENTS_CLIENT : clients.find((cl) => cl.id === id) ?? null;
            setCurrentClient(c);
          }}
        >
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
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {uniqueTypes.map((t) => (
              <SelectItem key={t} value={t}>{getTypeConfig(t).label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un livrable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement des livrables...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun livrable</h3>
          <p className="text-muted-foreground">
            {search ? 'Aucun livrable ne correspond a votre recherche.' : 'Aucun livrable pour cette selection.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const config = getTypeConfig(d.type);
                const Icon = config.icon;
                const destination = getDeliverableUrl(d);
                const openDestination = () => {
                  if (destination) {
                    window.open(destination.url, '_blank', 'noopener,noreferrer');
                  }
                };
                return (
                  <TableRow
                    key={d.id}
                    className={destination ? 'cursor-pointer' : undefined}
                    onClick={destination ? openDestination : undefined}
                    title={destination ? `Ouvrir dans ${destination.label}` : undefined}
                  >
                    <TableCell className="text-sm">
                      {format(new Date(d.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground line-clamp-1">
                          {d.title ?? d.filename ?? d.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={config.className}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.clients?.name ?? d.client_id}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {d.skill_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[d.status] ?? statusColors.draft}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {destination && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={destination.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Ouvrir dans ${destination.label}`}
                          >
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
