import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WRIKE_BASE = "https://www.wrike.com/api/v4";

// Wrike custom field IDs (mirrored from src/types/wrike.ts)
const FIELD_CANAL_DIFFUSION = "IEAETAZKJUAGUPRZ";
const FIELD_FORMAT = "IEAETAZKJUAGU5LL";
const FIELD_THEMATIQUE = "IEAETAZKJUAE3VV2";
const FIELD_LIEN_CONTENU_PROD = "IEAETAZKJUAGUNSK";
const FIELD_LIEN_CONTENU_REDAC = "IEAETAZKJUAIIP4M";
const FIELD_MOT_CLE_CIBLE = "IEAETAZKJUAIJ7IP";

type WrikeCustomField = { id: string; value: string | number | string[] };
type WrikeTask = {
  id: string;
  title: string;
  description?: string;
  status: string;
  customStatusId?: string;
  importance?: string;
  dates?: { start?: string; due?: string; type?: string };
  permalink?: string;
  parentIds?: string[];
  customFields?: WrikeCustomField[];
};

type WrikeWorkflow = {
  customStatuses: { id: string; name: string; group: string }[];
};

type CalendarEntryRow = {
  client_id: string;
  date: string;
  time_slot: string | null;
  canal: string;
  content_type: string;
  title: string;
  pilier: string | null;
  status: string;
  source_skill: string;
  source_proposal_id: string;
  owner: string | null;
  notes: string | null;
  tags: string[];
  priority: string;
  draft_content: string | null;
};

// Wrike workflow group → editorial_calendar status
const STATUS_FROM_GROUP: Record<string, string> = {
  Active: "brouillon",
  Completed: "publie",
  Deferred: "idee",
  Cancelled: "idee",
};

// Importance → editorial priority
const PRIORITY_FROM_IMPORTANCE: Record<string, string> = {
  High: "urgent",
  Normal: "normal",
  Low: "normal",
};

function getCustomFieldValue(task: WrikeTask, fieldId: string): string {
  const field = (task.customFields ?? []).find((f) => f.id === fieldId);
  if (!field) return "";
  if (Array.isArray(field.value)) return field.value.join(", ");
  if (typeof field.value === "string") return field.value;
  if (typeof field.value === "number") return String(field.value);
  return "";
}

// Normalize Wrike canal text to editorial calendar canal key
function normalizeCanal(raw: string): string | null {
  const v = raw.toLowerCase().trim();
  if (!v) return null;
  if (v.includes("linkedin")) return "linkedin";
  if (v.includes("newsletter") || v.includes("mailing") || v.includes("email")) return "newsletter";
  if (v.includes("blog") || v.includes("article")) return "blog";
  if (v.includes("site") || v.includes("web") || v.includes("landing")) return "web";
  if (v.includes("notion")) return "notion";
  if (v.includes("twitter") || v.includes("x ")) return "twitter";
  if (v.includes("instagram")) return "instagram";
  if (v.includes("facebook")) return "facebook";
  return null;
}

// Normalize Wrike format to a content_type, recognizing content-producing types
function normalizeContentType(raw: string): string | null {
  const v = raw.toLowerCase().trim();
  if (!v) return null;
  if (v.includes("article") || v.includes("blog")) return "article";
  if (v.includes("post")) return "post";
  if (v.includes("newsletter")) return "newsletter";
  if (v.includes("landing")) return "landing_page";
  if (v.includes("page")) return "page";
  if (v.includes("video")) return "video";
  if (v.includes("livre blanc") || v.includes("whitepaper")) return "whitepaper";
  if (v.includes("infographie")) return "infographic";
  return null;
}

// Decide if a Wrike task represents a calendar-worthy content item
function isContentTask(canalKey: string | null, contentTypeKey: string | null): boolean {
  return Boolean(canalKey) || Boolean(contentTypeKey);
}

async function wrikeFetch(url: string, token: string): Promise<Record<string, unknown>> {
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Wrike API error [${resp.status}]: ${errText.slice(0, 300)}`);
  }
  return await resp.json();
}

async function fetchAllTasksInFolder(folderId: string, token: string): Promise<WrikeTask[]> {
  const tasks: WrikeTask[] = [];
  let nextPageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      fields: '["customFields"]',
      pageSize: "100",
      descendants: "true",
    });
    if (nextPageToken) params.set("nextPageToken", nextPageToken);
    const resp = await wrikeFetch(`${WRIKE_BASE}/folders/${folderId}/tasks?${params}`, token);
    const batch = (resp.data as WrikeTask[] | undefined) ?? [];
    tasks.push(...batch);
    nextPageToken = resp.nextPageToken as string | undefined;
  } while (nextPageToken);
  return tasks;
}

function pickDate(task: WrikeTask): string | null {
  const due = task.dates?.due;
  if (due) return due.slice(0, 10);
  const start = task.dates?.start;
  if (start) return start.slice(0, 10);
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let runId: string | null = null;
  const startedAt = Date.now();
  const supabase = createServiceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const clientId = safeString(body?.clientId);
    const wrikeFolderId = safeString(body?.wrikeFolderId);
    const dryRun = Boolean(body?.dryRun);

    if (!clientId || !wrikeFolderId) {
      return new Response(
        JSON.stringify({ error: "clientId and wrikeFolderId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const WRIKE_TOKEN = Deno.env.get("WRIKE_ACCESS_TOKEN");
    if (!WRIKE_TOKEN) {
      return new Response(
        JSON.stringify({ error: "WRIKE_ACCESS_TOKEN is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    runId = await startIntegrationRun(supabase, {
      provider: "wrike",
      connector: "editorial-calendar",
      clientId,
      triggerType: "manual",
      requestPayload: { wrikeFolderId, dryRun },
    });

    // Load workflows to map customStatusId → status group
    const workflowsResp = await wrikeFetch(`${WRIKE_BASE}/workflows`, WRIKE_TOKEN);
    const statusGroupMap = new Map<string, string>();
    for (const wf of (workflowsResp.data as WrikeWorkflow[] | undefined) ?? []) {
      for (const cs of wf.customStatuses ?? []) {
        statusGroupMap.set(cs.id, cs.group);
      }
    }

    // Fetch all descendant tasks for the client's Wrike folder
    const allTasks = await fetchAllTasksInFolder(wrikeFolderId, WRIKE_TOKEN);

    const rows: CalendarEntryRow[] = [];
    let skippedNoDate = 0;
    let skippedNotContent = 0;

    for (const task of allTasks) {
      const canalRaw = getCustomFieldValue(task, FIELD_CANAL_DIFFUSION);
      const formatRaw = getCustomFieldValue(task, FIELD_FORMAT);
      const canalKey = normalizeCanal(canalRaw);
      const contentTypeKey = normalizeContentType(formatRaw);

      if (!isContentTask(canalKey, contentTypeKey)) {
        skippedNotContent++;
        continue;
      }

      const date = pickDate(task);
      if (!date) {
        skippedNoDate++;
        continue;
      }

      const group = task.customStatusId ? statusGroupMap.get(task.customStatusId) ?? "Active" : "Active";
      const status = STATUS_FROM_GROUP[group] ?? "brouillon";
      const priority = PRIORITY_FROM_IMPORTANCE[task.importance ?? "Normal"] ?? "normal";

      const thematique = getCustomFieldValue(task, FIELD_THEMATIQUE);
      const motCle = getCustomFieldValue(task, FIELD_MOT_CLE_CIBLE);
      const lienProd = getCustomFieldValue(task, FIELD_LIEN_CONTENU_PROD);
      const lienRedac = getCustomFieldValue(task, FIELD_LIEN_CONTENU_REDAC);

      const tags: string[] = [];
      if (thematique) tags.push(thematique);
      if (motCle) tags.push(motCle);

      const notesParts: string[] = [];
      if (task.permalink) notesParts.push(`Wrike: ${task.permalink}`);
      if (lienProd) notesParts.push(`Contenu prod: ${lienProd}`);
      if (lienRedac) notesParts.push(`Contenu redac: ${lienRedac}`);
      if (task.description) notesParts.push(task.description.replace(/<[^>]*>/g, "").slice(0, 500));

      rows.push({
        client_id: clientId,
        date,
        time_slot: null,
        canal: canalKey ?? "blog",
        content_type: contentTypeKey ?? (canalKey === "linkedin" ? "post" : "article"),
        title: task.title,
        pilier: thematique || null,
        status,
        source_skill: "wrike",
        source_proposal_id: task.id,
        owner: null,
        notes: notesParts.length > 0 ? notesParts.join("\n") : null,
        tags,
        priority,
        draft_content: null,
      });
    }

    if (dryRun) {
      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: {
          recordsFetched: allTasks.length,
          recordsUpserted: 0,
          durationMs: Date.now() - startedAt,
        },
      });
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalWrikeTasks: allTasks.length,
          matchedContent: rows.length,
          skippedNotContent,
          skippedNoDate,
          sample: rows.slice(0, 5),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Reset previously imported wrike entries for this client, then insert fresh
    const { error: deleteError } = await supabase
      .from("editorial_calendar")
      .delete()
      .eq("client_id", clientId)
      .eq("source_skill", "wrike");
    if (deleteError) throw new Error(`Failed to reset wrike entries: ${deleteError.message}`);

    let inserted = 0;
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("editorial_calendar").insert(rows);
      if (insertError) throw new Error(`Failed to insert calendar entries: ${insertError.message}`);
      inserted = rows.length;
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: allTasks.length,
        recordsUpserted: inserted,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: rows[0]
        ? { title: rows[0].title, canal: rows[0].canal, content_type: rows[0].content_type }
        : null,
    });

    return new Response(
      JSON.stringify({
        imported: inserted,
        totalWrikeTasks: allTasks.length,
        skippedNotContent,
        skippedNoDate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    await finishIntegrationRun(supabase, runId, {
      status: "failed",
      metrics: { durationMs: Date.now() - startedAt },
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
