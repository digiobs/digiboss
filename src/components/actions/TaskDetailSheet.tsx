import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ExternalLink,
  FileText,
  Link2,
  Tag,
  Hash,
  Clock,
  User,
  Calendar,
  Search,
  Palette,
  Share2,
  Target,
  MoreHorizontal,
  Pencil,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getWorkflow, getTaskTypeLabel, EDITORIAL_WORKFLOW } from '@/types/taskWorkflows';
import { getTaskNatureLabel, getIdeaSourceLabel } from '@/types/tasks';
import type { PlanTaskContentRow } from '@/hooks/useContentTasks';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TASK_TYPE_ICONS: Record<string, LucideIcon> = {
  seo: Search,
  contenu: FileText,
  design: Palette,
  social_media: Share2,
  strategie: Target,
  autre: MoreHorizontal,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  normal: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

function FinanceRow({
  label,
  value,
  negative,
  highlight,
}: {
  label: string;
  value: number;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex justify-between text-sm',
        highlight && 'font-semibold border-t border-border/50 pt-2',
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(negative ? 'text-destructive' : 'text-foreground')}>
        {negative ? '-' : ''}
        {Math.abs(value).toLocaleString('fr-FR')} €
      </span>
    </div>
  );
}

function StatusStepper({ task }: { task: PlanTaskContentRow }) {
  const workflow = getWorkflow(task.task_type);
  return (
    <div className="flex gap-1.5 flex-wrap">
      {workflow.statuses.map((s) => {
        const isCurrent = task.status === s;
        const isDone = workflow.doneStatuses.includes(task.status)
          ? true
          : workflow.statuses.indexOf(s) < workflow.statuses.indexOf(task.status);
        return (
          <Badge
            key={s}
            variant={isCurrent ? 'default' : 'outline'}
            className={cn(
              'text-xs',
              isCurrent && workflow.colors[s],
              isDone && !isCurrent && 'opacity-60',
            )}
          >
            {workflow.labels[s] ?? s}
          </Badge>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface TaskDetailSheetProps {
  task: PlanTaskContentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onEdit?: (task: PlanTaskContentRow) => void;
  onStatusChange?: (id: string, status: string) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  isAdmin,
  onEdit,
  onStatusChange,
}: TaskDetailSheetProps) {
  if (!task) return null;

  const Icon = TASK_TYPE_ICONS[task.task_type ?? ''] ?? FileText;
  const natureLabel = getTaskNatureLabel(task.task_nature);
  const sourceLabel = getIdeaSourceLabel(task.idea_source);
  const workflow = getWorkflow(task.task_type);

  const links = task.resource_links ?? [];
  const hasFinancials =
    task.budget_tache != null ||
    task.tarif_catalogue != null ||
    task.forfait_mensuel != null ||
    task.sous_traitance != null ||
    task.marge != null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-primary mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-left text-lg leading-tight">
                {task.title}
              </SheetTitle>
              {task.wrike_custom_status && (
                <Badge variant="secondary" className="mt-1.5 text-xs">
                  {task.wrike_custom_status}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Status stepper */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Statut</p>
            {onStatusChange ? (
              <div className="flex gap-1.5 flex-wrap">
                {workflow.statuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={task.status === s ? 'default' : 'outline'}
                    className={cn('text-xs h-7', task.status === s && workflow.colors[s])}
                    onClick={() => onStatusChange(task.id, s)}
                  >
                    {workflow.labels[s] ?? s}
                  </Button>
                ))}
              </div>
            ) : (
              <StatusStepper task={task} />
            )}
          </div>

          {/* Type & Nature */}
          <div className="grid grid-cols-2 gap-4">
            <DetailRow
              label="Type"
              value={
                <Badge variant="secondary" className="text-xs">
                  {getTaskTypeLabel(task.task_type)}
                </Badge>
              }
            />
            {natureLabel && (
              <DetailRow label="Nature" value={natureLabel} />
            )}
          </div>

          {/* Priority */}
          <DetailRow
            label="Priorite"
            value={
              <Badge
                variant="outline"
                className={cn(
                  'text-xs border-0',
                  PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal,
                )}
              >
                {task.priority}
              </Badge>
            }
          />

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                {task.description}
              </p>
            </div>
          )}

          {/* Canal / Format / Thematique */}
          {(task.canal || task.format || task.thematique) && (
            <div className="grid grid-cols-2 gap-4">
              {task.canal && (
                <DetailRow
                  icon={<Tag className="w-4 h-4" />}
                  label="Canal"
                  value={task.canal}
                />
              )}
              {task.format && (
                <DetailRow
                  icon={<FileText className="w-4 h-4" />}
                  label="Format"
                  value={task.format}
                />
              )}
              {task.thematique && (
                <DetailRow
                  icon={<Hash className="w-4 h-4" />}
                  label="Thematique"
                  value={task.thematique}
                />
              )}
            </div>
          )}

          {/* Assignee */}
          {task.assignee && (
            <DetailRow
              icon={<User className="w-4 h-4" />}
              label="Responsable"
              value={task.assignee}
            />
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {task.start_date && (
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Date de debut"
                value={format(new Date(task.start_date), 'd MMMM yyyy', {
                  locale: fr,
                })}
              />
            )}
            {task.due_date && (
              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Echeance"
                value={format(new Date(task.due_date), 'd MMMM yyyy', {
                  locale: fr,
                })}
              />
            )}
          </div>

          {/* Idea source */}
          {sourceLabel && (
            <DetailRow
              icon={<Lightbulb className="w-4 h-4" />}
              label="Source de l'idee"
              value={
                <span>
                  {sourceLabel}
                  {task.idea_source_detail && (
                    <span className="text-muted-foreground">
                      {' '}
                      · {task.idea_source_detail}
                    </span>
                  )}
                </span>
              }
            />
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Tags</p>
              <div className="flex gap-1.5 flex-wrap">
                {task.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {String(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resource links */}
          {links.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Liens</p>
              <div className="space-y-1.5">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    {link.label || link.type}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Wrike link */}
          {task.wrike_permalink && (
            <a
              href={task.wrike_permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir dans Wrike
            </a>
          )}

          {/* SEO fields */}
          {(task.mot_cle_cible || task.nombre_mots != null) && (
            <div>
              <p className="text-xs font-medium text-primary mb-2 uppercase tracking-wider">
                SEO
              </p>
              <div className="grid grid-cols-2 gap-4">
                {task.mot_cle_cible && (
                  <DetailRow label="Mot-cle cible" value={task.mot_cle_cible} />
                )}
                {task.nombre_mots != null && (
                  <DetailRow
                    label="Nombre de mots"
                    value={task.nombre_mots.toLocaleString('fr-FR')}
                  />
                )}
              </div>
            </div>
          )}

          {/* Effort */}
          {task.effort_reserve != null && (
            <DetailRow
              label="Effort reserve"
              value={`${task.effort_reserve}h`}
            />
          )}

          {/* Admin: financial block */}
          {isAdmin && hasFinancials && (
            <div>
              <div className="border-t border-border pt-4 mt-2">
                <p className="text-xs font-medium text-primary mb-3 uppercase tracking-wider">
                  Donnees financieres
                </p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                {task.tarif_catalogue != null && (
                  <FinanceRow label="Tarif catalogue" value={task.tarif_catalogue} />
                )}
                {task.forfait_mensuel != null && (
                  <FinanceRow label="Forfait mensuel" value={task.forfait_mensuel} />
                )}
                {task.budget_tache != null && (
                  <FinanceRow label="Budget tache" value={task.budget_tache} />
                )}
                {task.sous_traitance != null && (
                  <FinanceRow
                    label="Sous-traitance"
                    value={task.sous_traitance}
                    negative
                  />
                )}
                {task.marge != null && (
                  <FinanceRow label="Marge" value={task.marge} highlight />
                )}
              </div>
            </div>
          )}

          {/* Edit button */}
          {onEdit && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => onEdit(task)}
              >
                <Pencil className="w-4 h-4" />
                Modifier la tache
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
