-- Deliverables registry + register_deliverable RPC
--
-- The `deliverables` table already exists in production (created ad-hoc in an
-- earlier iteration) and uses `client_id text` to mirror `clients.id` which is
-- also `text` (kebab-cased slug, e.g. "agro-bio"). This migration is written to
-- be safe on environments where the table already exists (IF NOT EXISTS) and to
-- idempotently (re)create the upsert RPC + unique indexes it relies on.
--
-- See docs/deliverables-routing.md for the human-readable procedure.

-- 1. Table -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,

  -- Classification
  type text NOT NULL,
  skill_name text,
  sub_type text,
  channel text,
  period text,            -- yyyy-mm
  tags text[] DEFAULT '{}'::text[],

  -- Content metadata
  filename text NOT NULL,
  title text,
  description text,
  status text NOT NULL DEFAULT 'delivered',

  -- Physical destinations (exactly one of storage_path / onedrive_path is set)
  storage_bucket text DEFAULT 'deliverables',
  storage_path text,
  onedrive_path text,
  sharepoint_url text,

  -- Legacy (Notion) — kept for historical rows, no longer written
  notion_url text,
  notion_page_id text,

  -- File attributes
  file_size bigint,
  content_type text DEFAULT 'text/html',

  -- Production tracking
  generation_meta jsonb DEFAULT '{}'::jsonb,
  generated_by text DEFAULT 'cowork',
  error_message text,
  version integer DEFAULT 1,

  -- Archival
  is_archived boolean DEFAULT false,
  archived_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes (upsert keys) ---------------------------------------------------

-- Unique per client per physical path, so register_deliverable can upsert.
CREATE UNIQUE INDEX IF NOT EXISTS ux_deliverables_client_storage_path
  ON public.deliverables (client_id, storage_path)
  WHERE storage_path IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_deliverables_client_onedrive_path
  ON public.deliverables (client_id, onedrive_path)
  WHERE onedrive_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deliverables_skill
  ON public.deliverables (skill_name);

-- 3. updated_at trigger ------------------------------------------------------

CREATE OR REPLACE FUNCTION public.deliverables_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS deliverables_updated_at ON public.deliverables;
CREATE TRIGGER deliverables_updated_at
  BEFORE UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION public.deliverables_set_updated_at();

-- 4. register_deliverable RPC ------------------------------------------------
--
-- Idempotent upsert entry point used by skill producers and by the
-- `index-deliverables` edge function. Keyed on (client_id, storage_path) for
-- Supabase-hosted files and (client_id, onedrive_path) for OneDrive.
--
-- `client_id` is TEXT (not uuid) — it matches the kebab-cased slug used for
-- `public.clients.id`.

-- Drop the legacy ad-hoc version (different arg order, no return contract)
-- so the CREATE OR REPLACE below succeeds.
DROP FUNCTION IF EXISTS public.register_deliverable(
  text, text, text, text, text, text, text, text, text, bigint,
  text, text, text, text, text, text, text[], jsonb, text, text
);

CREATE OR REPLACE FUNCTION public.register_deliverable(
  p_client_id       text,
  p_type            text,
  p_filename        text,
  p_title           text    DEFAULT NULL,
  p_description     text    DEFAULT NULL,
  p_status          text    DEFAULT 'delivered',
  p_skill_name      text    DEFAULT NULL,
  p_sub_type        text    DEFAULT NULL,
  p_channel         text    DEFAULT NULL,
  p_period          text    DEFAULT NULL,
  p_tags            text[]  DEFAULT NULL,
  p_storage_path    text    DEFAULT NULL,
  p_onedrive_path   text    DEFAULT NULL,
  p_sharepoint_url  text    DEFAULT NULL,
  p_notion_url      text    DEFAULT NULL,
  p_notion_page_id  text    DEFAULT NULL,
  p_file_size       bigint  DEFAULT NULL,
  p_content_type    text    DEFAULT NULL,
  p_generation_meta jsonb   DEFAULT NULL,
  p_generated_by    text    DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_action text;
  v_created timestamptz;
  v_updated timestamptz;
BEGIN
  IF p_storage_path IS NULL AND p_onedrive_path IS NULL THEN
    RAISE EXCEPTION 'register_deliverable: either p_storage_path or p_onedrive_path must be provided';
  END IF;

  IF p_storage_path IS NOT NULL THEN
    INSERT INTO public.deliverables (
      client_id, type, skill_name, sub_type, channel, period, tags,
      filename, title, description, status,
      storage_bucket, storage_path, onedrive_path, sharepoint_url,
      notion_url, notion_page_id,
      file_size, content_type,
      generation_meta, generated_by
    ) VALUES (
      p_client_id, p_type, p_skill_name, p_sub_type, p_channel, p_period, p_tags,
      p_filename, p_title, p_description, p_status,
      'deliverables', p_storage_path, NULL, p_sharepoint_url,
      p_notion_url, p_notion_page_id,
      p_file_size, p_content_type,
      p_generation_meta, p_generated_by
    )
    ON CONFLICT (client_id, storage_path) WHERE storage_path IS NOT NULL
    DO UPDATE SET
      type            = EXCLUDED.type,
      skill_name      = COALESCE(EXCLUDED.skill_name,     public.deliverables.skill_name),
      sub_type        = COALESCE(EXCLUDED.sub_type,       public.deliverables.sub_type),
      channel         = COALESCE(EXCLUDED.channel,        public.deliverables.channel),
      period          = COALESCE(EXCLUDED.period,         public.deliverables.period),
      tags            = COALESCE(EXCLUDED.tags,           public.deliverables.tags),
      filename        = EXCLUDED.filename,
      title           = COALESCE(EXCLUDED.title,          public.deliverables.title),
      description     = COALESCE(EXCLUDED.description,    public.deliverables.description),
      status          = EXCLUDED.status,
      file_size       = COALESCE(EXCLUDED.file_size,      public.deliverables.file_size),
      content_type    = COALESCE(EXCLUDED.content_type,   public.deliverables.content_type),
      generation_meta = COALESCE(EXCLUDED.generation_meta, public.deliverables.generation_meta),
      generated_by    = COALESCE(EXCLUDED.generated_by,   public.deliverables.generated_by),
      sharepoint_url  = COALESCE(EXCLUDED.sharepoint_url, public.deliverables.sharepoint_url),
      updated_at      = now()
    RETURNING id, created_at, updated_at INTO v_id, v_created, v_updated;
  ELSE
    INSERT INTO public.deliverables (
      client_id, type, skill_name, sub_type, channel, period, tags,
      filename, title, description, status,
      storage_bucket, storage_path, onedrive_path, sharepoint_url,
      notion_url, notion_page_id,
      file_size, content_type,
      generation_meta, generated_by
    ) VALUES (
      p_client_id, p_type, p_skill_name, p_sub_type, p_channel, p_period, p_tags,
      p_filename, p_title, p_description, p_status,
      NULL, NULL, p_onedrive_path, p_sharepoint_url,
      p_notion_url, p_notion_page_id,
      p_file_size, p_content_type,
      p_generation_meta, p_generated_by
    )
    ON CONFLICT (client_id, onedrive_path) WHERE onedrive_path IS NOT NULL
    DO UPDATE SET
      type            = EXCLUDED.type,
      skill_name      = COALESCE(EXCLUDED.skill_name,     public.deliverables.skill_name),
      sub_type        = COALESCE(EXCLUDED.sub_type,       public.deliverables.sub_type),
      channel         = COALESCE(EXCLUDED.channel,        public.deliverables.channel),
      period          = COALESCE(EXCLUDED.period,         public.deliverables.period),
      tags            = COALESCE(EXCLUDED.tags,           public.deliverables.tags),
      filename        = EXCLUDED.filename,
      title           = COALESCE(EXCLUDED.title,          public.deliverables.title),
      description     = COALESCE(EXCLUDED.description,    public.deliverables.description),
      status          = EXCLUDED.status,
      file_size       = COALESCE(EXCLUDED.file_size,      public.deliverables.file_size),
      content_type    = COALESCE(EXCLUDED.content_type,   public.deliverables.content_type),
      generation_meta = COALESCE(EXCLUDED.generation_meta, public.deliverables.generation_meta),
      generated_by    = COALESCE(EXCLUDED.generated_by,   public.deliverables.generated_by),
      sharepoint_url  = COALESCE(EXCLUDED.sharepoint_url, public.deliverables.sharepoint_url),
      updated_at      = now()
    RETURNING id, created_at, updated_at INTO v_id, v_created, v_updated;
  END IF;

  v_action := CASE WHEN v_created = v_updated THEN 'inserted' ELSE 'updated' END;

  RETURN jsonb_build_object('id', v_id, 'action', v_action);
END $$;

GRANT EXECUTE ON FUNCTION public.register_deliverable(
  text, text, text, text, text, text, text, text, text, text, text[],
  text, text, text, text, text, bigint, text, jsonb, text
) TO service_role, authenticated;

-- 5. RLS ---------------------------------------------------------------------
-- RLS is already enabled in production with the following policies, which we
-- do not re-create here to avoid clobbering existing access control:
--   - admin_full_access   (ALL  USING is_digiobs_admin())
--   - client_read_own     (READ USING client_id IN user_client_ids() AND NOT is_archived)
--   - anon_read           (READ USING NOT is_archived)
--   - service_role_full_access (ALL USING true)
--
-- Just ensure RLS is on for environments where the table is freshly created.
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
