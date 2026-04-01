import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WRIKE_BASE = "https://www.wrike.com/api/v4";
const ACTIVE_SPACE_ID = "IEAETAZKI4VTWN6S";

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

type WrikeFolder = {
  id: string;
  title: string;
  childIds?: string[];
  project?: { status?: string };
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

type ClientMapping = {
  client_id: string;
  external_account_id: string;
};

type ClientSyncResult = {
  client_id: string;
  wrike_folder_id: string;
  total_tasks: number;
  synced: number;
  skipped: number;
  errors: string[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const WRIKE_TOKEN = Deno.env.get("WRIKE_ACCESS_TOKEN");
  if (!WRIKE_TOKEN) {
    return new Response(
      JSON.stringify({ error: "WRIKE_ACCESS_TOKEN is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // --- Stage 1: Discover active clients from Wrike folder tree ---
    const foldersResp = await wrikeFetch(
      `${WRIKE_BASE}/folders/${ACTIVE_SPACE_ID}/folders`,
      WRIKE_TOKEN
    );
    const activeWrikeFolders = ((foldersResp.data || []) as WrikeFolder[]).filter(
      (f) => f.project // Only project-type folders (= client projects)
    );

    console.log(
      `Found ${activeWrikeFolders.length} active project folders in Wrike ACTIVE space`
    );

    // --- Stage 2: Match Wrike folders to internal clients via client_data_mappings ---
    const { data: mappingRows, error: mappingError } = await supabase
      .from("client_data_mappings")
      .select("client_id,external_account_id")
      .eq("provider", "wrike")
      .eq("status", "connected")
      .eq("is_active", true);

    if (mappingError) {
      throw new Error(`Failed to read client_data_mappings: ${mappingError.message}`);
    }

    // Build lookup: wrike folder ID → client_id
    const folderToClient = new Map<string, string>();
    for (const row of (mappingRows ?? []) as ClientMapping[]) {
      if (row.external_account_id && row.client_id) {
        folderToClient.set(row.external_account_id, row.client_id);
      }
    }

    // Filter to only folders that have a connected mapping
    const clientsToSync: Array<{ client_id: string; wrike_folder_id: string; folder_title: string }> = [];
    const unmatchedFolders: string[] = [];

    for (const folder of activeWrikeFolders) {
      const clientId = folderToClient.get(folder.id);
      if (clientId) {
        clientsToSync.push({
          client_id: clientId,
          wrike_folder_id: folder.id,
          folder_title: folder.title,
        });
      } else {
        unmatchedFolders.push(folder.title);
      }
    }

    console.log(
      `Matched ${clientsToSync.length} clients for sync. Unmatched folders: ${unmatchedFolders.join(", ") || "none"}`
    );

    if (clientsToSync.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active clients with connected Wrike mappings found.",
          active_wrike_folders: activeWrikeFolders.length,
          unmatched_folders: unmatchedFolders,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Stage 3: Fetch workflows once (shared across all clients) ---
    const workflowsResp = await wrikeFetch(
      `${WRIKE_BASE}/workflows`,
      WRIKE_TOKEN
    );
    const statusMap = new Map<string, string>();
    for (const wf of workflowsResp.data || []) {
      for (const cs of (wf as WrikeWorkflow).customStatuses || []) {
        statusMap.set(cs.id, cs.group);
      }
    }

    // --- Stage 4: Record sync run ---
    const runStartedAt = new Date().toISOString();
    const { data: runData } = await supabase
      .from("integration_sync_runs")
      .insert({
        provider: "wrike",
        connector: "active-clients-sync",
        trigger_type: "manual",
        started_by: "system",
        status: "running",
        started_at: runStartedAt,
        request_payload: {
          clients_count: clientsToSync.length,
          client_ids: clientsToSync.map((c) => c.client_id),
        },
      })
      .select("id")
      .maybeSingle();
    const runId = runData?.id as string | null;

    // --- Stage 5: Sync tasks for each active client ---
    const results: ClientSyncResult[] = [];
    let totalSynced = 0;
    let totalSkipped = 0;
    let totalTasks = 0;

    for (const client of clientsToSync) {
      const result = await syncClientTasks(
        client.client_id,
        client.wrike_folder_id,
        WRIKE_TOKEN,
        supabase,
        statusMap
      );
      results.push(result);
      totalSynced += result.synced;
      totalSkipped += result.skipped;
      totalTasks += result.total_tasks;
      console.log(
        `[${client.folder_title}] synced=${result.synced} skipped=${result.skipped} total=${result.total_tasks}`
      );
    }

    // --- Stage 6: Finalize sync run ---
    const hasErrors = results.some((r) => r.errors.length > 0);
    if (runId) {
      const now = new Date().toISOString();
      await supabase
        .from("integration_sync_runs")
        .update({
          status: hasErrors ? "partial" : "success",
          completed_at: now,
          updated_at: now,
          metrics: {
            recordsFetched: totalTasks,
            recordsUpserted: totalSynced,
            recordsFailed: totalSkipped,
            clientsSynced: clientsToSync.length,
          },
          ...(hasErrors
            ? {
                error_details: {
                  client_errors: results
                    .filter((r) => r.errors.length > 0)
                    .map((r) => ({
                      client_id: r.client_id,
                      errors: r.errors,
                    })),
                },
              }
            : {}),
        })
        .eq("id", runId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        clients_synced: clientsToSync.length,
        total_tasks: totalTasks,
        total_synced: totalSynced,
        total_skipped: totalSkipped,
        unmatched_folders: unmatchedFolders,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("sync-active-wrike-clients error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Sync all tasks for a single client from their Wrike folder.
 */
async function syncClientTasks(
  clientId: string,
  wrikeFolderId: string,
  wrikeToken: string,
  supabase: ReturnType<typeof createClient>,
  statusMap: Map<string, string>
): Promise<ClientSyncResult> {
  const result: ClientSyncResult = {
    client_id: clientId,
    wrike_folder_id: wrikeFolderId,
    total_tasks: 0,
    synced: 0,
    skipped: 0,
    errors: [],
  };

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
      `${WRIKE_BASE}/folders/${wrikeFolderId}/tasks?${params}`,
      wrikeToken
    );
    allTasks.push(...((resp.data as WrikeTask[]) || []));
    nextPageToken = resp.nextPageToken as string | undefined;
  } while (nextPageToken);

  result.total_tasks = allTasks.length;

  if (allTasks.length === 0) return result;

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
      wrikeToken
    );
    for (const c of (contactResp.data as WrikeContact[]) || []) {
      contactMap.set(c.id, `${c.firstName} ${c.lastName}`);
    }
  }

  // Sync each task
  for (const task of allTasks) {
    try {
      const statusGroup = task.customStatusId
        ? statusMap.get(task.customStatusId) || "Active"
        : task.status || "Active";
      const mappedStatus = STATUS_MAP[statusGroup] || "active";

      const imp = IMPORTANCE_MAP[task.importance] || IMPORTANCE_MAP.Normal;

      const assignees = (task.responsibleIds || [])
        .map((id) => contactMap.get(id) || id)
        .join(", ");

      const resourceLinks: { type: string; url: string; label: string }[] = [];
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

      const startDate = task.dates?.start || null;
      const dueDate = task.dates?.due || null;
      const completedAt =
        mappedStatus === "completed" && task.completedDate
          ? task.completedDate
          : null;

      const wrikeProjectId =
        task.parentIds && task.parentIds.length > 0
          ? task.parentIds[0]
          : wrikeFolderId;

      const { error } = await supabase.rpc("sync_wrike_task", {
        p_client_id: clientId,
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
        result.errors.push(`${task.id}: ${error.message}`);
        result.skipped++;
      } else {
        result.synced++;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`${task.id}: ${msg}`);
      result.skipped++;
    }
  }

  return result;
}

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
