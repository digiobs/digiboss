import { ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWorkflow, type TaskWorkflow } from '@/types/taskWorkflows';

interface ActionStatusControlProps {
  taskType: string | null | undefined;
  status: string;
  /** When true, disables all controls — used for editorial rows surfaced read-only. */
  readOnly?: boolean;
  /** Mutation is optimistic; caller handles the actual update. */
  onChange?: (next: string) => void;
  /** If set, renders a small "Modifier" link next to the read-only control. */
  editHref?: string;
  /** Force a specific workflow — overrides the one derived from `taskType`. */
  workflow?: TaskWorkflow;
  disabled?: boolean;
}

export function ActionStatusControl({
  taskType,
  status,
  readOnly,
  onChange,
  editHref,
  workflow: overrideWorkflow,
  disabled,
}: ActionStatusControlProps) {
  const workflow = overrideWorkflow ?? getWorkflow(taskType);
  const isDone = workflow.doneStatuses.includes(status);

  if (workflow.kind === 'binary') {
    const next = isDone ? workflow.defaultStatus : 'done';
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isDone}
          disabled={readOnly || disabled}
          onCheckedChange={() => {
            if (!readOnly && !disabled) onChange?.(next);
          }}
          aria-label={isDone ? workflow.labels.done : workflow.labels.backlog}
        />
        <span
          className={cn(
            'text-xs font-medium',
            isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {isDone ? workflow.labels.done ?? 'Fait' : workflow.labels.backlog ?? 'À faire'}
        </span>
      </div>
    );
  }

  // Stepper — horizontal button group
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {workflow.statuses.map((s) => {
        const isActive = s === status;
        return (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={isActive ? 'default' : 'ghost'}
            className={cn(
              'h-7 px-2 text-[11px] font-medium',
              isActive && workflow.colors[s],
            )}
            disabled={readOnly || disabled}
            onClick={() => {
              if (!readOnly && !disabled && !isActive) onChange?.(s);
            }}
          >
            {workflow.labels[s] ?? s}
          </Button>
        );
      })}
      {readOnly && editHref && (
        <a
          href={editHref}
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline ml-1"
          title="Modifier dans le calendrier éditorial"
        >
          <ExternalLink className="w-3 h-3" />
          Modifier
        </a>
      )}
    </div>
  );
}
