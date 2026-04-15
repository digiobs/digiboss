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
    { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    { "x-api-key": apiKey, "Content-Type": "application/json" },
    // Lemlist legacy basic auth: login is any string, password is the API key.
    {
      Authorization: `Basic ${btoa(`user:${apiKey}`)}`,
      "Content-Type": "application/json",
    },
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
  const urls = [
    "https://api.lemlist.com/api/campaigns?limit=200",
    "https://api.lemlist.com/api/campaigns?offset=0&limit=200",
    "https://api.lemlist.com/api/campaigns",
  ];
  const { text, url } = await fetchWithFallbacks(urls, apiKey);

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 240)}`);
  }

  const rows = asArray(asObject(json)?.["campaigns"] ?? json);
  return rows
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const id = safeString(item.id ?? item._id);
      const name = safeString(item.name ?? item.title);
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((c): c is LemlistCampaign => Boolean(c));
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
      const n = toCount(payload[key]);
      if (n > 0) return n;
      // Still return the zero from the first present key, so we don't mask
      // explicit zeros with undefined counters further down.
      return n;
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
