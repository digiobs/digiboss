import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";

type VeilleContext = {
  industry?: string;
  keywords: string[];
  competitors: string[];
  scopeLabel: string;
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

export function useVeilleContext() {
  const { currentClient, isAllClientsSelected, clients } = useClient();
  const [context, setContext] = useState<VeilleContext>({
    industry: undefined,
    keywords: [],
    competitors: [],
    scopeLabel: currentClient?.name ?? "Client",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientNameById = useMemo(() => {
    return new Map(clients.map((c) => [c.id, c.name]));
  }, [clients]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) return;
      setLoading(true);
      setError(null);

      const query = supabase
        .from("client_configs")
        .select("client_id,industry,competitors,market_news_keywords");

      const scoped = isAllClientsSelected ? query : query.eq("client_id", currentClient.id);
      const { data, error: fetchError } = await scoped;

      if (!mounted) return;
      if (fetchError) {
        setError(fetchError.message);
        setContext({
          industry: undefined,
          keywords: [],
          competitors: [],
          scopeLabel: currentClient.name,
        });
        setLoading(false);
        return;
      }

      const rows = Array.isArray(data) ? data : [];

      if (isAllClientsSelected) {
        const industries = uniq(
          rows
            .map((row) => (typeof row.industry === "string" ? row.industry.trim() : ""))
            .filter(Boolean),
        );
        const competitors = uniq(rows.flatMap((row) => normalizeStringArray(row.competitors)));
        const keywords = uniq(rows.flatMap((row) => normalizeStringArray(row.market_news_keywords)));
        const involvedClientIds = uniq(rows.map((r) => (typeof r.client_id === "string" ? r.client_id : "")));
        const involvedNames = involvedClientIds
          .map((id) => clientNameById.get(id))
          .filter((name): name is string => Boolean(name));

        setContext({
          industry: industries.length > 0 ? industries.join(", ") : undefined,
          competitors,
          keywords,
          scopeLabel:
            involvedNames.length > 0
              ? `All clients (${involvedNames.length})`
              : "All clients",
        });
      } else {
        const row = rows[0];
        setContext({
          industry: typeof row?.industry === "string" && row.industry.trim() ? row.industry.trim() : undefined,
          competitors: normalizeStringArray(row?.competitors),
          keywords: normalizeStringArray(row?.market_news_keywords),
          scopeLabel: currentClient.name,
        });
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [currentClient?.id, currentClient?.name, isAllClientsSelected, clientNameById]);

  return { context, loading, error };
}

