import { useNavigate } from "react-router-dom";
import { useCreativeProposals } from "@/hooks/useCreativeProposals";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const URGENCY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const URGENCY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const URGENCY_LABEL: Record<string, string> = {
  high: "Urgent",
  medium: "Moyenne",
  low: "Faible",
};

export function HomeClientProposals() {
  const navigate = useNavigate();
  const { proposalsByStatus, isLoading } = useCreativeProposals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  const pending = proposalsByStatus?.enAttente ?? [];

  if (pending.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Aucune proposition à valider
      </div>
    );
  }

  const sorted = [...pending].sort((a, b) => {
    const aIdx = URGENCY_ORDER[a.urgency] ?? 3;
    const bIdx = URGENCY_ORDER[b.urgency] ?? 3;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const top = sorted.slice(0, 4);

  return (
    <div className="space-y-2">
      {top.map((proposal) => {
        const variant = URGENCY_VARIANT[proposal.urgency] ?? "outline";
        const label = URGENCY_LABEL[proposal.urgency] ?? proposal.urgency;
        return (
          <button
            key={proposal.id}
            type="button"
            onClick={() => navigate("/proposals")}
            className="flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted/50"
          >
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{proposal.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={variant} className="text-[10px]">
                  {label}
                </Badge>
                {proposal.source_skill && (
                  <span className="text-[10px] text-muted-foreground">
                    {proposal.source_skill}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
