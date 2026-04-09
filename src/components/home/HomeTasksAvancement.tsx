import { useClientAvancement } from "@/hooks/useClientAvancement";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";

export function HomeTasksAvancement() {
  const { currentClient, isAllClientsSelected } = useClient();
  const { data, isLoading } = useClientAvancement(
    isAllClientsSelected ? undefined : currentClient?.id
  );

  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">Chargement...</div>;
  }

  const kpis = data?.kpis;
  const tasks = data?.tasks ?? [];

  if (!kpis || kpis.total_count === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        {isAllClientsSelected ? "Selectionnez un client pour voir l'avancement" : "Aucune tache trouvee"}
      </div>
    );
  }

  const upcoming = tasks
    .filter((t) => t.health_status === "on_track" && t.due_date)
    .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-2 rounded-lg border bg-card/50 p-3">
          <ListTodo className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-lg font-semibold">{kpis.active_count}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card/50 p-3">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-lg font-semibold">{kpis.overdue_count}</p>
            <p className="text-xs text-muted-foreground">En retard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card/50 p-3">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-lg font-semibold">{kpis.completed_count}</p>
            <p className="text-xs text-muted-foreground">Terminees</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card/50 p-3">
          <Clock className="h-4 w-4 text-primary" />
          <div>
            <p className="text-lg font-semibold">{kpis.completion_pct}%</p>
            <p className="text-xs text-muted-foreground">Completion</p>
          </div>
        </div>
      </div>

      <Progress value={kpis.completion_pct} className="h-2" />

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Prochaines echeances</p>
          {upcoming.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="truncate pr-3">{task.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={task.health_status === "overdue" ? "destructive" : "secondary"} className="text-xs">
                  {task.priority}
                </Badge>
                <span className="text-xs text-muted-foreground">{task.due_date?.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
