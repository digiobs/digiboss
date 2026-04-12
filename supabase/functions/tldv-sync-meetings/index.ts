import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, finishIntegrationRun, safeString, startIntegrationRun } from "../_shared/ingestion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TLDV_BASE = "https://pasta.tldv.io/v1alpha1";

type TldvInvitee = {
  name?: string | null;
  email?: string | null;
};

type TldvMeeting = {
  id: string;
  name?: string | null;
  happenedAt?: string | null;
  happened_at?: string | null;
  createdAt?: string | null;
  url?: string | null;
  permalink?: string | null;
  duration?: number | string | null;
  durationSeconds?: number | string | null;
  duration_seconds?: number | string | null;
  organizer?: { name?: string | null; email?: string | null } | null;
  invitees?: TldvInvitee[] | null;
  participants?: TldvInvitee[] | null;
  thumbnailUrl?: string | null;
  thumbnail?: string | null;
};

type ClientRow = { id: string; name: string };
type ClientMapping = { client_id: string; external_account_id: string | null; external_account_name: string | null };

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractMeetingCandidates(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asObject(payload);
  if (!root) return [];
  const candidates = [
    root["results"],
    root["meetings"],
    root["data"],
    root["items"],
    asObject(root["data"])?.["results"],
    asObject(root["data"])?.["meetings"],
    asObject(root["data"])?.["items"],
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function extractNextPageToken(payload: unknown): string | null {
  const root = asObject(payload);
  if (!root) return null;
  const tokens = [
    root["nextPageToken"],
    root["next_page_token"],
    root["nextToken"],
    asObject(root["data"])?.["nextPageToken"],
    asObject(root["data"])?.["next_page_token"],
    asObject(root["page"])?.["nextPageToken"],
  ];
  for (const token of tokens) {
    const s = asString(token);
    if (s) return s;
  }
  return null;
}

function normalizeMeeting(raw: unknown): TldvMeeting | null {
  const obj = asObject(raw);
  if (!obj) return null;
  const id = asString(obj["id"]) ?? asString(obj["meetingId"]) ?? asString(obj["_id"]);
  if (!id) return null;

  const organizerObj = asObject(obj["organizer"]);
  const organizer = organizerObj
    ? {
        name: asString(organizerObj["name"]),
        email: asString(organizerObj["email"]),
      }
    : null;

  const inviteeSources = [obj["invitees"], obj["participants"], obj["attendees"]];
  let invitees: TldvInvitee[] = [];
  for (const src of inviteeSources) {
    if (Array.isArray(src)) {
      invitees = src
        .map((item) => {
          const r = asObject(item);
          if (!r) return null;
          return {
            name: asString(r["name"]) ?? asString(asObject(r["user"])?.["name"]),
            email: asString(r["email"]) ?? asString(asObject(r["user"])?.["email"]),
          };
        })
        .filter((x): x is TldvInvitee => Boolean(x));
      if (invitees.length > 0) break;
    }
  }

  return {
    id,
    name: asString(obj["name"]) ?? asString(obj["title"]) ?? asString(obj["subject"]),
    happenedAt: asString(obj["happenedAt"]) ?? asString(obj["happened_at"]) ?? asString(obj["startTime"]) ?? null,
    createdAt: asString(obj["createdAt"]) ?? asString(obj["created_at"]),
    url: asString(obj["url"]) ?? asString(obj["permalink"]) ?? asString(obj["meetingUrl"]),
    duration: asNumber(obj["duration"]) ?? asNumber(obj["durationSeconds"]) ?? asNumber(obj["duration_seconds"]),
    organizer,
    invitees,
    thumbnailUrl: asString(obj["thumbnailUrl"]) ?? asString(obj["thumbnail"]),
  };
}

// Normalize a client name for matching: lower-case, strip accents, keep alphanumerics only.
function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function extractDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return domain.length > 0 ? domain : null;
}

// Our own company domains — invitees on our side can't be used to attribute a meeting.
const IGNORED_DOMAINS = new Set([
  "digiobs.com",
  "digiobs.fr",
  "digiobs.io",
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.com",
  "icloud.com",
  "protonmail.com",
  "me.com",
  "live.com",
  "msn.com",
]);

function attributeClient(
  meeting: TldvMeeting,
  clients: ClientRow[],
  mappingsByDomain: Map<string, string>,
  mappingsByEmail: Map<string, string>,
): { clientId: string | null; method: string } {
  const allEmails: string[] = [];
  if (meeting.organizer?.email) allEmails.push(meeting.organizer.email.toLowerCase());
  for (const invitee of meeting.invitees ?? []) {
    if (invitee.email) allEmails.push(invitee.email.toLowerCase());
  }

  // 1. Exact email mapping
  for (const email of allEmails) {
    const clientId = mappingsByEmail.get(email);
    if (clientId) return { clientId, method: "mapping:email" };
  }

  // 2. Domain mapping
  const externalDomains = allEmails
    .map(extractDomain)
    .filter((d): d is string => Boolean(d) && !IGNORED_DOMAINS.has(d));
  for (const domain of externalDomains) {
    const clientId = mappingsByDomain.get(domain);
    if (clientId) return { clientId, method: "mapping:domain" };
  }

  // 3. Heuristic: match domain label against normalized client name
  //    e.g. "agrobio.fr" -> "agrobio" matches client "Agro-Bio" (normalized "agrobio")
  for (const domain of externalDomains) {
    const label = domain.split(".")[0];
    const labelNorm = normalizeForMatch(label);
    if (!labelNorm) continue;
    for (const client of clients) {
      const clientNorm = normalizeForMatch(client.name);
      if (!clientNorm) continue;
      if (labelNorm === clientNorm || labelNorm.includes(clientNorm) || clientNorm.includes(labelNorm)) {
        return { clientId: client.id, method: "heuristic:domain-name" };
      }
    }
  }

  // 4. Heuristic: meeting title contains a client name
  const title = meeting.name ? normalizeForMatch(meeting.name) : "";
  if (title) {
    for (const client of clients) {
      const clientNorm = normalizeForMatch(client.name);
      if (clientNorm && clientNorm.length >= 4 && title.includes(clientNorm)) {
        return { clientId: client.id, method: "heuristic:title" };
      }
    }
  }

  return { clientId: null, method: "unmatched" };
}

async function fetchMeetingsPage(
  token: string,
  pageToken: string | null,
  limit: number,
): Promise<{ meetings: unknown[]; nextPageToken: string | null }> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (pageToken) params.set("pageToken", pageToken);
  const url = `${TLDV_BASE}/meetings?${params}`;
  const response = await fetch(url, { headers: { "x-api-key": token } });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`tl;dv list meetings error ${response.status}: ${text.slice(0, 300)}`);
  }
  const json = await response.json();
  return {
    meetings: extractMeetingCandidates(json),
    nextPageToken: extractNextPageToken(json),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let runId: string | null = null;
  const startedAt = Date.now();
  const supabase = createServiceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const filterClientId = safeString(body?.clientId);
    const limit = Math.min(Math.max(Number(body?.limit ?? 100), 1), 500);
    const pageSize = 50;

    const TLDV_API_KEY = Deno.env.get("TLDV_API_KEY") ?? Deno.env.get("TLDV_ACCESS_TOKEN");
    if (!TLDV_API_KEY) {
      return new Response(JSON.stringify({ error: "TLDV_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    runId = await startIntegrationRun(supabase, {
      provider: "tldv",
      connector: "meetings-list",
      clientId: filterClientId,
      triggerType: "manual",
      requestPayload: { limit, filterClientId },
    });

    // Load clients for heuristic attribution
    const { data: clientRows, error: clientsError } = await supabase
      .from("clients")
      .select("id,name")
      .eq("status", "active");
    if (clientsError) throw new Error(`Failed to load clients: ${clientsError.message}`);
    const clients = (clientRows ?? []) as ClientRow[];

    // Load tldv mappings for deterministic attribution
    const { data: mappingRows } = await supabase
      .from("client_data_mappings")
      .select("client_id,external_account_id,external_account_name")
      .eq("provider", "tldv");
    const mappings = (mappingRows ?? []) as ClientMapping[];
    const mappingsByEmail = new Map<string, string>();
    const mappingsByDomain = new Map<string, string>();
    for (const m of mappings) {
      const key = m.external_account_id?.trim().toLowerCase();
      if (!key) continue;
      if (key.includes("@")) mappingsByEmail.set(key, m.client_id);
      else mappingsByDomain.set(key.replace(/^@/, ""), m.client_id);
    }

    // Paginate tl;dv meetings list until we reach the requested limit
    const collected: TldvMeeting[] = [];
    let pageToken: string | null = null;
    let pagesFetched = 0;
    while (collected.length < limit && pagesFetched < 20) {
      const page = await fetchMeetingsPage(TLDV_API_KEY, pageToken, Math.min(pageSize, limit - collected.length));
      pagesFetched += 1;
      for (const raw of page.meetings) {
        const m = normalizeMeeting(raw);
        if (m) collected.push(m);
        if (collected.length >= limit) break;
      }
      if (!page.nextPageToken || page.meetings.length === 0) break;
      pageToken = page.nextPageToken;
    }

    const rows = [];
    const attributionCounts: Record<string, number> = {};
    let skippedOtherClient = 0;

    for (const meeting of collected) {
      const { clientId: attributedClientId, method } = attributeClient(meeting, clients, mappingsByDomain, mappingsByEmail);
      attributionCounts[method] = (attributionCounts[method] ?? 0) + 1;

      if (filterClientId && attributedClientId !== filterClientId) {
        skippedOtherClient += 1;
        continue;
      }

      const organizerName = meeting.organizer?.name ?? null;
      const organizerEmail = meeting.organizer?.email ?? null;
      const participantsCount = (meeting.invitees?.length ?? 0) + (organizerEmail ? 1 : 0);

      rows.push({
        id: meeting.id,
        name: meeting.name,
        happened_at: meeting.happenedAt ?? meeting.createdAt ?? null,
        duration_seconds: typeof meeting.duration === "number" ? meeting.duration : null,
        organizer_name: organizerName,
        organizer_email: organizerEmail,
        meeting_url: meeting.url,
        participants_count: participantsCount,
        raw: {
          organizer: meeting.organizer,
          invitees: meeting.invitees ?? [],
        },
        client_id: attributedClientId,
        attribution_method: method,
        thumbnail_url: meeting.thumbnailUrl ?? null,
      });
    }

    let upserted = 0;
    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("tldv_meetings")
        .upsert(rows, { onConflict: "id" });
      if (upsertError) throw new Error(`Failed to upsert tldv_meetings: ${upsertError.message}`);
      upserted = rows.length;
    }

    await finishIntegrationRun(supabase, runId, {
      status: "success",
      metrics: {
        recordsFetched: collected.length,
        recordsUpserted: upserted,
        recordsFailed: 0,
        durationMs: Date.now() - startedAt,
      },
      samplePayload: rows[0] ? { id: rows[0].id, name: rows[0].name, client_id: rows[0].client_id } : null,
    });

    return new Response(
      JSON.stringify({
        fetched: collected.length,
        upserted,
        skippedOtherClient,
        attributionCounts,
        pagesFetched,
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
