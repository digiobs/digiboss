-- Migration: enrich plan_tasks for the avancement module
-- Adds: start_date, importance, completed_at, resource_links columns
-- Creates: v_client_avancement view, sync_wrike_task() function

-- Add new columns
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS importance text DEFAULT 'Normal';
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS resource_links jsonb DEFAULT '[]'::jsonb;

-- Index for overdue filtering
CREATE INDEX IF NOT EXISTS idx_plan_tasks_overdue ON plan_tasks(client_id, due_date) WHERE status IN ('active', 'in_progress');

-- View for the dashboard
CREATE OR REPLACE VIEW v_client_avancement AS
SELECT
  pt.id,
  pt.client_id,
  c.name AS client_name,
  pt.title,
  pt.description,
  pt.status,
  pt.priority,
  pt.importance,
  pt.assignee,
  pt.start_date,
  pt.due_date,
  pt.completed_at,
  pt.resource_links,
  pt.wrike_permalink,
  pt.wrike_task_id,
  pt.tags,
  CASE
    WHEN pt.status IN ('active', 'in_progress') AND pt.due_date < CURRENT_DATE
    THEN (CURRENT_DATE - pt.due_date)
    ELSE 0
  END AS overdue_days,
  CASE
    WHEN pt.status = 'completed' THEN 'completed'
    WHEN pt.status = 'deferred' THEN 'deferred'
    WHEN pt.status = 'cancelled' THEN 'cancelled'
    WHEN pt.due_date < CURRENT_DATE AND pt.status IN ('active', 'in_progress') THEN 'overdue'
    ELSE 'on_track'
  END AS health_status,
  CASE
    WHEN pt.due_date < CURRENT_DATE AND pt.status IN ('active', 'in_progress') THEN
      CASE
        WHEN (CURRENT_DATE - pt.due_date) > 90 THEN (CURRENT_DATE - pt.due_date) / 30 || ' mois'
        ELSE (CURRENT_DATE - pt.due_date) || ' jours'
      END
    ELSE NULL
  END AS overdue_label
FROM plan_tasks pt
LEFT JOIN clients c ON c.id = pt.client_id
ORDER BY
  CASE pt.status
    WHEN 'active' THEN 1 WHEN 'in_progress' THEN 1
    WHEN 'deferred' THEN 2 WHEN 'completed' THEN 3
    ELSE 4
  END,
  pt.due_date ASC NULLS LAST;

-- Sync function for Wrike tasks (upsert by wrike_task_id)
CREATE OR REPLACE FUNCTION sync_wrike_task(
  p_client_id text,
  p_wrike_task_id text,
  p_title text,
  p_description text DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_priority text DEFAULT 'normal',
  p_importance text DEFAULT 'Normal',
  p_assignee text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_due_date date DEFAULT NULL,
  p_completed_at timestamptz DEFAULT NULL,
  p_wrike_permalink text DEFAULT NULL,
  p_wrike_project_id text DEFAULT NULL,
  p_resource_links jsonb DEFAULT '[]'::jsonb,
  p_tags jsonb DEFAULT '[]'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO plan_tasks (
    id, client_id, wrike_task_id, title, description, status, priority,
    importance, assignee, due_date, completed_at, wrike_permalink,
    wrike_project_id, resource_links, tags, ai_generated, subtasks, comments,
    start_date, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_client_id, p_wrike_task_id, p_title, p_description,
    p_status, p_priority, p_importance, p_assignee, p_due_date, p_completed_at,
    p_wrike_permalink, p_wrike_project_id, p_resource_links, p_tags, false,
    '[]'::jsonb, '[]'::jsonb, p_start_date, now(), now()
  )
  ON CONFLICT (wrike_task_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    importance = EXCLUDED.importance,
    assignee = EXCLUDED.assignee,
    start_date = EXCLUDED.start_date,
    due_date = EXCLUDED.due_date,
    completed_at = EXCLUDED.completed_at,
    resource_links = EXCLUDED.resource_links,
    tags = EXCLUDED.tags,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
