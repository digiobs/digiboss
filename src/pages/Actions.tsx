import { useMemo, useState } from 'react';
import {
  CheckSquare,
  Search,
  RefreshCw,
  ExternalLink,
  Lightbulb,
  ChevronsDown,
  ChevronsUp,
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
import { MonthlyPackage } from '@/components/actions/MonthlyPackage';
import { ConvergencesPanel } from '@/components/actions/ConvergencesPanel';
import { useCreativeProposals, type CreativeProposal } from '@/hooks/useCreativeProposals';
import type { TaskType, TaskFormData } from '@/types/tasks';
import type { PlanTaskContentRow } from '@/hooks/useContentTasks';
import type { CalendarEntry } from '@/hooks/useEditorialCalendar';

const DEFAULT_MONTH_COUNT = 6;

export default function Actions() {
  const { clients, currentClient, setCurrentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const selectedClientId = currentClient?.id ?? ALL_CLIENTS_ID;
  const clientId = isAllClientsSelected ? null : currentClient?.id ?? null;

  // Anchor = most recent month shown at the top of the stack. Users can still
  // "paginate" backwards by changing the anchor via the month picker.
  const [anchor, setAnchor] = useState<string>(() => currentPeriod());
  const [monthCount, setMonthCount] = useState<number>(DEFAULT_MONTH_COUNT);
  const [search, setSearch] = useState('');
  const [showEditorial, setShowEditorial] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<TaskFormData> | undefined>();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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

  // Proposal mutations still live in useCreativeProposals so approved items
  // push to Wrike consistently with the old /proposals page.
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
    setPrefill({
      taskType,
      period: periodForCreate ?? anchor,
      ideaSource: 'manual',
    });
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

  const toggleCollapsed = (period: string) => {
    setCollapsed((prev) => ({ ...prev, [period]: !prev[period] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const p of periods) next[p] = false;
    setCollapsed(next);
  };
  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const p of periods) next[p] = true;
    setCollapsed(next);
  };

  // ---- Search filter applied to every source before grouping by period ----
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

  // ---- Index everything by period so MonthlyPackage can render in order ----
  const { tasksByPeriod, editorialByPeriod, proposalsByPeriod } = useMemo(() => {
    const tByP = new Map<string, PlanTaskContentRow[]>();
    for (const t of planTasks.filter(filterTask)) {
      const key = t.period ?? currentPeriod();
      const arr = tByP.get(key) ?? [];
      arr.push(t);
      tByP.set(key, arr);
    }

    const eByP = new Map<string, CalendarEntry[]>();
    if (showEditorial) {
      for (const e of editorialEntries.filter(filterEditorial)) {
        // derive `YYYY-MM` from the entry's date
        const d = new Date(e.date);
        const key = Number.isNaN(d.getTime())
          ? currentPeriod()
          : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        const arr = eByP.get(key) ?? [];
        arr.push(e);
        eByP.set(key, arr);
      }
    }

    const pByP = new Map<string, CreativeProposal[]>();
    for (const p of proposals.filter(filterProposal)) {
      const key = proposalPeriod(p);
      const arr = pByP.get(key) ?? [];
      arr.push(p);
      pByP.set(key, arr);
    }

    return {
      tasksByPeriod: tByP,
      editorialByPeriod: eByP,
      proposalsByPeriod: pByP,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planTasks, editorialEntries, proposals, showEditorial, search]);

  const totalTasks = planTasks.length;
  const totalProposals = proposals.length;
  const nowPeriod = currentPeriod();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Actions &amp; Propositions</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Le package mensuel du client : propositions créatives, tâches à cocher,
            contenus en production, articles éditoriaux — tous les mois les uns à la
            suite des autres, avec la nature précise de la tâche et la source de
            chaque idée.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5">
            <ChevronsDown className="w-3.5 h-3.5" />
            Tout ouvrir
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5">
            <ChevronsUp className="w-3.5 h-3.5" />
            Tout fermer
          </Button>
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
            placeholder="Rechercher une action, une proposition, une nature..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <span className="text-muted-foreground">
          {periods.length} packages mensuels · <span className="font-medium text-foreground">{totalTasks}</span> actions ·{' '}
          <span className="font-medium text-foreground">{totalProposals}</span> propositions
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
            Choisissez un client dans la liste pour afficher ses packages mensuels.
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement des packages...</div>
      ) : totalTasks === 0 && totalProposals === 0 ? (
        <div className="space-y-4">
          <ConvergencesPanel convergences={convergences} />
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucune action ni proposition sur la plage affichée
            </h3>
            <p className="text-muted-foreground">
              Créez une première action pour alimenter ces packages.
            </p>
            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              {(['seo', 'contenu', 'social_media'] as TaskType[]).map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  onClick={() => openCreate(t, anchor)}
                >
                  Nouvelle action {t}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ConvergencesPanel convergences={convergences} />
          {periods.map((p) => (
            <MonthlyPackage
              key={p}
              period={p}
              planTasks={tasksByPeriod.get(p) ?? []}
              editorialEntries={editorialByPeriod.get(p) ?? []}
              proposals={proposalsByPeriod.get(p) ?? []}
              collapsed={collapsed[p] ?? false}
              onToggleCollapsed={toggleCollapsed}
              onStatusChange={handleStatusChange}
              onCreateTask={openCreate}
              onApproveProposal={handleApproveProposal}
              onRejectProposal={handleRejectProposal}
              onEditProposal={handleEditProposal}
              showEditorial={showEditorial}
              isCurrent={p === nowPeriod}
              isAdmin={isAdmin}
            />
          ))}

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
            refetchProposals();
          }
        }}
        isAdmin={isAdmin}
        defaultClientId={clientId ?? undefined}
        clientName={currentClient?.name}
        prefill={prefill}
        defaultPeriod={anchor}
      />
    </div>
  );
}
