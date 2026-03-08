import { useState } from 'react';
import { LayoutGrid, AlertTriangle } from 'lucide-react';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useWrikeTasks } from '@/hooks/useWrikeTasks';
import { WrikeKanban } from '@/components/plan/WrikeKanban';
import { VisibilityToggle } from '@/components/plan/VisibilityToggle';
import { cn } from '@/lib/utils';

export default function Plan() {
  const { mode, toggle, isAdmin } = useVisibilityMode();
  const { data: tasks = [], isLoading, error } = useWrikeTasks();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Planning Éditorial</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Kanban de production de contenu — données Wrike en temps réel.
          </p>
        </div>
        <VisibilityToggle mode={mode} onToggle={toggle} />
      </div>

      {/* Client mode banner */}
      {!isAdmin && (
        <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-4 py-2.5 text-sm text-warning">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Vue partageable activée — les données financières et internes sont masquées.
        </div>
      )}

      {/* Kanban */}
      <WrikeKanban
        tasks={tasks}
        isAdmin={isAdmin}
        isLoading={isLoading}
        error={error ? (error as Error).message : null}
      />
    </div>
  );
}
