import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Sparkles, Clock, GripVertical, PenTool } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Task } from '@/types/tasks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const priorityColors = {
  high: 'impact-high',
  medium: 'impact-medium',
  low: 'impact-low',
};

interface DraggableTaskCardProps {
  task: Task;
  onClick: () => void;
}

export function DraggableTaskCard({ task, onClick }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0 
    ? (completedSubtasks / task.subtasks.length) * 100 
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 -ml-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0" onClick={onClick}>
          {/* Source badges */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {task.aiGenerated && (
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary font-medium">AI</span>
              </div>
            )}
            {task.sourceModule === 'content-creator' && (
              <div className="flex items-center gap-1">
                <PenTool className="w-3 h-3 text-violet-500" />
                <span className="text-[10px] text-violet-500 font-medium">Content</span>
              </div>
            )}
          </div>
          
          {/* Title */}
          <p className="text-sm font-medium mb-2 group-hover:text-primary transition-colors">
            {task.title}
          </p>

          {/* Subtask Progress */}
          {task.subtasks.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Subtasks</span>
                <span>{completedSubtasks}/{task.subtasks.length}</span>
              </div>
              <Progress value={subtaskProgress} className="h-1" />
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={cn('text-[10px]', priorityColors[task.priority])}
            >
              {task.priority}
            </Badge>
            <div className="flex items-center gap-2">
              {task.dueDate && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </div>
              )}
              {task.assignee && (
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                  {task.assignee[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
