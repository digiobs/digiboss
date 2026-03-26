import { useState } from 'react';
import { LayoutGrid, AlertTriangle, RefreshCw } from 'lucide-react';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useClient } from '@/contexts/ClientContext';
import { useWrikeTasks } from '@/hooks/useWrikeTasks';
import { WrikeKanban } from '@/components/plan/WrikeKanban';
import { VisibilityToggle } from '@/components/plan/VisibilityToggle';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@/types/tasks';

const statusToWrikeStep: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  doing: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function Plan() {
  const { mode, toggle, isAdmin } = useVisibilityMode();
  const { currentClient, isAllClientsSelected } = useClient();
  const { data: tasks = [], isLoading, error } = useWrikeTasks({
    clientId: isAllClientsSelected ? undefined : currentClient?.id,
  });
  const [syncing, setSyncing] = useState(false);

  const syncWrike = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('wrike-auto-match', { body: {} });
      if (error) throw error;
      toast.success('Wrike data synced');
      window.location.reload();
    } catch (err) {
      console.error('wrike sync failed:', err);
      toast.error('Wrike sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const wrikeMatchedCount = tasks.length;

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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" className="gap-2" onClick={syncWrike} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Wrike'}
            </Button>
          )}
          <VisibilityToggle mode={mode} onToggle={toggle} />
        </div>
      </div>
      <TabDataStatusBanner tab="plan" />

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
