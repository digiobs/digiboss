import { Quote, Send, Link } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Verbatim, VerbatimTag } from '@/types/followup';
import { cn } from '@/lib/utils';

interface VerbatimCardProps {
  verbatim: Verbatim;
  compact?: boolean;
}

const tagConfig: Record<VerbatimTag, { label: string; color: string }> = {
  pain: { label: 'Pain', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  benefit: { label: 'Benefit', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  objection: { label: 'Objection', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  proof: { label: 'Proof', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  feature: { label: 'Feature', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
};

export function VerbatimCard({ verbatim, compact = false }: VerbatimCardProps) {
  const config = tagConfig[verbatim.tag];

  return (
    <div className={cn('border rounded-lg p-3', compact ? 'bg-background' : 'bg-muted/30')}>
      <div className="flex items-start gap-2 mb-2">
        <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className={cn('text-sm italic flex-1', compact && 'line-clamp-2')}>"{verbatim.quote}"</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{verbatim.speaker}</span>
          {verbatim.timestamp && <span>@ {verbatim.timestamp}</span>}
          <Badge variant="secondary" className={cn('text-xs', config.color)}>
            {config.label}
          </Badge>
        </div>
        {!compact && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
              <Send className="h-3 w-3" />
              Content
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
              <Link className="h-3 w-3" />
              Task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
