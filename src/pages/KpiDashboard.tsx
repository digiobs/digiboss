import { useMemo, useState } from 'react';
import { format, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Linkedin,
  Target,
  Eye,
  MousePointerClick,
  Users,
  DollarSign,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useClient } from '@/contexts/ClientContext';
import { useVisibilityMode } from '@/hooks/useVisibilityMode';
import { useReportingKpis } from '@/hooks/useReportingKpis';
import { useEditorialCalendar } from '@/hooks/useEditorialCalendar';
import { useCreativeProposals } from '@/hooks/useCreativeProposals';
import { cn } from '@/lib/utils';

// Section display config
const sectionConfig: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  seo: { label: 'SEO', icon: Globe, color: 'text-green-600' },
  website: { label: 'Site Web', icon: Eye, color: 'text-blue-600' },
  social: { label: 'Social', icon: Linkedin, color: 'text-sky-600' },
  paid: { label: 'Ads', icon: DollarSign, color: 'text-orange-600' },
  conversion: { label: 'Conversion', icon: Target, color: 'text-purple-600' },
  acquisition: { label: 'Acquisition', icon: Users, color: 'text-teal-600' },
  'ai-visibility': { label: 'Visibilité IA', icon: Eye, color: 'text-indigo-600' },
  strategy: { label: 'Stratégie', icon: TrendingUp, color: 'text-rose-600' },
};

function MetricCard({
  label,
  value,
  delta,
  unit,
}: {
  label: string;
  value: string;
  delta?: number;
  unit?: string;
}) {
  const isPositive = delta && delta > 0;
  const isNegative = delta && delta < 0;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{value}</p>
          {delta !== undefined && delta !== 0 && (
            <div className={cn('flex items-center text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-red-600')}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(delta).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineSummary({
  proposalStats,
  calendarStats,
}: {
  proposalStats: { total: number; new: number; approved: number; pending: number; rejected: number };
  calendarStats: { total: number; byStatus: Record<string, number> };
}) {
  const proposalApprovalRate = proposalStats.total > 0
    ? Math.round((proposalStats.approved / proposalStats.total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Créatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Propositions actives</span>
            <span className="font-bold">{proposalStats.total}</span>
          </div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
            {proposalStats.new > 0 && (
              <div className="bg-blue-500 transition-all" style={{ width: `${(proposalStats.new / Math.max(proposalStats.total, 1)) * 100}%` }} />
            )}
            {proposalStats.pending > 0 && (
              <div className="bg-amber-500 transition-all" style={{ width: `${(proposalStats.pending / Math.max(proposalStats.total, 1)) * 100}%` }} />
            )}
            {proposalStats.approved > 0 && (
              <div className="bg-emerald-500 transition-all" style={{ width: `${(proposalStats.approved / Math.max(proposalStats.total, 1)) * 100}%` }} />
            )}
            {proposalStats.rejected > 0 && (
              <div className="bg-red-400 transition-all" style={{ width: `${(proposalStats.rejected / Math.max(proposalStats.total, 1)) * 100}%` }} />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>🔵 {proposalStats.new} new</span>
            <span>🟡 {proposalStats.pending} pending</span>
            <span>🟢 {proposalStats.approved} OK</span>
            <span>🔴 {proposalStats.rejected} non</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-1 border-t">
            <span className="text-muted-foreground">Taux de validation</span>
            <span className="font-bold">{proposalApprovalRate}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Calendrier Éditorial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Publications planifiées</span>
            <span className="font-bold">{calendarStats.total}</span>
          </div>
          <div className="space-y-2">
            {Object.entries(calendarStats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <span className="text-xs w-20 capitalize text-muted-foreground">{status}</span>
                <Progress value={(count / Math.max(calendarStats.total, 1)) * 100} className="h-2 flex-1" />
                <span className="text-xs font-medium w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KpiDashboard() {
  const { currentClient, isAllClientsSelected } = useClient();
  const { isAdmin } = useVisibilityMode();
  const { data: kpiData, hasSupabaseData } = useReportingKpis();
  const { stats: calendarStats } = useEditorialCalendar();
  const { stats: proposalStats } = useCreativeProposals();

  // Group KPIs by category
  const kpisByCategory = useMemo(() => {
    const groups: Record<string, typeof kpiData> = {};
    kpiData.forEach((kpi) => {
      const cat = kpi.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(kpi);
    });
    return groups;
  }, [kpiData]);

  const categories = Object.keys(kpisByCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-500" />
            Dashboard KPI
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAllClientsSelected ? 'Tous les clients' : currentClient?.name} · Vue consolidée
          </p>
        </div>
      </div>

      {/* Pipeline summary */}
      <PipelineSummary proposalStats={proposalStats} calendarStats={calendarStats} />

      {/* KPI sections */}
      {!hasSupabaseData ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune donnée KPI disponible</p>
            <p className="text-xs text-muted-foreground mt-1">Les KPIs apparaîtront après le premier reporting</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={categories[0] || 'seo'}>
          <TabsList className="flex-wrap">
            {categories.map((cat) => {
              const cfg = sectionConfig[cat];
              const Icon = cfg?.icon || BarChart3;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-1">
                  <Icon className={cn('w-3.5 h-3.5', cfg?.color)} />
                  {cfg?.label || cat}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {categories.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {kpisByCategory[cat].map((kpi, i) => (
                  <MetricCard
                    key={i}
                    label={kpi.label}
                    value={kpi.value}
                    delta={kpi.delta}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
