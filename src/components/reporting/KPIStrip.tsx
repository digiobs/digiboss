import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KPIData } from '@/data/analyticsData';

interface KPIStripProps {
  data: KPIData[];
  showCategories?: boolean;
}

function KPICard({ kpi }: { kpi: KPIData }) {
  const isPositive = kpi.delta > 0;
  const isNegative = kpi.delta < 0;
  // For bounce rate, negative is good
  const isGoodTrend = kpi.label === 'Bounce Rate' ? isNegative : isPositive;

  return (
    <div className="bg-card rounded-lg border border-border p-3 min-w-[140px] hover:shadow-sm transition-shadow">
      <p className="text-xs text-muted-foreground font-medium truncate">{kpi.label}</p>
      <p className="text-xl font-bold mt-1">{kpi.value}</p>
      <div className="flex items-center gap-1 mt-1">
        {isPositive ? (
          <TrendingUp className={cn("w-3 h-3", isGoodTrend ? "text-emerald-500" : "text-red-500")} />
        ) : isNegative ? (
          <TrendingDown className={cn("w-3 h-3", isGoodTrend ? "text-emerald-500" : "text-red-500")} />
        ) : (
          <Minus className="w-3 h-3 text-muted-foreground" />
        )}
        <span className={cn(
          "text-xs font-medium",
          isGoodTrend ? "text-emerald-600" : isNegative || isPositive ? "text-red-600" : "text-muted-foreground"
        )}>
          {isPositive ? '+' : ''}{kpi.delta}%
        </span>
        <span className="text-xs text-muted-foreground">{kpi.deltaLabel}</span>
      </div>
    </div>
  );
}

export function KPIStrip({ data, showCategories = true }: KPIStripProps) {
  const categories = {
    website: { label: 'Website (GA4)', kpis: data.filter(k => k.category === 'website') },
    activation: { label: 'Activation', kpis: data.filter(k => k.category === 'activation') },
    conversion: { label: 'Conversion & Leads', kpis: data.filter(k => k.category === 'conversion') },
    acquisition: { label: 'SEO & Visibility', kpis: data.filter(k => k.category === 'acquisition') },
    paid: { label: 'Paid', kpis: data.filter(k => k.category === 'paid') },
    social: { label: 'Social', kpis: data.filter(k => k.category === 'social') },
  };

  if (showCategories) {
    return (
      <div className="space-y-4">
        {Object.entries(categories).map(([key, { label, kpis }]) => (
          kpis.length > 0 && (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {label}
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {kpis.map((kpi, index) => (
                  <KPICard key={index} kpi={kpi} />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {data.map((kpi, index) => (
        <KPICard key={index} kpi={kpi} />
      ))}
    </div>
  );
}
