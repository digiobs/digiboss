-- Migration: extend plan_tasks to carry content-item semantics
-- Allows content-creator items to be stored as plan_tasks with task_type = 'contenu'
-- so create/edit flows can be unified with the existing CreateTaskDialog.

ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS content_type text;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS content_status text;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS funnel_stage text;

CREATE INDEX IF NOT EXISTS idx_plan_tasks_content_type ON plan_tasks(content_type);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_content_status ON plan_tasks(content_status);
