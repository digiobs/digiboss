import { useState } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Convergence } from '@/hooks/useCreativeProposals';

interface ConvergencesPanelProps {
  convergences: Convergence[];
}

/**
 * Compact panel showing creative-proposal convergences for the current
 * client. Convergences are created when multiple skills propose similar
 * ideas — they surface the "most agreed upon" recommendations across
 * the brief, SEO, social, data, etc. Displayed at the top of /actions
 * so the user can act on them before scanning the monthly packages.
 */
export function ConvergencesPanel({ convergences }: ConvergencesPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (convergences.length === 0) return null;

  return (
    <Card className="border-indigo-200 dark:border-indigo-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="w-4 h-4 text-indigo-500" />
            Convergences
            <Badge variant="secondary" className="text-xs">
              {convergences.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="h-7 gap-1 text-xs"
          >
            {expanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Masquer
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                Afficher
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Idées sur lesquelles plusieurs skills convergent — à traiter en priorité.
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {convergences.map((conv) => (
              <div
                key={conv.id}
                className="rounded-lg border border-indigo-200/70 dark:border-indigo-800/70 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <Layers className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <h4 className="text-sm font-medium leading-snug">
                    {conv.combined_title}
                  </h4>
                </div>

                {conv.combined_description && (
                  <p className="text-xs text-muted-foreground">
                    {conv.combined_description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    Confiance {Math.round((conv.confidence ?? 0) * 100)}%
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    ×{conv.urgency_multiplier ?? 1}
                  </Badge>
                  {(conv.source_skills ?? []).map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {String(skill)}
                    </Badge>
                  ))}
                </div>

                {conv.combined_action && (
                  <div className="rounded bg-indigo-100/60 dark:bg-indigo-900/30 p-2">
                    <p className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300 mb-0.5">
                      Action recommandée
                    </p>
                    <p className="text-xs">{conv.combined_action}</p>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  {(conv.cluster_members ?? []).length} propositions regroupées
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
