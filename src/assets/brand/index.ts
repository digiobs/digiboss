/**
 * Brand charte graphique aggregator.
 *
 * Each `<client_id>.json` file in this directory is a snapshot of a client's
 * charte graphique (colors, typographies, Figma URLs, style visuel) extracted
 * from the DigiObs Figma files via `scripts/export-brand-kits.ts` or directly
 * from the `client_brand_guidelines` table.
 *
 * They are loaded statically at build time through Vite's `import.meta.glob`
 * so they can serve as an offline / fallback source when the Supabase layer
 * is unavailable.
 */

export type BrandColor = {
  hex: string;
  name: string;
  usage?: string;
};

export type BrandTypography = {
  name: string;
  family?: string;
  weight?: number | string;
  size?: number | string;
  description?: string;
};

export type BrandFigmaUrl = {
  name: string;
  url: string;
};

export type BrandStyleVisuel = Record<string, string>;

export type BrandCharte = {
  client_id: string;
  source: string;
  colors: BrandColor[];
  typographies: BrandTypography[];
  figma_urls: BrandFigmaUrl[];
  style_visuel: BrandStyleVisuel | null;
};

type GlobbedCharte = {
  default?: BrandCharte;
} & Partial<BrandCharte>;

const modules = import.meta.glob<GlobbedCharte>('./*.json', { eager: true });

function normalize(raw: GlobbedCharte): BrandCharte {
  const data = (raw.default ?? raw) as BrandCharte;
  return {
    client_id: data.client_id,
    source: data.source ?? 'client_brand_guidelines',
    colors: Array.isArray(data.colors) ? data.colors : [],
    typographies: Array.isArray(data.typographies) ? data.typographies : [],
    figma_urls: Array.isArray(data.figma_urls) ? data.figma_urls : [],
    style_visuel:
      data.style_visuel && typeof data.style_visuel === 'object'
        ? data.style_visuel
        : null,
  };
}

export const brandChartes: Record<string, BrandCharte> = Object.entries(modules).reduce(
  (acc, [path, mod]) => {
    const fileName = path.replace(/^\.\//, '').replace(/\.json$/, '');
    const charte = normalize(mod);
    acc[charte.client_id || fileName] = charte;
    return acc;
  },
  {} as Record<string, BrandCharte>,
);

export function getBrandCharte(clientId: string | null | undefined): BrandCharte | null {
  if (!clientId) return null;
  return brandChartes[clientId] ?? null;
}

export function listBrandChartes(): BrandCharte[] {
  return Object.values(brandChartes).sort((a, b) =>
    a.client_id.localeCompare(b.client_id),
  );
}
