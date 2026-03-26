import { useEffect, useMemo, useState } from "react";
import { Lock, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RlsAuditRow = {
  schema_name: string;
  table_name: string;
  rls_enabled: boolean;
};

export function RlsAuditPanel() {
  const [rows, setRows] = useState<RlsAuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAudit = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_rls_audit" as never)
      .select("schema_name,table_name,rls_enabled")
      .order("table_name", { ascending: true });
    if (error) {
      console.error("security_rls_audit query error:", error);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as unknown as RlsAuditRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const summary = useMemo(() => {
    const total = rows.length;
    const disabled = rows.filter((row) => !row.rls_enabled).length;
    return { total, disabled };
  }, [rows]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">RLS audit</h2>
          <Badge variant="secondary">{summary.total} tables</Badge>
          {summary.disabled > 0 && <Badge variant="destructive">{summary.disabled} without RLS</Badge>}
        </div>
        <Button size="sm" variant="outline" onClick={fetchAudit} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Refresh
        </Button>
      </div>
      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-sm text-muted-foreground text-center">
          Audit view unavailable. Run latest migrations to populate security audit.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.slice(0, 16).map((row) => (
            <div key={`${row.schema_name}.${row.table_name}`} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{row.table_name}</p>
                <p className="text-xs text-muted-foreground">{row.schema_name}</p>
              </div>
              <div className="flex items-center gap-2">
                {!row.rls_enabled && <ShieldAlert className="w-4 h-4 text-destructive" />}
                <Badge variant={row.rls_enabled ? "secondary" : "destructive"}>
                  {row.rls_enabled ? "rls enabled" : "rls disabled"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
