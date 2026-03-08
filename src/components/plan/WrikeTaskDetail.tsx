import { WrikeTask, getSectorColor } from '@/types/wrike';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ExternalLink, FileText, Link2, Tag, Hash, Clock, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WrikeTaskDetailProps {
  task: WrikeTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
}

export function WrikeTaskDetail({ task, open, onOpenChange, isAdmin }: WrikeTaskDetailProps) {
  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left text-lg">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Status */}
          <DetailRow label="Statut" value={
            <Badge variant="secondary">{task.status}</Badge>
          } />

          {/* Client */}
          {task.clientName && (
            <DetailRow label="Client" value={
              <Badge className={cn(getSectorColor(task.clientSector))}>{task.clientName}</Badge>
            } />
          )}

          {/* Canal */}
          {task.canal && <DetailRow icon={<Tag className="w-4 h-4" />} label="Canal" value={task.canal} />}

          {/* Format */}
          {task.format && <DetailRow icon={<FileText className="w-4 h-4" />} label="Format" value={task.format} />}

          {/* Thématique */}
          {task.thematique && <DetailRow icon={<Hash className="w-4 h-4" />} label="Thématique" value={task.thematique} />}

          {/* Due date */}
          {task.dates?.due && (
            <DetailRow icon={<Clock className="w-4 h-4" />} label="Date de publication" value={
              new Date(task.dates.due).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            } />
          )}

          {/* Lien contenu en prod */}
          {task.lienContenuProd && (
            <DetailRow icon={<ExternalLink className="w-4 h-4" />} label="Lien contenu" value={
              <a href={task.lienContenuProd} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm break-all">
                {task.lienContenuProd}
              </a>
            } />
          )}

          {/* Admin-only fields */}
          {isAdmin && (
            <>
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs font-medium text-primary mb-3 uppercase tracking-wider">Données internes</p>
              </div>

              {task.lienFigma && (
                <DetailRow icon={<Link2 className="w-4 h-4" />} label="Lien Figma" value={
                  <a href={task.lienFigma} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm break-all">
                    Ouvrir dans Figma
                  </a>
                } />
              )}

              {task.lienContenuRedac && (
                <DetailRow icon={<Link2 className="w-4 h-4" />} label="Lien rédac" value={
                  <a href={task.lienContenuRedac} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm break-all">
                    Ouvrir le document
                  </a>
                } />
              )}

              {task.motCleCible && <DetailRow label="Mot clé cible" value={task.motCleCible} />}
              {task.nombreMots && <DetailRow label="Nombre de mots" value={task.nombreMots} />}
              {task.effortReserve != null && <DetailRow label="Effort réservé" value={`${task.effortReserve}h`} />}

              {/* Financial */}
              {(task.budgetTache != null || task.forfaitMensuel != null) && (
                <div className="bg-primary/5 rounded-lg p-3 space-y-2 mt-2">
                  {task.tarifCatalogue != null && (
                    <FinanceRow label="Tarif catalogue" value={task.tarifCatalogue} />
                  )}
                  {task.budgetTache != null && (
                    <FinanceRow label="Budget tâche" value={task.budgetTache} />
                  )}
                  {task.sousTraitance != null && (
                    <FinanceRow label="Sous-traitance" value={task.sousTraitance} negative />
                  )}
                  {task.marge != null && (
                    <FinanceRow label="Marge" value={task.marge} highlight />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{typeof value === 'string' ? value : value}</div>
      </div>
    </div>
  );
}

function FinanceRow({ label, value, negative, highlight }: { label: string; value: number; negative?: boolean; highlight?: boolean }) {
  return (
    <div className={cn('flex justify-between text-sm', highlight && 'font-semibold border-t border-border/50 pt-2')}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        negative ? 'text-destructive' : highlight ? 'text-foreground' : 'text-foreground'
      )}>
        {negative ? '-' : ''}{Math.abs(value).toLocaleString('fr-FR')} €
      </span>
    </div>
  );
}
