import { useEffect, useMemo, useState } from 'react';
import { Palette, Type, Eye, ExternalLink, RefreshCw, FileImage } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  brandChartes,
  getBrandCharte,
  type BrandCharte,
  type BrandColor,
  type BrandTypography,
  type BrandFigmaUrl,
} from '@/assets/brand';

/* ------------------------------------------------------------------ */
/*  Types (runtime shape for client_brand_kits rows)                  */
/* ------------------------------------------------------------------ */

type BrandKitRow = {
  client_id: string;
  figma_file_key: string;
  token_type: string;
  token_name: string;
  token_value: string | null;
  preview_url: string | null;
  payload: unknown;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const HEX_RE = /^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

function ensureHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
}

function kitRowsToCharte(clientId: string, rows: BrandKitRow[]): BrandCharte | null {
  if (!rows.length) return null;

  const colors: BrandColor[] = [];
  const colorSeen = new Set<string>();
  const typographies: BrandTypography[] = [];
  const typoSeen = new Set<string>();
  const figmaUrls: BrandFigmaUrl[] = [];
  const figmaSeen = new Set<string>();

  for (const row of rows) {
    if (row.token_type === 'color') {
      const hex = ensureHex(row.token_value);
      if (!hex || colorSeen.has(hex)) continue;
      colorSeen.add(hex);
      colors.push({ hex, name: row.token_name || hex });
    } else if (row.token_type === 'text' || row.token_type === 'typography') {
      const key = `${row.token_name}|${row.token_value ?? ''}`;
      if (typoSeen.has(key)) continue;
      typoSeen.add(key);
      typographies.push({
        name: row.token_name || 'Typography',
        description: row.token_value ?? undefined,
      });
    }

    if (row.figma_file_key) {
      const url = `https://www.figma.com/design/${row.figma_file_key}`;
      if (!figmaSeen.has(url)) {
        figmaSeen.add(url);
        figmaUrls.push({ name: row.figma_file_key.slice(0, 12), url });
      }
    }
  }

  if (colors.length === 0 && typographies.length === 0) {
    return null;
  }

  return {
    client_id: clientId,
    source: 'client_brand_kits',
    colors: colors.slice(0, 24),
    typographies: typographies.slice(0, 12),
    figma_urls: figmaUrls.slice(0, 4),
    style_visuel: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                     */
/* ------------------------------------------------------------------ */

function ColorSwatch({ color }: { color: BrandColor }) {
  return (
    <div className="text-center">
      <div
        className="w-14 h-14 rounded-lg border border-border shadow-sm"
        style={{ backgroundColor: color.hex }}
        title={`${color.name}${color.usage ? ' — ' + color.usage : ''}`}
      />
      <p className="text-[10px] font-medium mt-1 text-foreground truncate max-w-[64px]">
        {color.name}
      </p>
      <p className="text-[9px] text-muted-foreground truncate max-w-[64px]">{color.hex}</p>
    </div>
  );
}

function TypographyRow({ typo }: { typo: BrandTypography }) {
  const family = typo.family ?? typo.name;
  return (
    <div className="border-l-2 border-primary/30 pl-3 py-1">
      <p className="text-sm text-foreground" style={{ fontFamily: family }}>
        {typo.name}
      </p>
      {typo.description && (
        <p className="text-[11px] text-muted-foreground">{typo.description}</p>
      )}
    </div>
  );
}

function CharteCard({ charte, onRefresh, refreshing, fallbackFileKey }: {
  charte: BrandCharte;
  onRefresh?: () => void;
  refreshing?: boolean;
  fallbackFileKey?: string | null;
}) {
  const figmaLinks: BrandFigmaUrl[] = useMemo(() => {
    if (charte.figma_urls.length > 0) return charte.figma_urls;
    if (fallbackFileKey) {
      return [
        {
          name: `Ouvrir dans Figma`,
          url: `https://www.figma.com/design/${fallbackFileKey}`,
        },
      ];
    }
    return [];
  }, [charte.figma_urls, fallbackFileKey]);
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Charte graphique (Figma)</h2>
        <Badge variant="outline" className="ml-2 text-[10px]">
          {charte.client_id}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {charte.source === 'client_brand_kits' ? 'live' : 'snapshot'}
        </Badge>
        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Sync Figma'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Colors */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Couleurs
            <Badge variant="outline" className="text-[10px]">
              {charte.colors.length}
            </Badge>
          </h3>
          {charte.colors.length === 0 ? (
            <p className="text-sm text-muted-foreground">NA</p>
          ) : (
            <div className="flex items-start gap-3 flex-wrap">
              {charte.colors.map((c) => (
                <ColorSwatch key={`${c.hex}-${c.name}`} color={c} />
              ))}
            </div>
          )}
        </div>

        {/* Typography */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" /> Typographie
            <Badge variant="outline" className="text-[10px]">
              {charte.typographies.length}
            </Badge>
          </h3>
          {charte.typographies.length === 0 ? (
            <p className="text-sm text-muted-foreground">NA</p>
          ) : (
            <div className="space-y-2">
              {charte.typographies.map((typo, idx) => (
                <TypographyRow key={`${typo.name}-${idx}`} typo={typo} />
              ))}
            </div>
          )}
        </div>

        {/* Style visuel */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Style visuel
          </h3>
          {!charte.style_visuel || Object.keys(charte.style_visuel).length === 0 ? (
            <p className="text-sm text-muted-foreground">NA</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(charte.style_visuel).map(([key, value]) => (
                <div key={key}>
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>{' '}
                  <span className="text-xs text-foreground">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Figma URLs */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> Fichiers Figma
          </h3>
          {figmaLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">NA</p>
          ) : (
            <div className="space-y-2">
              {figmaLinks.map((link, idx) => (
                <a
                  key={`${link.url}-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{link.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AllClientsOverview({ chartes }: { chartes: BrandCharte[] }) {
  if (chartes.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Chartes graphiques (Figma)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Aucune charte graphique disponible. Lancez{' '}
          <code className="text-xs">npm run brand:export</code> pour générer les
          snapshots depuis Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Chartes graphiques (Figma)</h2>
        <Badge variant="secondary">{chartes.length} clients</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartes.map((charte) => (
          <div
            key={charte.client_id}
            className="rounded-lg border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground truncate">
                {charte.client_id}
              </p>
              <Badge variant="outline" className="text-[10px]">
                {charte.colors.length} couleurs
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              {charte.colors.slice(0, 6).map((c) => (
                <div
                  key={`${charte.client_id}-${c.hex}`}
                  className="w-6 h-6 rounded-md border border-border shadow-sm"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name} (${c.hex})`}
                />
              ))}
              {charte.colors.length > 6 && (
                <span className="text-[10px] text-muted-foreground ml-1">
                  +{charte.colors.length - 6}
                </span>
              )}
            </div>
            {charte.typographies.length > 0 && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <Type className="w-3 h-3 shrink-0" />
                {charte.typographies[0].name}
                {charte.typographies.length > 1 && ` +${charte.typographies.length - 1}`}
              </p>
            )}
            {charte.figma_urls.length > 0 && (
              <a
                href={charte.figma_urls[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{charte.figma_urls[0].name}</span>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

type BrandCharteSectionProps = {
  clientId: string | null;
  isAllClientsSelected: boolean;
  isAdmin?: boolean;
};

export function BrandCharteSection({
  clientId,
  isAllClientsSelected,
  isAdmin = false,
}: BrandCharteSectionProps) {
  const [liveCharte, setLiveCharte] = useState<BrandCharte | null>(null);
  const [mappingFileKey, setMappingFileKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* Fetch live charte from client_brand_kits + Figma file_key from mappings */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!clientId || isAllClientsSelected) {
        if (mounted) {
          setLiveCharte(null);
          setMappingFileKey(null);
        }
        return;
      }

      const [kitRes, mapRes] = await Promise.all([
        (supabase as unknown as { from: (table: string) => Record<string, unknown> })
          .from('client_brand_kits')
          .select('client_id,figma_file_key,token_type,token_name,token_value,preview_url,payload')
          .eq('client_id', clientId)
          .limit(400),
        (supabase as unknown as { from: (table: string) => Record<string, unknown> })
          .from('client_data_mappings')
          .select('external_account_id,status')
          .eq('client_id', clientId)
          .eq('provider', 'figma')
          .eq('status', 'connected')
          .maybeSingle(),
      ]);

      if (!mounted) return;

      if (kitRes.error) {
        console.warn('client_brand_kits fetch error:', kitRes.error);
        setLiveCharte(null);
      } else {
        setLiveCharte(kitRowsToCharte(clientId, (kitRes.data ?? []) as BrandKitRow[]));
      }

      const key =
        mapRes.data && typeof mapRes.data === 'object' && 'external_account_id' in mapRes.data
          ? ((mapRes.data as { external_account_id: string | null }).external_account_id ?? null)
          : null;
      setMappingFileKey(key && key.trim().length > 0 ? key.trim() : null);
    })();
    return () => {
      mounted = false;
    };
  }, [clientId, isAllClientsSelected]);

  const staticCharte = useMemo(() => getBrandCharte(clientId), [clientId]);

  const effectiveCharte: BrandCharte | null = useMemo(() => {
    if (!clientId || isAllClientsSelected) return null;
    if (liveCharte && staticCharte) {
      // Merge: prefer live colors/typos, keep static figma_urls + style_visuel
      return {
        ...staticCharte,
        source: 'client_brand_kits+snapshot',
        colors: liveCharte.colors.length ? liveCharte.colors : staticCharte.colors,
        typographies: liveCharte.typographies.length
          ? liveCharte.typographies
          : staticCharte.typographies,
        figma_urls:
          staticCharte.figma_urls.length > 0 ? staticCharte.figma_urls : liveCharte.figma_urls,
      };
    }
    return liveCharte ?? staticCharte ?? null;
  }, [clientId, isAllClientsSelected, liveCharte, staticCharte]);

  const allChartes = useMemo(() => Object.values(brandChartes).sort((a, b) =>
    a.client_id.localeCompare(b.client_id),
  ), []);

  const handleRefresh = async () => {
    if (!clientId) return;
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('figma-brand-kit-import', {
        body: { clientId },
      });
      if (error) throw error;
      toast.success('Charte graphique synchronisée depuis Figma');

      const { data } = await (
        supabase as unknown as { from: (table: string) => Record<string, unknown> }
      )
        .from('client_brand_kits')
        .select('client_id,figma_file_key,token_type,token_name,token_value,preview_url,payload')
        .eq('client_id', clientId)
        .limit(400);
      setLiveCharte(kitRowsToCharte(clientId, (data ?? []) as BrandKitRow[]));
    } catch (err) {
      console.error('figma-brand-kit-import failed:', err);
      toast.error('Échec de la synchronisation Figma');
    } finally {
      setRefreshing(false);
    }
  };

  if (isAllClientsSelected) {
    return <AllClientsOverview chartes={allChartes} />;
  }

  if (!clientId) {
    return null;
  }

  if (!effectiveCharte) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Charte graphique (Figma)</h2>
          <Badge variant="outline" className="ml-2 text-[10px]">
            {clientId}
          </Badge>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto gap-1.5"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing...' : 'Sync Figma'}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileImage className="w-4 h-4" />
          Aucune charte graphique disponible pour ce client.
          {isAdmin && ' Cliquez sur "Sync Figma" pour importer depuis Figma.'}
        </div>
        {mappingFileKey && (
          <a
            href={`https://www.figma.com/design/${mappingFileKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ouvrir le fichier Figma ({mappingFileKey.slice(0, 12)}…)
          </a>
        )}
      </div>
    );
  }

  return (
    <CharteCard
      charte={effectiveCharte}
      onRefresh={isAdmin ? handleRefresh : undefined}
      refreshing={refreshing}
      fallbackFileKey={mappingFileKey}
    />
  );
}

export default BrandCharteSection;
