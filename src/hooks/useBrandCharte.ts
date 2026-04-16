import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBrandCharte, type BrandCharte, type BrandColor, type BrandTypography } from '@/assets/brand';

type BrandKitRow = {
  token_type: string;
  token_name: string;
  token_value: string | null;
  preview_url: string | null;
};

const HEX_RE = /^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

function ensureHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
}

export function useBrandCharte(clientId: string | null | undefined) {
  const [liveColors, setLiveColors] = useState<BrandColor[]>([]);
  const [liveTypographies, setLiveTypographies] = useState<BrandTypography[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setLiveColors([]);
      setLiveTypographies([]);
      setLogoUrl(null);
      return;
    }

    let mounted = true;
    setLoading(true);

    (async () => {
      const { data } = await (
        supabase as unknown as { from: (table: string) => Record<string, unknown> }
      )
        .from('client_brand_kits')
        .select('token_type,token_name,token_value,preview_url')
        .eq('client_id', clientId)
        .limit(200) as unknown as { data: BrandKitRow[] | null };

      if (!mounted) return;

      const colors: BrandColor[] = [];
      const colorSeen = new Set<string>();
      const typographies: BrandTypography[] = [];
      const typoSeen = new Set<string>();
      let firstLogo: string | null = null;

      for (const row of data ?? []) {
        if (row.token_type === 'color') {
          const hex = ensureHex(row.token_value);
          if (hex && !colorSeen.has(hex)) {
            colorSeen.add(hex);
            colors.push({ hex, name: row.token_name || hex });
          }
        } else if (row.token_type === 'text' || row.token_type === 'typography') {
          const key = `${row.token_name}|${row.token_value ?? ''}`;
          if (!typoSeen.has(key)) {
            typoSeen.add(key);
            const parsed = parseTypographyValue(row.token_value);
            typographies.push({
              name: row.token_name || 'Typography',
              ...parsed,
            });
          }
        } else if (row.token_type === 'logo' && row.preview_url && !firstLogo) {
          firstLogo = row.preview_url;
        }
      }

      setLiveColors(colors);
      setLiveTypographies(typographies);
      setLogoUrl(firstLogo);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [clientId]);

  const staticCharte = useMemo(() => getBrandCharte(clientId ?? null), [clientId]);

  const charte = useMemo((): BrandCharte | null => {
    if (!clientId) return null;

    const hasLive = liveColors.length > 0 || liveTypographies.length > 0;
    if (hasLive && staticCharte) {
      return {
        ...staticCharte,
        source: 'client_brand_kits+snapshot',
        colors: liveColors.length > 0 ? liveColors : staticCharte.colors,
        typographies: liveTypographies.length > 0 ? liveTypographies : staticCharte.typographies,
      };
    }
    if (hasLive) {
      return {
        client_id: clientId,
        source: 'client_brand_kits',
        colors: liveColors,
        typographies: liveTypographies,
        figma_urls: [],
        style_visuel: null,
      };
    }
    return staticCharte;
  }, [clientId, liveColors, liveTypographies, staticCharte]);

  return { charte, logoUrl, loading };
}

function parseTypographyValue(value: string | null): Partial<BrandTypography> {
  if (!value) return {};
  const result: Partial<BrandTypography> = {};
  for (const part of value.split(';')) {
    const [key, val] = part.split('=').map((s) => s.trim());
    if (!key || !val) continue;
    if (key === 'family') result.family = val;
    else if (key === 'weight') result.weight = val;
    else if (key === 'size') result.size = val;
  }
  return result;
}
