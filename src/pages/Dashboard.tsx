import { useState, useMemo } from 'react';
import { EnhancedKPICard } from '@/components/dashboard/EnhancedKPICard';
import { WeeklyChanges } from '@/components/dashboard/WeeklyChanges';
import { NextBestActionCard } from '@/components/dashboard/NextBestActionCard';
import { ActionFilters } from '@/components/dashboard/ActionFilters';
import { PlanTimeline } from '@/components/dashboard/PlanTimeline';
import { ContextPanel } from '@/components/dashboard/ContextPanel';
import {
  dashboardKPIs,
  nextBestActions,
  type ActionType,
  type NextBestAction,
} from '@/data/dashboardData';
import { useClient } from '@/contexts/ClientContext';
import { Zap, LayoutGrid } from 'lucide-react';

export default function Dashboard() {
  const { currentClient } = useClient();
  const [selectedTypes, setSelectedTypes] = useState<ActionType[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'impact' | 'quickwins' | 'urgent'>('recommended');
  const [selectedAction, setSelectedAction] = useState<NextBestAction | null>(null);

  const handleTypeToggle = (type: ActionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredAndSortedActions = useMemo(() => {
    let actions = [...nextBestActions];

    // Filter by type
    if (selectedTypes.length > 0) {
      actions = actions.filter((a) => selectedTypes.includes(a.type));
    }

    // Sort
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
        // Combined score: urgency + impact + confidence
        actions.sort(
          (a, b) =>
            (b.urgencyScore + b.impactScore + b.confidence) / 3 -
            (a.urgencyScore + a.impactScore + a.confidence) / 3
        );
        break;
    }

    return actions;
  }, [selectedTypes, sortBy]);

  const highlightedActionIds = selectedAction ? [selectedAction.id] : [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {currentClient ? `${currentClient.name} Dashboard` : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Your marketing command center. Here's what matters most.
        </p>
      </div>

      {/* KPI Strip - Full Width */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {dashboardKPIs.map((kpi) => (
          <EnhancedKPICard key={kpi.id} kpi={kpi} onClick={() => {}} />
        ))}
      </div>

      {/* Weekly Changes - Full Width */}
      <WeeklyChanges />

      {/* 3-Column Plan Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Next Best Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Next Best Actions</h2>
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
                    setSelectedAction(selectedAction?.id === action.id ? null : action)
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

        {/* Column 2: Plan Timeline */}
        <div className="lg:col-span-4 bg-card rounded-xl border border-border p-4 shadow-sm">
          <PlanTimeline highlightedActionIds={highlightedActionIds} />
        </div>

        {/* Column 3: Context Panel */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border p-4 shadow-sm">
          <ContextPanel selectedAction={selectedAction} />
        </div>
      </div>
    </div>
  );
}
