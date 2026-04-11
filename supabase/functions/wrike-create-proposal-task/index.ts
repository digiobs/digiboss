import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWrikeToken } from "../_shared/wrike-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Target Wrike customStatus label when a proposal is validated.
 * Matches the "redaction" column in WrikeKanban.tsx.
 */
const DEFAULT_WRIKE_STATUS_LABEL = "En cours de rédaction";

type ProposalRow = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  rationale: string | null;
  draft_content: string | null;
  urgency: string | null;
  source_skill: string | null;
  target_skill: string | null;
  proposal_type: string | null;
  tags: string[] | null;
};

type WrikeWorkflow = {
  customStatuses?: { id: string; name: string; group?: string }[];
};

function urgencyToImportance(urgency: string | null): "High" | "Normal" | "Low" {
  if (!urgency) return "Normal";
  if (urgency.includes("Critique") || urgency.includes("Urgent")) return "High";
  if (urgency.includes("Normal")) return "Low";
  return "Normal";
}

function buildDescription(p: ProposalRow): string {
  const parts: string[] = [];
  if (p.description) parts.push(p.description);
  if (p.rationale) {
    parts.push("");
    parts.push("--- Justification ---");
    parts.push(p.rationale);
  }
  if (p.draft_content) {
    parts.push("");
    parts.push("--- Brouillon ---");
    parts.push(p.draft_content);
  }
  parts.push("");
  parts.push(
    `Source: proposition DigiObs · skill ${p.source_skill ?? "?"} → ${p.target_skill ?? "?"}`,
  );
  parts.push(`Type: ${p.proposal_type ?? "content"}`);
  return parts.join("\n");
}

async function wrikeFetch(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<Record<string, unknown>> {
  const resp = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Wrike API error [${resp.status}]: ${errText.slice(0, 500)}`);
  }
  return (await resp.json()) as Record<string, unknown>;
}

async function resolveCustomStatusId(
  apiBase: string,
  token: string,
  label: string,
): Promise<string | null> {
  try {
    const workflows = await wrikeFetch(`${apiBase}/workflows`, token);
    const data = (workflows.data ?? []) as WrikeWorkflow[];
    const needle = label.trim().toLowerCase();
    for (const wf of data) {
      for (const cs of wf.customStatuses ?? []) {
        if ((cs.name ?? "").trim().toLowerCase() === needle) {
          return cs.id;
        }
      }
    }
    return null;
  } catch (err) {
    console.warn("[wrike-create-proposal-task] workflow resolve failed:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase runtime secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let WRIKE_TOKEN: string | null = null;
  let WRIKE_BASE: string = "https://www.wrike.com/api/v4";
  try {
    const bundle = await getWrikeToken(supabase);
    WRIKE_TOKEN = bundle.token;
    WRIKE_BASE = bundle.apiBase;
  } catch {
    WRIKE_TOKEN = null; // Wrike not connected → function will fall back to approved_without_wrike
  }

  try {
    const body = await req.json().catch(() => ({}));
    const clientId: string | undefined = body?.clientId;
    const proposalId: string | undefined = body?.proposalId;

    if (!clientId || !proposalId) {
      return new Response(
        JSON.stringify({ error: "clientId and proposalId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Always mark the proposal as approved first, so the UI transition
    // happens even if the Wrike call fails downstream.
    const nowIso = new Date().toISOString();
    const { data: proposalData, error: proposalError } = await supabase
      .from("creative_proposals")
      .update({
        status: "approved",
        decided_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", proposalId)
      .eq("client_id", clientId)
      .select(
        "id,client_id,title,description,rationale,draft_content,urgency,source_skill,target_skill,proposal_type,tags",
      )
      .single();

    if (proposalError || !proposalData) {
      return new Response(
        JSON.stringify({
          error: `Failed to approve proposal: ${proposalError?.message ?? "not found"}`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const proposal = proposalData as ProposalRow;

    // Also trigger the existing auto-scheduler into editorial_calendar
    // (the former approve button relied on it).
    await supabase
      .rpc("approve_proposal", { proposal_id: proposalId })
      .then(() => undefined)
      .catch(() => undefined);

    if (!WRIKE_TOKEN) {
      return new Response(
        JSON.stringify({
          status: "approved_without_wrike",
          error: "WRIKE_ACCESS_TOKEN not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up the client's Wrike folder.
    const { data: mappingRow, error: mappingError } = await supabase
      .from("client_data_mappings")
      .select("external_account_id,external_project_id")
      .eq("client_id", clientId)
      .eq("provider", "wrike")
      .eq("status", "connected")
      .maybeSingle();

    if (mappingError) {
      return new Response(
        JSON.stringify({
          status: "approved_without_wrike",
          error: `mapping lookup failed: ${mappingError.message}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const folderId =
      (mappingRow?.external_account_id as string | null) ||
      (mappingRow?.external_project_id as string | null) ||
      null;

    if (!folderId) {
      return new Response(
        JSON.stringify({
          status: "approved_without_wrike",
          error: "No connected Wrike folder for this client",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve the "En cours de rédaction" customStatus (may be null if
    // the workspace doesn't use that label — we still create the task).
    const customStatusId = await resolveCustomStatusId(
      WRIKE_BASE,
      WRIKE_TOKEN,
      DEFAULT_WRIKE_STATUS_LABEL,
    );

    const importance = urgencyToImportance(proposal.urgency);
    const wrikeBody: Record<string, unknown> = {
      title: proposal.title,
      description: buildDescription(proposal),
      importance,
    };
    if (customStatusId) {
      wrikeBody.customStatus = customStatusId;
    }

    let wrikeTaskId: string | null = null;
    let wrikePermalink: string | null = null;
    let createError: string | null = null;

    try {
      const wrikeResp = await wrikeFetch(
        `${WRIKE_BASE}/folders/${folderId}/tasks`,
        WRIKE_TOKEN,
        { method: "POST", body: JSON.stringify(wrikeBody) },
      );
      const tasks = (wrikeResp.data ?? []) as Array<{
        id: string;
        permalink?: string;
      }>;
      if (tasks.length > 0) {
        wrikeTaskId = tasks[0].id;
        wrikePermalink = tasks[0].permalink ?? null;
      } else {
        createError = "Wrike returned empty task list";
      }
    } catch (err) {
      createError = err instanceof Error ? err.message : String(err);
    }

    if (createError) {
      // Audit trail (best effort — fire and forget).
      await supabase
        .from("integration_sync_runs")
        .insert({
          provider: "wrike",
          connector: "create-proposal-task",
          client_id: clientId,
          status: "error",
          error_message: createError.slice(0, 500),
          request_payload: { proposal_id: proposalId, folder_id: folderId },
          completed_at: new Date().toISOString(),
        })
        .then(() => undefined)
        .catch(() => undefined);

      return new Response(
        JSON.stringify({
          status: "approved_without_wrike",
          error: createError,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Persist the Wrike task link on the proposal.
    await supabase
      .from("creative_proposals")
      .update({
        wrike_task_id: wrikeTaskId,
        wrike_permalink: wrikePermalink,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    return new Response(
      JSON.stringify({
        status: "ok",
        wrike_task_id: wrikeTaskId,
        wrike_permalink: wrikePermalink,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[wrike-create-proposal-task] unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
