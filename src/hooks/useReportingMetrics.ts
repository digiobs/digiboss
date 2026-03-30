import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";

type ReportingRow = {
  metric_key: string;
  value: number | null;
  period_end: string;
};

export function useReportingMetrics(sections: string[]) {
  const { currentClient, isAllClientsSelected } = useClient();
  const [rows, setRows] = useState<ReportingRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id || sections.length === 0) return;

      let query = (supabase as unknown as { from: (table: string) => Record<string, unknown> })
        .from("reporting_kpis")
        .select("metric_key,value,period_end")
        .in("section", sections)
        .order("period_end", { ascending: false })
        .limit(500);
      if (!isAllClientsSelected) query = query.eq("client_id", currentClient.id);

      const { data, error } = await query;
      if (error) {
        console.error("reporting metrics query error:", error);
        return;
      }
      if (!mounted) return;
      setRows(((data ?? []) as unknown) as ReportingRow[]);
    })();

    return () => {
      mounted = false;
    };
  }, [currentClient?.id, isAllClientsSelected, sections.join("|")]);

  const { values, latestPeriodEnd } = useMemo(() => {
    if (!rows.length) return { values: {} as Record<string, number>, latestPeriodEnd: null as string | null };

    const latest = rows[0]?.period_end ?? null;
    const filtered = latest ? rows.filter((row) => row.period_end === latest) : rows;
    const grouped: Record<string, number[]> = {};

    filtered.forEach((row) => {
      const metricKey = row.metric_key;
      if (!grouped[metricKey]) grouped[metricKey] = [];
      grouped[metricKey].push(typeof row.value === "number" ? row.value : 0);
    });

    const aggregated: Record<string, number> = {};
    Object.entries(grouped).forEach(([key, values]) => {
      const sum = values.reduce((acc, value) => acc + value, 0);
      const shouldAverage = key.includes("rate") || key.includes("roas") || key.includes("position");
      aggregated[key] = shouldAverage ? sum / Math.max(values.length, 1) : sum;
    });

    return { values: aggregated, latestPeriodEnd: latest };
  }, [rows]);

  const getMetric = (key: string, fallback = 0) => {
    const value = values[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  };

  return {
    getMetric,
    latestPeriodEnd,
    hasData: rows.length > 0,
  };
}

