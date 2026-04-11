import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWrikeToken } from "../_shared/wrike-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DbTask = {
  id: string;
  client_id: string;
  title: string;
  status: string;
  wrike_task_id: string | null;
  wrike_step_id: string | null;
  wrike_project_id: string | null;
  wrike_permalink: string | null;
};

type WrikeTask = {
  id?: string;
  title?: string;
  permalink?: string;
  status?: string;
  customStatusId?: string;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function similarityScore(a: string, b: string): number {
  const aa = normalizeText(a);
  const bb = normalizeText(b);
  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if (bb.includes(aa) || aa.includes(bb)) return 0.9;

  const aTokens = new Set(aa.split(" ").filter(Boolean));
  const bTokens = new Set(bb.split(" ").filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let overlap = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) overlap += 1;
  });
  return overlap / Math.max(aTokens.size, bTokens.size);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const requestedClientId = (body?.clientId as string | undefined) ?? null;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase runtime secrets");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let WRIKE_ACCESS_TOKEN: string;
    let WRIKE_API_BASE: string;
    try {
      const bundle = await getWrikeToken(supabase);
      WRIKE_ACCESS_TOKEN = bundle.token;
      WRIKE_API_BASE = bundle.apiBase;
    } catch (err) {
      return new Response(
        JSON.stringify({
          matched: 0,
          totalCandidates: 0,
          message: err instanceof Error ? err.message : "Wrike not connected",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let taskQuery = supabase
      .from("plan_tasks")
      .select("id,client_id,title,status,wrike_task_id,wrike_step_id,wrike_project_id,wrike_permalink")
      .order("updated_at", { ascending: false });
    if (requestedClientId) taskQuery = taskQuery.eq("client_id", requestedClientId);
    const { data: dbTasks, error: tasksError } = await taskQuery;
    if (tasksError) throw new Error(`Failed to read plan_tasks: ${tasksError.message}`);

    const tasks = (dbTasks ?? []) as DbTask[];
    if (tasks.length === 0) {
      return new Response(
        JSON.stringify({ matched: 0, totalCandidates: 0, message: "No plan tasks found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let mappingQuery = supabase
      .from("client_data_mappings")
      .select("client_id,connector,external_account_id,status")
      .eq("provider", "wrike")
      .eq("status", "connected");
    if (requestedClientId) mappingQuery = mappingQuery.eq("client_id", requestedClientId);
    const { data: mappingRows } = await mappingQuery;
    const clientFolder = new Map<string, string>();
    (mappingRows ?? []).forEach((r) => {
      const row = r as Record<string, unknown>;
      const cid = String(row.client_id ?? "");
      const accountId = String(row.external_account_id ?? "");
      if (!cid || !accountId) return;
      if (!clientFolder.has(cid)) clientFolder.set(cid, accountId);
    });

    const tasksByClient = new Map<string, DbTask[]>();
    tasks.forEach((task) => {
      const list = tasksByClient.get(task.client_id) ?? [];
      list.push(task);
      tasksByClient.set(task.client_id, list);
    });

    const updates: Array<{
      id: string;
      wrike_task_id: string;
      wrike_step_id: string | null;
      wrike_project_id: string | null;
      wrike_permalink: string | null;
    }> = [];

    for (const [clientId, clientTasks] of tasksByClient.entries()) {
      const folderOrProjectId = clientFolder.get(clientId);
      if (!folderOrProjectId) continue;

      const wrikeResp = await fetch(
        `${WRIKE_API_BASE}/folders/${folderOrProjectId}/tasks?descendants=true&pageSize=100`,
        {
          headers: {
            Authorization: `Bearer ${WRIKE_ACCESS_TOKEN}`,
          },
        },
      );
      if (!wrikeResp.ok) continue;

      const wrikeJson = await wrikeResp.json();
      const wrikeTasks = ((wrikeJson?.data ?? []) as WrikeTask[]).filter((t) => t?.id && t?.title);
      if (wrikeTasks.length === 0) continue;

      for (const task of clientTasks) {
        if (task.wrike_task_id) continue;
        let best: { score: number; wrike: WrikeTask } | null = null;
        for (const wrikeTask of wrikeTasks) {
          const score = similarityScore(task.title, wrikeTask.title ?? "");
          if (!best || score > best.score) best = { score, wrike: wrikeTask };
        }
        if (!best || best.score < 0.5 || !best.wrike.id) continue;
        updates.push({
          id: task.id,
          wrike_task_id: best.wrike.id,
          wrike_step_id: best.wrike.customStatusId ?? best.wrike.status ?? null,
          wrike_project_id: folderOrProjectId,
          wrike_permalink: best.wrike.permalink ?? null,
        });
      }
    }

    if (updates.length > 0) {
      const { error: upsertError } = await supabase.from("plan_tasks").upsert(updates, { onConflict: "id" });
      if (upsertError) throw new Error(`Failed to write wrike matches: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        matched: updates.length,
        totalCandidates: tasks.length,
        updates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
