import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WRIKE_BASE = "https://www.wrike.com/api/v4";

/**
 * Mapping: creative_proposals.status → Wrike customStatus label
 * (labels must match the workspace workflow used by WrikeKanban.tsx).
 */
const PROPOSAL_STATUS_TO_WRIKE_LABEL: Record<string, string> = {
  ready_to_publish: "À publier",
  published: "Publié",
};

type WrikeWorkflow = {
  customStatuses?: { id: string; name: string }[];
};

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
  token: string,
  label: string,
): Promise<string | null> {
  try {
    const workflows = await wrikeFetch(`${WRIKE_BASE}/workflows`, token);
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
    console.warn("[wrike-update-proposal-status] workflow resolve failed:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const WRIKE_TOKEN = Deno.env.get("WRIKE_ACCESS_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase runtime secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const proposalId: string | undefined = body?.proposalId;
    const newProposalStatus: string | undefined = body?.newProposalStatus;

    if (!proposalId || !newProposalStatus) {
      return new Response(
        JSON.stringify({ error: "proposalId and newProposalStatus are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const wrikeLabel = PROPOSAL_STATUS_TO_WRIKE_LABEL[newProposalStatus];
    if (!wrikeLabel) {
      return new Response(
        JSON.stringify({
          error: `Unsupported newProposalStatus: ${newProposalStatus}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Update the proposal row first (source of truth for UI).
    const nowIso = new Date().toISOString();
    const update: Record<string, unknown> = {
      status: newProposalStatus,
      updated_at: nowIso,
    };
    if (newProposalStatus === "ready_to_publish") update.ready_at = nowIso;
    if (newProposalStatus === "published") update.published_at = nowIso;

    const { data: proposalData, error: proposalError } = await supabase
      .from("creative_proposals")
      .update(update)
      .eq("id", proposalId)
      .select("id,wrike_task_id")
      .single();

    if (proposalError || !proposalData) {
      return new Response(
        JSON.stringify({
          error: `Failed to update proposal: ${proposalError?.message ?? "not found"}`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const wrikeTaskId = (proposalData.wrike_task_id as string | null) ?? null;

    if (!wrikeTaskId) {
      return new Response(
        JSON.stringify({
          status: "updated_without_wrike",
          error: "Proposal has no linked Wrike task",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!WRIKE_TOKEN) {
      return new Response(
        JSON.stringify({
          status: "updated_without_wrike",
          error: "WRIKE_ACCESS_TOKEN not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Resolve the target customStatus and push it to Wrike.
    const customStatusId = await resolveCustomStatusId(WRIKE_TOKEN, wrikeLabel);
    if (!customStatusId) {
      return new Response(
        JSON.stringify({
          status: "updated_without_wrike",
          error: `Wrike workflow has no status labelled "${wrikeLabel}"`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      await wrikeFetch(
        `${WRIKE_BASE}/tasks/${wrikeTaskId}`,
        WRIKE_TOKEN,
        {
          method: "PUT",
          body: JSON.stringify({ customStatus: customStatusId }),
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase
        .from("integration_sync_runs")
        .insert({
          provider: "wrike",
          connector: "update-proposal-status",
          status: "error",
          error_message: message.slice(0, 500),
          request_payload: {
            proposal_id: proposalId,
            wrike_task_id: wrikeTaskId,
            target_status: newProposalStatus,
          },
          completed_at: new Date().toISOString(),
        })
        .then(() => undefined)
        .catch(() => undefined);

      return new Response(
        JSON.stringify({ status: "updated_without_wrike", error: message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        wrike_task_id: wrikeTaskId,
        new_proposal_status: newProposalStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[wrike-update-proposal-status] unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
