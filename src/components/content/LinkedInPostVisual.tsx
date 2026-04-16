import { useMemo, useState } from 'react';
import { Linkedin, LayoutTemplate, Palette, Type, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBrandCharte } from '@/hooks/useBrandCharte';
import type { BrandColor } from '@/assets/brand';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type LinkedInPostContent = {
  hook: string;
  body: string;
  cta: string;
  hashtags: string;
};

type LayoutId = 'statement' | 'card' | 'gradient' | 'tips';

type LayoutDef = {
  id: LayoutId;
  label: string;
  description: string;
};

const LAYOUTS: LayoutDef[] = [
  { id: 'statement', label: 'Statement', description: 'Texte bold sur fond couleur' },
  { id: 'card', label: 'Carte', description: 'Fond clair avec accent couleur' },
  { id: 'gradient', label: 'Dégradé', description: 'Dégradé moderne avec texte' },
  { id: 'tips', label: 'Tips', description: 'Liste de points clés' },
];

/* ------------------------------------------------------------------ */
/*  Color helpers                                                     */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function textColorFor(bgHex: string): string {
  return luminance(bgHex) > 0.55 ? '#1A1A1A' : '#FFFFFF';
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  const nr = Math.round(r * f).toString(16).padStart(2, '0');
  const ng = Math.round(g * f).toString(16).padStart(2, '0');
  const nb = Math.round(b * f).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.round(r + (255 - r) * amount).toString(16).padStart(2, '0');
  const ng = Math.round(g + (255 - g) * amount).toString(16).padStart(2, '0');
  const nb = Math.round(b + (255 - b) * amount).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

/* ------------------------------------------------------------------ */
/*  Parse body into bullet points                                     */
/* ------------------------------------------------------------------ */

function parseBodyPoints(body: string): string[] {
  if (!body.trim()) return [];
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) return lines.slice(0, 6);
  const sentences = body.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
  if (sentences.length >= 2) return sentences.slice(0, 6);
  return [body];
}

/* ------------------------------------------------------------------ */
/*  Default colors when no brand charter                              */
/* ------------------------------------------------------------------ */

const DEFAULT_PRIMARY = '#0A66C2'; // LinkedIn blue
const DEFAULT_SECONDARY = '#004182';

function pickColors(colors: BrandColor[]): { primary: string; secondary: string; accent: string } {
  if (colors.length === 0) {
    return { primary: DEFAULT_PRIMARY, secondary: DEFAULT_SECONDARY, accent: '#E7A33E' };
  }
  const primary = colors[0].hex;
  const secondary = colors.length > 1 ? colors[1].hex : darken(primary, 0.3);
  const accent = colors.length > 2 ? colors[2].hex : lighten(primary, 0.4);
  return { primary, secondary, accent };
}

/* ------------------------------------------------------------------ */
/*  Layout renderers                                                  */
/* ------------------------------------------------------------------ */

function StatementLayout({
  content,
  primary,
  secondary,
  fontFamily,
  logoUrl,
  clientName,
}: LayoutProps) {
  const textColor = textColorFor(primary);
  const subtextColor = luminance(primary) > 0.55 ? '#444444' : 'rgba(255,255,255,0.8)';

  return (
    <div
      className="w-full aspect-square rounded-lg overflow-hidden flex flex-col justify-between p-8 relative"
      style={{ backgroundColor: primary, fontFamily }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
        ) : (
          <div className="h-8 w-8 rounded bg-white/20" />
        )}
        <Linkedin className="w-5 h-5" style={{ color: textColor, opacity: 0.5 }} />
      </div>

      {/* Main text */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        <p
          className="text-xl font-bold leading-tight"
          style={{ color: textColor }}
        >
          {content.hook || 'Votre accroche ici...'}
        </p>
        {content.body && (
          <p
            className="text-sm leading-relaxed line-clamp-4"
            style={{ color: subtextColor }}
          >
            {content.body}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between">
        {content.cta && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: secondary, color: textColorFor(secondary) }}
          >
            {content.cta}
          </span>
        )}
        {content.hashtags && (
          <p className="text-[10px] opacity-60" style={{ color: textColor }}>
            {content.hashtags}
          </p>
        )}
      </div>

      {clientName && (
        <p className="absolute bottom-2 right-3 text-[9px] opacity-30" style={{ color: textColor }}>
          {clientName}
        </p>
      )}
    </div>
  );
}

function CardLayout({
  content,
  primary,
  accent,
  fontFamily,
  logoUrl,
  clientName,
}: LayoutProps) {
  return (
    <div
      className="w-full aspect-square rounded-lg overflow-hidden flex flex-col bg-white relative"
      style={{ fontFamily }}
    >
      {/* Color bar */}
      <div className="h-2 w-full" style={{ backgroundColor: primary }} />

      <div className="flex-1 flex flex-col justify-between p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
          ) : clientName ? (
            <span className="text-sm font-bold" style={{ color: primary }}>{clientName}</span>
          ) : (
            <div className="h-7 w-7 rounded" style={{ backgroundColor: accent }} />
          )}
          <Linkedin className="w-5 h-5 text-[#0A66C2]" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          <div className="w-12 h-1 rounded-full" style={{ backgroundColor: primary }} />
          <p
            className="text-lg font-bold leading-tight text-gray-900"
          >
            {content.hook || 'Votre accroche ici...'}
          </p>
          {content.body && (
            <p className="text-sm leading-relaxed text-gray-600 line-clamp-4">
              {content.body}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-100">
          {content.cta && (
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
              style={{ backgroundColor: primary }}
            >
              {content.cta}
            </span>
          )}
          {content.hashtags && (
            <p className="text-[10px] text-gray-400">
              {content.hashtags}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GradientLayout({
  content,
  primary,
  secondary,
  fontFamily,
  logoUrl,
}: LayoutProps) {
  const textColor = textColorFor(primary);
  const subtextColor = luminance(primary) > 0.55 ? '#333333' : 'rgba(255,255,255,0.85)';

  return (
    <div
      className="w-full aspect-square rounded-lg overflow-hidden flex flex-col justify-between p-8 relative"
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        fontFamily,
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10"
        style={{ backgroundColor: textColor }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
        style={{ backgroundColor: textColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
        ) : (
          <div className="h-8 w-8 rounded bg-white/20" />
        )}
        <Linkedin className="w-5 h-5" style={{ color: textColor, opacity: 0.5 }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center gap-4 relative z-10">
        <p className="text-xl font-bold leading-tight" style={{ color: textColor }}>
          {content.hook || 'Votre accroche ici...'}
        </p>
        {content.body && (
          <p className="text-sm leading-relaxed line-clamp-3" style={{ color: subtextColor }}>
            {content.body}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between relative z-10">
        {content.cta && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: textColor,
              border: `1px solid rgba(255,255,255,0.3)`,
            }}
          >
            {content.cta}
          </span>
        )}
        {content.hashtags && (
          <p className="text-[10px] opacity-60" style={{ color: textColor }}>
            {content.hashtags}
          </p>
        )}
      </div>
    </div>
  );
}

function TipsLayout({
  content,
  primary,
  accent,
  fontFamily,
  logoUrl,
  clientName,
}: LayoutProps) {
  const points = parseBodyPoints(content.body);

  return (
    <div
      className="w-full aspect-square rounded-lg overflow-hidden flex flex-col bg-white relative"
      style={{ fontFamily }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: primary }}
      >
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
          ) : clientName ? (
            <span className="text-sm font-bold" style={{ color: textColorFor(primary) }}>
              {clientName}
            </span>
          ) : null}
        </div>
        <Linkedin className="w-4 h-4" style={{ color: textColorFor(primary), opacity: 0.6 }} />
      </div>

      <div className="flex-1 flex flex-col justify-between p-6">
        {/* Hook */}
        <p className="text-base font-bold leading-tight text-gray-900 mb-4">
          {content.hook || 'Votre accroche ici...'}
        </p>

        {/* Points */}
        <div className="flex-1 space-y-2.5">
          {points.length > 1 ? (
            points.map((point, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ backgroundColor: accent || lighten(primary, 0.85), color: primary }}
                >
                  {i + 1}
                </span>
                <p className="text-xs text-gray-700 leading-relaxed pt-0.5">
                  {point.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">
              {content.body || 'Détaillez vos points ici...'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between pt-3 border-t border-gray-100 mt-3">
          {content.cta && (
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
              style={{ backgroundColor: primary }}
            >
              {content.cta}
            </span>
          )}
          {content.hashtags && (
            <p className="text-[10px] text-gray-400">
              {content.hashtags}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout props type                                                 */
/* ------------------------------------------------------------------ */

type LayoutProps = {
  content: LinkedInPostContent;
  primary: string;
  secondary: string;
  accent: string;
  fontFamily: string;
  logoUrl: string | null;
  clientName: string | null;
};

const LAYOUT_RENDERERS: Record<LayoutId, React.FC<LayoutProps>> = {
  statement: StatementLayout,
  card: CardLayout,
  gradient: GradientLayout,
  tips: TipsLayout,
};

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

type LinkedInPostVisualProps = {
  content: LinkedInPostContent;
  clientId: string | null | undefined;
  clientName?: string | null;
};

export function LinkedInPostVisual({ content, clientId, clientName }: LinkedInPostVisualProps) {
  const { charte, logoUrl, loading } = useBrandCharte(clientId);
  const [activeLayout, setActiveLayout] = useState<LayoutId>('statement');

  const { primary, secondary, accent } = useMemo(
    () => pickColors(charte?.colors ?? []),
    [charte?.colors],
  );

  const fontFamily = useMemo(() => {
    if (!charte?.typographies?.length) return 'system-ui, sans-serif';
    const first = charte.typographies[0];
    return first.family || first.name || 'system-ui, sans-serif';
  }, [charte?.typographies]);

  const LayoutComponent = LAYOUT_RENDERERS[activeLayout];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Chargement de la charte...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <LayoutTemplate className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Aperçu visuel</h3>
        {charte && (
          <Badge variant="secondary" className="text-[10px]">
            {charte.colors.length} couleurs
          </Badge>
        )}
      </div>

      {/* Layout selector */}
      <div className="flex gap-1.5 flex-wrap">
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            onClick={() => setActiveLayout(layout.id)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border transition-colors',
              activeLayout === layout.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40',
            )}
            title={layout.description}
          >
            {layout.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-muted/30 p-3">
        <LayoutComponent
          content={content}
          primary={primary}
          secondary={secondary}
          accent={accent}
          fontFamily={fontFamily}
          logoUrl={logoUrl}
          clientName={clientName ?? null}
        />
      </div>

      {/* Brand info */}
      {charte && charte.colors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium">Palette du client</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {charte.colors.slice(0, 8).map((c) => (
              <div
                key={c.hex}
                className="w-6 h-6 rounded border border-border shadow-sm cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: c.hex }}
                title={`${c.name} (${c.hex})`}
              />
            ))}
          </div>
          {charte.typographies.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Type className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                {charte.typographies.map((t) => t.family || t.name).slice(0, 2).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {!charte && !loading && (
        <p className="text-[11px] text-muted-foreground">
          Aucune charte graphique trouvée. Les couleurs LinkedIn par défaut sont utilisées.
          Synchronisez Figma pour personnaliser.
        </p>
      )}
    </div>
  );
}
