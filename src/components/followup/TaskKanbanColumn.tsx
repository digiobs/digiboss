import { format } from 'date-fns';
import { Clock, User, Link as LinkIcon, Palette, FileText, Globe, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FollowupTask, TaskStatus, WorkflowType, Priority } from '@/types/followup';
import { cn } from '@/lib/utils';

interface TaskKanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: FollowupTask[];
  onTaskClick: (task: FollowupTask) => void;
}

const workflowIcons: Record<WorkflowType, React.ElementType> = {
  branding: Palette,
  content: FileText,
  web: Globe,
  growth: TrendingUp,
};

const workflowColors: Record<WorkflowType, string> = {
  branding: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  content: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  web: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  growth: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const priorityColors: Record<Priority, string> = {
  P1: 'bg-destructive/10 text-destructive border-destructive/30',
  P2: 'bg-warning/10 text-warning border-warning/30',
  P3: 'bg-muted text-muted-foreground border-muted',
};

export function TaskKanbanColumn({ status, label, tasks, onTaskClick }: TaskKanbanColumnProps) {
  return (
    <div className="w-[220px] shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {tasks.length}
        </Badge>
      </div>
      <div className="space-y-2 min-h-[300px] p-2 rounded-lg bg-muted/30 border border-dashed border-border">
        {tasks.map((task) => {
          const WorkflowIcon = workflowIcons[task.workflow];
          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="p-3 rounded-lg bg-card border shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="flex items-start gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={cn('text-xs shrink-0', priorityColors[task.priority])}
                >
                  {task.priority}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn('text-xs shrink-0', workflowColors[task.workflow])}
                >
                  <WorkflowIcon className="h-3 w-3 mr-0.5" />
                  {task.workflow}
                </Badge>
              </div>
              <h4 className="text-sm font-medium leading-tight line-clamp-2 mb-2">
                {task.title}
              </h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.owner}
                </span>
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(task.dueDate, 'MMM d')}
                  </span>
                )}
              </div>
              {(task.linkedMeetingId || task.linkedAssets?.length) && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <LinkIcon className="h-3 w-3" />
                  <span>
                    {task.linkedMeetingId ? 'Meeting' : ''}
                    {task.linkedMeetingId && task.linkedAssets?.length ? ', ' : ''}
                    {task.linkedAssets?.length ? `${task.linkedAssets.length} asset${task.linkedAssets.length > 1 ? 's' : ''}` : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
