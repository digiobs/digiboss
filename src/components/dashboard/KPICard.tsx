import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KPI } from '@/data/mockData';

interface KPICardProps {
  kpi: KPI;
}

export function KPICard({ kpi }: KPICardProps) {
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const isPositive = kpi.trend === 'up';
  const isNegative = kpi.trend === 'down';

  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            isPositive && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            isNegative && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            !isPositive && !isNegative && 'bg-muted text-muted-foreground'
          )}
        >
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(kpi.change)}%</span>
        </div>
      </div>
      <p className="text-3xl font-bold mt-2 tracking-tight">{kpi.value}</p>
      <p className="text-xs text-muted-foreground mt-1">{kpi.changeLabel}</p>
    </div>
  );
}
