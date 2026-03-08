import { useState, useMemo } from 'react';
import { LeadTable } from '@/components/prospects/LeadTable';
import { leads as mockLeads } from '@/data/mockData';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { useSupabaseProspectLeads } from '@/hooks/useSupabaseTabData';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Filter, Plus, Download, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Prospects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score-desc');
  const [syncingLemlist, setSyncingLemlist] = useState(false);
  const { currentClient, isAllClientsSelected } = useClient();
  const { data: leads, refetch } = useSupabaseProspectLeads(mockLeads);

  const syncLemlistLeads = async () => {
    if (!currentClient?.id) return;
    setSyncingLemlist(true);
    try {
      const payload = isAllClientsSelected ? { limit: 50 } : { limit: 50, clientId: currentClient.id };
      const { error } = await supabase.functions.invoke('lemlist-sync', { body: payload });
      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('lemlist sync failed:', error);
    } finally {
      setSyncingLemlist(false);
    }
  };

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

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
      case 'score-desc':
        result.sort((a, b) => b.score - a.score);
        break;
      case 'score-asc':
        result.sort((a, b) => a.score - b.score);
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [leads, searchTerm, stageFilter, sortBy]);

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.stage === 'qualified' || l.stage === 'proposal').length;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / leads.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Prospects</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            AI-scored leads with prioritized outreach recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={syncLemlistLeads} disabled={syncingLemlist}>
            <RefreshCw className={`w-4 h-4 ${syncingLemlist ? 'animate-spin' : ''}`} />
            {syncingLemlist ? 'Syncing Lemlist...' : 'Sync Lemlist'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>
      <TabDataStatusBanner tab="prospects" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Leads</p>
          <p className="text-2xl font-bold mt-1">{totalLeads}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Qualified</p>
          <p className="text-2xl font-bold mt-1">{qualifiedLeads}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Avg. Score</p>
          <p className="text-2xl font-bold mt-1">{avgScore}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search leads..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score-desc">Score (High-Low)</SelectItem>
            <SelectItem value="score-asc">Score (Low-High)</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Lead Table */}
      <LeadTable leads={filteredLeads} />
    </div>
  );
}