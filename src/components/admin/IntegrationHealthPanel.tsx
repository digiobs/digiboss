import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SyncRunRow = {
  id: string;
  provider: string;
  connector: string;
  client_id: string | null;
  status: "running" | "success" | "partial" | "failed";
  metrics: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

type ClientLite = { id: string; name: string };

export function IntegrationHealthPanel({ clients }: { clients: ClientLite[] }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SyncRunRow[]>([]);

  const clientNameById = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  const fetchRuns = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
    const { data, error } = await supabase
      .from("integration_sync_runs" as never)
      .select("id,provider,connector,client_id,status,metrics,error_message,started_at,completed_at")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("integration_sync_runs query error:", error);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as unknown as SyncRunRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const statsByProvider = useMemo(() => {
    const map = new Map<
      string,
      { total: number; success: number; partial: number; failed: number; running: number; upserted: number }
    >();
    rows.forEach((row) => {
      const key = row.provider;
      const current = map.get(key) ?? { total: 0, success: 0, partial: 0, failed: 0, running: 0, upserted: 0 };
      current.total += 1;
      current[row.status] += 1;
      const metrics = row.metrics ?? {};
      const upserted =
        typeof metrics.recordsUpserted === "number"
          ? metrics.recordsUpserted
          : typeof metrics.recordsUpserted === "string"
            ? Number(metrics.recordsUpserted)
            : 0;
      current.upserted += Number.isFinite(upserted) ? upserted : 0;
      map.set(key, current);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [rows]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Integration health</h2>
          <Badge variant="secondary">{rows.length} runs</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={fetchRuns} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-sm text-muted-foreground text-center">
          No integration runs yet. Run a connector sync to populate health metrics.
        </div>
      ) : (
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {statsByProvider.map(([provider, stats]) => (
              <div key={provider} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium capitalize">{provider}</p>
                  <Badge variant="outline">{stats.total} runs</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary" className="status-completed">
                    success {stats.success}
                  </Badge>
                  <Badge variant="secondary" className="status-in-progress">
                    partial {stats.partial}
                  </Badge>
                  <Badge variant="secondary" className="impact-low">
                    failed {stats.failed}
                  </Badge>
                  <Badge variant="outline">upserted {stats.upserted}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border divide-y divide-border">
            {rows.slice(0, 12).map((row) => (
              <div key={row.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    <span className="capitalize">{row.provider}</span> / {row.connector}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.client_id ? clientNameById.get(row.client_id) ?? row.client_id : "All clients"} -{" "}
                    {new Date(row.started_at).toLocaleString()}
                  </p>
                  {row.error_message && (
                    <p className="text-xs text-destructive mt-1 line-clamp-1">{row.error_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {row.status === "failed" ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <Badge variant="outline">{row.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
