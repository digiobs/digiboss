import { useState } from 'react';
import { Calendar, LayoutGrid, List, Plus, Sparkles, Clock } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { campaigns } from '@/data/mockData';
import { Task, mockTasks, taskColumns, TaskStatus } from '@/types/tasks';
import { TaskDetailPanel } from '@/components/plan/TaskDetailPanel';
import { KanbanColumn } from '@/components/plan/KanbanColumn';
import { DraggableTaskCard } from '@/components/plan/DraggableTaskCard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type ViewMode = 'calendar' | 'kanban' | 'list';

const priorityColors = {
  high: 'impact-high',
  medium: 'impact-medium',
  low: 'impact-low',
};

export default function Plan() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
  };

  const getTasksByStatus = (status: TaskStatus) => 
    tasks.filter((t) => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropping over a column
    const isOverColumn = taskColumns.some((col) => col.id === overId);
    if (isOverColumn) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId ? { ...t, status: newStatus } : t
          )
        );
      }
      return;
    }

    // Check if dropping over another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Reorder within same column
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.status === overTask.status) {
      setTasks((prev) => {
        const columnTasks = prev.filter((t) => t.status === activeTask.status);
        const otherTasks = prev.filter((t) => t.status !== activeTask.status);
        
        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);
        
        const reorderedTasks = [...columnTasks];
        const [movedTask] = reorderedTasks.splice(oldIndex, 1);
        reorderedTasks.splice(newIndex, 0, movedTask);
        
        return [...otherTasks, ...reorderedTasks];
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Plan</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Your marketing roadmap, calendar, and task execution hub.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI Suggest Plan
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-4">
            {taskColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={getTasksByStatus(column.id)}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90">
                <DraggableTaskCard task={activeTask} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-5">Task</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-2">Assignee</div>
            <div className="col-span-2">Due Date</div>
          </div>
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors items-center"
              >
                <div className="col-span-5 flex items-center gap-3">
                  {task.aiGenerated && (
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge variant="secondary" className={cn(
                    'text-xs',
                    task.status === 'done' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    task.status === 'doing' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    task.status === 'review' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    task.status === 'backlog' && 'bg-muted text-muted-foreground'
                  )}>
                    {taskColumns.find((c) => c.id === task.status)?.title}
                  </Badge>
                </div>
                <div className="col-span-1">
                  <Badge variant="secondary" className={cn('text-xs', priorityColors[task.priority])}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="col-span-2">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {task.assignee[0]}
                      </div>
                      <span className="text-sm">{task.assignee}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === 'calendar' && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Calendar View</h3>
          <p className="text-muted-foreground">
            Visual calendar with content, campaigns, and meetings.
          </p>
        </div>
      )}

      {/* Active Campaigns */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Active Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{campaign.name}</h3>
                <Badge
                  variant="secondary"
                  className={
                    campaign.status === 'active'
                      ? 'status-completed'
                      : campaign.status === 'draft'
                      ? 'status-new'
                      : 'status-in-progress'
                  }
                >
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{campaign.channel}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
                </span>
                <span className="font-medium">{campaign.leads} leads</span>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
}
