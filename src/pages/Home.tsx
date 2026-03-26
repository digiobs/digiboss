import { useEffect, useMemo, useState } from "react";
import { HomeKPIStrip } from "@/components/home/HomeKPIStrip";
import { HomeWeeklySummary } from "@/components/home/HomeWeeklySummary";
import { HomeNextBestActions } from "@/components/home/HomeNextBestActions";
import { HomePlanSnapshot } from "@/components/home/HomePlanSnapshot";
import { SignalsPanel } from "@/components/home/SignalsPanel";
import { ContentPipelinePanel } from "@/components/home/ContentPipelinePanel";
import { DataHealthWidget } from "@/components/home/DataHealthWidget";
import { type NextBestAction, dashboardKPIs } from "@/data/dashboardData";
import { useHomeReportingKpis } from "@/hooks/useHomeData";
import { TabDataStatusBanner } from "@/components/data/TabDataStatusBanner";
import { ALL_CLIENTS_ID, useClient } from "@/contexts/ClientContext";
import { useVisibilityMode } from "@/hooks/useVisibilityMode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, CalendarDays, LayoutDashboard, RefreshCw, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Home() {
  const { clients } = useClient();
  const { isAdmin } = useVisibilityMode();
  const [selectedClientId, setSelectedClientId] = useState<string>(
    isAdmin ? ALL_CLIENTS_ID : (clients[0]?.id ?? ALL_CLIENTS_ID)
  );
  const [syncing, setSyncing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<NextBestAction | null>(null);

  // Auto-select first client for non-admin users
  useEffect(() => {
    if (!isAdmin && selectedClientId === ALL_CLIENTS_ID && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [isAdmin, clients, selectedClientId]);
  const [generateSignal, setGenerateSignal] = useState(0);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const highlightedActionIds = selectedAction ? [selectedAction.id] : [];
  const { data: reportingData } = useHomeReportingKpis(selectedClientId);

  const syncDashboard = async () => {
    setSyncing(true);
    try {
      const payload = selectedClientId === ALL_CLIENTS_ID ? {} : { clientId: selectedClientId };
      const { error } = await supabase.functions.invoke('dashboard-news', { body: payload });
      if (error) throw error;
      toast.success('Dashboard data synced');
      window.location.reload();
    } catch (error) {
      console.error('dashboard sync failed:', error);
      toast.error('Dashboard sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const heroKpis = useMemo(() => {
    if (reportingData?.hasData && reportingData.heroKpis.length > 0) {
      return reportingData.heroKpis;
    }
    return dashboardKPIs.slice(0, 3);
  }, [reportingData]);
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const aiScopeLabel = selectedClientId === ALL_CLIENTS_ID ? "global" : selectedClient?.name ?? "client";
  const aiContext = `Home dashboard generation scope: ${aiScopeLabel}. Prioritize high-impact opportunities for this scope.`;

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              New Lovable Home
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Marketing Command Center
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Priorites, performance, and next actions in one place for your team and clients.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" className="gap-2" onClick={syncDashboard} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </Button>
            )}
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-[220px] bg-background">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && <SelectItem value={ALL_CLIENTS_ID}>Admin (tous les clients)</SelectItem>}
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              This week
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setGenerateSignal((value) => value + 1)}
              disabled={isGeneratingActions}
            >
              <Zap className="h-4 w-4" />
              {isGeneratingActions ? "Generating..." : "Generate insights"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {heroKpis.map((kpi) => (
            <Card key={kpi.id} className="border-border/60 bg-card/70 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-semibold text-foreground">{kpi.value}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {kpi.delta >= 0 ? "+" : ""}
                    {kpi.delta.toFixed(1)}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">{kpi.deltaLabel}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <LayoutDashboard className="h-3 w-3" />
            {selectedClientId === ALL_CLIENTS_ID ? "Global view" : selectedClient?.name ?? "Client"}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <ArrowUpRight className="h-3 w-3" />
            Live KPI tracking
          </Badge>
        </div>
      </div>

      <TabDataStatusBanner tab="home" />

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <HomeKPIStrip reportingKpis={reportingData?.stripKpis} />
        </CardContent>
      </Card>

      <HomeWeeklySummary />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Next Best Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeNextBestActions
                selectedAction={selectedAction}
                onSelectAction={setSelectedAction}
                generateSignal={generateSignal}
                clientScope={selectedClientId}
                clientName={selectedClient?.name}
                aiContext={aiContext}
                onGeneratingChange={setIsGeneratingActions}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plan Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <HomePlanSnapshot highlightedActionIds={highlightedActionIds} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <SignalsPanel />
            <ContentPipelinePanel />
            <DataHealthWidget />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Need a dedicated deep-dive? Jump to Reporting, Prospects, or Contenus for channel-level analysis.
        </p>
        <Button variant="ghost" size="sm" className="text-xs">
          Explore tabs
        </Button>
      </div>
    </div>
  );
}
