import { Users, Info, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSupabaseProspectLeads } from '@/hooks/useSupabaseTabData';

export function LeadsSection() {
  const { data: prospectLeads, source } = useSupabaseProspectLeads([]);
  const hasData = source === 'supabase' && prospectLeads.length > 0;
  const totalLeads = prospectLeads.length;
  const latestLeads = prospectLeads.slice(0, 4).map((lead, index) => ({
    id: lead.id,
    contact: lead.name,
    source: lead.source,
    page: lead.company,
    lastSeen: lead.lastActivity || 'NA',
    date: String(index),
  }));
  const sourceCounts = Object.entries(
    prospectLeads.reduce<Record<string, number>>((acc, lead) => {
      const key = lead.source || 'Unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([sourceName, count]) => ({
      source: sourceName,
      leads: count,
      share: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Leads</h2>
            {hasData && <Badge variant="secondary" className="text-xs">Live</Badge>}
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
        </div>
      </div>

      <div className="p-5">
        {hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-4">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <span className="text-3xl font-bold">{totalLeads.toLocaleString()}</span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Source Breakdown</h3>
              <div className="space-y-2">
                {sourceCounts.map((s, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{s.source}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${s.share}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{s.leads}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Latest Leads</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {latestLeads.map((lead) => (
                  <div key={lead.id} className="p-2 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{lead.contact}</span>
                      <Badge variant="outline" className="text-xs">{lead.lastSeen}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{lead.source}</span>
                      <span>·</span>
                      <span className="truncate max-w-[120px]">{lead.page}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No leads data available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Connect HubSpot or Lemlist to populate this section.</p>
          </div>
        )}
      </div>
    </div>
  );
}
