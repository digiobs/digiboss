import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";

export type AppTabKey =
  | "home"
  | "insights"
  | "prospects"
  | "plan"
  | "content"
  | "assets"
  | "reporting"
  | "chat"
  | "admin";

type TabHealth = {
  connectedTables: string[];
  missingTables: string[];
  rowCounts: Record<string, number>;
};

const TAB_TABLES: Record<AppTabKey, string[]> = {
  home: ["home_kpis"],
  insights: ["insights_items"],
  prospects: ["prospect_leads"],
  plan: ["plan_tasks"],
  content: ["content_items"],
  assets: ["asset_library"],
  reporting: ["reporting_kpis"],
  chat: ["chat_messages"],
  admin: ["clients", "client_configs"],
};

function isMissingTableError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the table");
}

export function useTabDataHealth(tab: AppTabKey) {
  const { currentClient, isAllClientsSelected } = useClient();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<TabHealth>({
    connectedTables: [],
    missingTables: [],
    rowCounts: {},
  });

  const requiredTables = useMemo(() => TAB_TABLES[tab] ?? [], [tab]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      const connectedTables: string[] = [];
      const missingTables: string[] = [];
      const rowCounts: Record<string, number> = {};

      for (const table of requiredTables) {
        let query = (supabase as unknown as { from: (table: string) => Record<string, unknown> }).from(table).select("*", { count: "exact", head: true });
        if (currentClient?.id && !isAllClientsSelected && table !== "clients" && table !== "client_configs") {
          query = query.eq("client_id", currentClient.id);
        }
        const { count, error } = await query;
        if (error) {
          if (isMissingTableError(error.message)) {
            missingTables.push(table);
          } else {
            // Keep the table visible in missing to prompt linking.
            missingTables.push(table);
          }
          continue;
        }
        connectedTables.push(table);
        rowCounts[table] = count ?? 0;
      }

      if (!mounted) return;
      setHealth({ connectedTables, missingTables, rowCounts });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [currentClient?.id, requiredTables, isAllClientsSelected]);

  return {
    loading,
    requiredTables,
    ...health,
  };
}

