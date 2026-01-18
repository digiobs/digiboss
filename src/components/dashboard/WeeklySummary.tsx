import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { weeklySummary } from '@/data/mockData';

export function WeeklySummary() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">What changed this week?</h3>
          <p className="text-sm text-muted-foreground">AI-generated summary</p>
        </div>
      </div>

      <p className="text-lg font-medium text-foreground mb-4">{weeklySummary.headline}</p>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Highlights</span>
          </div>
          <ul className="space-y-1.5">
            {weeklySummary.highlights.map((highlight, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Areas to Watch</span>
          </div>
          <ul className="space-y-1.5">
            {weeklySummary.concerns.map((concern, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                {concern}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
