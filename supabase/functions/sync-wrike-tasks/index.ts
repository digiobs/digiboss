import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWrikeToken } from "../_shared/wrike-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Custom field IDs → resource_links type mapping
const CUSTOM_FIELD_LINKS: Record<string, string> = {
  IEAETAZKJUAIIP4J: "figma",
  IEAETAZKJUAIIP4M: "gdocs",
  IEAETAZKJUAGUNSK: "page",
};

// Custom field IDs that map to tags
const CUSTOM_FIELD_TAGS: string[] = [
  "IEAETAZKJUAIJ7IP", // SEO keyword
  "IEAETAZKJUAGUPRZ", // Category
];

// Ignored custom fields
const CUSTOM_FIELD_IGNORE: string[] = [
  "IEAETAZKJUAJDXT2", // Score (numeric)
];

// Status mapping: Wrike → plan_tasks
const STATUS_MAP: Record<string, string> = {
  Active: "active",
  Completed: "completed",
  Deferred: "deferred",
  Cancelled: "cancelled",
};

// Importance mapping
const IMPORTANCE_MAP: Record<string, { importance: string; priority: string }> =
  {
    High: { importance: "High", priority: "high" },
    Normal: { importance: "Normal", priority: "normal" },
    Low: { importance: "Low", priority: "low" },
  };

type WrikeTask = {
  id: string;
  title: string;
  description?: string;
  status: string;
  importance: string;
  dates?: { start?: string; due?: string };
  completedDate?: string;
  responsibleIds?: string[];
  permalink?: string;
  parentIds?: string[];
  customFields?: { id: string; value: string }[];
  customStatusId?: string;
};

type WrikeContact = {
  id: string;
  firstName: string;
  lastName: string;
};

type WrikeWorkflow = {
  customStatuses: { id: string; name: string; group: string }[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let WRIKE_TOKEN: string;
  let WRIKE_BASE: string;
  try {
    const bundle = await getWrikeToken(supabase);
    WRIKE_TOKEN = bundle.token;
    WRIKE_BASE = bundle.apiBase;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const { client_id, wrike_folder_id } = body;

    if (!client_id || !wrike_folder_id) {
      return new Response(
        JSON.stringify({
          error: "client_id and wrike_folder_id are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch workflows (to resolve custom status → status group)
    const workflowsResp = await wrikeFetch(
      `${WRIKE_BASE}/workflows`,
      WRIKE_TOKEN
    );
    const statusMap = new Map<string, string>();
    for (const wf of workflowsResp.data || []) {
      for (const cs of (wf as WrikeWorkflow).customStatuses || []) {
        statusMap.set(cs.id, cs.group); // group = Active, Completed, Deferred, Cancelled
      }
    }

    // Fetch all tasks from the folder with pagination
    const allTasks: WrikeTask[] = [];
    let nextPageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        fields: '["customFields","effortAllocation"]',
        pageSize: "100",
      });
      if (nextPageToken) params.set("nextPageToken", nextPageToken);

      const resp = await wrikeFetch(
        `${WRIKE_BASE}/folders/${wrike_folder_id}/tasks?${params}`,
        WRIKE_TOKEN
      );
      allTasks.push(...((resp.data as WrikeTask[]) || []));
      nextPageToken = resp.nextPageToken;
    } while (nextPageToken);

    // Collect unique responsible IDs to resolve names
    const responsibleIds = new Set<string>();
    for (const task of allTasks) {
      for (const rid of task.responsibleIds || []) {
        responsibleIds.add(rid);
      }
    }

    // Fetch contacts for name resolution
    const contactMap = new Map<string, string>();
    if (responsibleIds.size > 0) {
      const ids = Array.from(responsibleIds).join(",");
      const contactResp = await wrikeFetch(
        `${WRIKE_BASE}/contacts/${ids}`,
        WRIKE_TOKEN
      );
      for (const c of (contactResp.data as WrikeContact[]) || []) {
        contactMap.set(c.id, `${c.firstName} ${c.lastName}`);
      }
    }

    // Sync each task
    let synced = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const task of allTasks) {
      try {
        // Resolve status
        const statusGroup = task.customStatusId
          ? statusMap.get(task.customStatusId) || "Active"
          : task.status || "Active";
        const mappedStatus = STATUS_MAP[statusGroup] || "active";

        // Resolve importance
        const imp = IMPORTANCE_MAP[task.importance] || IMPORTANCE_MAP.Normal;

        // Resolve assignees
        const assignees = (task.responsibleIds || [])
          .map((id) => contactMap.get(id) || id)
          .join(", ");

        // Extract resource links from custom fields
        const resourceLinks: { type: string; url: string; label: string }[] =
          [];
        const extraTags: string[] = [];

        for (const cf of task.customFields || []) {
          if (CUSTOM_FIELD_IGNORE.includes(cf.id)) continue;

          if (CUSTOM_FIELD_LINKS[cf.id] && cf.value) {
            const linkType = CUSTOM_FIELD_LINKS[cf.id];
            const label =
              linkType === "figma"
                ? "Maquette Figma"
                : linkType === "gdocs"
                  ? "Google Docs"
                  : "Page web";
            resourceLinks.push({ type: linkType, url: cf.value, label });
          }

          if (CUSTOM_FIELD_TAGS.includes(cf.id) && cf.value) {
            extraTags.push(cf.value);
          }
        }

        // Dates
        const startDate = task.dates?.start || null;
        const dueDate = task.dates?.due || null;
        const completedAt =
          mappedStatus === "completed" && task.completedDate
            ? task.completedDate
            : null;

        // Wrike project ID (first parent folder)
        const wrikeProjectId =
          task.parentIds && task.parentIds.length > 0
            ? task.parentIds[0]
            : wrike_folder_id;

        const { error } = await supabase.rpc("sync_wrike_task", {
          p_client_id: client_id,
          p_wrike_task_id: task.id,
          p_title: task.title,
          p_description: task.description || null,
          p_status: mappedStatus,
          p_priority: imp.priority,
          p_importance: imp.importance,
          p_assignee: assignees || null,
          p_start_date: startDate,
          p_due_date: dueDate,
          p_completed_at: completedAt,
          p_wrike_permalink: task.permalink || null,
          p_wrike_project_id: wrikeProjectId,
          p_resource_links: resourceLinks,
          p_tags: extraTags,
        });

        if (error) {
          errors.push(`${task.id}: ${error.message}`);
          skipped++;
        } else {
          synced++;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${task.id}: ${msg}`);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        client_id,
        wrike_folder_id,
        total_wrike_tasks: allTasks.length,
        synced,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("sync-wrike-tasks error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function wrikeFetch(
  url: string,
  token: string
): Promise<Record<string, unknown>> {
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Wrike API error [${resp.status}]: ${errText}`);
  }
  return await resp.json();
}
