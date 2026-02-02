import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Sparkles,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ExternalInsight } from '@/types/insights';
import { nbaTypeConfig } from '@/data/insightsData';
import { cn } from '@/lib/utils';

interface ExternalInsightCardProps {
  insight: ExternalInsight;
}

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

export function ExternalInsightCard({ insight }: ExternalInsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const themeConfig = nbaTypeConfig[insight.theme];

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={cn(
        'p-4 rounded-xl border bg-card transition-colors',
        insight.isVerified 
          ? 'border-border hover:border-primary/30' 
          : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              Perplexity
            </Badge>
            <Badge variant="secondary" className={cn('text-xs', themeConfig.bgColor, themeConfig.color)}>
              {themeConfig.label}
            </Badge>
            {!insight.isVerified && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1">
                <AlertTriangle className="w-3 h-3" />
                Unverified
              </Badge>
            )}
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

        {/* Confidence indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                insight.confidence >= 80 ? 'bg-green-500' : insight.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${insight.confidence}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{insight.confidence}% confidence</span>
        </div>

        {/* TL;DR */}
        <p className="text-sm font-medium text-foreground mb-3">{insight.tldr}</p>

        {/* So What */}
        <div className="p-3 rounded-lg bg-muted/50 mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            So what?
          </p>
          <p className="text-sm text-foreground">{insight.soWhat}</p>
        </div>

        {/* Question (collapsible) */}
        <CollapsibleContent>
          <div className="p-3 rounded-lg border border-border mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Perplexity Question
            </p>
            <p className="text-sm text-muted-foreground italic">"{insight.perplexityQuestion}"</p>
          </div>
        </CollapsibleContent>

        {/* Citations */}
        {insight.citations.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Citations ({insight.citations.length})
            </p>
            <div className="space-y-1.5">
              {insight.citations.slice(0, isExpanded ? undefined : 2).map((citation, idx) => (
                <a
                  key={idx}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{citation.title}</span>
                  {citation.date && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(citation.date), 'd MMM yyyy', { locale: fr })}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {insight.citations.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              No citations available. This insight needs verification.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
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
          <div className="text-xs text-muted-foreground">
            Score: <span className="font-medium text-foreground">{insight.score}/100</span>
          </div>
        </div>
      </div>
    </Collapsible>
  );
}
