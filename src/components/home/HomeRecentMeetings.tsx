import { useSupabaseMeetings } from "@/hooks/useSupabaseMeetings";
import { Badge } from "@/components/ui/badge";
import { Video, Sparkles } from "lucide-react";

export function HomeRecentMeetings() {
  const { meetings, loading } = useSupabaseMeetings();

  if (loading) {
    return <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (meetings.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">Aucune reunion recente</div>;
  }

  const recent = meetings.slice(0, 3);

  return (
    <div className="space-y-2">
      {recent.map((meeting) => {
        const hasAiSummary =
          meeting.aiSummary &&
          (meeting.aiSummary.decisions.length > 0 ||
            meeting.aiSummary.actionItems.length > 0);
        const dateStr = new Date(meeting.date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });

        return (
          <div key={meeting.id} className="flex items-start gap-2 rounded-md border px-3 py-2">
            <Video className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{meeting.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                <span className="text-[10px] text-muted-foreground">{meeting.duration} min</span>
                {hasAiSummary && (
                  <Badge variant="secondary" className="gap-0.5 text-[10px]">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
