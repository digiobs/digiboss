import { useState } from 'react';
import { LayoutGrid, BarChart3, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useClient } from '@/contexts/ClientContext';
import { useWrikeTasks } from '@/hooks/useWrikeTasks';
import { WrikeKanban } from '@/components/plan/WrikeKanban';
import { ClientAvancement } from '@/components/plan/ClientAvancement';
import { CreateTaskDialog } from '@/components/plan/CreateTaskDialog';
import { VisibilityToggle } from '@/components/plan/VisibilityToggle';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'avancement';

export default function Plan() {
  const { mode, toggle, isAdmin } = useVisibilityMode();
  const { currentClient, isAllClientsSelected } = useClient();
  const { data: tasks = [], isLoading, error } = useWrikeTasks({
    clientId: isAllClientsSelected ? undefined : currentClient?.id,
  });
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('avancement');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
            {viewMode === 'kanban'
              ? 'Kanban de production de contenu — données Wrike en temps réel.'
              : 'Suivi d\'avancement des tâches par client.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('avancement')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'avancement'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Avancement
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
          </div>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </Button>
          {isAdmin && viewMode === 'kanban' && (
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

      {/* Content */}
      {viewMode === 'kanban' ? (
        <WrikeKanban
          tasks={tasks}
          isAdmin={isAdmin}
          isLoading={isLoading}
          error={error ? (error as Error).message : null}
        />
      ) : (
        <ClientAvancement
          clientId={isAllClientsSelected ? undefined : currentClient?.id}
        />
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        isAdmin={isAdmin}
        defaultClientId={isAllClientsSelected ? undefined : currentClient?.id}
        clientName={isAllClientsSelected ? undefined : currentClient?.name}
      />
    </div>
  );
}
