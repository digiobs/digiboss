import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  BarChart3,
  Search,
  Megaphone,
  Linkedin,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PerformanceInsight } from '@/types/insights';
import { nbaTypeConfig } from '@/data/insightsData';
import { cn } from '@/lib/utils';

interface PerformanceInsightCardProps {
  insight: PerformanceInsight;
}

const sourceIcons = {
  ga4: BarChart3,
  gsc: Search,
  ads: Megaphone,
  linkedin: Linkedin,
};

const sourceLabels = {
  ga4: 'GA4',
  gsc: 'Search Console',
  ads: 'Google Ads',
  linkedin: 'LinkedIn',
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

export function PerformanceInsightCard({ insight }: PerformanceInsightCardProps) {
  const SourceIcon = sourceIcons[insight.source];
  const themeConfig = nbaTypeConfig[insight.theme];

  const isPositive = insight.tldr.includes('+') || 
    insight.tldr.toLowerCase().includes('augment') || 
    insight.tldr.toLowerCase().includes('amélio');

  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', themeConfig.bgColor)}>
            <SourceIcon className={cn('w-4 h-4', themeConfig.color)} />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {sourceLabels[insight.source]}
            </Badge>
            <Badge variant="secondary" className={cn('text-xs', themeConfig.bgColor, themeConfig.color)}>
              {themeConfig.label}
            </Badge>
          </div>
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

      {/* TL;DR */}
      <div className="flex items-start gap-2 mb-3">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
        )}
        <p className="text-sm font-medium text-foreground">{insight.tldr}</p>
      </div>

      {/* So What */}
      <div className="p-3 rounded-lg bg-muted/50 mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          So what?
        </p>
        <p className="text-sm text-foreground">{insight.soWhat}</p>
      </div>

      {/* Evidence */}
      <div className="flex items-center gap-2 mb-4">
        {insight.evidence.map((ev, idx) => (
          <a
            key={idx}
            href={ev.link}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {ev.label}
          </a>
        ))}
      </div>

      {/* Score */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Score: <span className="font-medium text-foreground">{insight.score}/100</span>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1">
          <ArrowRight className="w-3 h-3" />
          View recommendation
        </Button>
      </div>
    </div>
  );
}
