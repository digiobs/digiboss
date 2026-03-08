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

const MAX_FALLBACK_TOKENS = 400;

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value: number): string {
  return clampByte(value).toString(16).padStart(2, "0").toUpperCase();
}

function colorToHex(color: { r?: number; g?: number; b?: number; a?: number } | undefined, opacity?: number): string {
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

function extractFallbackRows(mapping: MappingRow, fileKey: string, root: FigmaNode | undefined): BrandKitRow[] {
  if (!root) return [];
  const importedAt = new Date().toISOString();
  const dedupe = new Set<string>();
  const rows: BrandKitRow[] = [];

  const pushRow = (row: BrandKitRow) => {
    const key = `${row.token_type}|${row.token_name}|${row.token_value ?? "NA"}`;
    if (dedupe.has(key)) return;
    dedupe.add(key);
    rows.push(row);
  };

  const visit = (node: FigmaNode) => {
    if (rows.length >= MAX_FALLBACK_TOKENS) return;
    const nodeName = node.name?.trim() || "Unnamed layer";
    const nodeId = node.id ?? null;

    if (Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (rows.length >= MAX_FALLBACK_TOKENS) break;
        if (fill?.type !== "SOLID" || fill?.visible === false) continue;
        const colorHex = colorToHex(fill.color, fill.opacity);
        pushRow({
          client_id: mapping.client_id,
          source: "figma-fallback",
          figma_file_key: fileKey,
          figma_node_id: nodeId,
          token_type: "color",
          token_name: `${nodeName} / fill`,
          token_value: colorHex,
          preview_url: null,
          payload: {
            nodeType: node.type ?? null,
            fill,
          },
          imported_at: importedAt,
        });
      }
    }

    if (node.style?.fontFamily || node.style?.fontSize) {
      const textValue = [
        node.style.fontFamily ? `family=${node.style.fontFamily}` : null,
        typeof node.style.fontWeight === "number" ? `weight=${node.style.fontWeight}` : null,
        typeof node.style.fontSize === "number" ? `size=${node.style.fontSize}` : null,
        typeof node.style.lineHeightPx === "number" ? `lineHeight=${node.style.lineHeightPx}` : null,
        typeof node.style.letterSpacing === "number" ? `letterSpacing=${node.style.letterSpacing}` : null,
      ]
        .filter(Boolean)
        .join("; ");

      if (textValue) {
        pushRow({
          client_id: mapping.client_id,
          source: "figma-fallback",
          figma_file_key: fileKey,
          figma_node_id: nodeId,
          token_type: "text",
          token_name: `${nodeName} / typography`,
          token_value: textValue,
          preview_url: null,
          payload: {
            nodeType: node.type ?? null,
            style: node.style,
          },
          imported_at: importedAt,
        });
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (rows.length >= MAX_FALLBACK_TOKENS) break;
        visit(child);
      }
    }
  };

  visit(root);
  return rows;
}

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

    for (const mapping of usableMappings) {
      const fileKey = (mapping.external_account_id ?? "").trim();
      if (!fileKey) continue;

      const stylesResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}/styles`, {
        headers: {
          "X-Figma-Token": FIGMA_ACCESS_TOKEN,
        },
      });

      if (!stylesResponse.ok) {
        const details = await stylesResponse.text();
        throw new Error(`Figma API failed for file ${fileKey}: ${stylesResponse.status} ${details}`);
      }

      const stylesJson = await stylesResponse.json();
      const styles = (stylesJson?.meta?.styles ?? []) as FigmaStyle[];

      let rows: BrandKitRow[] = [];
      if (styles.length > 0) {
        rows = toStyleRows(mapping, fileKey, styles);
      } else {
        const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
          headers: {
            "X-Figma-Token": FIGMA_ACCESS_TOKEN,
          },
        });
        if (!fileResponse.ok) {
          const details = await fileResponse.text();
          throw new Error(`Figma file API failed for ${fileKey}: ${fileResponse.status} ${details}`);
        }
        const fileJson = await fileResponse.json();
        rows = extractFallbackRows(mapping, fileKey, fileJson?.document as FigmaNode | undefined);
      }

      if (rows.length === 0) continue;

      const { error: upsertError } = await supabase
        .from("client_brand_kits")
        .upsert(rows, {
          onConflict: "client_id,figma_file_key,token_type,token_name,figma_node_id",
        });

      if (upsertError) {
        throw new Error(`Failed to upsert client_brand_kits: ${upsertError.message}`);
      }

      importedTokens += rows.length;
      touchedClients.add(mapping.client_id);
    }

    return new Response(
      JSON.stringify({
        importedTokens,
        importedClients: touchedClients.size,
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
