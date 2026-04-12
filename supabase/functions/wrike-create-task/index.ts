import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWrikeToken } from "../_shared/wrike-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  let WRIKE_BASE = "https://www.wrike.com/api/v4";
  try {
    const bundle = await getWrikeToken(supabase);
    WRIKE_TOKEN = bundle.token;
    WRIKE_BASE = bundle.apiBase;
  } catch {
    WRIKE_TOKEN = null;
  }

  if (!WRIKE_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Wrike not connected", status: "skipped" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const taskId: string | undefined = body?.taskId;
    const clientId: string | undefined = body?.clientId;
    const taskData: Record<string, unknown> | undefined = body?.taskData;

    if (!taskId || !clientId || !taskData) {
      return new Response(
        JSON.stringify({ error: "taskId, clientId, and taskData are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up the client's Wrike folder
    const { data: mappingRow, error: mappingError } = await supabase
      .from("client_data_mappings")
      .select("external_account_id,external_project_id")
      .eq("client_id", clientId)
      .eq("provider", "wrike")
      .eq("status", "connected")
      .maybeSingle();

    if (mappingError) {
      return new Response(
        JSON.stringify({ error: `mapping lookup failed: ${mappingError.message}`, status: "skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const folderId =
      (mappingRow?.external_account_id as string | null) ||
      (mappingRow?.external_project_id as string | null) ||
      null;

    if (!folderId) {
      return new Response(
        JSON.stringify({ error: "No connected Wrike folder for this client", status: "skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create the task in Wrike
    const wrikeResp = await fetch(`${WRIKE_BASE}/folders/${folderId}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WRIKE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    if (!wrikeResp.ok) {
      const errText = await wrikeResp.text();
      throw new Error(`Wrike API error [${wrikeResp.status}]: ${errText.slice(0, 500)}`);
    }

    const wrikeResult = (await wrikeResp.json()) as {
      data?: Array<{ id: string; permalink?: string }>;
    };

    const createdTask = wrikeResult.data?.[0];
    if (!createdTask) {
      throw new Error("Wrike returned empty task list");
    }

    // Update plan_tasks with Wrike IDs
    const { error: updateError } = await supabase
      .from("plan_tasks")
      .update({
        wrike_task_id: createdTask.id,
        wrike_permalink: createdTask.permalink || null,
        wrike_project_id: folderId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (updateError) {
      console.warn("[wrike-create-task] Failed to update plan_tasks:", updateError.message);
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        wrike_task_id: createdTask.id,
        wrike_permalink: createdTask.permalink,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[wrike-create-task] unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
