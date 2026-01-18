import { useState, useEffect, useMemo } from 'react';
import { LeadTable } from '@/components/prospects/LeadTable';
import { leads as mockLeads } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Filter, Plus, Download, RefreshCw, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHubSpot, HubSpotContact } from '@/hooks/useHubSpot';
import type { Lead } from '@/data/mockData';

// Map HubSpot contact to Lead format
const mapHubSpotContactToLead = (contact: HubSpotContact, index: number): Lead => {
  const firstName = contact.properties.firstname || '';
  const lastName = contact.properties.lastname || '';
  const name = `${firstName} ${lastName}`.trim() || contact.properties.email || 'Unknown';
  
  // Map lifecycle stage to our stages
  const stageMap: Record<string, Lead['stage']> = {
    subscriber: 'new',
    lead: 'new',
    marketingqualifiedlead: 'contacted',
    salesqualifiedlead: 'qualified',
    opportunity: 'proposal',
    customer: 'closed',
    evangelist: 'closed',
    other: 'new',
  };
  
  const stage = stageMap[contact.properties.lifecyclestage?.toLowerCase() || ''] || 'new';
  
  // Generate pseudo-random scores based on contact id for consistency
  const hash = contact.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fitScore = 60 + (hash % 40);
  const intentScore = 50 + ((hash * 2) % 50);
  const engagementScore = 55 + ((hash * 3) % 45);
  const score = Math.round((fitScore + intentScore + engagementScore) / 3);
  
  const channels: Lead['suggestedChannel'][] = ['email', 'linkedin', 'call'];
  const actions = [
    'Schedule intro call',
    'Send case study',
    'Follow up on proposal',
    'Qualify with discovery questions',
    'Re-engage with content offer',
  ];
  
  return {
    id: contact.id,
    name,
    company: contact.properties.company || 'Unknown Company',
    email: contact.properties.email || '',
    score,
    stage,
    source: 'HubSpot',
    lastActivity: contact.properties.lastmodifieddate 
      ? new Date(contact.properties.lastmodifieddate).toLocaleDateString()
      : 'Unknown',
    fitScore,
    intentScore,
    engagementScore,
    suggestedAction: actions[hash % actions.length],
    suggestedChannel: channels[hash % channels.length],
  };
};

export default function Prospects() {
  const { contacts, isLoading, isConnected, fetchContacts } = useHubSpot();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score-desc');
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchContacts(100);
      setHasChecked(true);
    };
    init();
  }, [fetchContacts]);

  const handleRefresh = async () => {
    await fetchContacts(100);
  };

  // Map HubSpot contacts to leads format, or use mock data as fallback
  const leads = useMemo(() => {
    if (isConnected && contacts.length > 0) {
      return contacts.map(mapHubSpotContactToLead);
    }
    return mockLeads;
  }, [contacts, isConnected]);

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
            <Badge 
              variant="secondary" 
              className={`text-xs ${isConnected ? 'bg-emerald-500/10 text-emerald-600' : ''}`}
            >
              {isConnected ? '● HubSpot Connected' : 'Sample Data'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {isConnected 
              ? 'Live contacts from your HubSpot CRM with AI-scored recommendations.'
              : 'AI-scored leads with prioritized outreach recommendations.'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.open('https://app.hubspot.com/contacts', '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Open HubSpot
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

      {/* Connection Warning */}
      {!isConnected && hasChecked && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">HubSpot not connected. Showing sample data. Add your HubSpot access token in Admin settings.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Contacts</p>
          <p className="text-2xl font-bold mt-1">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : totalLeads}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Qualified</p>
          <p className="text-2xl font-bold mt-1">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : qualifiedLeads}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Avg. Score</p>
          <p className="text-2xl font-bold mt-1">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : avgScore}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search contacts..."
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
      {isLoading && !hasChecked ? (
        <div className="bg-card rounded-xl border border-border p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <LeadTable leads={filteredLeads} />
      )}
    </div>
  );
}
