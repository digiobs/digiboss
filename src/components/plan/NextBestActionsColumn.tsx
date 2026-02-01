import { useState } from 'react';
import { Lightbulb, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { nextBestActions, type ActionType, type NextBestAction } from '@/data/dashboardData';
import { cn } from '@/lib/utils';
import { 
  Search, 
  DollarSign, 
  Share2, 
  MousePointer, 
  Users, 
  Wrench, 
  Palette, 
  FileText,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react';

const typeConfig: Record<ActionType, { icon: typeof Search; color: string; label: string }> = {
  seo: { icon: Search, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'SEO' },
  content: { icon: FileText, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Content' },
  paid: { icon: DollarSign, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Paid' },
  social: { icon: Share2, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', label: 'Social' },
  cro: { icon: MousePointer, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'CRO' },
  crm: { icon: Users, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', label: 'CRM' },
  tech: { icon: Wrench, color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400', label: 'Tech' },
  brand: { icon: Palette, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', label: 'Brand' },
};

const impactColors = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-emerald-600 dark:text-emerald-400',
};

type SortOption = 'recommended' | 'impact' | 'quickWins' | 'urgent';

interface NextBestActionsColumnProps {
  onActionSelect?: (action: NextBestAction) => void;
  selectedActionId?: string | null;
}

export function NextBestActionsColumn({ onActionSelect, selectedActionId }: NextBestActionsColumnProps) {
  const [selectedTypes, setSelectedTypes] = useState<ActionType[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  const toggleType = (type: ActionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredActions = selectedTypes.length > 0
    ? nextBestActions.filter((a) => selectedTypes.includes(a.type))
    : nextBestActions;

  const sortedActions = [...filteredActions].sort((a, b) => {
    switch (sortBy) {
      case 'impact':
        const impactOrder = { high: 0, medium: 1, low: 2 };
        return impactOrder[a.impact] - impactOrder[b.impact];
      case 'quickWins':
        const effortOrder = { S: 0, M: 1, L: 2 };
        return effortOrder[a.effort] - effortOrder[b.effort];
      case 'urgent':
        return b.confidence - a.confidence;
      default:
        return 0;
    }
  });

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Next Best Actions</h2>
          <Badge variant="secondary" className="text-xs">
            {sortedActions.length}
          </Badge>
        </div>

        {/* Filters & Sort */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Filter className="w-3 h-3" />
                Filter
                {selectedTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {selectedTypes.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {Object.entries(typeConfig).map(([type, config]) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type as ActionType)}
                  onCheckedChange={() => toggleType(type as ActionType)}
                >
                  <config.icon className="w-3 h-3 mr-2" />
                  {config.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem
                checked={sortBy === 'recommended'}
                onCheckedChange={() => setSortBy('recommended')}
              >
                <Zap className="w-3 h-3 mr-2" />
                Recommended
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'impact'}
                onCheckedChange={() => setSortBy('impact')}
              >
                <TrendingUp className="w-3 h-3 mr-2" />
                Highest Impact
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'quickWins'}
                onCheckedChange={() => setSortBy('quickWins')}
              >
                <Clock className="w-3 h-3 mr-2" />
                Quick Wins
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'urgent'}
                onCheckedChange={() => setSortBy('urgent')}
              >
                <Lightbulb className="w-3 h-3 mr-2" />
                Most Urgent
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Action Cards */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {sortedActions.map((action) => {
            const config = typeConfig[action.type];
            const TypeIcon = config.icon;
            const isSelected = selectedActionId === action.id;

            return (
              <div
                key={action.id}
                onClick={() => onActionSelect?.(action)}
                className={cn(
                  'p-3 rounded-lg border transition-all cursor-pointer',
                  'hover:bg-muted/50 hover:border-primary/30',
                  isSelected
                    ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                    : 'bg-background border-border'
                )}
              >
                {/* Type Badge & Title */}
                <div className="flex items-start gap-2 mb-2">
                  <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', config.color)}>
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {action.funnelStage}
                  </Badge>
                </div>

                <h4 className="text-sm font-medium leading-snug mb-2">{action.title}</h4>

                {/* Metrics Row */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                  <span className={cn('font-medium', impactColors[action.impact])}>
                    {action.impact.toUpperCase()} Impact
                  </span>
                  <span>•</span>
                  <span>{action.confidence}% Confidence</span>
                  <span>•</span>
                  <span>Effort: {action.effort}</span>
                </div>

                {/* Why Now */}
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  {action.whyNow.slice(0, 2).map((reason, i) => (
                    <p key={i} className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      <span className="line-clamp-1">{reason}</span>
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
