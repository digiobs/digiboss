import { useMemo, useState } from 'react';
import { Users, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { LemlistLeadTable } from '@/components/prospects/LemlistLeadTable';
import { LemlistLeadDrawer } from '@/components/prospects/LemlistLeadDrawer';
import { LemlistCampaignPicker } from '@/components/prospects/LemlistCampaignPicker';
import { useLemlistContacts, type LemlistContactRow } from '@/hooks/useLemlistContacts';
import { useLemlistCampaignMapping } from '@/hooks/useLemlistCampaignMapping';

type SortKey = 'recent' | 'opens' | 'replies' | 'name';

function formatRelativeMinutes(iso: string | null): string {
  if (!iso) return 'jamais';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'jamais';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export default function Prospects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [syncing, setSyncing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<LemlistContactRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const { contacts, isLoading, stats, refetch } = useLemlistContacts();
  const { mapping, connect, disconnect } = useLemlistCampaignMapping();

  const handleManualSync = async () => {
    if (!currentClient?.id || isAllClientsSelected) {
      toast.error('Sélectionnez un client pour synchroniser lemlist.');
      return;
    }
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('lemlist-sync', {
        body: { clientId: currentClient.id, limit: 200 },
      });
      if (error) throw error;
      toast.success('Sync lemlist terminée.');
      await refetch();
    } catch (error) {
      console.error('lemlist sync failed:', error);
      toast.error(error instanceof Error ? error.message : 'Sync lemlist échouée.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) => {
        return (
          (c.full_name ?? '').toLowerCase().includes(term) ||
          (c.email ?? '').toLowerCase().includes(term) ||
          (c.company ?? '').toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => (c.status ?? '').toLowerCase().includes(statusFilter));
    }

    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => {
          const da = new Date(a.last_event_at ?? a.contacted_at ?? a.synced_at ?? 0).getTime();
          const db = new Date(b.last_event_at ?? b.contacted_at ?? b.synced_at ?? 0).getTime();
          return db - da;
        });
        break;
      case 'opens':
        result.sort((a, b) => b.emails_opened - a.emails_opened);
        break;
      case 'replies':
        result.sort((a, b) => b.emails_replied - a.emails_replied);
        break;
      case 'name':
        result.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));
        break;
    }

    return result;
  }, [contacts, searchTerm, statusFilter, sortBy]);

  const handleSelect = (contact: LemlistContactRow) => {
    setSelectedContact(contact);
    setDrawerOpen(true);
  };

  const showPicker = isAdmin && !isAllClientsSelected && Boolean(currentClient?.id);
  const emptyNoMapping =
    !isLoading && contacts.length === 0 && !isAllClientsSelected && !mapping;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Prospects · lemlist</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Contacts et métriques lemlist synchronisés pour le client sélectionné.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Dernière synchronisation : {formatRelativeMinutes(stats.lastSyncedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleManualSync}
              disabled={syncing || !mapping || isAllClientsSelected}
              title={!mapping ? 'Connectez une campagne lemlist avant de synchroniser' : undefined}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Synchroniser
            </Button>
          )}
        </div>
      </div>

      {showPicker && (
        <LemlistCampaignPicker
          mapping={mapping}
          enabled={showPicker}
          isConnecting={connect.isPending}
          isDisconnecting={disconnect.isPending}
          onConnect={(campaign) => connect.mutate(campaign)}
          onDisconnect={() => disconnect.mutate()}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Total contacts</p>
          <p className="text-2xl font-bold mt-1">{stats.totalContacts}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Emails envoyés</p>
          <p className="text-2xl font-bold mt-1">{stats.emailsSent}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
          <p className="text-2xl font-bold mt-1">{(stats.openRate * 100).toFixed(0)}%</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Taux de réponse</p>
          <p className="text-2xl font-bold mt-1">{(stats.replyRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher nom, email, société…"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="contacted">Contacté</SelectItem>
            <SelectItem value="opened">Ouvert</SelectItem>
            <SelectItem value="clicked">Cliqué</SelectItem>
            <SelectItem value="replied">Répondu</SelectItem>
            <SelectItem value="interested">Intéressé</SelectItem>
            <SelectItem value="bounced">Bounce</SelectItem>
            <SelectItem value="unsubscribed">Désinscrit</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: SortKey) => setSortBy(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récents</SelectItem>
            <SelectItem value="opens">Plus d'ouvertures</SelectItem>
            <SelectItem value="replies">Plus de réponses</SelectItem>
            <SelectItem value="name">Nom A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground animate-pulse">
          Chargement des contacts lemlist…
        </div>
      )}

      {emptyNoMapping ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune campagne lemlist connectée pour {currentClient?.name ?? 'ce client'}.
          </p>
          {isAdmin ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Utilisez le sélecteur ci-dessus pour connecter une campagne.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Contactez un admin pour connecter une campagne lemlist.
            </p>
          )}
        </div>
      ) : (
        <LemlistLeadTable contacts={filteredContacts} onSelect={handleSelect} />
      )}

      <LemlistLeadDrawer
        contact={selectedContact}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
