import { useState, useMemo, useCallback } from 'react';
import { LeadTable } from '@/components/prospects/LeadTable';
import { leads as mockLeads } from '@/data/mockData';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { useSupabaseProspectLeads } from '@/hooks/useSupabaseTabData';
import { useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Filter, Plus, Download, RefreshCw, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SOURCE_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'lemlist', label: 'Lemlist' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'hubspot', label: 'HubSpot' },
] as const;

type SyncTarget = 'lemlist' | 'hubspot' | 'linkedin';

export default function Prospects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [syncingTarget, setSyncingTarget] = useState<SyncTarget | null>(null);
  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const { data: leads, refetch } = useSupabaseProspectLeads(mockLeads);

  const syncSource = useCallback(async (target: SyncTarget) => {
    setSyncingTarget(target);
    try {
      const fnMap: Record<SyncTarget, string> = {
        lemlist: 'lemlist-sync',
        hubspot: 'hubspot-sync',
        linkedin: 'linkedin-prospects-sync',
      };
      const payload = isAllClientsSelected
        ? { limit: 100 }
        : { limit: 100, clientId: currentClient?.id };
      const { error } = await supabase.functions.invoke(fnMap[target], { body: payload });
      if (error) throw error;
      toast.success(`Sync ${target} terminee`);
      await refetch();
    } catch (error) {
      console.error(`${target} sync failed:`, error);
      toast.error(`Echec sync ${target}`);
    } finally {
      setSyncingTarget(null);
    }
  }, [currentClient?.id, isAllClientsSelected, refetch]);

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Source filter
    if (sourceFilter !== 'all') {
      result = result.filter((lead) => lead.source.toLowerCase() === sourceFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(term) ||
          lead.company.toLowerCase().includes(term) ||
          lead.email.toLowerCase().includes(term)
      );
    }

    // Stage filter
    if (stageFilter !== 'all') {
      result = result.filter((lead) => lead.stage === stageFilter);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => {
          const dateA = new Date(a.lastActivity || 0).getTime();
          const dateB = new Date(b.lastActivity || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'score-desc':
        result.sort((a, b) => b.score - a.score);
        break;
      case 'score-asc':
        result.sort((a, b) => a.score - b.score);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [leads, searchTerm, stageFilter, sourceFilter, sortBy]);

  // Source counts
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    for (const lead of leads) {
      const src = lead.source.toLowerCase();
      counts[src] = (counts[src] || 0) + 1;
    }
    return counts;
  }, [leads]);

  const qualifiedLeads = leads.filter((l) => l.stage === 'qualified' || l.stage === 'proposal').length;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / leads.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Prospects</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Contacts agriges par source, classes par ricence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => syncSource('lemlist')}
                disabled={syncingTarget !== null}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingTarget === 'lemlist' ? 'animate-spin' : ''}`} />
                Lemlist
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => syncSource('linkedin')}
                disabled={syncingTarget !== null}
              >
                <Linkedin className={`w-3.5 h-3.5 ${syncingTarget === 'linkedin' ? 'animate-spin' : ''}`} />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => syncSource('hubspot')}
                disabled={syncingTarget !== null}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingTarget === 'hubspot' ? 'animate-spin' : ''}`} />
                HubSpot
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <TabDataStatusBanner tab="prospects" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Total contacts</p>
          <p className="text-2xl font-bold mt-1">{leads.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Qualifies</p>
          <p className="text-2xl font-bold mt-1">{qualifiedLeads}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Score moyen</p>
          <p className="text-2xl font-bold mt-1">{avgScore}</p>
        </div>
      </div>

      {/* Source tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {SOURCE_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSourceFilter(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sourceFilter === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {label}
            {(sourceCounts[key] ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {sourceCounts[key]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Etape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les etapes</SelectItem>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="contacted">Contacte</SelectItem>
            <SelectItem value="qualified">Qualifie</SelectItem>
            <SelectItem value="proposal">Proposition</SelectItem>
            <SelectItem value="closed">Ferme</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus recents</SelectItem>
            <SelectItem value="score-desc">Score (haut-bas)</SelectItem>
            <SelectItem value="score-asc">Score (bas-haut)</SelectItem>
            <SelectItem value="name">Nom A-Z</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtres
        </Button>
      </div>

      {/* Lead Table */}
      <LeadTable leads={filteredLeads} />
    </div>
  );
}
