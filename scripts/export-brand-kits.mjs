#!/usr/bin/env node
/**
 * Export brand chartes graphiques from Supabase to static JSON snapshots
 * under `src/assets/brand/<client_id>.json`.
 *
 * Strategy:
 *   1. Read `client_brand_guidelines` (manually curated per-client charte).
 *   2. Enrich with data from `client_brand_kits` (auto-imported from Figma
 *      via the `figma-brand-kit-import` edge function) when available:
 *      - unique colors (by hex)
 *      - unique typographies (by family+size+weight)
 *      - logo preview URLs (token_type='logo')
 *   3. Write the merged result as `src/assets/brand/<client_id>.json`.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/export-brand-kits.mjs
 *   (or rely on a local `.env` — this script uses process.env only.)
 *
 * The aggregator `src/assets/brand/index.ts` picks up any new files via
 * Vite's `import.meta.glob`, so no further wiring is needed.
 */

import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "src", "assets", "brand");

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const HEX_RE = /^#?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;

function normalizeHex(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  return (trimmed.startsWith("#") ? trimmed : `#${trimmed}`).toUpperCase();
}

function parseTypographyValue(value) {
  if (!value || typeof value !== "string") return {};
  const out = {};
  for (const part of value.split(";")) {
    const [k, v] = part.split("=").map((s) => (s ?? "").trim());
    if (!k || !v) continue;
    out[k] = v;
  }
  return out;
}

function mergeColors(existing, extra) {
  const seen = new Set(existing.map((c) => (c.hex || "").toUpperCase()));
  const merged = [...existing];
  for (const color of extra) {
    const hex = normalizeHex(color.hex);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    merged.push({ hex, name: color.name ?? hex, usage: color.usage });
  }
  return merged;
}

function mergeTypographies(existing, extra) {
  const seen = new Set(existing.map((t) => `${t.name}|${t.description ?? ""}`));
  const merged = [...existing];
  for (const typo of extra) {
    const key = `${typo.name}|${typo.description ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(typo);
  }
  return merged;
}

function kitRowsToExtras(rows) {
  const colors = [];
  const typos = [];
  const logos = [];
  const hexSeen = new Set();
  const typoKeySeen = new Set();

  for (const row of rows) {
    if (row.token_type === "color") {
      const hex = normalizeHex(row.token_value);
      if (!hex || hexSeen.has(hex)) continue;
      hexSeen.add(hex);
      colors.push({ hex, name: row.token_name ?? hex });
    } else if (row.token_type === "text" || row.token_type === "typography") {
      const parsed = parseTypographyValue(row.token_value);
      const key = `${parsed.family ?? ""}|${parsed.size ?? ""}|${parsed.weight ?? ""}`;
      if (typoKeySeen.has(key)) continue;
      typoKeySeen.add(key);
      typos.push({
        name: row.token_name ?? parsed.family ?? "Typography",
        family: parsed.family,
        weight: parsed.weight,
        size: parsed.size,
        description: row.token_value ?? undefined,
      });
    } else if (row.token_type === "logo" && row.preview_url) {
      logos.push({
        name: row.token_name ?? "Logo",
        preview_url: row.preview_url,
      });
    }
  }

  return { colors, typos, logos };
}

async function main() {
  console.log(`→ Connecting to ${SUPABASE_URL}`);

  const { data: guidelines, error: gErr } = await supabase
    .from("client_brand_guidelines")
    .select("client_id, colors, typographies, figma_urls, style_visuel");
  if (gErr) throw new Error(`client_brand_guidelines: ${gErr.message}`);

  const { data: kitRows, error: kErr } = await supabase
    .from("client_brand_kits")
    .select("client_id, figma_file_key, token_type, token_name, token_value, preview_url");
  if (kErr) throw new Error(`client_brand_kits: ${kErr.message}`);

  const kitByClient = new Map();
  for (const row of kitRows ?? []) {
    if (!kitByClient.has(row.client_id)) kitByClient.set(row.client_id, []);
    kitByClient.get(row.client_id).push(row);
  }

  const clientIds = new Set([
    ...(guidelines ?? []).map((g) => g.client_id),
    ...kitByClient.keys(),
  ]);

  await mkdir(OUT_DIR, { recursive: true });

  const written = [];
  for (const clientId of Array.from(clientIds).sort()) {
    const guideline = (guidelines ?? []).find((g) => g.client_id === clientId);
    const kitRows = kitByClient.get(clientId) ?? [];

    const baseColors = Array.isArray(guideline?.colors) ? guideline.colors : [];
    const baseTypos = Array.isArray(guideline?.typographies)
      ? guideline.typographies.map((t) =>
          typeof t === "string" ? { name: t, description: t } : t,
        )
      : [];

    const extras = kitRowsToExtras(kitRows);

    const charte = {
      client_id: clientId,
      source: kitRows.length > 0 ? "client_brand_kits+guidelines" : "client_brand_guidelines",
      colors: mergeColors(baseColors, extras.colors),
      typographies: mergeTypographies(baseTypos, extras.typos),
      figma_urls: Array.isArray(guideline?.figma_urls) ? guideline.figma_urls : [],
      style_visuel:
        guideline?.style_visuel && typeof guideline.style_visuel === "object"
          ? guideline.style_visuel
          : null,
      ...(extras.logos.length > 0 ? { logos: extras.logos } : {}),
    };

    if (
      charte.colors.length === 0 &&
      charte.typographies.length === 0 &&
      charte.figma_urls.length === 0 &&
      !charte.style_visuel
    ) {
      console.log(`  · ${clientId}: skipped (no data)`);
      continue;
    }

    const outFile = path.join(OUT_DIR, `${clientId}.json`);
    await writeFile(outFile, JSON.stringify(charte, null, 2) + "\n", "utf8");
    written.push(clientId);
    console.log(
      `  · ${clientId}: ${charte.colors.length} colors, ${charte.typographies.length} typos, ${charte.figma_urls.length} figma urls`,
    );
  }

  console.log(`\n✓ Exported ${written.length} charte(s) to ${path.relative(REPO_ROOT, OUT_DIR)}`);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
