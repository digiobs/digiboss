-- Monthly batches for client actions.
-- Convention: `YYYY-MM` text column, identical to deliverables.period.
-- Used by /actions page to group a client's work into a single monthly view.

ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS period text;

CREATE INDEX IF NOT EXISTS idx_plan_tasks_period
  ON public.plan_tasks(period);

CREATE INDEX IF NOT EXISTS idx_plan_tasks_client_period
  ON public.plan_tasks(client_id, period);

-- Backfill: derive period from due_date, fall back to created_at.
UPDATE public.plan_tasks
SET period = to_char(COALESCE(due_date, created_at::date), 'YYYY-MM')
WHERE period IS NULL;

-- Defensive: drop the legacy CHECK on status if still present.
-- Since 20260330000000_enrich_plan_tasks_for_avancement.sql the status column
-- is used with values outside the original CHECK set (`active`, `completed`,
-- `deferred`, …) and the constraint was meant to have been removed.
ALTER TABLE public.plan_tasks DROP CONSTRAINT IF EXISTS plan_tasks_status_check;
