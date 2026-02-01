import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  nextBestActions,
  type ActionType,
  type NextBestAction,
  actionTypeLabels,
  actionTypeColors,
} from '@/data/dashboardData';
import { NextBestActionCard } from '@/components/dashboard/NextBestActionCard';
import { ActionFilters } from '@/components/dashboard/ActionFilters';
import { Button } from '@/components/ui/button';
import { Zap, LayoutGrid, Plug, Wand2 } from 'lucide-react';

interface HomeNextBestActionsProps {
  isEmpty?: boolean;
  selectedAction: NextBestAction | null;
  onSelectAction: (action: NextBestAction | null) => void;
}

export function HomeNextBestActions({
  isEmpty = false,
  selectedAction,
  onSelectAction,
}: HomeNextBestActionsProps) {
  const [selectedTypes, setSelectedTypes] = useState<ActionType[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'impact' | 'quickwins' | 'urgent'>('recommended');

  const handleTypeToggle = (type: ActionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredAndSortedActions = useMemo(() => {
    let actions = [...nextBestActions];

    if (selectedTypes.length > 0) {
      actions = actions.filter((a) => selectedTypes.includes(a.type));
    }

    switch (sortBy) {
      case 'impact':
        actions.sort((a, b) => b.impactScore - a.impactScore);
        break;
      case 'quickwins':
        actions.sort((a, b) => b.effortScore - a.effortScore);
        break;
      case 'urgent':
        actions.sort((a, b) => b.urgencyScore - a.urgencyScore);
        break;
      case 'recommended':
      default:
        actions.sort(
          (a, b) =>
            (b.urgencyScore + b.impactScore + b.confidence) / 3 -
            (a.urgencyScore + a.impactScore + a.confidence) / 3
        );
        break;
    }

    return actions;
  }, [selectedTypes, sortBy]);

  if (isEmpty) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Next Best Actions</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Wand2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            No recommendations yet — let's generate your first action list
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Connect data sources or import insights to enable Next Best Actions.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" className="gap-2">
              <Plug className="w-4 h-4" />
              Connect data
            </Button>
            <Button className="gap-2">
              <Wand2 className="w-4 h-4" />
              Generate actions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-semibold">Next Best Actions</h2>
          <p className="text-xs text-muted-foreground">
            Ranked by opportunity, impact, and confidence.
          </p>
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredAndSortedActions.length} actions
        </span>
      </div>

      <ActionFilters
        selectedTypes={selectedTypes}
        onTypeToggle={handleTypeToggle}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filteredAndSortedActions.length > 0 ? (
          filteredAndSortedActions.map((action) => (
            <NextBestActionCard
              key={action.id}
              action={action}
              isSelected={selectedAction?.id === action.id}
              onSelect={() =>
                onSelectAction(selectedAction?.id === action.id ? null : action)
              }
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No actions match your filters</p>
            <button
              className="text-primary text-sm mt-2 hover:underline"
              onClick={() => setSelectedTypes([])}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
