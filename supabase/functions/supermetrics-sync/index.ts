import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { asArray, asObject, createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SupermetricsMetric = {
  client_id: string;
  provider: string;
  channel: string;
  metric_key: string;
  metric_value: number;
  period_start: string;
  period_end: string;
  raw: Record<string, unknown>;
  synced_at: string;
};

type SupermetricsMapping = {
  client_id: string;
  external_account_id: string | null;
  external_account_name: string | null;
  external_workspace_id: string | null;
  external_project_id: string | null;
  alias_external_ids: string[] | null;
  mapping_strategy: string | null;
  is_manual_override: boolean;
  is_active: boolean;
};

const METRIC_ALIASES: Record<string, string[]> = {
  impressions: ["impressions", "ad_impressions", "page_impressions", "views"],
  clicks: ["clicks", "ad_clicks", "page_clicks", "link_clicks", "click"],
  conversions: ["conversions", "all_conversions", "conversion", "leads"],
  cost: ["cost", "ad_spend", "spend", "total_cost", "ad_cost"],
  roas: ["roas", "return_on_ad_spend", "purchase_roas"],
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeApiKey(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  return unquoted.length > 0 ? unquoted : null;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseArrayFormat(rows: unknown[]): Record<string, unknown>[] {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const headerRow = rows[0];
  if (!Array.isArray(headerRow)) return [];
  const headers = headerRow.map((value) => String(value));
  return rows
    .slice(1)
    .filter((row) => Array.isArray(row))
    .map((row) => {
      const record: Record<string, unknown> = {};
      headers.forEach((key, index) => {
        record[key] = (row as unknown[])[index] ?? null;
      });
      return record;
    });
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  const obj = asObject(payload);
  const rowsCandidate = asArray(
    obj?.data ??
      obj?.rows ??
      asObject(obj?.data)?.rows ??
      asObject(obj?.data)?.data ??
      obj?.results ??
      payload,
  );
  if (rowsCandidate.length > 0 && Array.isArray(rowsCandidate[0])) {
    return parseArrayFormat(rowsCandidate);
  }
  return rowsCandidate
    .map((value) => asObject(value))
    .filter((value): value is Record<string, unknown> => Boolean(value));
}

function extractScheduleId(payload: unknown): string | null {
  const obj = asObject(payload);
  const nested = asObject(obj?.data);
  return (
    safeString(obj?.schedule_id) ??
    safeString(obj?.scheduleId) ??
    safeString(nested?.schedule_id) ??
    safeString(nested?.scheduleId) ??
    null
  );
}

function metricFromRow(row: Record<string, unknown>, aliases: string[]): number {
  for (const key of aliases) {
    if (key in row) {
      const value = toNumber(row[key]);
      if (value !== 0) return value;
    }
  }
  return 0;
}

function normalizeMetricsFromRows(rows: Record<string, unknown>[], clientId: string, channel: string, periodStart: string, periodEnd: string): SupermetricsMetric[] {
  const now = new Date().toISOString();
  const values = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    cost: 0,
    roasSum: 0,
    roasCount: 0,
  };

  for (const row of rows) {
    values.impressions += metricFromRow(row, METRIC_ALIASES.impressions);
    values.clicks += metricFromRow(row, METRIC_ALIASES.clicks);
    values.conversions += metricFromRow(row, METRIC_ALIASES.conversions);
    values.cost += metricFromRow(row, METRIC_ALIASES.cost);
    const rowRoas = metricFromRow(row, METRIC_ALIASES.roas);
    if (rowRoas > 0) {
      values.roasSum += rowRoas;
      values.roasCount += 1;
    }
  }

  const normalized: Array<{ metric_key: string; metric_value: number }> = [
    { metric_key: "impressions", metric_value: values.impressions },
    { metric_key: "clicks", metric_value: values.clicks },
    { metric_key: "conversions", metric_value: values.conversions },
    { metric_key: "cost", metric_value: values.cost },
    { metric_key: "roas", metric_value: values.roasCount > 0 ? values.roasSum / values.roasCount : 0 },
  ];

  return normalized.map((metric) => ({
    client_id: clientId,
    provider: "supermetrics",
    channel,
    metric_key: metric.metric_key,
    metric_value: metric.metric_value,
    period_start: periodStart,
    period_end: periodEnd,
    raw: {
      source: "supermetrics",
      rows_count: rows.length,
      aggregated_metric: metric.metric_key,
    },
    synced_at: now,
  }));
}

async function fetchMappingRows(params: {
  apiKey: string;
  accountIds: string[];
  periodStart: string;
  periodEnd: string;
  dsId: string;
  reportType?: string;
}): Promise<Record<string, unknown>[]> {
  const baseUrl = (Deno.env.get("SUPERMETRICS_API_URL") ?? "https://api.supermetrics.com/enterprise/v2").replace(/\/$/, "");
  const dataUrl = `${baseUrl}/query/data/json`;
  const fields = ["date", "impressions", "clicks", "conversions", "cost", "roas"];
  const payload: Record<string, unknown> = {
    ds_id: params.dsId,
    ds_accounts: params.accountIds.join(","),
    date_range_type: "custom",
    date_range_start: params.periodStart,
    date_range_end: params.periodEnd,
    fields: fields.join(","),
    max_rows: 10000,
    format: "json",
  };
  if (params.reportType) payload.report_type = params.reportType;

  const authHeaders: Array<Record<string, string>> = [
    { Authorization: `Bearer ${params.apiKey}` },
    { "x-api-key": params.apiKey },
    { Authorization: params.apiKey },
  ];

  let json: unknown = null;
  let lastError = "Unknown Supermetrics API error";
  for (const auth of authHeaders) {
    const response = await fetch(dataUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      lastError = `Supermetrics API error ${response.status}: ${text.slice(0, 280)}`;
      continue;
    }
    json = await response.json();
    lastError = "";
    break;
  }
  if (lastError) throw new Error(lastError);

  let rows = extractRows(json);
  if (rows.length === 0) {
    const scheduleId = extractScheduleId(json);
    if (scheduleId) {
      const resultsUrl = `${baseUrl}/query/results`;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(5000);
        const resultQuery = encodeURIComponent(JSON.stringify({ schedule_id: scheduleId }));
        let resultResponse: Response | null = null;
        let resultError = "";
        for (const auth of authHeaders) {
          const poll = await fetch(`${resultsUrl}?json=${resultQuery}`, {
            method: "GET",
            headers: { "Content-Type": "application/json", ...auth },
          });
          if (poll.ok) {
            resultResponse = poll;
            resultError = "";
            break;
          }
          const txt = await poll.text();
          resultError = `Supermetrics results error ${poll.status}: ${txt.slice(0, 280)}`;
        }
        if (!resultResponse) throw new Error(resultError || "Supermetrics polling failed");
        const resultJson = await resultResponse.json();
        const status = safeString(asObject(resultJson)?.status ?? asObject(asObject(resultJson)?.data)?.status);
        rows = extractRows(resultJson);
        if (rows.length > 0) break;
        if (status && ["failed", "error", "cancelled"].includes(status.toLowerCase())) {
          throw new Error(`Supermetrics async query failed with status ${status}`);
        }
      }
    }
  }
  return rows;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createServiceClient();
  const startedAt = Date.now();
  let runId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const clientId = safeString(body?.clientId);
    const periodEnd = safeString(body?.periodEnd) ?? new Date().toISOString().slice(0, 10);
    const periodStart =
      safeString(body?.periodStart) ??
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
    const apiToken = normalizeApiKey(Deno.env.get("SUPERMETRICS_API_TOKEN") ?? Deno.env.get("SUPERMETRICS_API_KEY"));
    const defaultDsId = safeString(Deno.env.get("SUPERMETRICS_DS_ID")) ?? "LIADS";
    const defaultReportType = safeString(Deno.env.get("SUPERMETRICS_REPORT_TYPE"));

    runId = await startIntegrationRun(supabase, {
      provider: "supermetrics",
      connector: "account",
      clientId,
      triggerType: "manual",
      requestPayload: { periodStart, periodEnd, hasApiToken: Boolean(apiToken), defaultDsId },
    });

    if (!apiToken) {
      throw new Error("SUPERMETRICS_API_TOKEN or SUPERMETRICS_API_KEY is not configured");
    }

    let mappingQuery = supabase
      .from("client_data_mappings")
      .select(
        "client_id,external_account_id,external_account_name,external_workspace_id,external_project_id,alias_external_ids,mapping_strategy,is_manual_override,is_active",
      )
      .eq("provider", "supermetrics")
      .eq("connector", "account")
      .eq("is_active", true);
    if (clientId) mappingQuery = mappingQuery.eq("client_id", clientId);
    const { data: mappings, error: mappingError } = await mappingQuery;
    if (mappingError) throw new Error(`Failed to load Supermetrics mappings: ${mappingError.message}`);
    const activeMappings = (mappings ?? []) as SupermetricsMapping[];

    const metrics: SupermetricsMetric[] = [];
    const mappingErrors: Array<{ client_id: string; error: string }> = [];
    const mappingUpdates: Array<{
      client_id: string;
      provider: string;
      connector: string;
      external_account_id: string;
      external_account_name: string;
      status: string;
      is_active: boolean;
      updated_at: string;
    }> = [];
    for (const mapping of activeMappings) {
      const mappedClientId = safeString(mapping.client_id);
      if (!mappedClientId) continue;
      const accountName = safeString(mapping.external_account_name) ?? mappedClientId;
      const primaryAccountId = safeString(mapping.external_account_id);
      const aliasIds = (mapping.alias_external_ids ?? []).map((value) => safeString(value)).filter((value): value is string => Boolean(value));
      const accountIds = [...new Set([primaryAccountId, ...aliasIds].filter((value): value is string => Boolean(value)))];
      const channel = accountName;
      const dsId = safeString(mapping.external_project_id) ?? defaultDsId;
      const reportType = safeString(mapping.external_workspace_id) ?? defaultReportType ?? undefined;

      if (accountIds.length === 0) {
        mappingErrors.push({ client_id: mappedClientId, error: "Missing external_account_id for active mapping" });
        mappingUpdates.push({
          client_id: mappedClientId,
          provider: "supermetrics",
          connector: "account",
          external_account_id: "",
          external_account_name: accountName,
          status: "missing",
          is_active: true,
          updated_at: new Date().toISOString(),
        });
        continue;
      }

      try {
        const rows = await fetchMappingRows({
          apiKey: apiToken,
          accountIds,
          periodStart,
          periodEnd,
          dsId,
          reportType,
        });
        metrics.push(...normalizeMetricsFromRows(rows, mappedClientId, channel, periodStart, periodEnd));
        mappingUpdates.push({
          client_id: mappedClientId,
          provider: "supermetrics",
          connector: "account",
          external_account_id: primaryAccountId ?? accountIds[0],
          external_account_name: accountName,
          status: "connected",
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown Supermetrics mapping error";
        mappingErrors.push({ client_id: mappedClientId, error: errorMessage });
        mappingUpdates.push({
          client_id: mappedClientId,
          provider: "supermetrics",
          connector: "account",
          external_account_id: primaryAccountId ?? accountIds[0],
          external_account_name: accountName,
          status: "pending",
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (metrics.length > 0) {
      const { error: upsertError } = await supabase
        .from("supermetrics_channel_metrics")
        .upsert(metrics, {
          onConflict: "client_id,provider,channel,metric_key,period_start,period_end",
        });
      if (upsertError) throw new Error(`Failed to upsert Supermetrics rows: ${upsertError.message}`);
    }

    if (mappingUpdates.length > 0) {
      const { error: mappingUpsertError } = await supabase
        .from("client_data_mappings")
        .upsert(mappingUpdates, { onConflict: "client_id,provider,connector" });
      if (mappingUpsertError) {
        throw new Error(`Failed to backfill Supermetrics mappings: ${mappingUpsertError.message}`);
      }
    }

    await finishIntegrationRun(supabase, runId, {
      status: mappingErrors.length > 0 ? "partial" : "success",
      metrics: {
        recordsFetched: metrics.length + mappingErrors.length,
        recordsUpserted: metrics.length,
        recordsFailed: mappingErrors.length,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: metrics[0]
        ? { channel: metrics[0].channel, metric_key: metrics[0].metric_key, failedMappings: mappingErrors.length }
        : { failedMappings: mappingErrors.length },
      errorDetails: mappingErrors.length > 0 ? { mappings: mappingErrors } : undefined,
    });

    return new Response(
      JSON.stringify({
        synced: metrics.length,
        usedLiveApi: true,
        failedMappings: mappingErrors.length,
        mappingErrors,
        periodStart,
        periodEnd,
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
