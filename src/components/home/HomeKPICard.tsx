import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardKPI } from '@/data/dashboardData';
import { Link } from 'react-router-dom';

interface HomeKPICardProps {
  kpi: DashboardKPI;
}

function MiniSparkline({ data, trend }: { data: number[]; trend: 'up' | 'down' | 'neutral' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 50;
      const y = 18 - ((value - min) / range) * 14;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor =
    trend === 'up'
      ? 'hsl(var(--success))'
      : trend === 'down'
      ? 'hsl(var(--destructive))'
      : 'hsl(var(--muted-foreground))';

  return (
    <svg width="50" height="20" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeKPICard({ kpi }: HomeKPICardProps) {
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const isPositive = kpi.delta > 0;
  const isNegative = kpi.delta < 0;

  return (
    <div className="kpi-card group relative p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
        <MiniSparkline data={kpi.sparklineData} trend={kpi.trend} />
      </div>
      
      <div className="flex items-end justify-between gap-2">
        <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
        <div
          className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            isPositive && 'text-emerald-600 dark:text-emerald-400',
            isNegative && 'text-red-600 dark:text-red-400',
            !isPositive && !isNegative && 'text-muted-foreground'
          )}
        >
          <TrendIcon className="w-3 h-3" />
          <span>{isPositive ? '+' : ''}{kpi.delta}%</span>
        </div>
      </div>

      <Link
        to="/reporting"
        className="mt-2 text-[10px] text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        View details
        <ExternalLink className="w-2.5 h-2.5" />
      </Link>
    </div>
  );
}
