import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AZURE_TENANT_ID = Deno.env.get("AZURE_TENANT_ID")!;
const AZURE_CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID")!;
const AZURE_CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
  return data.access_token;
}

type DriveItem = {
  id: string;
  name: string;
  file?: { mimeType: string };
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
  "@microsoft.graph.downloadUrl"?: string;
};

type ClientDrive = {
  client_id: string;
  drive_id: string;
  root_folder: string;
};

/**
 * List files in a drive folder path.
 */
async function listDriveFiles(token: string, driveId: string, folderPath: string): Promise<DriveItem[]> {
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}:/children?$select=id,name,file,size,lastModifiedDateTime,webUrl`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return []; // Folder doesn't exist
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Graph list error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return (data.value ?? []) as DriveItem[];
}

/**
 * Download file content as text.
 */
async function downloadFileText(token: string, driveId: string, itemId: string): Promise<string> {
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Download error ${res.status}`);
  return await res.text();
}

/**
 * Parse Semrush CSV export (semicolon-delimited).
 * Handles multiple common Semrush export formats:
 * - domain_organic: Keyword;Position;Previous Position;Search Volume;Traffic (%)
 * - positions tracking: Keyword;Position;Previous Position;Search Volume;CPC;URL;Traffic (%)
 */
type ParsedRow = {
  client_id: string;
  domain: string;
  keyword: string;
  position: number;
  search_volume: number;
  traffic_percent: number;
  report_date: string;
  raw: Record<string, unknown>;
  synced_at: string;
};

/**
 * Parse Semrush CSV export. Handles two formats:
 * 1. Position Tracking export with metadata header block (lines starting with ---)
 *    Columns: Keyword, *.domain.com/*_YYYYMMDD (position), ..._visibility, ..._type, ..._landing_page
 * 2. Standard domain_organic export: Keyword;Position;Search Volume;Traffic (%)
 */
function parseSemrushCsv(
  csvText: string,
  clientId: string,
  domain: string,
  reportDate: string,
): ParsedRow[] {
  let lines = csvText.split("\n").map((l) => l.trim());

  // Skip metadata header block (lines starting with --- or key: value before the CSV)
  let csvStartIdx = 0;
  let inHeaderBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("---")) {
      inHeaderBlock = !inHeaderBlock;
      continue;
    }
    if (!inHeaderBlock && lines[i] === "") {
      // Skip blank lines between header block and CSV
      continue;
    }
    if (!inHeaderBlock && (lines[i].toLowerCase().startsWith("keyword") || lines[i].toLowerCase().startsWith("\"keyword"))) {
      csvStartIdx = i;
      break;
    }
    // If we're past the header block and find a non-empty non-header line, check if it's a metadata line
    if (!inHeaderBlock && lines[i].match(/^[A-Za-z ]+:/)) {
      continue; // Skip metadata lines like "Linktype filter: !aio"
    }
  }

  lines = lines.slice(csvStartIdx).filter(Boolean);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const sep = headerLine.includes("\t") ? "\t" : headerLine.includes(";") ? ";" : ",";
  const headers = headerLine.split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  const headersLower = headers.map((h) => h.toLowerCase().replace(/[\u00a0]/g, ""));

  // Detect format: Position Tracking vs standard
  const isPositionTracking = headers.some((h) => h.includes("_2026") || h.includes("_2025") || h.match(/\*\..+\.\w+\/\*/));

  const keywordIdx = headersLower.findIndex((h) =>
    h === "keyword" || h === "ph" || h === "mot-clé" || h === "mot clé" || h === "keywords"
  );

  if (keywordIdx === -1) {
    console.warn("No keyword column found in headers:", headersLower);
    return [];
  }

  let positionIdx = -1;
  let visibilityIdx = -1;
  let typeIdx = -1;
  let landingPageIdx = -1;
  let volumeIdx = -1;
  let trafficIdx = -1;
  let domainIdx = -1;
  let prevPositionIdx = -1;
  let extractedDomain = domain;

  if (isPositionTracking) {
    // Position Tracking format: find position column (first column after Keyword that doesn't end with _visibility, _type, _landing_page, etc.)
    for (let i = 0; i < headers.length; i++) {
      if (i === keywordIdx) continue;
      const h = headers[i];
      const hl = h.toLowerCase();
      if (hl.endsWith("_visibility")) { visibilityIdx = i; continue; }
      if (hl.endsWith("_type")) { typeIdx = i; continue; }
      if (hl.endsWith("_landing_page") || hl.endsWith("_landingpage")) { landingPageIdx = i; continue; }
      // The position column is the one with a domain pattern and date but no suffix
      if (h.match(/\*?\..+\.\w+.*_\d{8}$/) || h.match(/_\d{8}$/)) {
        if (positionIdx === -1) positionIdx = i;
      }
    }
    // Extract domain from column name: *.adechotech.com/*_20260323 -> adechotech.com
    if (positionIdx >= 0) {
      const domainMatch = headers[positionIdx].match(/\*?\.?([a-zA-Z0-9.-]+\.[a-z]{2,})/);
      if (domainMatch) extractedDomain = domainMatch[1];
    }
  } else {
    // Standard format
    positionIdx = headersLower.findIndex((h) =>
      h === "position" || h === "po" || h === "pos" || h === "rang" || h === "positions"
    );
    prevPositionIdx = headersLower.findIndex((h) =>
      h.includes("previous") || h.includes("prev") || h === "pp" || h.includes("précédent")
    );
    volumeIdx = headersLower.findIndex((h) =>
      h.includes("volume") || h === "nq" || h === "search volume" || h.includes("recherche")
    );
    trafficIdx = headersLower.findIndex((h) =>
      h.includes("traffic") || h === "tr" || h.includes("trafic")
    );
    domainIdx = headersLower.findIndex((h) =>
      h === "domain" || h === "domaine"
    );
  }

  const rows: ParsedRow[] = [];
  const now = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const keyword = cols[keywordIdx];
    if (!keyword) continue;

    const posRaw = positionIdx >= 0 ? cols[positionIdx] : "";
    const position = posRaw === "" || posRaw === "-" || posRaw === "n/a" ? 0 : Number(posRaw) || 0;
    const searchVolume = volumeIdx >= 0 ? Number(cols[volumeIdx]) || 0 : 0;
    const trafficPercent = trafficIdx >= 0 ? Number(cols[trafficIdx]) || 0 : 0;
    const rowDomain = domainIdx >= 0 && cols[domainIdx] ? cols[domainIdx] : extractedDomain;

    const raw: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (cols[idx] !== undefined) raw[h] = cols[idx];
    });
    if (prevPositionIdx >= 0) raw.previous_position = cols[prevPositionIdx];
    if (visibilityIdx >= 0) raw.visibility = cols[visibilityIdx];
    if (typeIdx >= 0) raw.serp_type = cols[typeIdx];
    if (landingPageIdx >= 0) raw.landing_page = cols[landingPageIdx];

    rows.push({
      client_id: clientId,
      domain: rowDomain,
      keyword,
      position,
      search_volume: searchVolume,
      traffic_percent: trafficPercent,
      report_date: reportDate,
      raw,
      synced_at: now,
    });
  }

  return rows;
}

/**
 * Extract a date from filename or file metadata.
 * E.g. "semrush-positions-2026-03-15.csv" => "2026-03-15"
 */
function extractDateFromFilename(filename: string, fallbackDate: string): string {
  // Try YYYY-MM-DD or YYYY_MM_DD
  const dashMatch = filename.match(/(\d{4}[-_]\d{2}[-_]\d{2})/);
  if (dashMatch) return dashMatch[1].replace(/_/g, "-");
  // Try YYYYMMDD — find ALL and pick the most plausible recent date
  const compactMatches = [...filename.matchAll(/(\d{4})(\d{2})(\d{2})/g)];
  const validDates = compactMatches.filter((m) => {
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    return y >= 2024 && y <= 2027 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31;
  });
  if (validDates.length > 0) {
    const last = validDates[validDates.length - 1];
    return `${last[1]}-${last[2]}-${last[3]}`;
  }
  // Try month-year patterns like "mars-2026" or "april-2026"
  const monthMatch = filename.match(/(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre|january|february|march|april|may|june|july|august|september|october|november|december)[-_]?(\d{4})/i);
  if (monthMatch) {
    const monthNames: Record<string, string> = {
      janvier: "01", january: "01", fevrier: "02", february: "02",
      mars: "03", march: "03", avril: "04", april: "04",
      mai: "05", may: "05", juin: "06", june: "06",
      juillet: "07", july: "07", aout: "08", august: "08",
      septembre: "09", september: "09", octobre: "10", october: "10",
      novembre: "11", november: "11", decembre: "12", december: "12",
    };
    const m = monthNames[monthMatch[1].toLowerCase()];
    if (m) return `${monthMatch[2]}-${m}-01`;
  }
  return fallbackDate;
}

/**
 * Get domain from client_data_mappings for semrush, or fallback.
 */
async function getClientDomain(clientId: string): Promise<string> {
  const { data } = await supabase
    .from("client_data_mappings")
    .select("external_account_id")
    .eq("client_id", clientId)
    .eq("provider", "semrush")
    .eq("connector", "account")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return (data?.external_account_id as string) || "unknown.com";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const targetClientId = typeof body?.clientId === "string" ? body.clientId.trim() : null;
    const dryRun = body?.dryRun === true;
    const today = new Date().toISOString().slice(0, 10);

    // 1. Get Graph API token
    const token = await getGraphToken();

    // 2. Load client drives
    let drivesQuery = supabase.from("client_drives").select("client_id, drive_id, root_folder");
    if (targetClientId) drivesQuery = drivesQuery.eq("client_id", targetClientId);
    const { data: drivesData, error: drivesError } = await drivesQuery;
    if (drivesError) throw new Error(`Failed to load drives: ${drivesError.message}`);
    const drives = (drivesData ?? []) as ClientDrive[];

    const results: Array<{
      client_id: string;
      files_found: string[];
      rows_parsed: number;
      rows_inserted: number;
      errors: string[];
      debug?: string[];
    }> = [];

    let totalInserted = 0;

    for (const drive of drives) {
      const clientResult = {
        client_id: drive.client_id,
        files_found: [] as string[],
        rows_parsed: 0,
        rows_inserted: 0,
        errors: [] as string[],
        debug: [] as string[],
      };

      try {
        const seoPath = `${drive.root_folder}/seo`;
        const files = await listDriveFiles(token, drive.drive_id, seoPath);

        // Filter for CSV/text files (Semrush exports)
        const csvFiles = files.filter((f) =>
          f.file && (
            f.name.toLowerCase().endsWith(".csv") ||
            f.name.toLowerCase().endsWith(".tsv") ||
            f.name.toLowerCase().endsWith(".txt")
          )
        );

        clientResult.files_found = files.map((f) => `${f.name} (${f.size}b)`);

        if (csvFiles.length === 0 && files.length > 0) {
          // Also list all files for debugging
          clientResult.files_found = files.map((f) => `${f.name} (${f.size}b, ${f.file?.mimeType ?? "folder"})`);
        }

        const domain = await getClientDomain(drive.client_id);

        clientResult.debug.push(`csvFiles count: ${csvFiles.length}`);

        for (const file of csvFiles) {
          try {
            const content = await downloadFileText(token, drive.drive_id, file.id);
            clientResult.debug.push(`${file.name}: ${content.length} chars, first 300: ${content.slice(0, 300)}`);

            const reportDate = extractDateFromFilename(
              file.name,
              file.lastModifiedDateTime?.slice(0, 10) ?? today
            );

            const rows = parseSemrushCsv(content, drive.client_id, domain, reportDate);
            clientResult.rows_parsed += rows.length;

            if (!dryRun && rows.length > 0) {
              // Delete existing rows for this client+date to avoid duplicates
              await supabase
                .from("semrush_domain_metrics")
                .delete()
                .eq("client_id", drive.client_id)
                .eq("report_date", reportDate);

              // Insert in batches of 100
              for (let i = 0; i < rows.length; i += 100) {
                const batch = rows.slice(i, i + 100);
                const { error: insertError } = await supabase
                  .from("semrush_domain_metrics")
                  .insert(batch);
                if (insertError) {
                  clientResult.errors.push(`Insert batch ${i}: ${insertError.message}`);
                } else {
                  clientResult.rows_inserted += batch.length;
                  totalInserted += batch.length;
                }
              }
            }
          } catch (fileErr) {
            clientResult.errors.push(`${file.name}: ${fileErr instanceof Error ? fileErr.message : String(fileErr)}`);
          }
        }
      } catch (clientErr) {
        clientResult.errors.push(clientErr instanceof Error ? clientErr.message : String(clientErr));
      }

      results.push(clientResult);
    }

    // Log integration run
    const now = new Date().toISOString();
    await supabase.from("integration_sync_runs").insert({
      provider: "semrush",
      connector: "onedrive_csv",
      client_id: targetClientId,
      trigger_type: "manual",
      started_by: "system",
      status: "success",
      started_at: new Date(startedAt).toISOString(),
      completed_at: now,
      metrics: {
        clientsScanned: drives.length,
        totalInserted,
        dryRun,
        durationMs: Date.now() - startedAt,
      },
    });

    return new Response(
      JSON.stringify({ success: true, dryRun, clients: results, totalInserted, durationMs: Date.now() - startedAt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
