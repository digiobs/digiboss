/**
 * Single source of truth for routing skill-produced reports into destination
 * folders — either Supabase Storage (private `deliverables` bucket) or
 * OneDrive (via the per-client `client_drives` entries and MS Graph).
 *
 * Notion is NOT a supported destination.
 *
 * Used by:
 *   - supabase/functions/index-deliverables/index.ts   — reindexer
 *   - any future skill producer that writes a new report
 *
 * Keep the skill list and path convention in this one file. The docs in
 * docs/deliverables-routing.md describe the same table for humans.
 */

export type DeliverableProvider = "supabase" | "onedrive";

export interface SkillRouting {
  /** Canonical skill_name value (kebab-case, stored on `deliverables.skill_name`). */
  skill: string;
  /** Coarse deliverable type — mirrors the `type` column used by the UI. */
  type: string;
  /** Destination provider: where the file physically lives. */
  provider: DeliverableProvider;
  /** Segment of the full path that identifies this skill's folder. */
  folder: string;
  /** Human-readable label shown in UI. */
  label: string;
}

/**
 * Canonical routing table — one row per skill.
 *
 * Path convention for BOTH providers:
 *   {root}/{client_slug}/{folder}/{yyyy}/{yyyy-mm}/{filename}
 *
 * Where {root} is:
 *   - supabase: the `deliverables` bucket root
 *   - onedrive: `{client_drives.root_folder}/livrables`
 */
export const SKILL_ROUTING: readonly SkillRouting[] = [
  // --- OneDrive (human-edited, binary, long-lived) ---
  { skill: "seo-strategy",       type: "seo-strategy",       provider: "onedrive", folder: "seo/strategy",   label: "SEO Strategy" },
  { skill: "audit-seo",          type: "audit-seo",          provider: "onedrive", folder: "seo/audits",     label: "Audit SEO" },
  { skill: "analyse-pmf",        type: "analyse-pmf",        provider: "onedrive", folder: "pmf",            label: "Analyse PMF" },
  { skill: "rapport-performance",type: "rapport-performance",provider: "onedrive", folder: "reporting",      label: "Rapport Performance" },
  { skill: "architecture-site",  type: "architecture-site",  provider: "onedrive", folder: "tech/architecture", label: "Architecture Site" },
  { skill: "campagne",           type: "campagne",           provider: "onedrive", folder: "campagnes",      label: "Campagne" },

  // --- Supabase Storage (auto-generated, HTML/JSON, pipeline-fed) ---
  { skill: "content-post",       type: "content-post",       provider: "supabase", folder: "content/posts",    label: "Post" },
  { skill: "content-article",    type: "content-article",    provider: "supabase", folder: "content/articles", label: "Article" },
  { skill: "veille",             type: "veille",             provider: "supabase", folder: "veille",           label: "Veille" },
  { skill: "orchestrateur",      type: "orchestrateur",      provider: "supabase", folder: "orchestrateur",    label: "Orchestrateur" },
] as const;

export const SKILL_BY_NAME: Record<string, SkillRouting> = Object.fromEntries(
  SKILL_ROUTING.map((s) => [s.skill, s]),
);

/** Match a folder segment back to a skill (longest-match first). */
export function matchSkillByFolder(pathSegment: string): SkillRouting | null {
  const normalized = pathSegment.replace(/^\/+|\/+$/g, "");
  const sorted = [...SKILL_ROUTING].sort((a, b) => b.folder.length - a.folder.length);
  for (const s of sorted) {
    if (normalized === s.folder || normalized.startsWith(s.folder + "/")) return s;
  }
  return null;
}

/** Produce a URL-safe slug from a client name ("Agro-Bio" → "agro-bio"). */
export function slugifyClient(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build the canonical Supabase Storage path for a new deliverable.
 * Example: `agro-bio/content/articles/2026/2026-04/april-roundup.html`
 */
export function buildStoragePath(
  clientSlug: string,
  skill: string,
  filename: string,
  period?: string,
): string {
  const routing = SKILL_BY_NAME[skill];
  if (!routing) throw new Error(`Unknown skill: ${skill}`);
  if (routing.provider !== "supabase") {
    throw new Error(`Skill ${skill} routes to OneDrive, not Supabase Storage`);
  }
  const { year, month } = splitPeriod(period);
  return `${clientSlug}/${routing.folder}/${year}/${year}-${month}/${filename}`;
}

/**
 * Build the canonical OneDrive path (relative to `client_drives.root_folder`).
 * Example: `livrables/seo/strategy/2026/2026-04/strategy-q2.pdf`
 */
export function buildOneDrivePath(
  skill: string,
  filename: string,
  period?: string,
): string {
  const routing = SKILL_BY_NAME[skill];
  if (!routing) throw new Error(`Unknown skill: ${skill}`);
  if (routing.provider !== "onedrive") {
    throw new Error(`Skill ${skill} routes to Supabase Storage, not OneDrive`);
  }
  const { year, month } = splitPeriod(period);
  return `livrables/${routing.folder}/${year}/${year}-${month}/${filename}`;
}

/**
 * Parse a Supabase Storage path back into its semantic parts.
 * Returns null if the path doesn't match the expected convention.
 */
export function parseStoragePath(path: string): {
  clientSlug: string;
  skill: SkillRouting;
  period: string | null;
  filename: string;
} | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 3) return null;
  const [clientSlug, ...rest] = parts;
  const filename = rest[rest.length - 1];
  // Try each skill (longest folder match wins) against rest[0..n-1]
  const folderPath = rest.slice(0, -1).join("/");
  const sorted = [...SKILL_ROUTING].filter((s) => s.provider === "supabase").sort((a, b) => b.folder.length - a.folder.length);
  for (const s of sorted) {
    if (folderPath === s.folder || folderPath.startsWith(s.folder + "/")) {
      const tail = folderPath.slice(s.folder.length).replace(/^\/+/, "");
      const period = tail.split("/").find((p) => /^\d{4}-\d{2}$/.test(p)) ?? null;
      return { clientSlug, skill: s, period, filename };
    }
  }
  return null;
}

/**
 * Parse a OneDrive path (relative to a client's root_folder) into semantic parts.
 * Example input: `livrables/seo/strategy/2026/2026-04/strategy-q2.pdf`
 */
export function parseOneDrivePath(path: string): {
  skill: SkillRouting;
  period: string | null;
  filename: string;
} | null {
  const trimmed = path.replace(/^\/+/, "").replace(/^livrables\//, "");
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const filename = parts[parts.length - 1];
  const folderPath = parts.slice(0, -1).join("/");
  const sorted = [...SKILL_ROUTING].filter((s) => s.provider === "onedrive").sort((a, b) => b.folder.length - a.folder.length);
  for (const s of sorted) {
    if (folderPath === s.folder || folderPath.startsWith(s.folder + "/")) {
      const tail = folderPath.slice(s.folder.length).replace(/^\/+/, "");
      const period = tail.split("/").find((p) => /^\d{4}-\d{2}$/.test(p)) ?? null;
      return { skill: s, period, filename };
    }
  }
  return null;
}

function splitPeriod(period?: string): { year: string; month: string } {
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    return { year, month };
  }
  const now = new Date();
  return {
    year: String(now.getUTCFullYear()),
    month: String(now.getUTCMonth() + 1).padStart(2, "0"),
  };
}
