/**
 * Workflow definitions for client actions on the /actions page.
 *
 * Each `plan_tasks.task_type` maps to a workflow (`binary` or `stepper`) that
 * drives how `ActionStatusControl` renders — a single checkbox for binary
 * actions (SEO tweak, ad change, design nudge) or a horizontal button group
 * for multi-step actions (content production).
 */

export type WorkflowKind = 'binary' | 'stepper';

export interface TaskWorkflow {
  kind: WorkflowKind;
  /** Ordered list of statuses — drives stepper order. */
  statuses: readonly string[];
  /** FR label per status (shown in UI). */
  labels: Record<string, string>;
  /** Tailwind class per status (badge background + text). */
  colors: Record<string, string>;
  defaultStatus: string;
  /** Statuses considered "done" for the checkbox/progress indicator. */
  doneStatuses: readonly string[];
}

/** Generic 4-state workflow, aligned on the historical plan_tasks statuses. */
export const GENERIC_WORKFLOW: TaskWorkflow = {
  kind: 'stepper',
  statuses: ['backlog', 'in_progress', 'review', 'done'] as const,
  labels: {
    backlog: 'À faire',
    in_progress: 'En cours',
    review: 'À valider',
    done: 'Terminé',
  },
  colors: {
    backlog: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  defaultStatus: 'backlog',
  doneStatuses: ['done'] as const,
};

/** Binary workflow: fait / pas fait. Reuses `backlog` and `done`. */
export const BINARY_WORKFLOW: TaskWorkflow = {
  kind: 'binary',
  statuses: ['backlog', 'done'] as const,
  labels: {
    backlog: 'À faire',
    done: 'Fait',
  },
  colors: {
    backlog: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  defaultStatus: 'backlog',
  doneStatuses: ['done'] as const,
};

/**
 * Editorial workflow (READ-ONLY on /actions — the source of truth is
 * `editorial_calendar`). Statuses mirror EditorialCalendar's own flow:
 * `idee → brouillon → valide → programme → publie`.
 */
export const EDITORIAL_WORKFLOW: TaskWorkflow = {
  kind: 'stepper',
  statuses: ['idee', 'brouillon', 'valide', 'programme', 'publie'] as const,
  labels: {
    idee: 'Idée',
    brouillon: 'Brouillon',
    valide: 'Validé',
    programme: 'Programmé',
    publie: 'Publié',
  },
  colors: {
    idee: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    brouillon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    valide: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    programme: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    publie: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  defaultStatus: 'idee',
  doneStatuses: ['publie'] as const,
};

/** task_type → workflow. Unknown task types fall back to GENERIC_WORKFLOW. */
const WORKFLOW_BY_TYPE: Record<string, TaskWorkflow> = {
  seo: BINARY_WORKFLOW,
  social_media: BINARY_WORKFLOW,
  design: BINARY_WORKFLOW,
  strategie: BINARY_WORKFLOW,
  autre: BINARY_WORKFLOW,
  contenu: GENERIC_WORKFLOW,
};

export function getWorkflow(taskType: string | null | undefined): TaskWorkflow {
  return WORKFLOW_BY_TYPE[taskType ?? ''] ?? GENERIC_WORKFLOW;
}

/** FR label for each task_type value, used to title the group sections. */
export const TASK_TYPE_LABELS: Record<string, string> = {
  seo: 'SEO',
  social_media: 'Social media',
  design: 'Design',
  strategie: 'Stratégie',
  contenu: 'Contenus',
  autre: 'Autres actions',
};

export function getTaskTypeLabel(taskType: string | null | undefined): string {
  return TASK_TYPE_LABELS[taskType ?? ''] ?? 'Autres actions';
}
