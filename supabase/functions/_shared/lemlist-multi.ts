// Multi-team lemlist extensions. This module is imported only when
// LEMLIST_API_KEYS is configured; the single-key path never touches it.
//
// Base helpers (fetchCampaigns, fetchLeadsForCampaign, etc.) live in
// lemlist.ts and are reused here — nothing is duplicated.

import { asObject, safeString } from "./ingestion.ts";
import { type LemlistCampaign, fetchCampaigns } from "./lemlist.ts";

/** One lemlist workspace (API key + resolved team metadata). */
export type LemlistTeamClient = {
  apiKey: string;
  teamId: string;
  teamName: string;
};

/** Campaign enriched with the team it belongs to. */
export type LemlistCampaignWithTeam = LemlistCampaign & {
  teamId: string;
  teamName: string;
};

/**
 * Parse the raw `LEMLIST_API_KEYS` secret. Accepts:
 *   - JSON array of strings:          `["key1","key2"]`
 *   - JSON array of `{apiKey,label?}`: `[{"apiKey":"key1","label":"Team A"}]`
 *   - Comma-separated bare keys:       `key1,key2`
 *   - Single bare string
 */
function parseApiKeysSecret(
  raw: string | undefined,
): Array<{ apiKey: string; label: string | null }> {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

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
          const label = safeString(
            obj.label ?? obj.name ?? obj.teamName ?? obj.team_name,
          );
          return apiKey ? { apiKey, label } : null;
        })
        .filter(
          (e): e is { apiKey: string; label: string | null } => Boolean(e),
        );
    }
    if (typeof parsed === "string") {
      const key = parsed.trim();
      return key ? [{ apiKey: key, label: null }] : [];
    }
  } catch {
    // Fall through to comma-separated.
  }

  return trimmed
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((apiKey) => ({ apiKey, label: null }));
}

/**
 * Fetch the lemlist team (workspace) tied to a given API key.
 * Uses HTTP Basic auth directly (the most common auth variant).
 */
async function fetchTeam(
  apiKey: string,
): Promise<{ id: string; name: string }> {
  const response = await fetch("https://api.lemlist.com/api/team", {
    headers: {
      Authorization: `Basic ${btoa(`user:${apiKey}`)}`,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `/api/team returned ${response.status}: ${text.slice(0, 240)}`,
    );
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from /api/team: ${text.slice(0, 240)}`);
  }
  const candidate = Array.isArray(json) ? json[0] : json;
  const obj = asObject(candidate);
  if (!obj) {
    throw new Error(`Unexpected /api/team shape: ${text.slice(0, 240)}`);
  }
  const id = safeString(obj._id ?? obj.id ?? obj.teamId ?? obj.team_id);
  const name = safeString(
    obj.name ?? obj.teamName ?? obj.team_name ?? obj.companyName,
  );
  if (!id) {
    throw new Error(`/api/team did not include a team id`);
  }
  return { id, name: name || id };
}

/**
 * Resolve all lemlist workspaces from the `LEMLIST_API_KEYS` secret. For each
 * key we call `/api/team` to resolve metadata. Keys where `/api/team` fails
 * still get a synthetic team entry so campaigns can be fetched even if the team
 * endpoint is unreachable.
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
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    try {
      const team = await fetchTeam(entry.apiKey);
      clients.push({
        apiKey: entry.apiKey,
        teamId: team.id,
        teamName: entry.label || team.name,
      });
    } catch {
      // /api/team may not be available for all plans. Use a synthetic id so
      // the rest of the pipeline can proceed.
      clients.push({
        apiKey: entry.apiKey,
        teamId: `key-${i}`,
        teamName: entry.label || "Lemlist",
      });
    }
  }
  return clients;
}

/**
 * Fetch campaigns for every configured team and tag each with its team
 * provenance. Campaign ids are globally unique in lemlist so we don't dedupe.
 */
export async function fetchCampaignsAcrossTeams(
  clients: LemlistTeamClient[],
): Promise<LemlistCampaignWithTeam[]> {
  const all: LemlistCampaignWithTeam[] = [];
  for (const client of clients) {
    const perTeam = await fetchCampaigns(client.apiKey);
    for (const campaign of perTeam) {
      all.push({
        ...campaign,
        teamId: client.teamId,
        teamName: client.teamName,
      });
    }
  }
  return all;
}
