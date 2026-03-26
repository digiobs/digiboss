-- Add Wrike mapping fields to plan tasks
ALTER TABLE public.plan_tasks
  ADD COLUMN IF NOT EXISTS wrike_task_id TEXT,
  ADD COLUMN IF NOT EXISTS wrike_step_id TEXT,
  ADD COLUMN IF NOT EXISTS wrike_project_id TEXT,
  ADD COLUMN IF NOT EXISTS wrike_permalink TEXT;

CREATE INDEX IF NOT EXISTS plan_tasks_client_wrike_task_idx
  ON public.plan_tasks (client_id, wrike_task_id);
CREATE INDEX IF NOT EXISTS plan_tasks_client_wrike_step_idx
  ON public.plan_tasks (client_id, wrike_step_id);
