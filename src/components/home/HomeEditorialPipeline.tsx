import { useEditorialCalendar } from "@/hooks/useEditorialCalendar";

const STATUS_CONFIG: { key: string; label: string; color: string }[] = [
  { key: "idee", label: "Idee", color: "bg-gray-400" },
  { key: "brouillon", label: "Brouillon", color: "bg-yellow-400" },
  { key: "valide", label: "Valide", color: "bg-blue-400" },
  { key: "programme", label: "Programme", color: "bg-purple-400" },
  { key: "publie", label: "Publie", color: "bg-green-500" },
];

export function HomeEditorialPipeline() {
  const { stats, isLoading } = useEditorialCalendar();

  if (isLoading) {
    return <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (stats.total === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">Aucun contenu editorial</div>;
  }

  const maxCount = Math.max(...Object.values(stats.byStatus), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Pipeline</span>
        <span>{stats.total} contenus</span>
      </div>
      <div className="space-y-2">
        {STATUS_CONFIG.map(({ key, label, color }) => {
          const count = stats.byStatus[key as keyof typeof stats.byStatus] ?? 0;
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-20 text-xs text-muted-foreground">{label}</span>
              <div className="flex-1">
                <div className="h-4 w-full rounded-full bg-muted">
                  <div
                    className={`h-4 rounded-full ${color} transition-all`}
                    style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
              <span className="w-6 text-right text-xs font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
