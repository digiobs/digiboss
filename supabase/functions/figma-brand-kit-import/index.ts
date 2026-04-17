import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MappingRow = {
  client_id: string;
  external_account_id: string | null;
};

type FigmaStyle = {
  key: string;
  name: string;
  style_type: string;
  node_id?: string;
  thumbnail_url?: string;
  description?: string;
};

type FigmaNode = {
  id?: string;
  name?: string;
  type?: string;
  fills?: Array<{
    type?: string;
    visible?: boolean;
    opacity?: number;
    color?: { r?: number; g?: number; b?: number; a?: number };
  }>;
  style?: {
    fontFamily?: string;
    fontPostScriptName?: string;
    fontWeight?: number;
    fontSize?: number;
    lineHeightPx?: number;
    letterSpacing?: number;
  };
  children?: FigmaNode[];
};

type BrandKitRow = {
  client_id: string;
  source: string;
  figma_file_key: string;
  figma_node_id: string | null;
  token_type: string;
  token_name: string;
  token_value: string | null;
  preview_url: string | null;
  payload: unknown;
  imported_at: string;
};

const MAX_FALLBACK_TOKENS = 80;
const LOGO_PAGE_MATCH = /logo|brand|charte|style|guideline/i;

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value: number): string {
  return clampByte(value).toString(16).padStart(2, "0").toUpperCase();
}

function colorToHex(
  color: { r?: number; g?: number; b?: number; a?: number } | undefined,
  opacity?: number,
): string {
  if (!color) return "NA";
  const r = toHex((color.r ?? 0) * 255);
  const g = toHex((color.g ?? 0) * 255);
  const b = toHex((color.b ?? 0) * 255);
  const alpha = typeof opacity === "number" ? opacity : color.a;
  if (typeof alpha === "number" && alpha < 0.999) {
    return `#${r}${g}${b}${toHex(alpha * 255)}`;
  }
  return `#${r}${g}${b}`;
}

function toStyleRows(mapping: MappingRow, fileKey: string, styles: FigmaStyle[]): BrandKitRow[] {
  const importedAt = new Date().toISOString();
  return styles.map((style) => ({
    client_id: mapping.client_id,
    source: "figma",
    figma_file_key: fileKey,
    figma_node_id: style.node_id ?? null,
    token_type: (style.style_type || "style").toLowerCase(),
    token_name: style.name || "Unnamed style",
    token_value: style.key || null,
    preview_url: style.thumbnail_url || null,
    payload: style,
    imported_at: importedAt,
  }));
}

/**
 * Walk a Figma document and extract a minimal charte graphique:
 * - unique solid fill colors (keyed by hex),
 * - unique text styles (keyed by family+size+weight),
 * - logo candidates from pages whose name matches LOGO_PAGE_MATCH.
 */
function extractFallbackRows(
  mapping: MappingRow,
  fileKey: string,
  root: FigmaNode | undefined,
): { rows: BrandKitRow[]; logoNodeIds: string[] } {
  if (!root) return { rows: [], logoNodeIds: [] };
  const importedAt = new Date().toISOString();
  const rows: BrandKitRow[] = [];
  const colorSeen = new Set<string>();
  const typoSeen = new Set<string>();
  const logoNodeIds: string[] = [];

  const pushColor = (hex: string, name: string, nodeId: string | null) => {
    if (colorSeen.has(hex)) return;
    if (rows.length >= MAX_FALLBACK_TOKENS) return;
    colorSeen.add(hex);
    rows.push({
      client_id: mapping.client_id,
      source: "figma-fallback",
      figma_file_key: fileKey,
      figma_node_id: nodeId,
      token_type: "color",
      token_name: name,
      token_value: hex,
      preview_url: null,
      payload: { hex },
      imported_at: importedAt,
    });
  };

  const pushTypography = (
    node: FigmaNode,
    nodeName: string,
    nodeId: string | null,
  ) => {
    const s = node.style;
    if (!s) return;
    const key = `${s.fontFamily ?? ""}|${s.fontSize ?? ""}|${s.fontWeight ?? ""}`;
    if (typoSeen.has(key)) return;
    if (rows.length >= MAX_FALLBACK_TOKENS) return;
    typoSeen.add(key);
    const value = [
      s.fontFamily ? `family=${s.fontFamily}` : null,
      typeof s.fontWeight === "number" ? `weight=${s.fontWeight}` : null,
      typeof s.fontSize === "number" ? `size=${s.fontSize}` : null,
      typeof s.lineHeightPx === "number" ? `lineHeight=${s.lineHeightPx}` : null,
      typeof s.letterSpacing === "number" ? `letterSpacing=${s.letterSpacing}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    if (!value) return;
    rows.push({
      client_id: mapping.client_id,
      source: "figma-fallback",
      figma_file_key: fileKey,
      figma_node_id: nodeId,
      token_type: "text",
      token_name: nodeName,
      token_value: value,
      preview_url: null,
      payload: { style: s },
      imported_at: importedAt,
    });
  };

  const visit = (node: FigmaNode, inLogoPage: boolean) => {
    if (rows.length >= MAX_FALLBACK_TOKENS) return;
    const nodeName = node.name?.trim() || "Unnamed layer";
    const nodeId = node.id ?? null;

    // Mark top-level logo frames for image export.
    if (
      inLogoPage &&
      nodeId &&
      (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "COMPONENT_SET") &&
      logoNodeIds.length < 12
    ) {
      logoNodeIds.push(nodeId);
    }

    if (Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill?.type !== "SOLID" || fill?.visible === false) continue;
        const hex = colorToHex(fill.color, fill.opacity);
        if (hex === "NA") continue;
        pushColor(hex, nodeName, nodeId);
      }
    }

    if (node.style?.fontFamily || node.style?.fontSize) {
      pushTypography(node, nodeName, nodeId);
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (rows.length >= MAX_FALLBACK_TOKENS) break;
        visit(child, inLogoPage);
      }
    }
  };

  // Root is the DOCUMENT node; its children are PAGEs.
  if (Array.isArray(root.children)) {
    for (const page of root.children) {
      const isLogoPage = LOGO_PAGE_MATCH.test(page.name ?? "");
      visit(page, isLogoPage);
    }
  } else {
    visit(root, false);
  }

  return { rows, logoNodeIds };
}

async function fetchLogoPreviews(
  fileKey: string,
  nodeIds: string[],
  token: string,
): Promise<Record<string, string>> {
  if (nodeIds.length === 0) return {};
  const ids = nodeIds.join(",");
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=2`;
  const response = await fetch(url, { headers: { "X-Figma-Token": token } });
  if (!response.ok) return {};
  const json = await response.json().catch(() => ({}));
  const images = json?.images;
  return images && typeof images === "object" ? images : {};
}

type ImportSummary = {
  client_id: string;
  status: "ok" | "error";
  tokens: number;
  message?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestedClientId: string | null = body?.clientId ?? null;

    const FIGMA_ACCESS_TOKEN = Deno.env.get("FIGMA_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIGMA_ACCESS_TOKEN) {
      throw new Error("Missing FIGMA_ACCESS_TOKEN secret");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase runtime secrets");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let mappingsQuery = supabase
      .from("client_data_mappings")
      .select("client_id,external_account_id")
      .eq("provider", "figma")
      .eq("status", "connected");

    if (requestedClientId) {
      mappingsQuery = mappingsQuery.eq("client_id", requestedClientId);
    }

    const { data: mappings, error: mappingsError } = await mappingsQuery;
    if (mappingsError) {
      throw new Error(`Failed to read figma mappings: ${mappingsError.message}`);
    }

    const usableMappings = ((mappings ?? []) as MappingRow[]).filter(
      (m) => (m.external_account_id ?? "").trim().length > 0,
    );

    if (usableMappings.length === 0) {
      return new Response(
        JSON.stringify({
          importedTokens: 0,
          importedClients: 0,
          message: "No connected Figma mappings found.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let importedTokens = 0;
    const touchedClients = new Set<string>();
    const summaries: ImportSummary[] = [];

    for (const mapping of usableMappings) {
      const fileKey = (mapping.external_account_id ?? "").trim();
      if (!fileKey) continue;

      try {
        const stylesResponse = await fetch(
          `https://api.figma.com/v1/files/${fileKey}/styles`,
          { headers: { "X-Figma-Token": FIGMA_ACCESS_TOKEN } },
        );

        if (!stylesResponse.ok) {
          const details = await stylesResponse.text();
          throw new Error(`styles ${stylesResponse.status}: ${details.slice(0, 200)}`);
        }

        const stylesJson = await stylesResponse.json();
        const styles = (stylesJson?.meta?.styles ?? []) as FigmaStyle[];

        let rows: BrandKitRow[] = [];
        let logoNodeIds: string[] = [];

        if (styles.length > 0) {
          rows = toStyleRows(mapping, fileKey, styles);
        } else {
          const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
            headers: { "X-Figma-Token": FIGMA_ACCESS_TOKEN },
          });
          if (!fileResponse.ok) {
            const details = await fileResponse.text();
            throw new Error(`file ${fileResponse.status}: ${details.slice(0, 200)}`);
          }
          const fileJson = await fileResponse.json();
          const extracted = extractFallbackRows(
            mapping,
            fileKey,
            fileJson?.document as FigmaNode | undefined,
          );
          rows = extracted.rows;
          logoNodeIds = extracted.logoNodeIds;
        }

        // Try to fetch logo previews for nodes sitting on "Logo"/"Brand" pages.
        if (logoNodeIds.length > 0) {
          const previews = await fetchLogoPreviews(
            fileKey,
            logoNodeIds,
            FIGMA_ACCESS_TOKEN,
          );
          const importedAt = new Date().toISOString();
          for (const [nodeId, url] of Object.entries(previews)) {
            if (!url) continue;
            rows.push({
              client_id: mapping.client_id,
              source: "figma-fallback",
              figma_file_key: fileKey,
              figma_node_id: nodeId,
              token_type: "logo",
              token_name: `Logo ${nodeId}`,
              token_value: nodeId,
              preview_url: url,
              payload: { node_id: nodeId },
              imported_at: importedAt,
            });
          }
        }

        if (rows.length === 0) {
          summaries.push({
            client_id: mapping.client_id,
            status: "ok",
            tokens: 0,
            message: "No tokens extracted",
          });
          continue;
        }

        // Remove stale tokens for this file before upsert, so deleted Figma
        // nodes don't linger in the DB.
        const { error: deleteError } = await supabase
          .from("client_brand_kits")
          .delete()
          .eq("client_id", mapping.client_id)
          .eq("figma_file_key", fileKey);

        if (deleteError) {
          throw new Error(`delete stale: ${deleteError.message}`);
        }

        const { error: upsertError } = await supabase
          .from("client_brand_kits")
          .upsert(rows, {
            onConflict: "client_id,figma_file_key,token_type,token_name,figma_node_id",
          });

        if (upsertError) {
          throw new Error(`upsert: ${upsertError.message}`);
        }

        importedTokens += rows.length;
        touchedClients.add(mapping.client_id);
        summaries.push({
          client_id: mapping.client_id,
          status: "ok",
          tokens: rows.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[figma-brand-kit-import] client=${mapping.client_id} file=${fileKey}:`,
          message,
        );
        summaries.push({
          client_id: mapping.client_id,
          status: "error",
          tokens: 0,
          message,
        });
        // Try to persist the error into client_figma_sync_state if available.
        await supabase
          .from("client_figma_sync_state")
          .upsert(
            {
              client_id: mapping.client_id,
              status: "error",
              message: message.slice(0, 500),
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: "client_id" },
          )
          .then(() => undefined)
          .catch(() => undefined);
      }
    }

    return new Response(
      JSON.stringify({
        importedTokens,
        importedClients: touchedClients.size,
        summaries,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
