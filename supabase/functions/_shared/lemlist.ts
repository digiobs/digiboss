// Shared lemlist helpers used by both `lemlist-sync` and
// `lemlist-list-campaigns`. Lemlist's public API is historically flaky about
// auth headers and pagination, so every helper walks through a small set of
// attempts before giving up.

import { asArray, asObject, safeString } from "./ingestion.ts";

export type LemlistCampaign = {
  id: string;
  name: string;
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

export async function fetchCampaigns(apiKey: string): Promise<LemlistCampaign[]> {
  // Lemlist historically caps `/api/campaigns` at 100 rows per call regardless
  // of the `limit` we pass, so we always paginate. Stop when a page is empty,
  // shorter than the page size, or repeats IDs we already saw (which means the
  // workspace doesn't actually honor `offset` and we're looping on page 0).
  const pageSize = 100;
  const maxPages = 20;
  const seen = new Map<string, LemlistCampaign>();

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
      .filter((c): c is LemlistCampaign => Boolean(c));

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
  // /export/leads returns CSV — try JSON endpoints first.
  const urls = [
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
