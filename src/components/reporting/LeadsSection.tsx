import { useEffect, useState } from 'react';
import { Users, Info, ExternalLink, TrendingUp, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { leadsData, leadSourceBreakdown } from '@/data/analyticsData';
import { useHubSpot, HubSpotContact } from '@/hooks/useHubSpot';
import { formatDistanceToNow } from 'date-fns';

export function LeadsSection() {
  const { contacts, isLoading, isConnected, fetchContacts, fetchAnalytics, analytics } = useHubSpot();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchAnalytics();
      await fetchContacts(10);
      setHasChecked(true);
    };
    init();
  }, [fetchContacts, fetchAnalytics]);

  const handleRefresh = async () => {
    await fetchAnalytics();
    await fetchContacts(10);
  };

  const formatContactName = (contact: HubSpotContact) => {
    const first = contact.properties.firstname || '';
    const last = contact.properties.lastname || '';
    if (first || last) return `${first} ${last}`.trim();
    return contact.properties.email || 'Unknown';
  };

  const formatLastSeen = (contact: HubSpotContact) => {
    const date = contact.properties.lastmodifieddate || contact.properties.createdate;
    if (!date) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  // Use HubSpot data if connected, fallback to mock data
  const displayContacts = isConnected && contacts.length > 0 ? contacts : null;
  const totalLeads = analytics?.contacts?.total || 156;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Leads</h2>
            <Badge 
              variant="secondary" 
              className={`text-xs ${isConnected ? 'bg-emerald-500/10 text-emerald-600' : ''}`}
            >
              {isConnected ? '● HubSpot Connected' : 'HubSpot'}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>Attribution note:</strong> Leads may lag behind conversions. 
                    Compare by week/month for clearer signal.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1.5 text-xs"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Refresh
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1.5 text-xs"
              onClick={() => window.open('https://app.hubspot.com', '_blank')}
            >
              Open HubSpot <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {!isConnected && hasChecked && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">HubSpot not connected. Showing sample data.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Card */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalLeads.toLocaleString()}
              </span>
              {!isLoading && (
                <div className="flex items-center text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+24.8%</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isConnected ? 'from HubSpot CRM' : 'vs previous period'}
            </p>
          </div>

          {/* Source Breakdown */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Source → Leads</h3>
            <div className="space-y-2">
              {leadSourceBreakdown.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{source.source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${source.share}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{source.leads}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Leads Table */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Latest Contacts</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayContacts ? (
                displayContacts.slice(0, 4).map((contact) => (
                  <div key={contact.id} className="p-2 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{formatContactName(contact)}</span>
                      <Badge variant="outline" className="text-xs">{formatLastSeen(contact)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{contact.properties.company || 'No company'}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{contact.properties.lifecyclestage || 'Unknown stage'}</span>
                    </div>
                  </div>
                ))
              ) : (
                leadsData.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="p-2 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{lead.contact}</span>
                      <Badge variant="outline" className="text-xs">{lead.lastSeen}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{lead.source}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{lead.page}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
