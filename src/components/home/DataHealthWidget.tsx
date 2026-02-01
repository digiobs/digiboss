import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Settings,
  Plug,
} from 'lucide-react';

interface DataSource {
  name: string;
  status: 'connected' | 'error' | 'missing';
  lastSync?: string;
}

const dataSources: DataSource[] = [
  { name: 'GA4', status: 'connected', lastSync: '09:14' },
  { name: 'Search Console', status: 'connected', lastSync: '09:14' },
  { name: 'HubSpot', status: 'connected', lastSync: '08:45' },
  { name: 'LinkedIn', status: 'error', lastSync: 'Error' },
  { name: 'Google Ads', status: 'missing' },
];

const statusIcons = {
  connected: CheckCircle2,
  error: AlertCircle,
  missing: XCircle,
};

const statusColors = {
  connected: 'text-emerald-500',
  error: 'text-amber-500',
  missing: 'text-muted-foreground',
};

interface DataHealthWidgetProps {
  isEmpty?: boolean;
}

export function DataHealthWidget({ isEmpty = false }: DataHealthWidgetProps) {
  const connectedCount = dataSources.filter((s) => s.status === 'connected').length;
  const totalCount = dataSources.length;
  const errorCount = dataSources.filter((s) => s.status === 'error').length;

  if (isEmpty) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Data health</h4>
        </div>
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
            <Plug className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-3">No sources connected</p>
          <Button variant="outline" size="sm" className="text-xs h-7">
            Connect integrations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Data health</h4>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Sources connected</span>
          <span className="font-medium">{connectedCount}/{totalCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Last sync</span>
          <span className="font-medium flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Today, 09:14
          </span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tracking alerts</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {errorCount}
            </span>
          </div>
        )}
      </div>

      {/* Source status dots */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border">
        {dataSources.map((source) => {
          const StatusIcon = statusIcons[source.status];
          return (
            <div
              key={source.name}
              className="group relative"
              title={`${source.name}: ${source.status}`}
            >
              <StatusIcon className={cn('w-3.5 h-3.5', statusColors[source.status])} />
            </div>
          );
        })}
        <button className="ml-auto text-[10px] text-primary hover:underline">
          Manage →
        </button>
      </div>
    </div>
  );
}
