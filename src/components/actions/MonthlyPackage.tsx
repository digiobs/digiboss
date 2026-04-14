import { useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Newspaper,
  FileText,
  Search,
  Palette,
  Share2,
  Target,
  MoreHorizontal,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ActionsGroupCard, type ActionsGroupRow } from './ActionsGroupCard';
import { ProposalMiniCard } from './ProposalMiniCard';
import {
  getWorkflow,
  getTaskTypeLabel,
  EDITORIAL_WORKFLOW,
} from '@/types/taskWorkflows';
import { getTaskNatureLabel, getIdeaSourceLabel, type TaskType } from '@/types/tasks';
import type { PlanTaskContentRow } from '@/hooks/useContentTasks';
import type { CalendarEntry } from '@/hooks/useEditorialCalendar';
import type { CreativeProposal } from '@/hooks/useCreativeProposals';

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
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export interface MonthlyPackageProps {
  period: string;
  planTasks: PlanTaskContentRow[];
  editorialEntries: CalendarEntry[];
  proposals: CreativeProposal[];
  collapsed: boolean;
  onToggleCollapsed: (period: string) => void;
  onStatusChange: (id: string, next: string) => void;
  onCreateTask: (taskType: TaskType, period: string) => void;
  onApproveProposal: (id: string) => void;
  onRejectProposal: (id: string) => void;
  onEditProposal: (proposal: CreativeProposal) => void;
  showEditorial: boolean;
  isCurrent: boolean;
  isAdmin: boolean;
}

/**
 * Renders the monthly "package" for a single `YYYY-MM` period:
 *   - a collapsible header with the month label and task counts
 *   - pending creative proposals raised that month (merged from /proposals)
 *   - plan_tasks grouped by task_type
 *   - editorial_calendar entries (read-only)
 */
export function MonthlyPackage({
  period,
  planTasks,
  editorialEntries,
  proposals,
  collapsed,
  onToggleCollapsed,
  onStatusChange,
  onCreateTask,
  onApproveProposal,
  onRejectProposal,
  onEditProposal,
  showEditorial,
  isCurrent,
  isAdmin,
}: MonthlyPackageProps) {
  const label = formatPeriodLabel(period);

  const groupedPlanTasks = useMemo(() => {
    const byType = new Map<string, PlanTaskContentRow[]>();
    for (const t of planTasks) {
      const key = t.task_type ?? 'autre';
      const arr = byType.get(key) ?? [];
      arr.push(t);
      byType.set(key, arr);
    }
    return Array.from(byType.entries()).sort(([a], [b]) => {
      const ia = TASK_TYPE_ORDER.indexOf(a);
      const ib = TASK_TYPE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [planTasks]);

  const totalTasks = planTasks.length;
  const doneTasks = planTasks.filter((t) => t.status === 'done').length;
  const pendingProposals = proposals.filter(
    (p) => p.status === 'new' || p.status === 'pending',
  ).length;

  const hasContent =
    totalTasks > 0 ||
    proposals.length > 0 ||
    (showEditorial && editorialEntries.length > 0);

  return (
    <Card
      className={cn(
        'border-border overflow-hidden',
        isCurrent && 'ring-1 ring-primary/30',
      )}
    >
      {/* Month header (clickable to toggle collapse) */}
      <button
        type="button"
        onClick={() => onToggleCollapsed(period)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          'hover:bg-muted/40',
          isCurrent && 'bg-primary/5',
        )}
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <CalendarDays
          className={cn(
            'w-5 h-5 shrink-0',
            isCurrent ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base capitalize">
            Lot {label}
            {isCurrent && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                en cours
              </Badge>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            {totalTasks > 0
              ? `${doneTasks}/${totalTasks} actions · ${pendingProposals} proposition${pendingProposals > 1 ? 's' : ''} en attente`
              : pendingProposals > 0
                ? `${pendingProposals} proposition${pendingProposals > 1 ? 's' : ''} en attente`
                : 'Aucune action ni proposition'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalTasks > 0 && (
            <Badge variant="secondary" className="text-xs">
              {doneTasks}/{totalTasks}
            </Badge>
          )}
          {pendingProposals > 0 && (
            <Badge
              className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              {pendingProposals}
            </Badge>
          )}
        </div>
      </button>

      {!collapsed && (
        <CardContent className="p-4 pt-0 space-y-4">
          {!hasContent && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucune action, proposition ou article éditorial pour {label}.
              <div className="mt-3 flex justify-center gap-2 flex-wrap">
                {(['seo', 'contenu', 'social_media'] as TaskType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onCreateTask(t, period)}
                    className="text-xs px-3 py-1 rounded border border-border hover:bg-muted transition-colors"
                  >
                    + {getTaskTypeLabel(t)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Creative proposals merged into the month package */}
          {proposals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-semibold">Propositions créatives</h4>
                <Badge variant="secondary" className="text-xs">
                  {proposals.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {proposals.map((p) => (
                  <ProposalMiniCard
                    key={p.id}
                    proposal={p}
                    isAdmin={isAdmin}
                    onApprove={onApproveProposal}
                    onReject={onRejectProposal}
                    onEdit={onEditProposal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Plan tasks grouped by task_type */}
          {groupedPlanTasks.map(([taskType, rows]) => {
            const workflow = getWorkflow(taskType);
            const typeLabel = getTaskTypeLabel(taskType);
            const Icon = TASK_TYPE_ICONS[taskType] ?? MoreHorizontal;
            const mapped: ActionsGroupRow[] = rows.map((r) => {
              const natureLabel = getTaskNatureLabel(r.task_nature);
              const sourceLabel = getIdeaSourceLabel(r.idea_source);
              const subtitleParts = [
                natureLabel,
                sourceLabel ? `Source: ${sourceLabel}` : '',
                r.idea_source_detail ?? '',
                r.thematique ?? '',
                r.canal ?? '',
              ].filter(Boolean);
              return {
                id: r.id,
                title: r.title,
                subtitle: subtitleParts.join(' · ') || r.description || null,
                priority: r.priority,
                assignee: r.assignee,
                dueDate: r.due_date,
                status: r.status,
              };
            });
            return (
              <ActionsGroupCard
                key={taskType}
                title={typeLabel}
                icon={Icon}
                rows={mapped}
                workflow={workflow}
                taskType={taskType}
                onStatusChange={onStatusChange}
                onCreate={() => onCreateTask(taskType as TaskType, period)}
                createLabel="Nouvelle action"
                emptyLabel={`Aucune action ${typeLabel.toLowerCase()} pour ${label}.`}
              />
            );
          })}

          {/* Editorial rows (read-only) */}
          {showEditorial && editorialEntries.length > 0 && (
            <ActionsGroupCard
              title="Articles éditoriaux"
              icon={Newspaper}
              rows={editorialEntries.map<ActionsGroupRow>((e) => ({
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
        </CardContent>
      )}
    </Card>
  );
}
