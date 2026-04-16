-- Migration: sync ALL Wrike custom fields to plan_tasks
-- Adds wrike_custom_status column and updates the sync_wrike_task() function
-- to accept canal, format, thematique, mot_cle_cible, nombre_mots,
-- effort_reserve, and all financial fields from Wrike custom fields.

ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS wrike_custom_status text;

-- Recreate sync function with extended parameter list
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
  p_tags jsonb DEFAULT '[]'::jsonb,
  -- Wrike custom fields
  p_canal text DEFAULT NULL,
  p_format text DEFAULT NULL,
  p_thematique text DEFAULT NULL,
  p_mot_cle_cible text DEFAULT NULL,
  p_nombre_mots integer DEFAULT NULL,
  p_effort_reserve numeric(6,2) DEFAULT NULL,
  p_budget_tache numeric(10,2) DEFAULT NULL,
  p_tarif_catalogue numeric(10,2) DEFAULT NULL,
  p_forfait_mensuel numeric(10,2) DEFAULT NULL,
  p_sous_traitance numeric(10,2) DEFAULT NULL,
  p_marge numeric(10,2) DEFAULT NULL,
  p_wrike_custom_status text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO plan_tasks (
    id, client_id, wrike_task_id, title, description, status, priority,
    importance, assignee, due_date, completed_at, wrike_permalink,
    wrike_project_id, resource_links, tags, ai_generated, subtasks, comments,
    start_date, canal, format, thematique, mot_cle_cible, nombre_mots,
    effort_reserve, budget_tache, tarif_catalogue, forfait_mensuel,
    sous_traitance, marge, wrike_custom_status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_client_id, p_wrike_task_id, p_title, p_description,
    p_status, p_priority, p_importance, p_assignee, p_due_date, p_completed_at,
    p_wrike_permalink, p_wrike_project_id, p_resource_links, p_tags, false,
    '[]'::jsonb, '[]'::jsonb, p_start_date, p_canal, p_format, p_thematique,
    p_mot_cle_cible, p_nombre_mots, p_effort_reserve, p_budget_tache,
    p_tarif_catalogue, p_forfait_mensuel, p_sous_traitance, p_marge,
    p_wrike_custom_status, now(), now()
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
    canal = EXCLUDED.canal,
    format = EXCLUDED.format,
    thematique = EXCLUDED.thematique,
    mot_cle_cible = EXCLUDED.mot_cle_cible,
    nombre_mots = EXCLUDED.nombre_mots,
    effort_reserve = EXCLUDED.effort_reserve,
    budget_tache = EXCLUDED.budget_tache,
    tarif_catalogue = EXCLUDED.tarif_catalogue,
    forfait_mensuel = EXCLUDED.forfait_mensuel,
    sous_traitance = EXCLUDED.sous_traitance,
    marge = EXCLUDED.marge,
    wrike_custom_status = EXCLUDED.wrike_custom_status,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
