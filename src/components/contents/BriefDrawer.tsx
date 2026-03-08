import { Copy, ExternalLink, PenLine } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChannelBadge } from './ChannelBadge';
import { toast } from 'sonner';
import type { ContentRecommendation } from '@/hooks/useContentRecommendations';

interface Props {
  recommendation: ContentRecommendation | null;
  open: boolean;
  onClose: () => void;
}

export function BriefDrawer({ recommendation: rec, open, onClose }: Props) {
  if (!rec) return null;

  const brief = rec.brief;

  const handleCopyBrief = () => {
    const lines = [
      `Canal : ${rec.channel}`,
      `Titre : ${rec.title}`,
      brief?.angle ? `\nAngle : ${brief.angle}` : '',
      brief?.key_points?.length ? `\nPoints clés :\n${brief.key_points.map(p => `- ${p}`).join('\n')}` : '',
      brief?.tone ? `\nTon recommandé : ${brief.tone}` : '',
      brief?.suggested_length ? `\nLongueur suggérée : ${brief.suggested_length}` : '',
      brief?.suggested_cta ? `\nCTA suggéré : ${brief.suggested_cta}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    toast.success('Brief copié dans le presse-papier');
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <ChannelBadge channel={rec.channel} />
            {rec.clients && (
              <Badge variant="secondary">{rec.clients.name}</Badge>
            )}
          </div>
          <SheetTitle className="text-lg">{rec.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 text-sm">
          {/* Angle */}
          {brief?.angle && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Angle / Hook</h4>
              <p className="text-muted-foreground">{brief.angle}</p>
            </div>
          )}

          <Separator />

          {/* Key points */}
          {brief?.key_points?.length ? (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Points clés à couvrir</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {brief.key_points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          ) : null}

          {/* Tone */}
          {brief?.tone && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Ton recommandé</h4>
              <p className="text-muted-foreground">{brief.tone}</p>
            </div>
          )}

          {/* Length */}
          {brief?.suggested_length && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Longueur suggérée</h4>
              <p className="text-muted-foreground">{brief.suggested_length}</p>
            </div>
          )}

          {/* CTA */}
          {brief?.suggested_cta && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">CTA suggéré</h4>
              <p className="text-muted-foreground">{brief.suggested_cta}</p>
            </div>
          )}

          <Separator />

          {/* References */}
          {brief?.references?.length ? (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Références</h4>
              <ul className="space-y-1">
                {brief.references.map((ref, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <span>{ref.title}</span>
                    {ref.impressions && <Badge variant="secondary" className="text-[10px]">{ref.impressions.toLocaleString('fr-FR')} imp.</Badge>}
                    {ref.url && (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-6">
          <Button variant="outline" size="sm" onClick={handleCopyBrief}>
            <Copy className="w-4 h-4 mr-1" /> Copier le brief
          </Button>
          <Button variant="secondary" size="sm" disabled>
            <PenLine className="w-4 h-4 mr-1" /> Ouvrir dans l'éditeur
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
