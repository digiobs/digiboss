import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  User,
  ExternalLink,
  Plus,
  type LucideIcon,
  Search,
  FileText,
  Palette,
  Share2,
  Target,
  MoreHorizontal,
  Lightbulb,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getWorkflow, getTaskTypeLabel } from '@/types/taskWorkflows';
import { getTaskNatureLabel } from '@/types/tasks';
import type { PlanTaskContentRow } from '@/hooks/useContentTasks';
import type { CreativeProposal } from '@/hooks/useCreativeProposals';
import type { TaskType } from '@/types/tasks';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TASK_TYPE_ICONS: Record<string, LucideIcon> = {
  seo: Search,
  contenu: FileText,
  design: Palette,
  social_media: Share2,
  strategie: Target,
  autre: MoreHorizontal,
};

const STATUS_ICON: Record<string, { icon: LucideIcon; className: string }> = {
  backlog: { icon: Circle, className: 'text-slate-400' },
  in_progress: { icon: Clock, className: 'text-blue-500' },
  review: { icon: AlertTriangle, className: 'text-amber-500' },
  done: { icon: CheckCircle2, className: 'text-emerald-500' },
  active: { icon: Clock, className: 'text-blue-500' },
  completed: { icon: CheckCircle2, className: 'text-emerald-500' },
  deferred: { icon: Circle, className: 'text-slate-400' },
  cancelled: { icon: Circle, className: 'text-red-400 line-through' },
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
  normal: 'bg-slate-300',
};

function formatPeriodLabel(period: string): string {
  const [yStr, mStr] = period.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  if (!year || !month) return period;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function TaskRow({
  task,
  onClick,
  isAdmin,
}: {
  task: PlanTaskContentRow;
  onClick: () => void;
  isAdmin: boolean;
}) {
  const statusConf = STATUS_ICON[task.status] ?? STATUS_ICON.backlog;
  const StatusIcon = statusConf.icon;
  const workflow = getWorkflow(task.task_type);
  const statusLabel = workflow.labels[task.status] ?? task.wrike_custom_status ?? task.status;
  const TypeIcon = TASK_TYPE_ICONS[task.task_type ?? ''] ?? FileText;
  const isOverdue =
    task.due_date &&
    !workflow.doneStatuses.includes(task.status) &&
    new Date(task.due_date) < new Date();

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={onClick}
    >
      {/* Status icon */}
      <TableCell className="w-10 pr-0">
        <StatusIcon className={cn('w-4 h-4', statusConf.className)} />
      </TableCell>

      {/* Title + meta */}
      <TableCell>
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm truncate">{task.title}</span>
          {task.wrike_permalink && (
            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
          )}
        </div>
        {task.task_nature && (
          <span className="text-[11px] text-muted-foreground ml-6">
            {getTaskNatureLabel(task.task_nature)}
          </span>
        )}
      </TableCell>

      {/* Status text */}
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            'text-[11px] border-0',
            workflow.colors[task.status] ?? 'bg-muted text-muted-foreground',
          )}
        >
          {statusLabel}
        </Badge>
      </TableCell>

      {/* Canal */}
      <TableCell className="hidden lg:table-cell">
        {task.canal && (
          <span className="text-xs text-muted-foreground">{task.canal}</span>
        )}
      </TableCell>

      {/* Assignee */}
      <TableCell className="hidden md:table-cell">
        {task.assignee && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{task.assignee}</span>
          </div>
        )}
      </TableCell>

      {/* Due date */}
      <TableCell className="hidden sm:table-cell">
        {task.due_date && (
          <span
            className={cn(
              'text-xs',
              isOverdue
                ? 'text-red-600 font-medium'
                : 'text-muted-foreground',
            )}
          >
            {format(new Date(task.due_date), 'd MMM yyyy', { locale: fr })}
          </span>
        )}
      </TableCell>

      {/* Priority dot */}
      <TableCell className="w-8">
        <span
          className={cn(
            'w-2 h-2 rounded-full inline-block',
            PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.normal,
          )}
          title={task.priority}
        />
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Proposal row (compact, in the table)
// ---------------------------------------------------------------------------

function ProposalRow({
  proposal,
  onClick,
}: {
  proposal: CreativeProposal;
  onClick: () => void;
}) {
  const statusLabel =
    proposal.status === 'new' || proposal.status === 'pending'
      ? 'En attente'
      : proposal.status === 'approved'
        ? 'Validee'
        : proposal.status === 'ready_to_publish'
          ? 'A publier'
          : proposal.status;

  return (
    <TableRow
      className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors"
      onClick={onClick}
    >
      <TableCell className="w-10 pr-0">
        <Lightbulb className="w-4 h-4 text-amber-500" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm truncate">{proposal.title}</span>
          <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0 shrink-0">
            Proposition
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {proposal.source_skill} · {proposal.proposal_type}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-[11px] border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          {statusLabel}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell" />
      <TableCell className="hidden md:table-cell" />
      <TableCell className="hidden sm:table-cell">
        {proposal.created_at && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(proposal.created_at), 'd MMM yyyy', { locale: fr })}
          </span>
        )}
      </TableCell>
      <TableCell className="w-8" />
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface ActionsTableViewProps {
  periods: string[];
  tasksByPeriod: Map<string, PlanTaskContentRow[]>;
  proposalsByPeriod: Map<string, CreativeProposal[]>;
  onTaskClick: (task: PlanTaskContentRow) => void;
  onProposalClick: (proposal: CreativeProposal) => void;
  onCreateTask: (taskType: TaskType, period: string) => void;
  isAdmin: boolean;
  nowPeriod: string;
}

export function ActionsTableView({
  periods,
  tasksByPeriod,
  proposalsByPeriod,
  onTaskClick,
  onProposalClick,
  onCreateTask,
  isAdmin,
  nowPeriod,
}: ActionsTableViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (period: string) =>
    setCollapsed((prev) => ({ ...prev, [period]: !prev[period] }));

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10" />
            <TableHead className="font-semibold">Titre</TableHead>
            <TableHead className="w-[120px] font-semibold">Statut</TableHead>
            <TableHead className="hidden lg:table-cell w-[100px] font-semibold">
              Canal
            </TableHead>
            <TableHead className="hidden md:table-cell w-[140px] font-semibold">
              Responsable
            </TableHead>
            <TableHead className="hidden sm:table-cell w-[110px] font-semibold">
              Echeance
            </TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((period) => {
            const tasks = tasksByPeriod.get(period) ?? [];
            const proposals = proposalsByPeriod.get(period) ?? [];
            const isCollapsed = collapsed[period] ?? false;
            const isCurrent = period === nowPeriod;
            const totalItems = tasks.length + proposals.length;
            const doneCount = tasks.filter((t) => {
              const wf = getWorkflow(t.task_type);
              return wf.doneStatuses.includes(t.status);
            }).length;

            if (totalItems === 0) return null;

            return (
              <Fragment key={period}>
                {/* Period group header */}
                <TableRow
                  className={cn(
                    'cursor-pointer hover:bg-muted/40 border-t',
                    isCurrent && 'bg-primary/5',
                  )}
                  onClick={() => toggle(period)}
                >
                  <TableCell colSpan={7} className="py-2">
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-sm capitalize">
                        {formatPeriodLabel(period)}
                      </span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px]">
                          en cours
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {doneCount}/{tasks.length} actions
                      </Badge>
                      {proposals.length > 0 && (
                        <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <Lightbulb className="w-3 h-3 mr-0.5" />
                          {proposals.length}
                        </Badge>
                      )}
                      <div className="flex-1" />
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateTask('contenu', period);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Ajouter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {/* Task & proposal rows */}
                {!isCollapsed && (
                  <>
                    {proposals.map((p) => (
                      <ProposalRow
                        key={p.id}
                        proposal={p}
                        onClick={() => onProposalClick(p)}
                      />
                    ))}
                    {tasks.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        onClick={() => onTaskClick(t)}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Need React.Fragment for the grouped rows
import { Fragment } from 'react';
