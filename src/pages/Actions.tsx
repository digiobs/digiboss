import { useMemo, useState } from 'react';
import {
  CheckSquare,
  Search,
  Palette,
  Share2,
  Target,
  FileText,
  Newspaper,
  MoreHorizontal,
  CalendarDays,
  RefreshCw,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import {
  useMonthlyActions,
  useUpdateActionStatus,
  currentPeriod,
} from '@/hooks/useMonthlyActions';
import { CreateTaskDialog } from '@/components/plan/CreateTaskDialog';
import { ActionsGroupCard, type ActionsGroupRow } from '@/components/actions/ActionsGroupCard';
import {
  getWorkflow,
  getTaskTypeLabel,
  EDITORIAL_WORKFLOW,
} from '@/types/taskWorkflows';
import type { TaskType, TaskFormData } from '@/types/tasks';
import type { PlanTaskContentRow } from '@/hooks/useContentTasks';

const TASK_TYPE_ICONS: Record<string, LucideIcon> = {
  seo: Search,
  contenu: FileText,
  design: Palette,
  social_media: Share2,
  strategie: Target,
  autre: MoreHorizontal,
};

const TASK_TYPE_ORDER: string[] = [
  'seo',
  'social_media',
  'design',
  'strategie',
  'contenu',
  'autre',
];

function formatPeriodLabel(period: string): string {
  const [yStr, mStr] = period.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  if (!year || !month) return period;
  // Build a Date at UTC midnight of the first day so locale formatting is stable
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function Actions() {
  const { clients, currentClient, setCurrentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const selectedClientId = currentClient?.id ?? ALL_CLIENTS_ID;
  const clientId = isAllClientsSelected ? null : currentClient?.id ?? null;

  const [period, setPeriod] = useState<string>(() => currentPeriod());
  const [search, setSearch] = useState('');
  const [showEditorial, setShowEditorial] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<TaskFormData> | undefined>();

  const { planTasks, editorialEntries, isLoading, isFetching, refetch } = useMonthlyActions({
    clientId,
    period,
  });

  const updateStatus = useUpdateActionStatus();

  const handleStatusChange = (id: string, next: string) => {
    updateStatus.mutate({ id, status: next });
  };

  const openCreate = (taskType: TaskType) => {
    setPrefill({ taskType, period });
    setDialogOpen(true);
  };

  // Group plan_tasks by task_type, respecting TASK_TYPE_ORDER and honoring
  // the free-text search filter.
  const groupedPlanTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? planTasks.filter((t) => {
          return (
            t.title.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.thematique?.toLowerCase().includes(q)
          );
        })
      : planTasks;

    const byType = new Map<string, PlanTaskContentRow[]>();
    for (const t of filtered) {
      const key = t.task_type ?? 'autre';
      const arr = byType.get(key) ?? [];
      arr.push(t);
      byType.set(key, arr);
    }

    // Sort the entries in an order that feels natural, putting unknown types
    // at the end.
    const entries = Array.from(byType.entries()).sort(([a], [b]) => {
      const ia = TASK_TYPE_ORDER.indexOf(a);
      const ib = TASK_TYPE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return entries;
  }, [planTasks, search]);

  const filteredEditorial = useMemo(() => {
    if (!showEditorial) return [];
    const q = search.trim().toLowerCase();
    return q
      ? editorialEntries.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.canal?.toLowerCase().includes(q) ||
            e.content_type?.toLowerCase().includes(q),
        )
      : editorialEntries;
  }, [editorialEntries, showEditorial, search]);

  const hasAnything =
    groupedPlanTasks.length > 0 || (showEditorial && filteredEditorial.length > 0);

  const periodLabel = formatPeriodLabel(period);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Actions du mois</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Toutes les actions prévues pour un client sur un mois donné : tâches à cocher,
            contenus en production, articles éditoriaux.
          </p>
        </div>
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
          <SelectTrigger className="w-[220px]">
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

        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value || currentPeriod())}
            className="w-[180px]"
            aria-label="Mois"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="show-editorial"
            checked={showEditorial}
            onCheckedChange={setShowEditorial}
          />
          <Label htmlFor="show-editorial" className="text-sm cursor-pointer">
            Inclure les articles éditoriaux
          </Label>
        </div>

        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Month label + inline fetching indicator */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          Lot <span className="font-medium text-foreground capitalize">{periodLabel}</span>
        </span>
        {isFetching && !isLoading && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Mise à jour en cours...
          </span>
        )}
      </div>

      {/* Body */}
      {!clientId ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Sélectionnez un client</h3>
          <p className="text-muted-foreground">
            Choisissez un client dans la liste pour afficher ses actions du mois.
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement des actions...</div>
      ) : !hasAnything ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune action ce mois-ci</h3>
          <p className="text-muted-foreground">
            Créez une première action pour alimenter le lot de {periodLabel}.
          </p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {(['seo', 'contenu', 'design'] as TaskType[]).map((t) => (
              <Button
                key={t}
                variant="outline"
                size="sm"
                onClick={() => openCreate(t)}
                className="gap-1.5"
              >
                {getTaskTypeLabel(t)}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedPlanTasks.map(([taskType, rows]) => {
            const workflow = getWorkflow(taskType);
            const label = getTaskTypeLabel(taskType);
            const Icon = TASK_TYPE_ICONS[taskType] ?? MoreHorizontal;
            const mapped: ActionsGroupRow[] = rows.map((r) => ({
              id: r.id,
              title: r.title,
              subtitle: r.description ?? r.thematique ?? r.canal ?? null,
              priority: r.priority,
              assignee: r.assignee,
              dueDate: r.due_date,
              status: r.status,
            }));
            return (
              <ActionsGroupCard
                key={taskType}
                title={label}
                icon={Icon}
                rows={mapped}
                workflow={workflow}
                taskType={taskType}
                onStatusChange={handleStatusChange}
                onCreate={() => openCreate(taskType as TaskType)}
                createLabel="Nouvelle action"
                emptyLabel={`Aucune action ${label.toLowerCase()} pour ${periodLabel}.`}
              />
            );
          })}

          {showEditorial && filteredEditorial.length > 0 && (
            <ActionsGroupCard
              title="Articles éditoriaux"
              icon={Newspaper}
              rows={filteredEditorial.map<ActionsGroupRow>((e) => ({
                id: e.id,
                title: e.title,
                subtitle: [e.canal, e.content_type].filter(Boolean).join(' · ') || null,
                priority: e.priority,
                assignee: e.owner,
                dueDate: e.date,
                status: e.status,
                editHref: '/calendar',
              }))}
              workflow={EDITORIAL_WORKFLOW}
              readOnly
              emptyLabel="Aucun article éditorial pour ce mois."
            />
          )}

          {/* Footer helper linking back to Journal */}
          <div className="text-xs text-muted-foreground text-center pt-2">
            <a href="/journal" className="inline-flex items-center gap-1 hover:underline">
              Voir l'historique complet dans le Journal
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            refetch();
          }
        }}
        isAdmin={isAdmin}
        defaultClientId={clientId ?? undefined}
        clientName={currentClient?.name}
        prefill={prefill}
        defaultPeriod={period}
      />
    </div>
  );
}
