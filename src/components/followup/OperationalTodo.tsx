import { useState } from 'react';
import { Plus, LayoutGrid, Calendar as CalendarIcon, Plug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FollowupTask, TaskStatus, WorkflowType } from '@/types/followup';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { StrategicRoadmap } from './StrategicRoadmap';
import { Milestone } from '@/types/followup';

interface OperationalTodoProps {
  tasks: FollowupTask[];
  milestones: Milestone[];
  onTaskUpdate?: (task: FollowupTask) => void;
}

const columns: { status: TaskStatus; label: string }[] = [
  { status: 'idea', label: 'Idea' },
  { status: 'proposal', label: 'Proposal' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'to_validate', label: 'To Validate' },
  { status: 'to_publish', label: 'To Publish' },
  { status: 'waiting_client', label: 'Waiting Client' },
  { status: 'completed', label: 'Completed' },
];

export function OperationalTodo({ tasks, milestones, onTaskUpdate }: OperationalTodoProps) {
  const [view, setView] = useState<'kanban' | 'roadmap'>('kanban');
  const [selectedTask, setSelectedTask] = useState<FollowupTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  const handleTaskClick = (task: FollowupTask) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  if (tasks.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            Operational To-Do
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Plug className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Connect Wrike or Airtable to manage execution</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Link your project management tool to sync tasks, track progress, and keep your team aligned.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Button variant="outline">Connect Wrike</Button>
            <Button variant="outline">Connect Airtable</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              Operational To-Do
            </CardTitle>
            <div className="flex items-center gap-2">
              <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'roadmap')}>
                <TabsList className="h-8">
                  <TabsTrigger value="kanban" className="text-xs px-3 h-6">
                    <LayoutGrid className="h-3 w-3 mr-1" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="roadmap" className="text-xs px-3 h-6">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Roadmap
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button size="sm" className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" />
                Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0 overflow-hidden">
          {view === 'kanban' ? (
            <ScrollArea className="w-full h-[400px]">
              <div className="flex gap-3 pb-4" style={{ minWidth: 'max-content' }}>
                {columns.map((column) => (
                  <TaskKanbanColumn
                    key={column.status}
                    status={column.status}
                    label={column.label}
                    tasks={getTasksByStatus(column.status)}
                    onTaskClick={handleTaskClick}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <StrategicRoadmap milestones={milestones} tasks={tasks} />
          )}
        </CardContent>
      </Card>

      <TaskDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        task={selectedTask}
        onUpdate={onTaskUpdate}
      />
    </>
  );
}
