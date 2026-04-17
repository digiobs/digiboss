import { useMemo, useState } from "react";
import { HomeTasksAvancement } from "@/components/home/HomeTasksAvancement";
import { HomeSeoSnapshot } from "@/components/home/HomeSeoSnapshot";
import { HomeEditorialPipeline } from "@/components/home/HomeEditorialPipeline";
import { HomeVeilleAlerts } from "@/components/home/HomeVeilleAlerts";
import { HomeClientDecisions } from "@/components/home/HomeClientDecisions";
import { HomeClientInsights } from "@/components/home/HomeClientInsights";
import { HomeClientCalendar } from "@/components/home/HomeClientCalendar";
import { dashboardKPIs } from "@/data/dashboardData";
import { useHomeReportingKpis } from "@/hooks/useHomeData";
import { TabDataStatusBanner } from "@/components/data/TabDataStatusBanner";
import { ALL_CLIENTS_CLIENT, ALL_CLIENTS_ID, useClient } from "@/contexts/ClientContext";
import { useVisibilityMode } from "@/hooks/useVisibilityMode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, CalendarDays, LayoutDashboard, Lightbulb, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Home() {
  const { clients, currentClient, setCurrentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const selectedClientId = currentClient?.id ?? ALL_CLIENTS_ID;
  const [syncing, setSyncing] = useState(false);
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
  const clientLabel = isAllClientsSelected ? "Vue globale" : selectedClient?.name ?? "Client";
  const todayStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      {/* Hero — greeting + KPIs */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Tableau de bord
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Bonjour {clientLabel}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {todayStr} — Vos decisions, votre calendrier et les signaux importants.
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={syncDashboard} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Synchro...' : 'Sync'}
              </Button>
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
                  <SelectItem value={ALL_CLIENTS_ID}>Tous les clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

      {/* Section 1 — Decisions: proposals + convergences */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            A decider
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Propositions et convergences en attente de votre validation.
          </p>
        </CardHeader>
        <CardContent>
          <HomeClientDecisions />
        </CardContent>
      </Card>

      {/* Section 2 — Calendar + Veille side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Votre semaine
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Contenus, meetings et echeances a venir.
            </p>
          </CardHeader>
          <CardContent>
            <HomeClientCalendar />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Veille & Alertes
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Signaux marche, concurrence et opportunites detectees.
            </p>
          </CardHeader>
          <CardContent>
            <HomeVeilleAlerts />
          </CardContent>
        </Card>
      </div>

      {/* Section 3 — Insights for decision-making */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary" />
            Insights pour decider
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Opportunites, decisions de meetings et alertes cles pour orienter vos choix.
          </p>
        </CardHeader>
        <CardContent>
          <HomeClientInsights />
        </CardContent>
      </Card>

      {/* Section 4 — Operational snapshot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Avancement des taches</CardTitle>
          </CardHeader>
          <CardContent>
            <HomeTasksAvancement />
          </CardContent>
        </Card>

        <div className="space-y-6">
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
              <CardTitle className="text-base">Apercu SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeSeoSnapshot />
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
