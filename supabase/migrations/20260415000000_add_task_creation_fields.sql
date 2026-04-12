-- Migration: add full task creation fields mapped from Wrike + team_members table
-- Adds task_type, content fields (canal, format, thematique, mot_cle_cible, nombre_mots),
-- production fields (effort_reserve), admin financial fields, assignee_ids, sync_to_wrike

-- Task type for agency workflow categorization
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'autre';

-- Wrike-mapped content fields
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS canal text;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS format text;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS thematique text;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS mot_cle_cible text;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS nombre_mots integer;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS effort_reserve numeric(6,2);

-- Admin financial fields (Wrike custom fields)
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS budget_tache numeric(10,2);
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS tarif_catalogue numeric(10,2);
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS forfait_mensuel numeric(10,2);
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS sous_traitance numeric(10,2);
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS marge numeric(10,2);

-- Wrike sync flag
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS sync_to_wrike boolean DEFAULT false;

-- Structured assignees (keeps existing assignee TEXT for backward compat)
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS assignee_ids jsonb DEFAULT '[]'::jsonb;

-- Indexes for new filterable columns
CREATE INDEX IF NOT EXISTS idx_plan_tasks_task_type ON plan_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_canal ON plan_tasks(canal);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  wrike_contact_id text,
  avatar_url text,
  role text DEFAULT 'member',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique constraint on wrike_contact_id (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_wrike_contact ON team_members(wrike_contact_id) WHERE wrike_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

-- RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to team_members" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to team_members" ON team_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to team_members" ON team_members FOR DELETE USING (true);

-- Drop and recreate view with new columns
DROP VIEW IF EXISTS v_client_avancement;
CREATE VIEW v_client_avancement AS
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
  pt.task_type,
  pt.canal,
  pt.format,
  pt.thematique,
  pt.assignee_ids,
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
