import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radar,
  TrendingUp,
  AlertTriangle,
  Zap,
  MessageSquare,
  ExternalLink,
  Plug,
} from 'lucide-react';

interface Signal {
  id: string;
  type: 'competitor' | 'seo' | 'campaign' | 'meeting';
  title: string;
  summary: string;
  timestamp: string;
}

const signalTypeConfig: Record<Signal['type'], { icon: typeof Radar; label: string; className: string }> = {
  competitor: {
    icon: TrendingUp,
    label: 'Competitor',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  seo: {
    icon: AlertTriangle,
    label: 'SEO Anomaly',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  campaign: {
    icon: Zap,
    label: 'Campaign',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  meeting: {
    icon: MessageSquare,
    label: 'Meeting',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
};

const mockSignals: Signal[] = [
  {
    id: '1',
    type: 'competitor',
    title: 'MarketForce launched AI pricing',
    summary: 'Competitor released new AI-powered pricing feature. Monitoring social sentiment.',
    timestamp: '2h ago',
  },
  {
    id: '2',
    type: 'seo',
    title: 'Ranking drop on "automation tools"',
    summary: 'Position moved from #3 to #7. Recommend content refresh.',
    timestamp: '5h ago',
  },
  {
    id: '3',
    type: 'campaign',
    title: 'LinkedIn Ads CTR spike',
    summary: 'New creative achieving 4.2% CTR vs 2.1% benchmark.',
    timestamp: '1d ago',
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Sales call: Enterprise objection',
    summary: '"Pricing too complex" mentioned 3x in recent calls.',
    timestamp: '2d ago',
  },
];

interface SignalsPanelProps {
  isEmpty?: boolean;
}

export function SignalsPanel({ isEmpty = false }: SignalsPanelProps) {
  if (isEmpty) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Signals worth your attention</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Plug className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-sm mb-1">No signals detected</h4>
          <p className="text-xs text-muted-foreground mb-4 max-w-[200px] mx-auto">
            When monitoring or transcripts are connected, important signals will appear here.
          </p>
          <Button variant="outline" size="sm" className="text-xs">
            Connect Insights
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Radar className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Signals worth your attention</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Only what's likely to change your priorities.
      </p>

      <div className="space-y-3">
        {mockSignals.map((signal) => {
          const config = signalTypeConfig[signal.type];
          const Icon = config.icon;

          return (
            <div
              key={signal.id}
              className="group p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-2 mb-2">
                <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', config.className)}>
                  <Icon className="w-2.5 h-2.5 mr-1" />
                  {config.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">{signal.timestamp}</span>
              </div>
              <h5 className="text-sm font-medium mb-1">{signal.title}</h5>
              <p className="text-xs text-muted-foreground line-clamp-2">{signal.summary}</p>
              <button className="mt-2 text-[10px] text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-2.5 h-2.5" />
                View details
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
