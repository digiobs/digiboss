import { memo, useEffect, useMemo, useState } from 'react';
import { format, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ScrollText,
  ExternalLink,
  Search,
  Newspaper,
  Video,
  Sparkles,
  CalendarDays,
  FileCheck,
  CheckSquare,
  RefreshCw,
  Database,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useJournal, type JournalEntry, type JournalSource } from '@/hooks/useJournal';

interface SourceConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const SOURCE_CONFIG: Record<JournalSource, SourceConfig> = {
  veille: {
    label: 'Veille',
    icon: Newspaper,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  meeting: {
    label: 'Réunion',
    icon: Video,
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  proposal: {
    label: 'Proposition',
    icon: Sparkles,
    className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  },
  editorial: {
    label: 'Contenu',
    icon: CalendarDays,
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  deliverable: {
    label: 'Livrable',
    icon: FileCheck,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  task: {
    label: 'Tâche',
    icon: CheckSquare,
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
};

const SOURCES: JournalSource[] = ['veille', 'meeting', 'proposal', 'editorial', 'deliverable', 'task'];

function dayLabel(ts: number): string {
  const date = new Date(ts);
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return 'Hier';
  const diff = differenceInCalendarDays(new Date(), date);
  if (diff < 7) return format(date, 'EEEE', { locale: fr });
  return format(date, 'EEEE d MMMM yyyy', { locale: fr });
}

function dayKey(ts: number): string {
  return format(new Date(ts), 'yyyy-MM-dd');
}

/** How many entries to render before showing a "Show more" button. Rendering
 *  hundreds of rows synchronously is the main culprit for a slow journal. */
const PAGE_SIZE = 60;

export default function Journal() {
  const { clients, currentClient, setCurrentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const selectedClientId = currentClient?.id ?? ALL_CLIENTS_ID;

  const [selectedSources, setSelectedSources] = useState<JournalSource[]>(SOURCES);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  const clientFilter = isAllClientsSelected ? null : currentClient?.id ?? null;
  const { entries, countsBySource, isLoading, refetch } = useJournal({ clientId: clientFilter });

  // Reset pagination whenever filters/search change — otherwise the user could
  // land on a paginated view that's already past the end of the filtered list.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedSources, search, clientFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const { data, error } = await supabase.functions.invoke('index-deliverables', { body: {} });
      if (error) throw error;
      const payload = data as {
        indexed?: number;
        updated?: number;
        skipped?: number;
        errors?: Array<{ path: string; error: string }>;
      } | null;
      const indexed = payload?.indexed ?? 0;
      const updated = payload?.updated ?? 0;
      const skipped = payload?.skipped ?? 0;
      const errorCount = payload?.errors?.length ?? 0;
      toast.success(
        `Réindexation : ${indexed} nouveaux, ${updated} mis à jour, ${skipped} ignorés${
          errorCount ? `, ${errorCount} erreurs` : ''
        }`,
      );
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Échec de la réindexation : ${msg}`);
    } finally {
      setReindexing(false);
    }
  };

  const filtered = useMemo(() => {
    const selectedSet = new Set(selectedSources);
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (!selectedSet.has(e.source)) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.subtitle?.toLowerCase().includes(q) ||
        e.client_name?.toLowerCase().includes(q) ||
        e.badge?.toLowerCase().includes(q)
      );
    });
  }, [entries, selectedSources, search]);

  const totalFiltered = filtered.length;
  const hasMore = visibleCount < totalFiltered;

  // Group only the *visible* slice — this is the single biggest perf win:
  // a fresh tab shows ~60 rows instead of ~900, and grouping stays cheap.
  const grouped = useMemo(() => {
    const groups: Array<{ key: string; label: string; entries: JournalEntry[] }> = [];
    const limit = Math.min(visibleCount, filtered.length);
    let currentKey = '';
    for (let i = 0; i < limit; i++) {
      const entry = filtered[i];
      const key = dayKey(entry.occurred_ts);
      if (key !== currentKey) {
        groups.push({ key, label: dayLabel(entry.occurred_ts), entries: [entry] });
        currentKey = key;
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [filtered, visibleCount]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Journal</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Toutes les actions réalisées sur le compte, par ordre chronologique — veille, réunions,
            contenus, livrables, tâches.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleReindex}
              disabled={reindexing || refreshing}
              title="Balayer Supabase Storage + OneDrive et réenregistrer les livrables"
            >
              <Database className={`w-4 h-4 ${reindexing ? 'animate-pulse' : ''}`} />
              {reindexing ? 'Réindexation...' : 'Réindexer livrables'}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={refreshing || reindexing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </div>
        )}
      </div>

      {/* Stats cards — counts per source */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SOURCES.map((src) => {
          const cfg = SOURCE_CONFIG[src];
          const Icon = cfg.icon;
          return (
            <Card key={src} className="border-border/60">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-2xl font-semibold">{countsBySource[src]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selectedClientId}
          onValueChange={(id) => {
            const c =
              id === ALL_CLIENTS_ID
                ? ALL_CLIENTS_CLIENT
                : clients.find((cl) => cl.id === id) ?? null;
            setCurrentClient(c);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            {isAdmin && <SelectItem value={ALL_CLIENTS_ID}>Admin (tous les clients)</SelectItem>}
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          type="multiple"
          value={selectedSources}
          onValueChange={(v) => {
            if (v.length === 0) return;
            setSelectedSources(v as JournalSource[]);
          }}
          className="flex-wrap"
        >
          {SOURCES.map((src) => {
            const cfg = SOURCE_CONFIG[src];
            const Icon = cfg.icon;
            return (
              <ToggleGroupItem key={src} value={src} className="gap-1.5 data-[state=on]:bg-primary/10">
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans le journal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement du journal...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <ScrollText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune activité</h3>
          <p className="text-muted-foreground">
            {search
              ? 'Aucune entrée ne correspond à votre recherche.'
              : 'Aucune activité pour cette sélection.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.key} className="space-y-2">
              <h2 className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider text-muted-foreground py-1">
                {group.label}
              </h2>
              <div className="space-y-1">
                {group.entries.map((entry) => (
                  <JournalRow key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Afficher plus ({totalFiltered - visibleCount} restantes)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const JournalRow = memo(function JournalRow({ entry }: { entry: JournalEntry }) {
  const cfg = SOURCE_CONFIG[entry.source];
  const Icon = cfg.icon;
  const time = format(new Date(entry.occurred_ts), 'HH:mm', { locale: fr });
  const clickable = Boolean(entry.href);

  const body = (
    <>
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.className}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{entry.title}</p>
          {entry.badge && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {entry.badge}
            </Badge>
          )}
          {clickable && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span className="font-mono">{time}</span>
          <span>·</span>
          <span>{cfg.label}</span>
          {entry.subtitle && (
            <>
              <span>·</span>
              <span className="truncate">{entry.subtitle}</span>
            </>
          )}
          {entry.client_name && (
            <>
              <span>·</span>
              <span className="truncate">{entry.client_name}</span>
            </>
          )}
        </div>
      </div>
    </>
  );

  const commonClasses =
    'flex items-center gap-3 rounded-md border border-transparent px-3 py-2 transition-colors';

  if (clickable) {
    return (
      <a
        href={entry.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${commonClasses} hover:border-border hover:bg-muted/50 cursor-pointer`}
      >
        {body}
      </a>
    );
  }

  return <div className={commonClasses}>{body}</div>;
});
