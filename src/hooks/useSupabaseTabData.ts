import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";
import type { Lead, Asset } from "@/data/mockData";
import type { Task } from "@/types/tasks";

type LoadState<T> = {
  data: T;
  loading: boolean;
  source: "supabase" | "fallback";
  refetch: () => Promise<void>;
};

type DbRow = Record<string, unknown>;

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function isMissingTableError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the table");
}

export function useSupabaseProspectLeads(fallback: Lead[]): LoadState<Lead[]> {
  const { currentClient, isAllClientsSelected } = useClient();
  const [reloadIndex, setReloadIndex] = useState(0);
  const refetch = async () => {
    setReloadIndex((prev) => prev + 1);
  };
  const [state, setState] = useState<LoadState<Lead[]>>({
    data: fallback,
    loading: true,
    source: "fallback",
    refetch,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) {
        if (mounted) setState({ data: fallback, loading: false, source: "fallback", refetch });
        return;
      }
      let query = (supabase as any)
        .from("prospect_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (!isAllClientsSelected) {
        query = query.eq("client_id", currentClient.id);
      }
      const { data, error } = await query;

      if (error) {
        if (!isMissingTableError(error.message)) console.error("prospect_leads query error:", error);
        if (mounted) setState({ data: fallback, loading: false, source: "fallback", refetch });
        return;
      }

      const mapped: Lead[] = (data ?? []).map((row) => {
        const r = row as DbRow;
        return {
          id: String(r.id ?? ""),
          name: asText(r.name, "Unknown"),
          company: asText(r.company, "Unknown"),
          email: asText(r.email),
          score: asNumber(r.score),
          stage: (asText(r.stage, "new") as Lead["stage"]) ?? "new",
          source: asText(r.source, "Unknown"),
          lastActivity: asText(r.last_activity, "NA"),
          fitScore: asNumber(r.fit_score),
          intentScore: asNumber(r.intent_score),
          engagementScore: asNumber(r.engagement_score),
          suggestedAction: asText(r.suggested_action, "No suggested action"),
          suggestedChannel: (asText(r.suggested_channel, "email") as Lead["suggestedChannel"]) ?? "email",
        };
      });

      if (mounted) {
        setState({
          data: mapped.length > 0 ? mapped : fallback,
          loading: false,
          source: mapped.length > 0 ? "supabase" : "fallback",
          refetch,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentClient?.id, fallback, isAllClientsSelected, reloadIndex]);

  return state;
}

export function useSupabasePlanTasks(fallback: Task[]): LoadState<Task[]> {
  const { currentClient, isAllClientsSelected } = useClient();
  const [state, setState] = useState<LoadState<Task[]>>({
    data: fallback,
    loading: true,
    source: "fallback",
    refetch: async () => undefined,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) {
        if (mounted) setState({ data: fallback, loading: false, source: "fallback", refetch: async () => undefined });
        return;
      }
      let query = (supabase as any)
        .from("plan_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (!isAllClientsSelected) {
        query = query.eq("client_id", currentClient.id);
      }
      const { data, error } = await query;

      if (error) {
        if (!isMissingTableError(error.message)) console.error("plan_tasks query error:", error);
        if (mounted) setState({ data: fallback, loading: false, source: "fallback", refetch: async () => undefined });
        return;
      }

      const mapped: Task[] = (data ?? []).map((row) => {
        const r = row as DbRow;
        return {
          id: String(r.id ?? ""),
          title: asText(r.title, "Untitled task"),
          description: asText(r.description),
          status: asText(r.status, "backlog") as Task["status"],
          priority: asText(r.priority, "medium") as Task["priority"],
          assignee: typeof r.assignee === "string" ? r.assignee : null,
          dueDate: typeof r.due_date === "string" ? r.due_date : null,
          createdAt: asText(r.created_at, new Date().toISOString()),
          updatedAt: asText(r.updated_at, new Date().toISOString()),
          tags: asStringArray(r.tags),
          subtasks: Array.isArray(r.subtasks) ? (r.subtasks as Task["subtasks"]) : [],
          comments: Array.isArray(r.comments) ? (r.comments as Task["comments"]) : [],
          linkedCampaign: asText(r.linked_campaign) || undefined,
          estimatedHours: typeof r.estimated_hours === "number" ? r.estimated_hours : undefined,
          aiGenerated: asBool(r.ai_generated, false),
          linkedContentId: asText(r.linked_content_id) || undefined,
          linkedContentType: (asText(r.linked_content_type) || undefined) as Task["linkedContentType"],
          sourceModule: (asText(r.source_module) || undefined) as Task["sourceModule"],
          wrikeTaskId: asText(r.wrike_task_id) || undefined,
          wrikeStepId: asText(r.wrike_step_id) || undefined,
          wrikeProjectId: asText(r.wrike_project_id) || undefined,
          wrikePermalink: asText(r.wrike_permalink) || undefined,
        };
      });

      if (mounted) {
        setState({
          data: mapped.length > 0 ? mapped : fallback,
          loading: false,
          source: mapped.length > 0 ? "supabase" : "fallback",
          refetch: async () => undefined,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentClient?.id, fallback, isAllClientsSelected]);

  return state;
}

export function useSupabaseAssets(fallback: Asset[]): LoadState<Asset[]> {
  const { currentClient, isAllClientsSelected } = useClient();
  const [state, setState] = useState<LoadState<Asset[]>>({
    data: fallback,
    loading: true,
    source: "fallback",
    refetch: async () => undefined,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentClient?.id) {
        if (mounted) setState({ data: fallback, loading: false, source: "fallback", refetch: async () => undefined });
        return;
      }
      let query = (supabase as any)
        .from("asset_library")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!isAllClientsSelected) {
        query = query.eq("client_id", currentClient.id);
      }
      const { data, error } = await query;

      if (error) {
        if (!isMissingTableError(error.message)) console.error("asset_library query error:", error);
        if (mounted) setState({ data: fallback, loading: false, source: "fallback", refetch: async () => undefined });
        return;
      }

      const mapped: Asset[] = (data ?? []).map((row) => {
        const r = row as DbRow;
        return {
          id: String(r.id ?? ""),
          name: asText(r.name, "Untitled"),
          type: (asText(r.type, "image") as Asset["type"]) ?? "image",
          version: asText(r.version, "1.0"),
          tags: asStringArray(r.tags),
          updatedAt: asText(r.updated_at, new Date().toISOString()),
          url: asText(r.url, "#"),
        };
      });

      if (mounted) {
        setState({
          data: mapped.length > 0 ? mapped : fallback,
          loading: false,
          source: mapped.length > 0 ? "supabase" : "fallback",
          refetch: async () => undefined,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentClient?.id, fallback, isAllClientsSelected]);

  return state;
}

