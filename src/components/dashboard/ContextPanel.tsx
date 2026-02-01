import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  contextInsights,
  contextAssets,
  integrationStatuses,
  recentActivity,
  type NextBestAction,
} from '@/data/dashboardData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  FolderOpen,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  FileText,
  Presentation,
  Book,
  File,
  Activity,
  ExternalLink,
  User,
  Calendar,
  Link2,
} from 'lucide-react';

interface ContextPanelProps {
  selectedAction: NextBestAction | null;
}

const insightSeverityColors = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  opportunity: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const assetTypeIcons = {
  template: FileText,
  deck: Presentation,
  guideline: Book,
  doc: File,
};

const statusIcons = {
  connected: CheckCircle2,
  error: AlertCircle,
  missing: XCircle,
};

const statusColors = {
  connected: 'text-emerald-500',
  error: 'text-red-500',
  missing: 'text-muted-foreground',
};

export function ContextPanel({ selectedAction }: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState('insights');

  if (!selectedAction) {
    // Default view - Integration status + Recent activity
    return (
      <div className="h-full flex flex-col">
        <h3 className="font-semibold text-sm mb-4">Context & Execution</h3>

        {/* Integration Status */}
        <div className="mb-6">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Data Sources
          </h4>
          <div className="space-y-2">
            {integrationStatuses.map((integration) => {
              const StatusIcon = statusIcons[integration.status];
              return (
                <div
                  key={integration.name}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={cn('w-4 h-4', statusColors[integration.status])}
                    />
                    <span className="text-sm">{integration.name}</span>
                  </div>
                  {integration.lastSync && (
                    <span className="text-xs text-muted-foreground">
                      {integration.lastSync}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Recent Activity
          </h4>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.title}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px]',
                      item.performance === 'trending' &&
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                      item.performance === 'top' &&
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    )}
                  >
                    {item.performance}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{item.type}</span>
                  <span>•</span>
                  <span>
                    {item.views || item.leads || item.registrations}{' '}
                    {item.views ? 'views' : item.leads ? 'leads' : 'registrations'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty state hint */}
        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Select an action to see related context
          </p>
        </div>
      </div>
    );
  }

  // Action-specific context view
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">Context for:</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {selectedAction.title}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="insights" className="text-xs gap-1">
            <Lightbulb className="w-3 h-3" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="assets" className="text-xs gap-1">
            <FolderOpen className="w-3 h-3" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="workflow" className="text-xs gap-1">
            <GitBranch className="w-3 h-3" />
            Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="flex-1 mt-4 overflow-y-auto">
          <div className="space-y-3">
            {contextInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Badge
                    className={cn(
                      'text-[10px] shrink-0',
                      insightSeverityColors[insight.severity]
                    )}
                  >
                    {insight.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">
                    {insight.type}
                  </span>
                </div>
                <h5 className="text-sm font-medium mb-1">{insight.title}</h5>
                <p className="text-xs text-muted-foreground">{insight.summary}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="flex-1 mt-4 overflow-y-auto">
          <div className="space-y-2">
            {contextAssets.map((asset) => {
              const AssetIcon = assetTypeIcons[asset.type];
              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <AssetIcon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {asset.updatedAt}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="flex-1 mt-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Owner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Owner</span>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Assign
              </Button>
            </div>

            {/* Due date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due date</span>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Set date
              </Button>
            </div>

            {/* Dependencies */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Dependencies</span>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Add
              </Button>
            </div>

            {/* Status */}
            <div className="pt-4 border-t border-border">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Status
              </h5>
              <Badge variant="secondary" className="text-xs">
                Not started
              </Badge>
            </div>

            {/* Comments placeholder */}
            <div className="pt-4 border-t border-border">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Comments
              </h5>
              <p className="text-xs text-muted-foreground">No comments yet</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
