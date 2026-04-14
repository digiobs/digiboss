import { Calendar, Plus, User, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ActionStatusControl } from './ActionStatusControl';
import type { TaskWorkflow } from '@/types/taskWorkflows';

export interface ActionsGroupRow {
  id: string;
  title: string;
  subtitle?: string | null;
  priority?: string | null;
  assignee?: string | null;
  dueDate?: string | null;
  status: string;
  /** Overrides the workflow derived from `taskType` on the card. */
  editHref?: string;
}

interface ActionsGroupCardProps {
  title: string;
  icon?: LucideIcon;
  rows: ActionsGroupRow[];
  workflow: TaskWorkflow;
  /** task_type passed to ActionStatusControl. If unset, uses workflow directly. */
  taskType?: string | null;
  /** When true, controls render disabled and rows cannot be mutated. */
  readOnly?: boolean;
  onStatusChange?: (id: string, next: string) => void;
  onCreate?: () => void;
  createLabel?: string;
  emptyLabel?: string;
  className?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function ActionsGroupCard({
  title,
  icon: Icon,
  rows,
  workflow,
  taskType,
  readOnly,
  onStatusChange,
  onCreate,
  createLabel,
  emptyLabel,
  className,
}: ActionsGroupCardProps) {
  const doneCount = rows.filter((r) => workflow.doneStatuses.includes(r.status)).length;

  return (
    <Card className={cn('border-border', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-primary" />}
            <h3 className="font-semibold">{title}</h3>
            <Badge variant="secondary" className="text-xs">
              {doneCount}/{rows.length}
            </Badge>
          </div>
          {onCreate && !readOnly && (
            <Button size="sm" variant="outline" onClick={onCreate} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {createLabel ?? 'Ajouter'}
            </Button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {emptyLabel ?? 'Aucune action pour ce mois.'}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {row.title}
                  </p>
                  {row.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {row.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {row.priority && (
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] border-0', PRIORITY_COLORS[row.priority])}
                      >
                        {row.priority}
                      </Badge>
                    )}
                    {row.assignee && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <User className="w-3 h-3" />
                        {row.assignee}
                      </span>
                    )}
                    {row.dueDate && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(row.dueDate), 'd MMM', { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 pt-0.5">
                  <ActionStatusControl
                    taskType={taskType}
                    workflow={workflow}
                    status={row.status}
                    readOnly={readOnly}
                    editHref={row.editHref}
                    onChange={(next) => onStatusChange?.(row.id, next)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
