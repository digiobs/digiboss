import { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  UserPlus,
  TrendingUp,
  Clock,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { NBA } from '@/types/insights';
import { nbaTypeConfig, formatTimestamp, getMeetingById } from '@/data/insightsData';
import { cn } from '@/lib/utils';

interface NBACardProps {
  nba: NBA;
  compact?: boolean;
  onConvertToTask?: (nba: NBA) => void;
}

const impactColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const effortLabels = {
  s: 'Small',
  m: 'Medium',
  l: 'Large',
};

const funnelLabels = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  conversion: 'Conversion',
};

const statusColors = {
  proposed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  implemented: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function NBACard({ nba, compact = false, onConvertToTask }: NBACardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const typeConfig = nbaTypeConfig[nba.type];

  const meeting = nba.meetingId ? getMeetingById(nba.meetingId) : null;

  if (compact) {
    return (
      <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={cn('text-xs', typeConfig.bgColor, typeConfig.color)}>
                {typeConfig.label}
              </Badge>
              <Badge variant="secondary" className={cn('text-xs', impactColors[nba.impact])}>
                {nba.impact.charAt(0).toUpperCase() + nba.impact.slice(1)} Impact
              </Badge>
              <Badge variant="secondary" className={cn('text-xs', statusColors[nba.status])}>
                {nba.status.charAt(0).toUpperCase() + nba.status.slice(1)}
              </Badge>
            </div>
            <h4 className="font-medium text-foreground">{nba.title}</h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {nba.confidence}% confidence
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Effort: {effortLabels[nba.effort]}
              </span>
            </div>
          </div>
        </div>

        {nba.whyBullets.length > 0 && (
          <ul className="mt-3 space-y-1">
            {nba.whyBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className={cn('text-xs', typeConfig.bgColor, typeConfig.color)}>
                {typeConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {funnelLabels[nba.funnel]}
              </Badge>
              <Badge variant="secondary" className={cn('text-xs', impactColors[nba.impact])}>
                {nba.impact.charAt(0).toUpperCase() + nba.impact.slice(1)}
              </Badge>
              <Badge variant="secondary" className={cn('text-xs', statusColors[nba.status])}>
                {nba.status.charAt(0).toUpperCase() + nba.status.slice(1)}
              </Badge>
            </div>
            <h4 className="font-semibold text-foreground">{nba.title}</h4>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary">{nba.confidence}%</div>
            <div className="text-xs text-muted-foreground">confidence</div>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Effort: {effortLabels[nba.effort]}
          </span>
          {nba.assignedTo && (
            <span className="flex items-center gap-1">
              <UserPlus className="w-3 h-3" />
              {nba.assignedTo}
            </span>
          )}
          <span>Score: {nba.score}/100</span>
        </div>

        {/* Why bullets */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Why this action?
          </p>
          <ul className="space-y-1.5">
            {nba.whyBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        {/* Evidence */}
        {nba.evidence.length > 0 && (
          <CollapsibleContent>
            <div className="mt-4 p-3 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Evidence
              </p>
              <ul className="space-y-2">
                {nba.evidence.map((evidence, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                    {evidence.type === 'meeting_timestamp' && meeting && (
                      <span>
                        Meeting: {meeting.title} at {formatTimestamp(evidence.timestamp || 0)}
                      </span>
                    )}
                    {evidence.type === 'verbatim' && (
                      <span className="italic">"{evidence.text}"</span>
                    )}
                    {evidence.type === 'performance_data' && (
                      <a href={evidence.link} className="text-primary hover:underline">
                        {evidence.source}
                      </a>
                    )}
                    {evidence.type === 'transcript' && (
                      <span>Transcript excerpt</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </CollapsibleContent>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Less details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  More details
                </>
              )}
            </Button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-2">
            {nba.status === 'proposed' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowRejectReason(!showRejectReason)}
                >
                  <X className="w-3 h-3" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
            >
              <UserPlus className="w-3 h-3" />
              Assign
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1"
              onClick={() => onConvertToTask?.(nba)}
            >
              <Sparkles className="w-3 h-3" />
              Convert to task
            </Button>
          </div>
        </div>

        {/* Reject reason */}
        {showRejectReason && nba.status === 'proposed' && (
          <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">
              Rejection reason (required)
            </p>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="already_done">Already done</SelectItem>
                <SelectItem value="not_relevant">Not relevant</SelectItem>
                <SelectItem value="missing_context">Missing context</SelectItem>
                <SelectItem value="data_wrong">Data wrong</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectReason(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm">
                Confirm rejection
              </Button>
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
}
