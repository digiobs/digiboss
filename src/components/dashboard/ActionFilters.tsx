import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ActionType,
  actionTypeLabels,
  actionTypeColors,
} from '@/data/dashboardData';
import { ArrowDownWideNarrow, Sparkles, Zap, Clock, Target } from 'lucide-react';

interface ActionFiltersProps {
  selectedTypes: ActionType[];
  onTypeToggle: (type: ActionType) => void;
  sortBy: 'recommended' | 'impact' | 'quickwins' | 'urgent';
  onSortChange: (sort: 'recommended' | 'impact' | 'quickwins' | 'urgent') => void;
}

const allTypes: ActionType[] = ['seo', 'content', 'paid', 'social', 'cro', 'crm', 'tech', 'brand'];

const sortOptions = [
  { value: 'recommended' as const, label: 'Recommended', icon: Sparkles },
  { value: 'impact' as const, label: 'Highest Impact', icon: Target },
  { value: 'quickwins' as const, label: 'Quick Wins', icon: Zap },
  { value: 'urgent' as const, label: 'Most Urgent', icon: Clock },
];

export function ActionFilters({
  selectedTypes,
  onTypeToggle,
  sortBy,
  onSortChange,
}: ActionFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Type filters */}
      <div className="flex flex-wrap gap-1.5">
        {allTypes.map((type) => {
          const isSelected = selectedTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => onTypeToggle(type)}
              className={cn(
                'px-2 py-1 rounded-md text-xs font-medium transition-all',
                isSelected
                  ? actionTypeColors[type]
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {actionTypeLabels[type]}
            </button>
          );
        })}
      </div>

      {/* Sort options */}
      <div className="flex items-center gap-1">
        <ArrowDownWideNarrow className="w-3.5 h-3.5 text-muted-foreground mr-1" />
        {sortOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.value}
              variant={sortBy === option.value ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 text-xs gap-1',
                sortBy === option.value && 'bg-primary/10 text-primary'
              )}
              onClick={() => onSortChange(option.value)}
            >
              <Icon className="w-3 h-3" />
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
