import { useMemo, useState } from "react";
import { HomeKPIStrip } from "@/components/home/HomeKPIStrip";
import { HomeNextBestActions } from "@/components/home/HomeNextBestActions";
import { HomeTasksAvancement } from "@/components/home/HomeTasksAvancement";
import { HomeSeoSnapshot } from "@/components/home/HomeSeoSnapshot";
import { HomeEditorialPipeline } from "@/components/home/HomeEditorialPipeline";
import { HomeVeilleAlerts } from "@/components/home/HomeVeilleAlerts";
import { HomeRecentMeetings } from "@/components/home/HomeRecentMeetings";
import { HomeCalendarWeek } from "@/components/home/HomeCalendarWeek";
import { HomeClientProposals } from "@/components/home/HomeClientProposals";
import { HomeRecentDeliverables } from "@/components/home/HomeRecentDeliverables";
import { type NextBestAction, dashboardKPIs } from "@/data/dashboardData";
import { useHomeReportingKpis } from "@/hooks/useHomeData";
import { TabDataStatusBanner } from "@/components/data/TabDataStatusBanner";
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from "@/contexts/ClientContext";
import { useVisibilityMode } from "@/hooks/useVisibilityMode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, CalendarDays, LayoutDashboard, RefreshCw, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Home() {
  const { clients, currentClient, setCurrentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const selectedClientId = currentClient?.id ?? ALL_CLIENTS_ID;
  const [syncing, setSyncing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<NextBestAction | null>(null);
  const [generateSignal, setGenerateSignal] = useState(0);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const { data: reportingData } = useHomeReportingKpis(selectedClientId);

  const syncDashboard = async () => {
    setSyncing(true);
    try {
      const payload = isAllClientsSelected ? {} : { clientId: selectedClientId };
      const { error } = await supabase.functions.invoke('dashboard-news', { body: payload });
      if (error) throw error;
      toast.success('Donnees synchronisees');
      window.location.reload();
    } catch (error) {
      console.error('dashboard sync failed:', error);
      toast.error('Echec de la synchronisation');
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
  const aiScopeLabel = isAllClientsSelected ? "global" : selectedClient?.name ?? "client";
  const aiContext = `Home dashboard generation scope: ${aiScopeLabel}. Prioritize high-impact opportunities for this scope.`;

  // Client-focused homepage — shown when visibility mode is "client".
  // Leads with calendar, last veille, and propositions awaiting decision,
  // followed by a 2x2 grid of delivery / livrables / SEO / meetings.
  if (!isAdmin) {
    const clientLabel = isAllClientsSelected ? "Vue globale" : selectedClient?.name ?? "Client";
    return (
      <div className="space-y-6 animate-fade-in pb-6">
        {/* Compact client hero */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-5 md:p-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Vue client
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Bonjour {clientLabel}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Votre semaine, vos dernières alertes et les décisions à valider.
              </p>
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
              {clientLabel}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ArrowUpRight className="h-3 w-3" />
              KPIs en direct
            </Badge>
          </div>
        </div>

        <TabDataStatusBanner tab="home" />

        {/* Row 1 — striking client info */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cette semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeCalendarWeek />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dernière veille</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeVeilleAlerts />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Propositions à valider</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeClientProposals />
            </CardContent>
          </Card>
        </div>

        {/* Row 2 — secondary 2x2 grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Avancement des tâches</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeTasksAvancement />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Livrables récents</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeRecentDeliverables />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aperçu SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeSeoSnapshot />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Réunions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeRecentMeetings />
            </CardContent>
          </Card>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Besoin d'une analyse approfondie ? Consultez Reporting, Prospects ou Contenus pour une analyse par canal.
          </p>
          <Button variant="ghost" size="sm" className="text-xs">
            Explorer les onglets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      {/* Hero section */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Centre de Commande
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Centre de Commande Marketing
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Priorites, performance et prochaines actions pour votre equipe et vos clients.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" className="gap-2" onClick={syncDashboard} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Synchro...' : 'Sync'}
              </Button>
            )}
            <Select
              value={selectedClientId}
              onValueChange={(id) => {
                const c = id === ALL_CLIENTS_ID ? ALL_CLIENTS_CLIENT : clients.find((cl) => cl.id === id) ?? null;
                setCurrentClient(c);
              }}
            >
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
              Cette semaine
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setGenerateSignal((value) => value + 1)}
              disabled={isGeneratingActions}
            >
              <Zap className="h-4 w-4" />
              {isGeneratingActions ? "Generation..." : "Generer insights"}
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
            {isAllClientsSelected ? "Vue globale" : selectedClient?.name ?? "Client"}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <ArrowUpRight className="h-3 w-3" />
            KPIs en direct
          </Badge>
        </div>
      </div>

      <TabDataStatusBanner tab="home" />

      {/* Performance Overview */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vue d'ensemble performance</CardTitle>
        </CardHeader>
        <CardContent>
          <HomeKPIStrip reportingKpis={reportingData?.stripKpis} />
        </CardContent>
      </Card>

      {/* Tasks Avancement */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Avancement des taches</CardTitle>
        </CardHeader>
        <CardContent>
          <HomeTasksAvancement />
        </CardContent>
      </Card>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prochaines actions recommandees</CardTitle>
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
              <CardTitle className="text-base">Apercu SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeSeoSnapshot />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pipeline editorial</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeEditorialPipeline />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Veille & Alertes</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeVeilleAlerts />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Reunions recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeRecentMeetings />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Besoin d'une analyse approfondie ? Consultez Reporting, Prospects ou Contenus pour une analyse par canal.
        </p>
        <Button variant="ghost" size="sm" className="text-xs">
          Explorer les onglets
        </Button>
      </div>
    </div>
  );
}
