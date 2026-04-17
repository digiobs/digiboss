import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Filter,
  Info,
  Zap,
  Layers,
  Calendar,
  Tag,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Rocket,
  Send,
  Pencil,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useCreativeProposals, type CreativeProposal } from '@/hooks/useCreativeProposals';
import { WorkflowLegend } from '@/components/proposals/WorkflowLegend';
import { CreateTaskDialog } from '@/components/plan/CreateTaskDialog';
import type { TaskFormData } from '@/types/tasks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ColumnKey = 'enAttente' | 'approved' | 'readyToPublish' | 'rejected';

type ColumnConfig = {
  key: ColumnKey;
  label: string;
  description: string;
  icon: typeof Lightbulb;
  color: string;
  bg: string;
};

const columnsConfig: ColumnConfig[] = [
  {
    key: 'enAttente',
    label: 'En attente',
    description: "Propositions générées par nos IA, en attente de validation par l'équipe DigiObs.",
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  },
  {
    key: 'approved',
    label: 'Validées',
    description: "Idées retenues par DigiObs. Une tâche Wrike a été créée pour démarrer la production.",
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  },
  {
    key: 'readyToPublish',
    label: 'À publier',
    description: 'Contenus rédigés et validés, prêts à être publiés sur vos canaux.',
    icon: Rocket,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
  },
  {
    key: 'rejected',
    label: 'Rejetées',
    description: 'Propositions écartées par DigiObs ou le client.',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  },
];

const urgencyConfig: Record<string, { label: string; color: string }> = {
  '🔴 Critique': { label: 'Critique', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  '🟠 Urgent': { label: 'Urgent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  '🟡 Important': { label: 'Important', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  '🟢 Normal': { label: 'Normal', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

function ProposalCard({
  proposal,
  onApprove,
  onReject,
  onMarkReady,
  onEdit,
  isAdmin,
}: {
  proposal: CreativeProposal;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkReady: (id: string) => void;
  onEdit: (p: CreativeProposal) => void;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const urgency = urgencyConfig[proposal.urgency] ?? urgencyConfig['🟢 Normal'];
  const age = formatDistanceToNow(new Date(proposal.created_at), { locale: fr, addSuffix: true });

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={urgency.color}>
                {urgency.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {proposal.source_skill}
              </Badge>
              {proposal.is_wild_card && (
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs">
                  <Zap className="w-3 h-3 mr-1" />Wild Card
                </Badge>
              )}
              {proposal.is_marronnier && (
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-xs">
                  <Calendar className="w-3 h-3 mr-1" />{proposal.marronnier_name}
                </Badge>
              )}
              {proposal.convergence_cluster_id && (
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs">
                  <Layers className="w-3 h-3 mr-1" />Convergence
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm leading-tight mb-1">{proposal.title}</h4>
            <p className="text-xs text-muted-foreground">{age} · {proposal.proposal_type} → {proposal.target_skill}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 p-1 hover:bg-accent rounded"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <p className="text-sm text-foreground">{proposal.description}</p>
            <div className="bg-muted/50 rounded p-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Justification</p>
              <p className="text-xs">{proposal.rationale}</p>
            </div>
            {proposal.source_insight && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />Source de l'insight
                </p>
                <p className="text-xs">{proposal.source_insight}</p>
                {proposal.source_url && (
                  <a
                    href={proposal.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Voir la source
                  </a>
                )}
              </div>
            )}
            {proposal.draft_content && (
              <div className="bg-accent/30 rounded p-3 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Brouillon du contenu</p>
                <div className="text-sm text-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {proposal.draft_content}
                </div>
              </div>
            )}
            {proposal.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {proposal.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{String(tag)}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wrike link — visible on approved / ready_to_publish / published */}
        {proposal.wrike_permalink && (
          <a
            href={proposal.wrike_permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Voir la tâche dans Wrike
          </a>
        )}

        {isAdmin && (proposal.status === 'new' || proposal.status === 'pending') && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="default"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onApprove(proposal.id)}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Valider
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => onReject(proposal.id)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Rejeter
            </Button>
          </div>
        )}

        {isAdmin && proposal.status === 'approved' && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="default"
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => onMarkReady(proposal.id)}
            >
              <Rocket className="w-3.5 h-3.5 mr-1" />
              Marquer à publier
            </Button>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(proposal)}
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Modifier / Créer tâche
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Proposals() {
  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const {
    proposals,
    convergences,
    proposalsByStatus,
    stats,
    isLoading,
    updateProposalStatus,
    approveAndPushToWrike,
    markReadyToPublish,
    refetch,
  } = useCreativeProposals();
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');

  // Create-task dialog state (prefilled from a creative proposal)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<Partial<TaskFormData> | undefined>();

  const urgencyToPriority = (urgency: string): TaskFormData['priority'] => {
    if (urgency.includes('Critique') || urgency.includes('Urgent')) return 'high';
    if (urgency.includes('Important')) return 'medium';
    return 'low';
  };

  const handleEditProposal = (p: CreativeProposal) => {
    const descriptionParts = [
      p.description,
      p.rationale ? `\n\nJustification:\n${p.rationale}` : '',
      p.source_insight ? `\n\nInsight source:\n${p.source_insight}` : '',
      p.source_url ? `\n\nSource: ${p.source_url}` : '',
      p.draft_content ? `\n\nBrouillon:\n${p.draft_content}` : '',
    ].filter(Boolean).join('');

    setTaskPrefill({
      title: p.title,
      description: descriptionParts,
      taskType: 'contenu',
      clientId: p.client_id,
      priority: urgencyToPriority(p.urgency),
      status: 'backlog',
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      contentStatus: 'idea',
    });
    setTaskDialogOpen(true);
  };

  const skills = useMemo(() => {
    const set = new Set(proposals.map((p) => p.source_skill));
    return Array.from(set).sort();
  }, [proposals]);

  const handleApprove = async (id: string) => {
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
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateProposalStatus(id, 'rejected');
      toast.success('Proposition rejetée');
    } catch {
      toast.error('Erreur lors du rejet');
    }
  };

  const handleMarkReady = async (id: string) => {
    try {
      const result = await markReadyToPublish(id, 'ready_to_publish');
      if (result?.status === 'ok') {
        toast.success('Contenu marqué "À publier" · Wrike mis à jour');
      } else if (result?.status === 'updated_without_wrike') {
        toast.warning(
          `Contenu marqué "À publier", mais Wrike non mis à jour (${result.error ?? 'erreur inconnue'}).`,
        );
      } else {
        toast.success('Contenu marqué à publier');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du passage à publier');
    }
  };

  const filterProposals = (list: CreativeProposal[]) =>
    list.filter((p) => {
      if (filterSkill !== 'all' && p.source_skill !== filterSkill) return false;
      if (filterUrgency !== 'all' && p.urgency !== filterUrgency) return false;
      return true;
    });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            Propositions Créatives
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAllClientsSelected ? 'Tous les clients' : currentClient?.name} · {stats.total} propositions actives
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Workflow legend — client-facing */}
      <WorkflowLegend />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {columnsConfig.map((col) => {
          const Icon = col.icon;
          return (
            <Card key={col.key} className={cn('border', col.bg)}>
              <CardContent className="p-3 flex items-center gap-3">
                <Icon className={cn('w-5 h-5', col.color)} />
                <div>
                  <p className="text-xl font-bold">{proposalsByStatus[col.key].length}</p>
                  <p className="text-xs text-muted-foreground">{col.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className="border bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-3 flex items-center gap-3">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-xl font-bold">{stats.convergences}</p>
              <p className="text-xs text-muted-foreground">Convergences</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterSkill} onValueChange={setFilterSkill}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Skill source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les skills</SelectItem>
            {skills.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterUrgency} onValueChange={setFilterUrgency}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Urgence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="🔴 Critique">Critique</SelectItem>
            <SelectItem value="🟠 Urgent">Urgent</SelectItem>
            <SelectItem value="🟡 Important">Important</SelectItem>
            <SelectItem value="🟢 Normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="convergences">Convergences ({convergences.length})</TabsTrigger>
        </TabsList>

        {/* Kanban board */}
        <TabsContent value="kanban">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {columnsConfig.map((col) => {
                const Icon = col.icon;
                const filtered = filterProposals(proposalsByStatus[col.key]);
                return (
                  <div key={col.key} className="space-y-2">
                    <div className={cn('flex items-center gap-2 p-2 rounded-lg border', col.bg)}>
                      <Icon className={cn('w-4 h-4', col.color)} />
                      <span className="font-medium text-sm">{col.label}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground/70 hover:text-foreground"
                            aria-label={`En savoir plus sur ${col.label}`}
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px] text-xs">
                          {col.description}
                        </TooltipContent>
                      </Tooltip>
                      <Badge variant="secondary" className="ml-auto text-xs">{filtered.length}</Badge>
                    </div>
                    <div className="space-y-0 max-h-[60vh] overflow-y-auto pr-1">
                      {filtered.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">Aucune proposition</p>
                      ) : (
                        filtered.map((p) => (
                          <ProposalCard
                            key={p.id}
                            proposal={p}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onMarkReady={handleMarkReady}
                            onEdit={handleEditProposal}
                            isAdmin={isAdmin}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Convergences tab */}
        <TabsContent value="convergences">
          {convergences.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Layers className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucune convergence détectée</p>
                <p className="text-xs text-muted-foreground mt-1">Les convergences apparaissent quand plusieurs skills proposent des idées similaires</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {convergences.map((conv) => (
                <Card key={conv.id} className="border-indigo-200 dark:border-indigo-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <CardTitle className="text-sm">{conv.combined_title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {conv.combined_description && (
                      <p className="text-sm text-muted-foreground">{conv.combined_description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        Confiance: {Math.round(conv.confidence * 100)}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Multiplicateur: ×{conv.urgency_multiplier}
                      </Badge>
                      {conv.source_skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{String(skill)}</Badge>
                      ))}
                    </div>
                    {conv.combined_action && (
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded p-2">
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Action recommandée</p>
                        <p className="text-xs">{conv.combined_action}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {conv.cluster_members.length} propositions regroupées
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create-task dialog — opens prefilled from a creative proposal */}
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        isAdmin={isAdmin}
        defaultClientId={isAllClientsSelected ? undefined : currentClient?.id}
        clientName={isAllClientsSelected ? undefined : currentClient?.name}
        prefill={taskPrefill}
      />
      </div>
    </TooltipProvider>
  );
}
