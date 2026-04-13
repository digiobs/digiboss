import { useState } from 'react';
import { Plus, Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { usePlanTasksByType } from '@/hooks/usePlanTasksByType';
import { CreateTaskDialog } from '@/components/plan/CreateTaskDialog';
import type { PlanTaskContentRow } from '@/hooks/useContentTasks';
import type { TaskType, TaskFormData } from '@/types/tasks';

interface TypedTasksSectionProps {
  /** Which plan_tasks.task_type to list */
  taskType: TaskType;
  /** Card title, eg. "Tâches SEO" */
  title: string;
  /** Icon component rendered next to the title */
  icon?: React.ComponentType<{ className?: string }>;
  /** Label for the empty state, eg. "Aucune tâche SEO pour l'instant" */
  emptyLabel?: string;
  /** Label for the create button, eg. "Nouvelle tâche SEO" */
  createLabel?: string;
  /** Optional className applied to the wrapping card */
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  in_progress: 'En cours',
  review: 'À valider',
  done: 'Terminé',
  cancelled: 'Annulé',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function TypedTasksSection({
  taskType,
  title,
  icon: Icon,
  emptyLabel,
  createLabel,
  className,
}: TypedTasksSectionProps) {
  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const clientId = isAllClientsSelected ? undefined : currentClient?.id;
  const { data: tasks = [], isLoading } = usePlanTasksByType(taskType, clientId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlanTaskContentRow | undefined>();
  const [prefill, setPrefill] = useState<Partial<TaskFormData> | undefined>();

  const openCreate = () => {
    setEditingTask(undefined);
    setPrefill({ taskType });
    setDialogOpen(true);
  };

  const openEdit = (row: PlanTaskContentRow) => {
    setPrefill(undefined);
    setEditingTask(row);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className={cn('border-border', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-5 h-5 text-primary" />}
              <h3 className="font-semibold">{title}</h3>
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </div>
            <Button size="sm" variant="outline" onClick={openCreate} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {createLabel ?? 'Nouvelle tâche'}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {emptyLabel ?? 'Aucune tâche pour le moment.'}
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openEdit(task)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1 mb-1">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] border-0', STATUS_COLORS[task.status])}
                        >
                          {STATUS_LABELS[task.status] ?? task.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] border-0', PRIORITY_COLORS[task.priority])}
                        >
                          {task.priority}
                        </Badge>
                        {task.assignee && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <User className="w-3 h-3" />
                            {task.assignee}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.due_date), 'd MMM', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isAdmin={isAdmin}
        defaultClientId={clientId}
        clientName={isAllClientsSelected ? undefined : currentClient?.name}
        task={editingTask}
        prefill={prefill}
      />
    </>
  );
}
