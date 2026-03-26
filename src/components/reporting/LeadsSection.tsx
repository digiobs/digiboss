import { Users, Info, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { leadsData, leadSourceBreakdown } from '@/data/analyticsData';
import { useSupabaseProspectLeads } from '@/hooks/useSupabaseTabData';
import { leads as fallbackLeads } from '@/data/mockData';

export function LeadsSection() {
  const { data: prospectLeads, source } = useSupabaseProspectLeads(fallbackLeads);
  const totalLeads = prospectLeads.length;
  const latestLeads = prospectLeads.slice(0, 4).map((lead, index) => ({
    id: lead.id,
    contact: lead.name,
    source: lead.source,
    page: lead.company,
    lastSeen: lead.lastActivity || 'NA',
    email: lead.email,
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
  const displayedSourceBreakdown = sourceCounts.length > 0 ? sourceCounts : leadSourceBreakdown;
  const displayedLatestLeads = latestLeads.length > 0 ? latestLeads : leadsData.slice(0, 4);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Leads</h2>
            <Badge variant="secondary" className="text-xs">
              {source === 'supabase' ? 'Live Data' : 'Sample Data'}
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
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Card */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold">{totalLeads.toLocaleString()}</span>
              <div className="flex items-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+24.8%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs previous period</p>
          </div>

          {/* Source Breakdown */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Source → Leads</h3>
            <div className="space-y-2">
              {displayedSourceBreakdown.map((source, index) => (
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
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Latest Leads</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {displayedLatestLeads.map((lead) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}