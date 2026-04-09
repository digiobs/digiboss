import { useVeilleItems } from "@/hooks/useVeilleItems";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Lightbulb, Info } from "lucide-react";

const SEVERITY_CONFIG = {
  alert: { icon: AlertTriangle, color: "destructive" as const, label: "Alerte" },
  warning: { icon: AlertCircle, color: "default" as const, label: "Attention" },
  opportunity: { icon: Lightbulb, color: "secondary" as const, label: "Opportunite" },
  info: { icon: Info, color: "outline" as const, label: "Info" },
};

const SEVERITY_ORDER = ["alert", "warning", "opportunity", "info"] as const;

export function HomeVeilleAlerts() {
  const { data: items, isLoading } = useVeilleItems();

  if (isLoading) {
    return <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!items || items.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">Aucune alerte de veille</div>;
  }

  const sorted = [...items].sort((a, b) => {
    const aIdx = SEVERITY_ORDER.indexOf(a.severity);
    const bIdx = SEVERITY_ORDER.indexOf(b.severity);
    return aIdx - bIdx;
  });
  const top = sorted.slice(0, 4);

  return (
    <div className="space-y-2">
      {top.map((item) => {
        const config = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.info;
        const Icon = config.icon;
        return (
          <div key={item.id} className="flex items-start gap-2 rounded-md border px-3 py-2">
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{item.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={config.color} className="text-[10px]">
                  {config.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{item.source}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
