import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task, TaskStatus } from '@/types/tasks';
import { DraggableTaskCard } from './DraggableTaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ id, title, color, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="w-6 h-6">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          `${color} rounded-lg p-2 min-h-[400px] space-y-2 transition-all`,
          isOver && "ring-2 ring-primary/50 ring-dashed"
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
