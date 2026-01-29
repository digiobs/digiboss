import { useState } from 'react';
import { ArrowRight, ExternalLink, AlertTriangle, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import type { Insight } from '@/data/mockData';

interface InsightCardProps {
  insight: Insight;
}

const typeLabels = {
  competitor: { label: 'Competitor', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  seo: { label: 'SEO', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  product: { label: 'Product', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  industry: { label: 'Industry', class: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  client: { label: 'Client', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  opportunity: Zap,
};

export function InsightCard({ insight }: InsightCardProps) {
  const typeInfo = typeLabels[insight.type];
  const SeverityIcon = severityIcons[insight.severity];
  const [imageError, setImageError] = useState(false);
  
  const hasValidImage = insight.imageUrl && !imageError;

  return (
    <div className="insight-card overflow-hidden">
      {/* Thumbnail */}
      {hasValidImage && (
        <div className="relative w-full">
          <AspectRatio ratio={16 / 9}>
            <img 
              src={insight.imageUrl} 
              alt={insight.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            {/* Badges overlay on image */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Badge variant="secondary" className={typeInfo.class}>
                {typeInfo.label}
              </Badge>
              {insight.severity === 'warning' && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Alert
                </Badge>
              )}
              {insight.severity === 'opportunity' && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Zap className="w-3 h-3 mr-1" />
                  Opportunity
                </Badge>
              )}
            </div>
          </AspectRatio>
        </div>
      )}
      
      <div className="p-5">
        {/* Header - only show badges here if no image */}
        {!hasValidImage && (
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={typeInfo.class}>
                {typeInfo.label}
              </Badge>
              {insight.severity === 'warning' && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Alert
                </Badge>
              )}
              {insight.severity === 'opportunity' && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Zap className="w-3 h-3 mr-1" />
                  Opportunity
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(insight.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {/* Date when image is present */}
        {hasValidImage && (
          <div className="flex justify-end mb-2">
            <span className="text-xs text-muted-foreground">
              {new Date(insight.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Title & Summary */}
        <h3 className="font-semibold text-foreground mb-2">{insight.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{insight.summary}</p>

        {/* TL;DR - So What */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            So what?
          </p>
          <p className="text-sm text-foreground">{insight.soWhat}</p>
        </div>

        {/* Source */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <ExternalLink className="w-3 h-3" />
          <span>Source: {insight.source}</span>
        </div>

        {/* Recommended Actions */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Recommended Actions
          </p>
          <ul className="space-y-1.5 mb-4">
            {insight.recommendedActions.map((action, idx) => (
              <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                {action}
              </li>
            ))}
          </ul>
          <Button size="sm" className="w-full">
            Add to Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
