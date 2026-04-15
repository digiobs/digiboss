// Shared lemlist helpers used by both `lemlist-sync` and
// `lemlist-list-campaigns`. Lemlist's public API is historically flaky about
// auth headers and pagination, so every helper walks through a small set of
// attempts before giving up.

import { asArray, asObject, safeString } from "./ingestion.ts";

export type LemlistCampaign = {
  id: string;
  name: string;
  teamId: string | null;
  teamName: string | null;
};

/** One lemlist workspace we know how to call (its API key and team metadata). */
export type LemlistTeamClient = {
  apiKey: string;
  teamId: string;
  teamName: string;
};

export type LemlistLead = {
  externalId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  company: string | null;
  status: string | null;
  contactedAt: string | null;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  currentStep: number;
  lastEventType: string | null;
  lastEventAt: string | null;
  raw: Record<string, unknown>;
};

function buildHeaderVariants(apiKey: string): Array<Record<string, string>> {
  return [
    // Lemlist's public API uses HTTP Basic with any username + API key as
    // password. Keep the Bearer / x-api-key variants as fallbacks for
    // workspaces that might accept them.
    {
      Authorization: `Basic ${btoa(`user:${apiKey}`)}`,
      "Content-Type": "application/json",
    },
    { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    { "x-api-key": apiKey, "Content-Type": "application/json" },
  ];
}

async function fetchWithFallbacks(
  urls: string[],
  apiKey: string,
): Promise<{ text: string; url: string; headers: Record<string, string> }> {
  const headerVariants = buildHeaderVariants(apiKey);
  let lastError = "No response";
  for (const url of urls) {
    for (const headers of headerVariants) {
      const response = await fetch(url, { headers });
      const text = await response.text();
      if (!response.ok) {
        lastError = `status ${response.status} from ${url}: ${text.slice(0, 240)}`;
        continue;
      }
      return { text, url, headers };
    }
  }
  throw new Error(`Lemlist API failed: ${lastError}`);
}

/**
 * Parse the raw `LEMLIST_API_KEYS` secret. Accepts either:
 *   - a JSON array of strings:          `["key1", "key2"]`
 *   - a JSON array of `{apiKey,label?}`: `[{"apiKey":"key1","label":"Team A"}]`
 *   - a single bare string (treated as one key)
 *   - a comma-separated list of bare keys
 *
 * The returned objects only carry the raw key; team metadata is resolved later
 * via `/api/team`. Returns an empty array when the secret is absent or empty.
 */
function parseApiKeysSecret(raw: string | undefined): Array<{ apiKey: string; label: string | null }> {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Try JSON first.
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") {
            const key = item.trim();
            return key ? { apiKey: key, label: null } : null;
          }
          const obj = asObject(item);
          if (!obj) return null;
          const apiKey = safeString(obj.apiKey ?? obj.api_key ?? obj.key);
          const label = safeString(obj.label ?? obj.name ?? obj.teamName ?? obj.team_name);
          return apiKey ? { apiKey, label } : null;
        })
        .filter((entry): entry is { apiKey: string; label: string | null } => Boolean(entry));
    }
    if (typeof parsed === "string") {
      const key = parsed.trim();
      return key ? [{ apiKey: key, label: null }] : [];
    }
  } catch {
    // Fall through to comma-separated parsing.
  }

  // Comma-separated fallback.
  return trimmed
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((apiKey) => ({ apiKey, label: null }));
}

/**
 * Fetch the lemlist team (workspace) tied to a given API key. Lemlist returns
 * a single object on `/api/team`, but older accounts occasionally return an
 * array — we normalize both shapes.
 */
export async function fetchTeam(apiKey: string): Promise<{ id: string; name: string }> {
  const { text, url } = await fetchWithFallbacks(["https://api.lemlist.com/api/team"], apiKey);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 240)}`);
  }
  const candidate = Array.isArray(json) ? json[0] : json;
  const obj = asObject(candidate);
  if (!obj) {
    throw new Error(`Unexpected /api/team payload: ${text.slice(0, 240)}`);
  }
  const id = safeString(obj._id ?? obj.id ?? obj.teamId ?? obj.team_id);
  const name = safeString(obj.name ?? obj.teamName ?? obj.team_name ?? obj.companyName);
  if (!id) {
    throw new Error(`/api/team did not include a team id: ${text.slice(0, 240)}`);
  }
  return { id, name: name || id };
}

/**
 * Resolve the full list of lemlist workspaces we can talk to. Reads the new
 * multi-team secret `LEMLIST_API_KEYS` first, then falls back to the legacy
 * single-key secret `LEMLIST_API_KEY`. For each API key, we call `/api/team`
 * to fetch the team id/name so downstream callers can aggregate campaigns and
 * route sync calls to the right key.
 *
 * Failures are collected per-key so one broken key doesn't take the whole
 * feature down. If every key fails, we throw with the aggregated errors.
 */
export async function loadLemlistClients(): Promise<LemlistTeamClient[]> {
  const multi = parseApiKeysSecret(Deno.env.get("LEMLIST_API_KEYS"));
  const legacy = safeString(Deno.env.get("LEMLIST_API_KEY"));
  const entries: Array<{ apiKey: string; label: string | null }> = [...multi];
  if (legacy && !entries.some((e) => e.apiKey === legacy)) {
    entries.push({ apiKey: legacy, label: null });
  }
  if (entries.length === 0) return [];

  const clients: LemlistTeamClient[] = [];
  const errors: string[] = [];
  for (const entry of entries) {
    try {
      const team = await fetchTeam(entry.apiKey);
      clients.push({
        apiKey: entry.apiKey,
        teamId: team.id,
        // Prefer the label from the secret if provided (makes it easy to
        // override display names without touching lemlist).
        teamName: entry.label || team.name,
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (clients.length === 0 && errors.length > 0) {
    throw new Error(`Failed to resolve any lemlist team: ${errors.join(" | ")}`);
  }
  return clients;
}

/**
 * Fetch campaigns for every configured lemlist team and tag each campaign with
 * its team id/name. Campaign ids are globally unique in lemlist, so we don't
 * need to dedupe across teams.
 */
export async function fetchCampaignsAcrossTeams(
  clients: LemlistTeamClient[],
): Promise<LemlistCampaign[]> {
  const all: LemlistCampaign[] = [];
  for (const client of clients) {
    const perTeam = await fetchCampaignsForKey(client.apiKey);
    for (const campaign of perTeam) {
      all.push({
        id: campaign.id,
        name: campaign.name,
        teamId: client.teamId,
        teamName: client.teamName,
      });
    }
  }
  return all;
}

/**
 * Legacy single-key wrapper: returns campaigns for one lemlist key without any
 * team metadata attached. Kept for backwards compatibility; new callers should
 * prefer `fetchCampaignsAcrossTeams`.
 */
export async function fetchCampaigns(apiKey: string): Promise<LemlistCampaign[]> {
  const rows = await fetchCampaignsForKey(apiKey);
  return rows.map((c) => ({ ...c, teamId: null, teamName: null }));
}

async function fetchCampaignsForKey(apiKey: string): Promise<Array<{ id: string; name: string }>> {
  // Lemlist historically caps `/api/campaigns` at 100 rows per call regardless
  // of the `limit` we pass, so we always paginate. Stop when a page is empty,
  // shorter than the page size, or repeats IDs we already saw (which means the
  // workspace doesn't actually honor `offset` and we're looping on page 0).
  const pageSize = 100;
  const maxPages = 20;
  const seen = new Map<string, { id: string; name: string }>();

  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * pageSize;
    const urls = [
      `https://api.lemlist.com/api/campaigns?version=v2&limit=${pageSize}&offset=${offset}`,
      `https://api.lemlist.com/api/campaigns?limit=${pageSize}&offset=${offset}`,
      `https://api.lemlist.com/api/campaigns?limit=${pageSize}&page=${page}`,
      `https://api.lemlist.com/api/campaigns?limit=${pageSize}`,
    ];

    let text: string;
    try {
      const result = await fetchWithFallbacks(urls, apiKey);
      text = result.text;
    } catch (error) {
      if (page === 0) throw error;
      break;
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      break;
    }

    const rows = asArray(asObject(json)?.["campaigns"] ?? json);
    const pageCampaigns = rows
      .map((item) => asObject(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item) => {
        const id = safeString(item.id ?? item._id);
        const name = safeString(item.name ?? item.title);
        if (!id || !name) return null;
        return { id, name };
      })
      .filter((c): c is { id: string; name: string } => Boolean(c));

    if (pageCampaigns.length === 0) break;
    const hasNew = pageCampaigns.some((c) => !seen.has(c.id));
    if (!hasNew) break; // API ignored `offset` — stop to avoid an infinite loop.
    for (const c of pageCampaigns) seen.set(c.id, c);
    if (pageCampaigns.length < pageSize) break;
  }

  return Array.from(seen.values());
}

function toCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.trunc(value));
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return 0;
}

function pickFirstNumber(payload: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    if (key in payload) {
      // First key present wins, even if zero, so we don't mask explicit zeros
      // with undefined counters further down the list.
      return toCount(payload[key]);
    }
  }
  return 0;
}

function pickFirstString(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = safeString(payload[key]);
    if (v) return v;
  }
  return null;
}

/**
 * Normalize a raw lead payload coming from lemlist into a shape we can store.
 * We accept several variants because lemlist's own response shapes differ
 * between the global `/api/leads` endpoint and the per-campaign export.
 */
export function normalizeLemlistLead(payload: Record<string, unknown>): LemlistLead | null {
  const externalId = safeString(payload.id ?? payload._id ?? payload.leadId ?? payload.contactId);
  if (!externalId) return null;

  const firstName = safeString(payload.firstName ?? payload.first_name);
  const lastName = safeString(payload.lastName ?? payload.last_name);
  const fullNameFromParts = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fullName = fullNameFromParts || safeString(payload.name ?? payload.fullName);

  return {
    externalId,
    firstName,
    lastName,
    fullName,
    email: safeString(payload.email),
    company: safeString(payload.company ?? payload.companyName ?? payload.company_name),
    status: safeString(
      payload.status ??
        payload.sendStatus ??
        payload.campaignStatus ??
        payload.state,
    ),
    contactedAt: safeString(
      payload.contactedAt ??
        payload.contacted_at ??
        payload.firstContactedAt ??
        payload.sentAt,
    ),
    emailsSent: pickFirstNumber(payload, [
      "emailsSentCount",
      "emailSentCount",
      "emailsSent",
      "emailSent",
      "sendCount",
      "sent",
    ]),
    emailsOpened: pickFirstNumber(payload, [
      "emailsOpenCount",
      "emailOpenCount",
      "emailsOpened",
      "emailOpened",
      "openCount",
      "opened",
    ]),
    emailsClicked: pickFirstNumber(payload, [
      "emailsClickedCount",
      "emailClickedCount",
      "emailsClicked",
      "emailClicked",
      "clickCount",
      "clicked",
    ]),
    emailsReplied: pickFirstNumber(payload, [
      "emailsRepliedCount",
      "emailRepliedCount",
      "emailsReplied",
      "emailReplied",
      "replyCount",
      "replied",
    ]),
    currentStep: pickFirstNumber(payload, [
      "stepsCount",
      "currentStep",
      "step",
      "stepIndex",
    ]),
    lastEventType: pickFirstString(payload, [
      "lastActivityType",
      "lastEventType",
      "lastActionType",
      "lastEvent",
    ]),
    lastEventAt: pickFirstString(payload, [
      "lastActivityAt",
      "lastEventAt",
      "lastActivity",
      "lastActionAt",
      "updatedAt",
    ]),
    raw: payload,
  };
}

/**
 * Fetch leads for a single lemlist campaign with funnel counters. The public
 * lemlist endpoint changed shape a few times — we try the per-campaign export
 * first (returns counters), then fall back to the flat `/api/leads` list which
 * at least carries the status and a few basic fields.
 */
export async function fetchLeadsForCampaign(
  apiKey: string,
  campaignId: string,
  limit: number,
): Promise<LemlistLead[]> {
  const cappedLimit = Math.min(Math.max(limit, 1), 500);
  const urls = [
    `https://api.lemlist.com/api/campaigns/${campaignId}/export/leads?state=all&limit=${cappedLimit}`,
    `https://api.lemlist.com/api/campaigns/${campaignId}/export/leads?limit=${cappedLimit}`,
    `https://api.lemlist.com/api/campaigns/${campaignId}/leads?limit=${cappedLimit}`,
    `https://api.lemlist.com/api/leads?campaignId=${campaignId}&limit=${cappedLimit}`,
  ];

  const { text, url } = await fetchWithFallbacks(urls, apiKey);

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 240)}`);
  }

  const container = asObject(json);
  const rows = asArray(
    container?.["leads"] ?? container?.["data"] ?? container?.["results"] ?? json,
  );
  return rows
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => normalizeLemlistLead(item))
    .filter((lead): lead is LemlistLead => Boolean(lead));
}

/** Normalize a client/campaign display string for fuzzy matching. */
export function normalizeText(value: string | null): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
