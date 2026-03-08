import { Users, FileText, Eye, UserPlus, HeartPulse } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHomeKPIs } from '@/hooks/useHomeData';
import { cn } from '@/lib/utils';

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const kpis = [
  { key: 'activeClients', label: 'Clients actifs', icon: Users },
  { key: 'contentsPublished', label: 'Contenus publiés', icon: FileText },
  { key: 'totalImpressions', label: 'Impressions totales', icon: Eye },
  { key: 'leads', label: 'Leads générés', icon: UserPlus },
  { key: 'avgHealthScore', label: 'Score santé moyen', icon: HeartPulse },
] as const;

export function HomeKPICards() {
  const { data, isLoading } = useHomeKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const values: Record<string, number> = {
    activeClients: data?.activeClients ?? 0,
    contentsPublished: data?.contentsPublished ?? 0,
    totalImpressions: data?.totalImpressions ?? 0,
    leads: 89, // placeholder — will come from Supermetrics
    avgHealthScore: data?.avgHealthScore ?? 0,
  };

  const deltas: Record<string, number> = {
    activeClients: 0,
    contentsPublished: data?.contentsDelta ?? 0,
    totalImpressions: 12,
    leads: 22,
    avgHealthScore: 3,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {kpis.map(({ key, label, icon: Icon }) => {
        const delta = deltas[key];
        const isUp = delta > 0;
        const showDelta = delta !== 0;

        return (
          <Card key={key} className="p-4 flex flex-col gap-1.5 relative overflow-hidden">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">
                {key === 'avgHealthScore' ? `${values[key]}/100` : formatNum(values[key])}
              </span>
              {showDelta && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    isUp ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'
                  )}
                >
                  {isUp ? '↑' : '↓'} {Math.abs(delta)}%
                </Badge>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
