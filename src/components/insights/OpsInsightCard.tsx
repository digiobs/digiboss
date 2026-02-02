import {
  AlertTriangle,
  Clock,
  AlertCircle,
  Link as LinkIcon,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OpsInsight } from '@/types/insights';
import { cn } from '@/lib/utils';

interface OpsInsightCardProps {
  insight: OpsInsight;
}

const typeConfig = {
  blocker: {
    icon: AlertTriangle,
    label: 'Blocker',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  validation_pending: {
    icon: Clock,
    label: 'Pending Validation',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  dependency_missing: {
    icon: LinkIcon,
    label: 'Missing Dependency',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
};

const urgencyColors = {
  now: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  later: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const impactColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export function OpsInsightCard({ insight }: OpsInsightCardProps) {
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'p-4 rounded-xl border bg-card transition-colors',
      config.borderColor
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
            <Icon className={cn('w-4 h-4', config.color)} />
          </div>
          <Badge variant="secondary" className={cn('text-xs', config.bgColor, config.color)}>
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn('text-xs', urgencyColors[insight.urgency])}>
            {insight.urgency === 'now' ? 'Now' : insight.urgency === 'soon' ? 'Soon' : 'Later'}
          </Badge>
          <Badge variant="secondary" className={cn('text-xs', impactColors[insight.impact])}>
            {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Title & Description */}
      <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
      <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>

      {/* Links */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
        {insight.linkedTaskId && (
          <a href="#" className="flex items-center gap-1 text-primary hover:underline">
            <LinkIcon className="w-3 h-3" />
            View task
          </a>
        )}
        {insight.linkedMeetingId && (
          <a href="#" className="flex items-center gap-1 text-primary hover:underline">
            <LinkIcon className="w-3 h-3" />
            View meeting
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Score: <span className="font-medium text-foreground">{insight.score}/100</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <Bell className="w-3 h-3" />
            Notify
          </Button>
          <Button size="sm" className="text-xs gap-1">
            <ArrowRight className="w-3 h-3" />
            Convert to task
          </Button>
        </div>
      </div>
    </div>
  );
}
