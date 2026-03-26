import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type IntegrationProvider =
  | "tldv"
  | "lemlist"
  | "semrush"
  | "supermetrics"
  | "market-news"
  | "claude";

export type IntegrationRunStatus = "running" | "success" | "partial" | "failed";

export type IntegrationRunMetrics = {
  recordsFetched?: number;
  recordsUpserted?: number;
  recordsFailed?: number;
  durationMs?: number;
};

export type IntegrationRunInput = {
  provider: IntegrationProvider;
  connector: string;
  clientId?: string | null;
  triggerType?: "manual" | "scheduled" | "webhook";
  startedBy?: string | null;
  requestPayload?: Record<string, unknown> | null;
};

type UpdateRunInput = {
  status: IntegrationRunStatus;
  metrics?: IntegrationRunMetrics;
  errorMessage?: string | null;
  errorDetails?: Record<string, unknown> | null;
  samplePayload?: Record<string, unknown> | null;
};

export function createServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase runtime secrets");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export async function startIntegrationRun(
  supabase: ReturnType<typeof createServiceClient>,
  input: IntegrationRunInput,
): Promise<string | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("integration_sync_runs")
    .insert({
      provider: input.provider,
      connector: input.connector,
      client_id: input.clientId ?? null,
      trigger_type: input.triggerType ?? "manual",
      started_by: input.startedBy ?? "system",
      status: "running",
      started_at: now,
      request_payload: input.requestPayload ?? null,
    })
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("startIntegrationRun error:", error);
    return null;
  }
  return typeof data?.id === "string" ? data.id : null;
}

export async function finishIntegrationRun(
  supabase: ReturnType<typeof createServiceClient>,
  runId: string | null,
  update: UpdateRunInput,
) {
  if (!runId) return;
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status: update.status,
    completed_at: now,
    updated_at: now,
  };
  if (update.metrics) payload.metrics = update.metrics;
  if (typeof update.errorMessage === "string") payload.error_message = update.errorMessage;
  if (update.errorDetails) payload.error_details = update.errorDetails;
  if (update.samplePayload) payload.sample_payload = update.samplePayload;

  const { error } = await supabase.from("integration_sync_runs").update(payload).eq("id", runId);
  if (error) {
    console.error("finishIntegrationRun error:", error);
  }
}

export function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
