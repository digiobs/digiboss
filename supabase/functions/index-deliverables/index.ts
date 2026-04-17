import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  SKILL_ROUTING,
  parseStoragePath,
  parseOneDrivePath,
  slugifyClient,
  type SkillRouting,
} from "../_shared/deliverables-routing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AZURE_TENANT_ID = Deno.env.get("AZURE_TENANT_ID") ?? "";
const AZURE_CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID") ?? "";
const AZURE_CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* -------------------------------------------------------------------------- */
/*                                 Types                                     */
/* -------------------------------------------------------------------------- */

interface ClientRow {
  id: string;
  name: string;
}

interface ClientDriveRow {
  client_id: string;
  drive_id: string;
  root_folder: string;
}

interface DriveItem {
  id: string;
  name: string;
  size?: number;
  file?: { mimeType: string };
  folder?: { childCount: number };
  lastModifiedDateTime?: string;
  webUrl?: string;
}

interface IndexStats {
  indexed: number;
  updated: number;
  skipped: number;
  errors: Array<{ path: string; error: string }>;
}

/* -------------------------------------------------------------------------- */
/*                              Graph helpers                                 */
/* -------------------------------------------------------------------------- */

async function getGraphToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
  });
  const res = await fetch(url, { method: "POST", body });
  if (!res.ok) throw new Error(`Azure token error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

async function listDriveFolder(
  token: string,
  driveId: string,
  folderPath: string,
): Promise<DriveItem[]> {
  const encoded = folderPath.split("/").map(encodeURIComponent).join("/");
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encoded}:/children?$select=id,name,file,folder,size,lastModifiedDateTime,webUrl&$top=200`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`Graph list ${folderPath} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return (data.value ?? []) as DriveItem[];
}

/**
 * Recursively walk a OneDrive folder, yielding file items with their
 * folder-relative path (relative to {root_folder}).
 */
async function walkDrive(
  token: string,
  driveId: string,
  rootRelative: string,
  basePathFromRoot: string,
  out: Array<{ relPath: string; item: DriveItem }>,
  maxDepth = 8,
): Promise<void> {
  if (maxDepth < 0) return;
  const items = await listDriveFolder(token, driveId, rootRelative);
  for (const item of items) {
    const childRel = `${basePathFromRoot}/${item.name}`.replace(/^\/+/, "");
    if (item.folder) {
      await walkDrive(
        token,
        driveId,
        `${rootRelative}/${item.name}`,
        childRel,
        out,
        maxDepth - 1,
      );
    } else if (item.file) {
      out.push({ relPath: childRel, item });
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                          Supabase Storage walker                           */
/* -------------------------------------------------------------------------- */

interface StorageFile {
  path: string;
  name: string;
  size?: number;
  mime?: string;
  updated?: string;
}

async function walkBucket(prefix: string, out: StorageFile[], maxDepth = 8): Promise<void> {
  if (maxDepth < 0) return;
  let offset = 0;
  const PAGE = 100;
  while (true) {
    const { data, error } = await supabase.storage
      .from("deliverables")
      .list(prefix, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`Bucket list ${prefix || "/"} failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const entry of data) {
      // A folder in supabase storage has `id === null` and `metadata === null`.
      const childPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const isFolder = entry.id === null;
      if (isFolder) {
        await walkBucket(childPath, out, maxDepth - 1);
      } else {
        out.push({
          path: childPath,
          name: entry.name,
          size: (entry.metadata as { size?: number } | null)?.size,
          mime: (entry.metadata as { mimetype?: string } | null)?.mimetype,
          updated: entry.updated_at ?? entry.created_at ?? undefined,
        });
      }
    }
    if (data.length < PAGE) break;
    offset += PAGE;
  }
}

/* -------------------------------------------------------------------------- */
/*                            Registration helper                             */
/* -------------------------------------------------------------------------- */

function titleFromFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

async function registerSupabase(
  clientId: string,
  skill: SkillRouting,
  storagePath: string,
  filename: string,
  period: string | null,
  meta: { size?: number; mime?: string; updated?: string },
  stats: IndexStats,
): Promise<void> {
  const { data, error } = await supabase.rpc("register_deliverable", {
    p_client_id: clientId,
    p_type: skill.type,
    p_filename: filename,
    p_title: titleFromFilename(filename),
    p_status: "delivered",
    p_skill_name: skill.skill,
    p_period: period,
    p_storage_path: storagePath,
    p_file_size: meta.size ?? null,
    p_content_type: meta.mime ?? null,
    p_generated_by: "index-deliverables",
    p_generation_meta: { source: "supabase-storage", reindexed_at: new Date().toISOString() },
  });
  if (error) {
    stats.errors.push({ path: storagePath, error: error.message });
    return;
  }
  const action = (data as { action?: string } | null)?.action;
  if (action === "inserted") stats.indexed++;
  else if (action === "updated") stats.updated++;
  else stats.skipped++;
}

async function registerOneDrive(
  clientId: string,
  skill: SkillRouting,
  onedrivePath: string,
  filename: string,
  period: string | null,
  meta: { size?: number; mime?: string; updated?: string },
  stats: IndexStats,
): Promise<void> {
  const { data, error } = await supabase.rpc("register_deliverable", {
    p_client_id: clientId,
    p_type: skill.type,
    p_filename: filename,
    p_title: titleFromFilename(filename),
    p_status: "delivered",
    p_skill_name: skill.skill,
    p_period: period,
    p_onedrive_path: onedrivePath,
    p_file_size: meta.size ?? null,
    p_content_type: meta.mime ?? null,
    p_generated_by: "index-deliverables",
    p_generation_meta: { source: "onedrive", reindexed_at: new Date().toISOString() },
  });
  if (error) {
    stats.errors.push({ path: onedrivePath, error: error.message });
    return;
  }
  const action = (data as { action?: string } | null)?.action;
  if (action === "inserted") stats.indexed++;
  else if (action === "updated") stats.updated++;
  else stats.skipped++;
}

/* -------------------------------------------------------------------------- */
/*                                Main                                        */
/* -------------------------------------------------------------------------- */

async function indexSupabaseStorage(
  clientsBySlug: Map<string, ClientRow>,
  stats: IndexStats,
): Promise<number> {
  const files: StorageFile[] = [];
  await walkBucket("", files);
  let matched = 0;
  for (const f of files) {
    const parsed = parseStoragePath(f.path);
    if (!parsed) {
      stats.skipped++;
      continue;
    }
    const client = clientsBySlug.get(parsed.clientSlug);
    if (!client) {
      stats.skipped++;
      continue;
    }
    matched++;
    await registerSupabase(
      client.id,
      parsed.skill,
      f.path,
      parsed.filename,
      parsed.period,
      { size: f.size, mime: f.mime, updated: f.updated },
      stats,
    );
  }
  return matched;
}

async function indexOneDrive(stats: IndexStats): Promise<number> {
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    console.warn("[index-deliverables] OneDrive skipped — Azure env vars not set");
    return 0;
  }

  const { data: drives, error: drivesError } = await supabase
    .from("client_drives")
    .select("client_id, drive_id, root_folder");
  if (drivesError) throw new Error(`Load client_drives failed: ${drivesError.message}`);

  const rows = (drives ?? []) as ClientDriveRow[];
  if (rows.length === 0) return 0;

  const token = await getGraphToken();
  let matched = 0;

  for (const drive of rows) {
    const livrablesRoot = `${drive.root_folder}/livrables`;
    const collected: Array<{ relPath: string; item: DriveItem }> = [];
    try {
      await walkDrive(token, drive.drive_id, livrablesRoot, "livrables", collected);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      stats.errors.push({ path: livrablesRoot, error: msg });
      continue;
    }

    for (const { relPath, item } of collected) {
      // relPath is like: livrables/seo/strategy/2026/2026-04/file.pdf
      const parsed = parseOneDrivePath(relPath);
      if (!parsed) {
        stats.skipped++;
        continue;
      }
      matched++;
      await registerOneDrive(
        drive.client_id,
        parsed.skill,
        relPath,
        parsed.filename,
        parsed.period,
        {
          size: item.size,
          mime: item.file?.mimeType,
          updated: item.lastModifiedDateTime,
        },
        stats,
      );
    }
  }
  return matched;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  try {
    // Load client slug → id map
    const { data: clients, error: cErr } = await supabase
      .from("clients")
      .select("id, name");
    if (cErr) throw new Error(`Load clients failed: ${cErr.message}`);
    const clientsBySlug = new Map<string, ClientRow>();
    for (const c of (clients ?? []) as ClientRow[]) {
      clientsBySlug.set(slugifyClient(c.name), c);
    }

    const stats: IndexStats = { indexed: 0, updated: 0, skipped: 0, errors: [] };

    const supabaseMatched = await indexSupabaseStorage(clientsBySlug, stats);
    const onedriveMatched = await indexOneDrive(stats);

    const durationMs = Date.now() - startedAt;
    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: durationMs,
        supabase_matched: supabaseMatched,
        onedrive_matched: onedriveMatched,
        skills: SKILL_ROUTING.length,
        ...stats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[index-deliverables]", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
