import { useMemo, useState } from 'react';
import {
  CheckSquare,
  Search,
  RefreshCw,
  ExternalLink,
  Lightbulb,
  List,
  Columns3,
  CalendarDays,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import {
  useMonthlyActions,
  useUpdateActionStatus,
  currentPeriod,
  buildPeriodRange,
  proposalPeriod,
} from '@/hooks/useMonthlyActions';
import { CreateTaskDialog } from '@/components/plan/CreateTaskDialog';
import { ConvergencesPanel } from '@/components/actions/ConvergencesPanel';
import { ActionsTableView } from '@/components/actions/ActionsTableView';
import { ActionsKanbanView } from '@/components/actions/ActionsKanbanView';
import { ActionsCalendarView } from '@/components/actions/ActionsCalendarView';
import { TaskDetailSheet } from '@/components/actions/TaskDetailSheet';
import { useCreativeProposals, type CreativeProposal } from '@/hooks/useCreativeProposals';
import type { TaskType, TaskFormData } from '@/types/tasks';
import type { PlanTaskContentRow } from '@/hooks/useContentTasks';
import type { CalendarEntry } from '@/hooks/useEditorialCalendar';

const DEFAULT_MONTH_COUNT = 6;

type ViewTab = 'liste' | 'kanban' | 'calendrier';

export default function Actions() {
  const { clients, currentClient, setCurrentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const selectedClientId = currentClient?.id ?? ALL_CLIENTS_ID;
  const clientId = isAllClientsSelected ? null : currentClient?.id ?? null;

  const [activeView, setActiveView] = useState<ViewTab>('liste');

  // Anchor = most recent month shown at the top of the stack.
  const [anchor, setAnchor] = useState<string>(() => currentPeriod());
  const [monthCount, setMonthCount] = useState<number>(DEFAULT_MONTH_COUNT);
  const [search, setSearch] = useState('');
  const [showEditorial, setShowEditorial] = useState(true);

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<PlanTaskContentRow | undefined>();
  const [prefill, setPrefill] = useState<Partial<TaskFormData> | undefined>();

  // Task detail sheet
  const [detailTask, setDetailTask] = useState<PlanTaskContentRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const periods = useMemo(() => buildPeriodRange(anchor, monthCount), [anchor, monthCount]);

  const {
    planTasks,
    editorialEntries,
    proposals,
    convergences,
    isLoading,
    isFetching,
    refetch,
  } = useMonthlyActions({ clientId, periods });

  const {
    approveAndPushToWrike,
    updateProposalStatus,
    refetch: refetchProposals,
  } = useCreativeProposals();

  const updateStatus = useUpdateActionStatus();

  const handleStatusChange = (id: string, next: string) => {
    updateStatus.mutate({ id, status: next });
  };

  const openCreate = (taskType: TaskType, periodForCreate?: string) => {
    setEditTask(undefined);
    setPrefill({
      taskType,
      period: periodForCreate ?? anchor,
      ideaSource: 'manual',
    });
    setDialogOpen(true);
  };

  const openTaskDetail = (task: PlanTaskContentRow) => {
    setDetailTask(task);
    setDetailOpen(true);
  };

  const openEditFromDetail = (task: PlanTaskContentRow) => {
    setDetailOpen(false);
    setEditTask(task);
    setPrefill(undefined);
    setDialogOpen(true);
  };

  const urgencyToPriority = (urgency: string): TaskFormData['priority'] => {
    if (urgency.includes('Critique') || urgency.includes('Urgent')) return 'high';
    if (urgency.includes('Important')) return 'medium';
    return 'low';
  };

  const handleApproveProposal = async (id: string) => {
    try {
      const result = await approveAndPushToWrike(id);
      if (result?.status === 'ok') {
        toast.success('Proposition validée · tâche Wrike créée');
      } else if (result?.status === 'approved_without_wrike') {
        toast.warning(
          `Proposition validée, mais Wrike indisponible (${result.error ?? 'erreur inconnue'}).`,
        );
      } else {
        toast.success('Proposition validée');
      }
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejectProposal = async (id: string) => {
    try {
      await updateProposalStatus(id, 'rejected');
      toast.success('Proposition rejetée');
      refetch();
    } catch {
      toast.error('Erreur lors du rejet');
    }
  };

  const handleEditProposal = (p: CreativeProposal) => {
    const descriptionParts = [
      p.description,
      p.rationale ? `\n\nJustification:\n${p.rationale}` : '',
      p.source_insight ? `\n\nInsight source:\n${p.source_insight}` : '',
      p.source_url ? `\n\nSource: ${p.source_url}` : '',
      p.draft_content ? `\n\nBrouillon:\n${p.draft_content}` : '',
    ]
      .filter(Boolean)
      .join('');

    setEditTask(undefined);
    setPrefill({
      title: p.title,
      description: descriptionParts,
      taskType: 'contenu',
      clientId: p.client_id,
      priority: urgencyToPriority(p.urgency),
      status: 'backlog',
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      contentStatus: 'idea',
      ideaSource: 'proposal',
      ideaSourceDetail: p.source_skill,
      ideaSourceUrl: p.source_url ?? null,
      sourceProposalId: p.id,
      period: proposalPeriod(p),
    });
    setDialogOpen(true);
  };

  // ---- Search filter ----
  const q = search.trim().toLowerCase();

  const filterTask = (t: PlanTaskContentRow) =>
    !q ||
    t.title.toLowerCase().includes(q) ||
    t.description?.toLowerCase().includes(q) ||
    t.thematique?.toLowerCase().includes(q) ||
    t.canal?.toLowerCase().includes(q) ||
    t.task_nature?.toLowerCase().includes(q) ||
    t.idea_source?.toLowerCase().includes(q);

  const filterEditorial = (e: CalendarEntry) =>
    !q ||
    e.title.toLowerCase().includes(q) ||
    e.canal?.toLowerCase().includes(q) ||
    e.content_type?.toLowerCase().includes(q);

  const filterProposal = (p: CreativeProposal) =>
    !q ||
    p.title.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q) ||
    p.source_skill?.toLowerCase().includes(q) ||
    p.source_insight?.toLowerCase().includes(q);

  const filteredPlanTasks = useMemo(() => planTasks.filter(filterTask), [planTasks, q]);
  const filteredEditorialEntries = useMemo(
    () => (showEditorial ? editorialEntries.filter(filterEditorial) : []),
    [editorialEntries, showEditorial, q],
  );
  const filteredProposals = useMemo(() => proposals.filter(filterProposal), [proposals, q]);

  // ---- Index by period ----
  const { tasksByPeriod, proposalsByPeriod } = useMemo(() => {
    const tByP = new Map<string, PlanTaskContentRow[]>();
    for (const t of filteredPlanTasks) {
      const key = t.period ?? currentPeriod();
      const arr = tByP.get(key) ?? [];
      arr.push(t);
      tByP.set(key, arr);
    }

    const pByP = new Map<string, CreativeProposal[]>();
    for (const p of filteredProposals) {
      const key = proposalPeriod(p);
      const arr = pByP.get(key) ?? [];
      arr.push(p);
      pByP.set(key, arr);
    }

    return { tasksByPeriod: tByP, proposalsByPeriod: pByP };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPlanTasks, filteredProposals]);

  const totalTasks = planTasks.length;
  const totalProposals = proposals.length;
  const nowPeriod = currentPeriod();

  const showListeControls = activeView === 'liste';
  const showCommonFilters = activeView !== 'calendrier';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Contenus</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Trois vues sur les contenus du client : liste des tâches, tableau
            kanban et calendrier éditorial.
          </p>
        </div>
      </div>

      {/* ────────────────────────── View tabs ────────────────────────── */}
      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as ViewTab)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="liste" className="gap-1.5">
            <List className="w-4 h-4" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5">
            <Columns3 className="w-4 h-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendrier" className="gap-1.5">
            <CalendarDays className="w-4 h-4" />
            Calendrier
          </TabsTrigger>
        </TabsList>

        {/* ── Common filters (Liste + Kanban) ── */}
        {showCommonFilters && (
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
                {isAdmin && (
                  <SelectItem value={ALL_CLIENTS_ID}>Admin (tous les clients)</SelectItem>
                )}
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showListeControls && (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="anchor" className="text-xs text-muted-foreground">
                    Mois le plus récent
                  </Label>
                  <Input
                    id="anchor"
                    type="month"
                    value={anchor}
                    onChange={(e) => setAnchor(e.target.value || currentPeriod())}
                    className="w-[160px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="month-count" className="text-xs text-muted-foreground">
                    Mois affichés
                  </Label>
                  <Select
                    value={String(monthCount)}
                    onValueChange={(v) => setMonthCount(Number(v) || DEFAULT_MONTH_COUNT)}
                  >
                    <SelectTrigger id="month-count" className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 6, 9, 12].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} mois
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

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
                placeholder="Rechercher une tâche, une proposition..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Summary row */}
        {showCommonFilters && (
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{totalTasks}</span> tâches ·{' '}
              <span className="font-medium text-foreground">{totalProposals}</span> propositions
            </span>
            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Mise à jour...
              </span>
            )}
          </div>
        )}

        {/* ═══════════════════════ LISTE VIEW ═══════════════════════ */}
        <TabsContent value="liste" className="mt-0">
          {!clientId ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Sélectionnez un client
              </h3>
              <p className="text-muted-foreground">
                Choisissez un client pour afficher ses contenus.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : totalTasks === 0 && totalProposals === 0 ? (
            <div className="space-y-4">
              <ConvergencesPanel convergences={convergences} />
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Aucune tâche ni proposition
                </h3>
                <p className="text-muted-foreground">
                  Créez une première tâche pour commencer.
                </p>
                <div className="mt-4 flex justify-center gap-2 flex-wrap">
                  {(['seo', 'contenu', 'social_media'] as TaskType[]).map((t) => (
                    <Button
                      key={t}
                      variant="outline"
                      size="sm"
                      onClick={() => openCreate(t, anchor)}
                    >
                      Nouvelle tâche {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ConvergencesPanel convergences={convergences} />
              <ActionsTableView
                periods={periods}
                tasksByPeriod={tasksByPeriod}
                proposalsByPeriod={proposalsByPeriod}
                onTaskClick={openTaskDetail}
                onProposalClick={handleEditProposal}
                onCreateTask={openCreate}
                isAdmin={isAdmin}
                nowPeriod={nowPeriod}
              />
              <div className="text-xs text-muted-foreground text-center pt-2">
                <a href="/journal" className="inline-flex items-center gap-1 hover:underline">
                  Voir l'historique complet dans le Journal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════ KANBAN VIEW ═══════════════════════ */}
        <TabsContent value="kanban" className="mt-0">
          {!clientId ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Sélectionnez un client
              </h3>
              <p className="text-muted-foreground">
                Choisissez un client pour afficher le tableau kanban.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <ConvergencesPanel convergences={convergences} />
              <ActionsKanbanView
                planTasks={filteredPlanTasks}
                proposals={filteredProposals}
                editorialEntries={filteredEditorialEntries}
                showEditorial={showEditorial}
                onTaskClick={openTaskDetail}
              />
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════ CALENDRIER VIEW ═══════════════════════ */}
        <TabsContent value="calendrier" className="mt-0">
          {!clientId ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Sélectionnez un client
              </h3>
              <p className="text-muted-foreground">
                Choisissez un client pour afficher le calendrier éditorial.
              </p>
            </div>
          ) : (
            <ActionsCalendarView planTasks={planTasks} isAdmin={isAdmin} />
          )}
        </TabsContent>
      </Tabs>

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={detailTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isAdmin={isAdmin}
        onEdit={openEditFromDetail}
        onStatusChange={handleStatusChange}
      />

      {/* Create / edit dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditTask(undefined);
            refetch();
            refetchProposals();
          }
        }}
        isAdmin={isAdmin}
        defaultClientId={clientId ?? undefined}
        clientName={currentClient?.name}
        task={editTask}
        prefill={prefill}
        defaultPeriod={anchor}
      />
    </div>
  );
}
