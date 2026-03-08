import { useState, useEffect } from 'react';
import { Calendar, LayoutGrid, List, Plus, Sparkles, PenTool, RefreshCcw } from 'lucide-react';
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
import { Task, mockTasks, taskColumns, TaskStatus, TaskPriority } from '@/types/tasks';
import { TaskDetailPanel } from '@/components/plan/TaskDetailPanel';
import { CreateTaskDialog } from '@/components/plan/CreateTaskDialog';
import { AISuggestionsDialog } from '@/components/plan/AISuggestionsDialog';
import { KanbanColumn } from '@/components/plan/KanbanColumn';
import { DraggableTaskCard } from '@/components/plan/DraggableTaskCard';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabasePlanTasks } from '@/hooks/useSupabaseTabData';
import { subscribeToContentTasks, CONTENT_TASK_CREATED_EVENT } from '@/hooks/useContentPlanLink';
import { useNavigate } from 'react-router-dom';

interface AISuggestion {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  estimatedHours?: number;
  tags?: string[];
}

type ViewMode = 'calendar' | 'kanban' | 'list';

const priorityColors = {
  high: 'impact-high',
  medium: 'impact-medium',
  low: 'impact-low',
};

const statusToWrikeStep: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  doing: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function Plan() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const { data: dbTasks, loading: tasksLoading } = useSupabasePlanTasks(mockTasks);
  const [tasks, setTasks] = useState<Task[]>(dbTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // AI Suggestions state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [wrikeMatching, setWrikeMatching] = useState(false);
  

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Listen for tasks created from Content Creator
  useEffect(() => {
    const unsubscribe = subscribeToContentTasks((newTask: Task) => {
      setTasks(prev => [newTask, ...prev]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setTasks(dbTasks);
  }, [dbTasks]);

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

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'comments'>) => {
    setCreating(true);
    
    try {
      const newTask: Task = {
        ...taskData,
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: [],
        comments: [],
      };

      toast.success('Task created successfully!');
      setTasks((prev) => [newTask, ...prev]);
      setCreateOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  // AI Suggest Plan
  const fetchAISuggestions = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiDialogOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-tasks', {
        body: {
          currentTasks: tasks.map(t => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
          })),
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI suggestions');
      }

      if (data?.suggestions) {
        setAiSuggestions(data.suggestions);
      } else {
        setAiSuggestions([]);
      }
    } catch (error: unknown) {
      console.error('AI suggestions error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
        setAiError('Rate limit exceeded. Please try again in a moment.');
      } else if (errorMessage.includes('402') || errorMessage.includes('Payment')) {
        setAiError('AI credits exhausted. Please add funds to continue.');
      } else {
        setAiError(errorMessage || 'Failed to get AI suggestions');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAISuggestions = (suggestions: AISuggestion[]) => {
    const newTasks: Task[] = suggestions.map((s, index) => ({
      id: `ai-${Date.now()}-${index}`,
      title: s.title,
      description: s.description,
      status: 'backlog' as TaskStatus,
      priority: s.priority,
      assignee: null,
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: s.tags || [],
      subtasks: [],
      comments: [],
      estimatedHours: s.estimatedHours,
      aiGenerated: true,
    }));

    setTasks((prev) => [...newTasks, ...prev]);
    toast.success(`Added ${suggestions.length} AI-suggested task${suggestions.length > 1 ? 's' : ''} to your plan!`);
  };

  const runWrikeAutoMatch = async () => {
    setWrikeMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('wrike-auto-match', {
        body: {},
      });
      if (error) {
        throw new Error(error.message || 'Failed to run Wrike auto-match');
      }

      const updates = Array.isArray(data?.updates) ? (data.updates as Array<Record<string, unknown>>) : [];
      if (updates.length === 0) {
        toast.info(data?.message || 'No new Wrike match found.');
        setWrikeMatching(false);
        return;
      }

      const updatesByTaskId = new Map(
        updates.map((u) => [
          String(u.id ?? ''),
          {
            wrikeTaskId: typeof u.wrike_task_id === 'string' ? u.wrike_task_id : undefined,
            wrikeStepId: typeof u.wrike_step_id === 'string' ? u.wrike_step_id : undefined,
            wrikeProjectId: typeof u.wrike_project_id === 'string' ? u.wrike_project_id : undefined,
            wrikePermalink: typeof u.wrike_permalink === 'string' ? u.wrike_permalink : undefined,
          },
        ]),
      );

      setTasks((prev) =>
        prev.map((task) => {
          const match = updatesByTaskId.get(task.id);
          if (!match) return task;
          return {
            ...task,
            ...match,
          };
        }),
      );

      toast.success(`Wrike auto-match done: ${updates.length} task(s) linked.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('wrike auto-match error:', error);
      toast.error(message || 'Failed to run Wrike auto-match');
    } finally {
      setWrikeMatching(false);
    }
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

  const wrikeMatchedCount = tasks.filter((t) => t.wrikeTaskId || t.wrikeStepId).length;

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
          <Button variant="outline" className="gap-2" onClick={runWrikeAutoMatch} disabled={wrikeMatching}>
            <RefreshCcw className={cn('w-4 h-4', wrikeMatching && 'animate-spin')} />
            Auto-match Wrike
          </Button>
          <Button variant="outline" className="gap-2" onClick={fetchAISuggestions} disabled={aiLoading}>
            <Sparkles className={cn("w-4 h-4", aiLoading && "animate-pulse")} />
            AI Suggest Plan
          </Button>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>
      <TabDataStatusBanner tab="plan" />

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

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Wrike Match Coverage</p>
            <p className="text-xs text-muted-foreground">
              Matched tasks for selected client: {wrikeMatchedCount}/{tasks.length || 0}
            </p>
          </div>
          <Badge variant="secondary">
            {tasks.length > 0 ? Math.round((wrikeMatchedCount / tasks.length) * 100) : 0}% matched
          </Badge>
        </div>
      </div>

      {/* Kanban View with Next Best Actions Column */}
      {viewMode === 'kanban' && (
        <>
        {tasksLoading && (
          <div className="text-xs text-muted-foreground">Loading tasks from Supabase...</div>
        )}
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
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-14 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Task</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-2">Wrike Step</div>
            <div className="col-span-2">Wrike Task</div>
            <div className="col-span-2">Assignee</div>
            <div className="col-span-1">Due Date</div>
          </div>
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="grid grid-cols-14 gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors items-center"
              >
                <div className="col-span-4 flex items-center gap-3">
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
                <div className="col-span-2 text-sm text-muted-foreground">
                  {task.wrikeStepId || statusToWrikeStep[task.status] || 'NA'}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {task.wrikeTaskId ? (
                    task.wrikePermalink ? (
                      <a
                        href={task.wrikePermalink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {task.wrikeTaskId}
                      </a>
                    ) : (
                      task.wrikeTaskId
                    )
                  ) : (
                    'NA'
                  )}
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
                <div className="col-span-1 text-sm text-muted-foreground">
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
          {campaigns.map((campaign) => {
            const progress = campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0;
            return (
              <div key={campaign.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{campaign.name}</span>
                  <Badge variant="secondary">{campaign.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {campaign.channel} • ${campaign.budget.toLocaleString()}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{progress}% spent</span>
                  <span>{campaign.endDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdateTask={handleUpdateTask}
      />

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateTask={handleCreateTask}
        isLoading={creating}
      />

      {/* AI Suggestions Dialog */}
      <AISuggestionsDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        suggestions={aiSuggestions}
        isLoading={aiLoading}
        error={aiError}
        onAddSuggestions={handleAddAISuggestions}
        onRetry={fetchAISuggestions}
      />
    </div>
  );
}