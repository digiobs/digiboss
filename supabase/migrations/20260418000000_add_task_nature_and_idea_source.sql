-- Adds precise task nature (inspired by Wrike custom element types) and
-- idea-source tracking to `plan_tasks`.
--
-- Context:
--   * `task_type` stays as a coarse grouping (seo, contenu, design, …) used
--     to choose workflows and render the monthly package sections.
--   * `task_nature` identifies the task far more precisely (LinkedIn post,
--     LinkedIn carousel, SEO article, SEO audit, data report, …), mirroring
--     Wrike's custom item types.
--   * `idea_source` + friends answer "d'où vient cette idée ?" — a proposal,
--     a meeting insight, a client request, a veille signal, an AI suggestion,
--     or just a manual entry. When the source is a creative_proposal, the
--     FK is stored in `source_proposal_id` so we can surface the full
--     context (rationale, source URL) on the /actions page.

ALTER TABLE public.plan_tasks
  ADD COLUMN IF NOT EXISTS task_nature text,
  ADD COLUMN IF NOT EXISTS idea_source text,
  ADD COLUMN IF NOT EXISTS idea_source_detail text,
  ADD COLUMN IF NOT EXISTS idea_source_url text,
  ADD COLUMN IF NOT EXISTS source_proposal_id uuid;

-- Optional soft FK to creative_proposals. We use ON DELETE SET NULL so a
-- deleted proposal does not cascade-delete the action that inherited from it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'creative_proposals'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'plan_tasks'
      AND constraint_name = 'plan_tasks_source_proposal_id_fkey'
  ) THEN
    ALTER TABLE public.plan_tasks
      ADD CONSTRAINT plan_tasks_source_proposal_id_fkey
      FOREIGN KEY (source_proposal_id)
      REFERENCES public.creative_proposals(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plan_tasks_task_nature
  ON public.plan_tasks(task_nature);

CREATE INDEX IF NOT EXISTS idx_plan_tasks_idea_source
  ON public.plan_tasks(idea_source);

CREATE INDEX IF NOT EXISTS idx_plan_tasks_source_proposal_id
  ON public.plan_tasks(source_proposal_id);
