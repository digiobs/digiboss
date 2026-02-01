import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardKPI } from '@/data/dashboardData';

interface EnhancedKPICardProps {
  kpi: DashboardKPI;
  onClick?: () => void;
}

function MiniSparkline({ data, trend }: { data: number[]; trend: 'up' | 'down' | 'neutral' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 60;
    const y = 20 - ((value - min) / range) * 16;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = trend === 'up' 
    ? 'hsl(var(--success))' 
    : trend === 'down' 
    ? 'hsl(var(--destructive))' 
    : 'hsl(var(--muted-foreground))';

  return (
    <svg width="60" height="24" className="overflow-visible">
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

export function EnhancedKPICard({ kpi, onClick }: EnhancedKPICardProps) {
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const isPositive = kpi.delta > 0;
  const isNegative = kpi.delta < 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "kpi-card text-left w-full group cursor-pointer",
        "hover:border-primary/30 hover:shadow-md transition-all"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{kpi.label}</p>
          <p className="text-2xl font-bold mt-1 tracking-tight">{kpi.value}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <MiniSparkline data={kpi.sparklineData} trend={kpi.trend} />
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              isPositive && 'text-emerald-600 dark:text-emerald-400',
              isNegative && 'text-red-600 dark:text-red-400',
              !isPositive && !isNegative && 'text-muted-foreground'
            )}
          >
            <TrendIcon className="w-3 h-3" />
            <span>{isPositive ? '+' : ''}{kpi.delta}%</span>
          </div>
        </div>
      </div>
    </button>
  );
}
