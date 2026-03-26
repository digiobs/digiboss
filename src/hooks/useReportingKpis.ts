import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";
import { kpiStripData, type KPIData } from "@/data/analyticsData";

type ReportingRow = {
  section: string;
  metric_key: string;
  label: string;
  value: number | null;
  unit: string | null;
};

function formatValue(value: number, unit: string | null): string {
  if (unit === "currency") return `EUR ${Math.round(value).toLocaleString()}`;
  if (unit === "percent") return `${value.toFixed(2)}%`;
  if (unit === "ratio") return value.toFixed(2);
  return Math.round(value).toLocaleString();
}

function toCategory(section: string): KPIData["category"] {
  if (section === "website") return "website";
  if (section === "activation") return "activation";
  if (section === "conversion" || section === "leads") return "conversion";
  if (section === "paid") return "paid";
  if (section === "social") return "social";
  return "acquisition";
}

export function useReportingKpis() {
  const { currentClient, isAllClientsSelected } = useClient();
  const [rows, setRows] = useState<ReportingRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) return;
      let query = (supabase as any)
        .from("reporting_kpis")
        .select("section,metric_key,label,value,unit")
        .order("period_end", { ascending: false })
        .limit(100);
      if (!isAllClientsSelected) query = query.eq("client_id", currentClient.id);
      const { data, error } = await query;
      if (error) {
        console.error("reporting_kpis query error:", error);
        return;
      }
      if (mounted) setRows(((data ?? []) as unknown) as ReportingRow[]);
    })();
    return () => {
      mounted = false;
    };
  }, [currentClient?.id, isAllClientsSelected]);

  const data = useMemo<KPIData[]>(() => {
    if (!rows.length) return kpiStripData;

    const uniqueByMetric = new Map<string, ReportingRow>();
    rows.forEach((row) => {
      const key = `${row.section}:${row.metric_key}`;
      if (!uniqueByMetric.has(key)) uniqueByMetric.set(key, row);
    });

    return Array.from(uniqueByMetric.values()).map((row) => ({
      label: row.label,
      value: formatValue(row.value ?? 0, row.unit),
      delta: 0,
      deltaLabel: "latest sync",
      category: toCategory(row.section),
    }));
  }, [rows]);

  return {
    data,
    hasSupabaseData: rows.length > 0,
  };
}

