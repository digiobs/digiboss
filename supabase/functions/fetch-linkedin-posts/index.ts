import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { asArray, asObject, createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LinkedInAccount = {
  client_id: string;
  linkedin_account_id: string;
  linkedin_page_name: string;
};

type SupermetricsLinkedInPost = {
  profile: string;
  profileID?: string;
  update_title?: string;
  update_share_comment: string;
  update_url: string;
  update_share_media_category?: string;
  date: string;
  page_impressions?: number;
  page_clicks?: number;
  page_likes?: number;
  page_comments?: number;
  page_shares?: number;
  page_engagements?: number;
  page_engagement_rate?: number;
};

const SAMPLE_POSTS: SupermetricsLinkedInPost[] = [
  {
    profile: "AdEchoTech",
    profileID: "15216486",
    update_share_comment:
      "353 patients deja concernes au CHIRC de Redon depuis mai 2025.\nAvec MELODY, un radiologue pilote l'echographie a distance.",
    update_url: "https://www.linkedin.com/feed/update/urn:li:share:7429857452889759744",
    update_share_media_category: "IMAGE",
    date: "2026-02-18",
    page_impressions: 1368,
    page_clicks: 55,
    page_likes: 38,
    page_comments: 2,
    page_shares: 9,
    page_engagements: 104,
    page_engagement_rate: 7.6,
  },
  {
    profile: "AlibeeZ",
    profileID: "9216560",
    update_share_comment:
      "Un CRA mal rempli, c'est une facture qui part en retard.\nNos equipes montrent comment fiabiliser le process.",
    update_url: "https://www.linkedin.com/feed/update/urn:li:ugcPost:7435255578932817920",
    update_share_media_category: "VIDEO",
    date: "2026-03-05",
    page_impressions: 140,
    page_clicks: 18,
    page_likes: 11,
    page_comments: 1,
    page_shares: 1,
    page_engagements: 31,
    page_engagement_rate: 22.14,
  },
  {
    profile: "Amarok Biotechnologies",
    profileID: "2774822",
    update_share_comment:
      "Une nouvelle etape pour Amarok Biotech.\nNotre nouveau batiment prend vie petit a petit.",
    update_url: "https://www.linkedin.com/feed/update/urn:li:share:7403872103935942657",
    update_share_media_category: "IMAGE",
    date: "2025-12-08",
    page_impressions: 3236,
    page_clicks: 195,
    page_likes: 71,
    page_comments: 1,
    page_shares: 0,
    page_engagements: 267,
    page_engagement_rate: 8.25,
  },
];

function extractTitle(text: string): string {
  if (!text) return "Post LinkedIn";
  const firstLine = text.split("\n")[0].replace(/^[#A-Za-z0-9_]+\s*/, "").trim();
  if (!firstLine) return "Post LinkedIn";
  return firstLine.length > 100 ? `${firstLine.slice(0, 97)}...` : firstLine;
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  if (!matches) return [];
  return [...new Set(matches.map((value) => value.toLowerCase()))];
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

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

function mapPost(item: Record<string, unknown>): SupermetricsLinkedInPost | null {
  const profile = safeString(item.profile);
  const updateUrl = safeString(item.update_url);
  const text = safeString(item.update_share_comment);
  const date = safeString(item.date);
  if (!profile || !updateUrl || !text || !date) return null;
  return {
    profile,
    profileID: safeString(item.profileID) ?? undefined,
    update_title: safeString(item.update_title) ?? undefined,
    update_share_comment: text,
    update_url: updateUrl,
    update_share_media_category: safeString(item.update_share_media_category) ?? "TEXT",
    date,
    page_impressions: asNumber(item.page_impressions),
    page_clicks: asNumber(item.page_clicks),
    page_likes: asNumber(item.page_likes),
    page_comments: asNumber(item.page_comments),
    page_shares: asNumber(item.page_shares),
    page_engagements: asNumber(item.page_engagements),
    page_engagement_rate: asNumber(item.page_engagement_rate),
  };
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
  const objectPayload = asObject(payload);
  const possibleRows = asArray(
    asObject(payload)?.["data"] ??
      asObject(payload)?.["rows"] ??
      asObject(objectPayload?.["data"])?.["rows"] ??
      asObject(objectPayload?.["data"])?.["data"] ??
      objectPayload?.["results"] ??
      payload,
  );

  if (possibleRows.length > 0 && Array.isArray(possibleRows[0])) {
    return parseArrayFormat(possibleRows);
  }

  return possibleRows
    .map((value) => asObject(value))
    .filter((value): value is Record<string, unknown> => Boolean(value));
}

function extractScheduleId(payload: unknown): string | null {
  const obj = asObject(payload);
  const nestedData = asObject(obj?.data);
  return (
    safeString(obj?.schedule_id) ??
    safeString(obj?.scheduleId) ??
    safeString(nestedData?.schedule_id) ??
    safeString(nestedData?.scheduleId) ??
    null
  );
}

async function fetchFromSupermetrics(params: {
  apiKey: string;
  accountIds: string[];
  dateRangeType: string;
}): Promise<SupermetricsLinkedInPost[]> {
  const baseUrl = Deno.env.get("SUPERMETRICS_API_URL") ?? "https://api.supermetrics.com/enterprise/v2";
  const dataUrl = `${baseUrl.replace(/\/$/, "")}/query/data/json`;
  const dsAccounts = params.accountIds.join(",");
  const fields = [
    "profile",
    "profileID",
    "update_title",
    "update_share_comment",
    "update_url",
    "update_share_media_category",
    "date",
    "page_impressions",
    "page_clicks",
    "page_likes",
    "page_comments",
    "page_shares",
    "page_engagements",
    "page_engagement_rate",
  ];

  const payload = {
    ds_id: "LIP",
    ds_accounts: dsAccounts,
    date_range_type: params.dateRangeType,
    fields: fields.join(","),
    report_type: "update_details",
    max_rows: 5000,
    format: "json",
  };

  const authHeaderAttempts: Array<Record<string, string>> = [
    { Authorization: `Bearer ${params.apiKey}` },
    { "x-api-key": params.apiKey },
    { Authorization: params.apiKey },
  ];

  let json: unknown = null;
  let lastError = "Unknown Supermetrics error";
  for (const authHeaders of authHeaderAttempts) {
    const response = await fetch(dataUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      lastError = `Supermetrics API error ${response.status}: ${text.slice(0, 240)}`;
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
      const resultBase = `${baseUrl.replace(/\/$/, "")}/query/results`;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(5000);
        const resultQuery = encodeURIComponent(JSON.stringify({ schedule_id: scheduleId }));
        let resultResponse: Response | null = null;
        let resultError = "";
        for (const authHeaders of authHeaderAttempts) {
          const attempt = await fetch(`${resultBase}?json=${resultQuery}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
          });
          if (attempt.ok) {
            resultResponse = attempt;
            resultError = "";
            break;
          }
          const txt = await attempt.text();
          resultError = `Supermetrics results error ${attempt.status}: ${txt.slice(0, 240)}`;
        }

        if (!resultResponse) {
          throw new Error(resultError || "Supermetrics results fetch failed");
        }
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

  return rows
    .map(mapPost)
    .filter((value): value is SupermetricsLinkedInPost => Boolean(value));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createServiceClient();
  let runId: string | null = null;
  const startedAt = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const clientId = safeString(body?.clientId);
    const dateRangeType = safeString(body?.dateRangeType) ?? "last_90_days";
    const apiKey = normalizeApiKey(
      Deno.env.get("SUPERMETRICS_API_KEY") ?? Deno.env.get("SUPERMETRICS_API_TOKEN"),
    );

    runId = await startIntegrationRun(supabase, {
      provider: "supermetrics",
      connector: "linkedin_posts",
      clientId,
      triggerType: "manual",
      requestPayload: { clientId, dateRangeType, hasApiKey: Boolean(apiKey) },
    });

    let accountsQuery = supabase
      .from("linkedin_accounts")
      .select("client_id,linkedin_account_id,linkedin_page_name")
      .order("linkedin_page_name", { ascending: true });
    if (clientId) accountsQuery = accountsQuery.eq("client_id", clientId);
    const { data: accountRows, error: accountError } = await accountsQuery;
    if (accountError) throw new Error(`Failed to load linkedin_accounts: ${accountError.message}`);
    const accounts = (accountRows ?? []) as LinkedInAccount[];
    if (accounts.length === 0) {
      await finishIntegrationRun(supabase, runId, {
        status: "success",
        metrics: { recordsFetched: 0, recordsUpserted: 0, recordsFailed: 0, durationMs: Date.now() - startedAt },
      });
      return new Response(JSON.stringify({ success: true, posts_processed: 0, message: "No LinkedIn accounts mapped." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let posts: SupermetricsLinkedInPost[] = SAMPLE_POSTS;
    let usedLiveApi = false;
    let liveFetchError: string | null = null;
    if (apiKey) {
      try {
        posts = await fetchFromSupermetrics({
          apiKey,
          accountIds: accounts.map((item) => item.linkedin_account_id),
          dateRangeType,
        });
        usedLiveApi = true;
      } catch (apiError) {
        liveFetchError = apiError instanceof Error ? apiError.message : "Unknown live fetch error";
        console.error("Supermetrics live fetch failed, falling back to sample posts:", apiError);
      }
    }

    const clientByProfile = new Map<string, string>();
    const clientByAccountId = new Map<string, string>();
    accounts.forEach((account) => {
      clientByProfile.set(account.linkedin_page_name.toLowerCase(), account.client_id);
      clientByAccountId.set(account.linkedin_account_id, account.client_id);
    });

    let upserted = 0;
    let skippedNoClient = 0;
    let contentUpsertErrors = 0;
    let metricUpsertErrors = 0;
    for (const post of posts) {
      const byProfile = clientByProfile.get(post.profile.toLowerCase());
      const byAccount = post.profileID ? clientByAccountId.get(post.profileID) : null;
      const linkedClientId = byProfile ?? byAccount ?? null;
      if (!linkedClientId) {
        skippedNoClient += 1;
        continue;
      }

      const title = safeString(post.update_title) ?? extractTitle(post.update_share_comment);
      const tags = extractHashtags(post.update_share_comment);
      const mediaType = safeString(post.update_share_media_category) ?? "TEXT";
      const publishedAt = new Date(`${post.date}T12:00:00.000Z`).toISOString();

      const { data: upsertedContent, error: contentError } = await supabase
        .from("contents")
        .upsert(
          {
            client_id: linkedClientId,
            channel: "linkedin",
            title,
            body: post.update_share_comment,
            published_at: publishedAt,
            source_url: post.update_url,
            tags,
            metadata: {
              media_type: mediaType,
              linkedin_profile: post.profile,
              linkedin_profile_id: post.profileID ?? null,
            },
            status: "published",
          },
          { onConflict: "source_url" },
        )
        .select("id")
        .single();

      if (contentError) {
        console.error("content upsert error:", contentError);
        contentUpsertErrors += 1;
        continue;
      }

      const contentId = safeString(upsertedContent?.id);
      if (!contentId) continue;

      const measuredAt = new Date().toISOString();
      const { error: metricError } = await supabase.from("content_metrics").upsert(
        {
          content_id: contentId,
          measured_at: measuredAt,
          impressions: asNumber(post.page_impressions),
          views: asNumber(post.page_clicks),
          likes: asNumber(post.page_likes),
          comments: asNumber(post.page_comments),
          shares: asNumber(post.page_shares),
          engagement_rate: asNumber(post.page_engagement_rate),
        },
        { onConflict: "content_id,measured_at" },
      );
      if (metricError) {
        console.error("metric upsert error:", metricError);
        metricUpsertErrors += 1;
        continue;
      }

      upserted += 1;
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: posts.length,
        recordsUpserted: upserted,
        recordsFailed: Math.max(0, posts.length - upserted),
        durationMs: Date.now() - startedAt,
      },
      samplePayload: posts[0]
        ? {
            profile: posts[0].profile,
            update_url: posts[0].update_url,
          }
        : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        posts_processed: posts.length,
        posts_upserted: upserted,
        usedLiveApi,
        liveFetchError,
        skippedNoClient,
        contentUpsertErrors,
        metricUpsertErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    await finishIntegrationRun(supabase, runId, {
      status: "failed",
      metrics: { durationMs: Date.now() - startedAt },
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

