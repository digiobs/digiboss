import { useMemo, useState } from 'react';
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  CircleDot,
  Lightbulb,
  FileText,
  Newspaper,
  Search,
  Palette,
  Share2,
  Target,
  MoreHorizontal,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getTaskTypeLabel } from '@/types/taskWorkflows';
import { getTaskNatureLabel, getIdeaSourceLabel } from '@/types/tasks';
import type { PlanTaskContentRow } from '@/hooks/useContentTasks';
import type { CalendarEntry } from '@/hooks/useEditorialCalendar';
import type { CreativeProposal } from '@/hooks/useCreativeProposals';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KanbanColumnKey = 'todo' | 'in_progress' | 'review' | 'done';
type ItemSource = 'task' | 'proposal' | 'editorial';

interface KanbanItem {
  id: string;
  title: string;
  subtitle: string | null;
  source: ItemSource;
  priority: string | null;
  column: KanbanColumnKey;
  // task extras
  taskType?: string | null;
  assignee?: string | null;
  dueDate?: string | null;
  // proposal extras
  urgency?: string;
  sourceSkill?: string;
  proposalStatus?: string;
  // editorial extras
  canal?: string;
  contentType?: string;
  date?: string;
}

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

interface ColumnDef {
  key: KanbanColumnKey;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const COLUMNS: ColumnDef[] = [
  {
    key: 'todo',
    label: 'A faire',
    icon: Clock,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700',
  },
  {
    key: 'in_progress',
    label: 'En cours',
    icon: PlayCircle,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  },
  {
    key: 'review',
    label: 'A valider',
    icon: CircleDot,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  },
  {
    key: 'done',
    label: 'Termine',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  },
];

// ---------------------------------------------------------------------------
// Status mapping helpers
// ---------------------------------------------------------------------------

const TASK_STATUS_MAP: Record<string, KanbanColumnKey> = {
  backlog: 'todo',
  in_progress: 'in_progress',
  review: 'review',
  done: 'done',
};

const PROPOSAL_STATUS_MAP: Record<string, KanbanColumnKey> = {
  new: 'todo',
  pending: 'todo',
  approved: 'in_progress',
  ready_to_publish: 'review',
  published: 'done',
};

const EDITORIAL_STATUS_MAP: Record<string, KanbanColumnKey> = {
  idee: 'todo',
  brouillon: 'in_progress',
  valide: 'review',
  programme: 'review',
  publie: 'done',
};

// ---------------------------------------------------------------------------
// Source icons & labels
// ---------------------------------------------------------------------------

const SOURCE_CONFIG: Record<ItemSource, { label: string; className: string }> = {
  task: {
    label: 'Action',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  proposal: {
    label: 'Proposition',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  editorial: {
    label: 'Editorial',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
};

const TASK_TYPE_ICONS: Record<string, LucideIcon> = {
  seo: Search,
  contenu: FileText,
  design: Palette,
  social_media: Share2,
  strategie: Target,
  autre: MoreHorizontal,
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400',
  critique: 'bg-red-500',
  urgent: 'bg-orange-500',
  important: 'bg-amber-500',
  normal: 'bg-slate-400',
};

// ---------------------------------------------------------------------------
// Item card
// ---------------------------------------------------------------------------

function KanbanItemCard({ item }: { item: KanbanItem }) {
  const [expanded, setExpanded] = useState(false);
  const sourceConf = SOURCE_CONFIG[item.source];
  const Icon =
    item.source === 'task'
      ? TASK_TYPE_ICONS[item.taskType ?? ''] ?? FileText
      : item.source === 'editorial'
        ? Newspaper
        : Lightbulb;

  const priorityDot =
    PRIORITY_DOT[item.priority ?? ''] ?? PRIORITY_DOT.normal;

  return (
    <Card className="mb-2 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px] border-0', sourceConf.className)}>
                {sourceConf.label}
              </Badge>
              {item.priority && (
                <span className="flex items-center gap-1">
                  <span className={cn('w-1.5 h-1.5 rounded-full', priorityDot)} />
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {item.priority}
                  </span>
                </span>
              )}
              {item.source === 'task' && item.taskType && (
                <Badge variant="secondary" className="text-[10px]">
                  {getTaskTypeLabel(item.taskType)}
                </Badge>
              )}
              {item.source === 'proposal' && item.sourceSkill && (
                <Badge variant="secondary" className="text-[10px]">
                  {item.sourceSkill}
                </Badge>
              )}
              {item.source === 'editorial' && item.canal && (
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {item.canal}
                </Badge>
              )}
            </div>
            <h4 className="text-sm font-medium leading-tight line-clamp-2">
              {item.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {item.assignee && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <User className="w-3 h-3" />
                  {item.assignee}
                </span>
              )}
              {(item.dueDate || item.date) && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(item.dueDate ?? item.date!), 'd MMM', { locale: fr })}
                </span>
              )}
            </div>
            {item.subtitle && expanded && (
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                {item.subtitle}
              </p>
            )}
          </div>
          {item.subtitle && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 p-0.5 hover:bg-accent rounded"
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface ActionsKanbanViewProps {
  planTasks: PlanTaskContentRow[];
  proposals: CreativeProposal[];
  editorialEntries: CalendarEntry[];
  showEditorial: boolean;
}

export function ActionsKanbanView({
  planTasks,
  proposals,
  editorialEntries,
  showEditorial,
}: ActionsKanbanViewProps) {
  const items = useMemo(() => {
    const result: KanbanItem[] = [];

    // Map plan tasks
    for (const t of planTasks) {
      const column = TASK_STATUS_MAP[t.status] ?? 'todo';
      const natureLabel = getTaskNatureLabel(t.task_nature);
      const sourceLabel = getIdeaSourceLabel(t.idea_source);
      const subtitleParts = [
        natureLabel,
        sourceLabel ? `Source: ${sourceLabel}` : '',
        t.thematique ?? '',
        t.canal ?? '',
      ].filter(Boolean);

      result.push({
        id: t.id,
        title: t.title,
        subtitle: subtitleParts.join(' · ') || t.description || null,
        source: 'task',
        priority: t.priority,
        column,
        taskType: t.task_type,
        assignee: t.assignee,
        dueDate: t.due_date,
      });
    }

    // Map proposals (skip rejected)
    for (const p of proposals) {
      if (p.status === 'rejected') continue;
      const column = PROPOSAL_STATUS_MAP[p.status] ?? 'todo';
      result.push({
        id: p.id,
        title: p.title,
        subtitle: p.description || null,
        source: 'proposal',
        priority: null,
        column,
        urgency: p.urgency,
        sourceSkill: p.source_skill,
        proposalStatus: p.status,
      });
    }

    // Map editorial entries
    if (showEditorial) {
      for (const e of editorialEntries) {
        const column = EDITORIAL_STATUS_MAP[e.status] ?? 'todo';
        result.push({
          id: e.id,
          title: e.title,
          subtitle: e.notes || null,
          source: 'editorial',
          priority: e.priority,
          column,
          canal: e.canal,
          contentType: e.content_type,
          date: e.date,
        });
      }
    }

    return result;
  }, [planTasks, proposals, editorialEntries, showEditorial]);

  const byColumn = useMemo(() => {
    const map: Record<KanbanColumnKey, KanbanItem[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const item of items) {
      map[item.column].push(item);
    }
    return map;
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colItems = byColumn[col.key];
        const Icon = col.icon;
        return (
          <div key={col.key} className="space-y-2">
            <div className={cn('flex items-center gap-2 p-2 rounded-lg border', col.bg)}>
              <Icon className={cn('w-4 h-4', col.color)} />
              <span className="font-medium text-sm">{col.label}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {colItems.length}
              </Badge>
            </div>
            <div className="space-y-0 max-h-[65vh] overflow-y-auto pr-1">
              {colItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Aucun element
                </p>
              ) : (
                colItems.map((item) => (
                  <KanbanItemCard key={`${item.source}-${item.id}`} item={item} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
