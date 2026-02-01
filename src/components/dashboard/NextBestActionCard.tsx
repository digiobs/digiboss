import { cn } from '@/lib/utils';
import {
  NextBestAction,
  actionTypeLabels,
  actionTypeColors,
  funnelStageLabels,
} from '@/data/dashboardData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarPlus,
  UserPlus,
  FileEdit,
  X,
  ExternalLink,
  Lightbulb,
  Zap,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NextBestActionCardProps {
  action: NextBestAction;
  isSelected: boolean;
  onSelect: () => void;
}

const impactColors = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const effortLabels = { S: 'Small', M: 'Medium', L: 'Large' };

export function NextBestActionCard({ action, isSelected, onSelect }: NextBestActionCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'rounded-lg border p-4 transition-all cursor-pointer',
        'hover:shadow-md hover:border-primary/30',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
          : 'border-border bg-card'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Badge className={cn('text-[10px] px-1.5 py-0', actionTypeColors[action.type])}>
              {actionTypeLabels[action.type]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {funnelStageLabels[action.funnelStage]}
            </span>
          </div>
          <h4 className="font-medium text-sm leading-snug">{action.title}</h4>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Impact:</span>
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', impactColors[action.impact])}>
            {action.impact}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Confidence:</span>
          <span className="font-medium">{action.confidence}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Effort:</span>
          <span className="font-medium">{effortLabels[action.effort]}</span>
        </div>
      </div>

      {/* Why now */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
          <Lightbulb className="w-3 h-3" />
          <span>Why now</span>
        </div>
        <ul className="space-y-1">
          {action.whyNow.map((reason, idx) => (
            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Evidence links */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {action.evidenceLinks.map((link, idx) => (
          <button
            key={idx}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
          >
            <ExternalLink className="w-2.5 h-2.5" />
            {link.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button
          size="sm"
          variant="default"
          className="h-7 text-xs gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarPlus className="w-3 h-3" />
          Add to Plan
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <UserPlus className="w-3 h-3" />
          Assign
        </Button>
        {action.isContentRelated && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <FileEdit className="w-3 h-3" />
            Draft
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <X className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Not relevant</DropdownMenuItem>
            <DropdownMenuItem>Already done</DropdownMenuItem>
            <DropdownMenuItem>Missing data</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
