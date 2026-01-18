import { useState } from 'react';
import { Calendar, LayoutGrid, List, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { campaigns } from '@/data/mockData';

type ViewMode = 'calendar' | 'kanban' | 'list';

const tasks = [
  { id: '1', title: 'Review Q1 content calendar', status: 'done', priority: 'high', assignee: 'Alex' },
  { id: '2', title: 'Launch LinkedIn retargeting', status: 'doing', priority: 'high', assignee: 'Sarah' },
  { id: '3', title: 'A/B test pricing page', status: 'doing', priority: 'medium', assignee: 'Alex' },
  { id: '4', title: 'Create case study draft', status: 'backlog', priority: 'medium', assignee: 'Mike' },
  { id: '5', title: 'Optimize blog for SEO', status: 'backlog', priority: 'high', assignee: null },
  { id: '6', title: 'Update email sequences', status: 'review', priority: 'low', assignee: 'Sarah' },
];

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-muted' },
  { id: 'doing', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'review', title: 'Review', color: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'done', title: 'Done', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
];

export default function Plan() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

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
        <div className="grid grid-cols-4 gap-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.id);
            return (
              <div key={column.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="w-6 h-6">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className={`${column.color} rounded-lg p-2 min-h-[400px] space-y-2`}>
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <p className="text-sm font-medium mb-2">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={
                            task.priority === 'high'
                              ? 'impact-high'
                              : task.priority === 'medium'
                              ? 'impact-medium'
                              : 'impact-low'
                          }
                        >
                          {task.priority}
                        </Badge>
                        {task.assignee && (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {task.assignee[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar/List View Placeholder */}
      {(viewMode === 'calendar' || viewMode === 'list') && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {viewMode === 'calendar' ? 'Calendar View' : 'List View'}
          </h3>
          <p className="text-muted-foreground">
            {viewMode === 'calendar'
              ? 'Visual calendar with content, campaigns, and meetings.'
              : 'All tasks in a sortable, filterable list.'}
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
    </div>
  );
}
