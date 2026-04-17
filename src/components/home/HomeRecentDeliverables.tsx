import { useDeliverables, getDeliverableUrl } from "@/hooks/useDeliverables";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  final: "default",
  draft: "secondary",
  review: "outline",
  archived: "destructive",
};

export function HomeRecentDeliverables() {
  const { data: deliverables, isLoading } = useDeliverables();

  if (isLoading) {
    return <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!deliverables || deliverables.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">Aucun livrable recent</div>;
  }

  const recent = deliverables.slice(0, 5);

  return (
    <div className="space-y-2">
      {recent.map((d) => {
        const dateStr = new Date(d.created_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
        const clientName = d.clients?.name;
        const destination = getDeliverableUrl(d);

        const body = (
          <>
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm">{d.title ?? d.filename ?? d.type}</p>
                {destination && (
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {clientName && <span className="text-[10px] text-muted-foreground">{clientName}</span>}
                <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                <Badge variant={STATUS_VARIANT[d.status] ?? "secondary"} className="text-[10px]">
                  {d.type}
                </Badge>
              </div>
            </div>
          </>
        );

        if (destination) {
          return (
            <a
              key={d.id}
              href={destination.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Ouvrir dans ${destination.label}`}
              className="flex items-start gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
            >
              {body}
            </a>
          );
        }

        return (
          <div key={d.id} className="flex items-start gap-2 rounded-md border px-3 py-2">
            {body}
          </div>
        );
      })}
    </div>
  );
}
