-- Lemlist multi-team support
--
-- digiobs rolled out a second lemlist workspace and the prospects tab needs to
-- know which team each cached contact belongs to so the UI picker can filter
-- campaigns by client → team first and by campaign name as a fallback.
--
-- Column conventions:
--   team_id   — lemlist's internal team/workspace id (mirrors the value we
--               store on client_data_mappings.external_workspace_id so we can
--               route sync calls to the right API key).
--   team_name — cached display name so we don't need to re-hit /api/team on
--               every list render.

ALTER TABLE public.lemlist_contacts_cache
  ADD COLUMN IF NOT EXISTS team_id   TEXT,
  ADD COLUMN IF NOT EXISTS team_name TEXT;

CREATE INDEX IF NOT EXISTS lemlist_contacts_cache_team_idx
  ON public.lemlist_contacts_cache (team_id);
