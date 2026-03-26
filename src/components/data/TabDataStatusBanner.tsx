import { AlertCircle, CheckCircle2, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type AppTabKey, useTabDataHealth } from "@/hooks/useTabDataHealth";

export function TabDataStatusBanner({ tab }: { tab: AppTabKey }) {
  const { loading, requiredTables, connectedTables, missingTables, rowCounts } = useTabDataHealth(tab);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Checking Supabase data links...
      </div>
    );
  }

  const allConnected = missingTables.length === 0;
  const title = allConnected
    ? "Supabase data linked for this tab"
    : "Missing Supabase links detected";

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs",
        allConnected
          ? "border-emerald-300/60 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
          : "border-amber-300/60 bg-amber-50/60 text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {allConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
        <span className="font-medium">{title}</span>
        <Badge variant="outline" className="text-[10px]">
          {connectedTables.length}/{requiredTables.length} tables connected
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {connectedTables.map((t) => (
          <Badge key={t} variant="secondary" className="text-[10px]">
            {t}: {rowCounts[t] ?? 0}
          </Badge>
        ))}
        {missingTables.map((t) => (
          <Badge key={t} variant="destructive" className="text-[10px]">
            {t}: missing
          </Badge>
        ))}
      </div>

      {!allConnected && (
        <div className="mt-2 flex items-center gap-1 text-[11px]">
          <Link2 className="h-3.5 w-3.5" />
          Linking plan: create missing table(s), import client data, and map `client_id` values.
        </div>
      )}
    </div>
  );
}

