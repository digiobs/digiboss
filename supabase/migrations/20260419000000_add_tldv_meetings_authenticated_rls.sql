-- tldv_meetings had only `service_role_all` and `anon_read` policies.
-- When team auth rolled out every user now signs in as `authenticated`,
-- which means the `anon_read` policy no longer applies and /meetings
-- returns zero rows (reported as "meetings ne s'affichent plus").
--
-- Mirror the pattern used on creative_proposals / editorial_calendar:
--   - admin_full_access (is_digiobs_admin)
--   - client_read_own  (client_id ∈ user_client_ids())
-- Keep the existing anon_read & service_role_all policies untouched so
-- the edge-function sync (runs as service_role) and any pre-auth tooling
-- stay functional.

-- Admin has full CRUD
DROP POLICY IF EXISTS admin_full_access ON public.tldv_meetings;
CREATE POLICY admin_full_access ON public.tldv_meetings
  FOR ALL
  TO authenticated
  USING (is_digiobs_admin())
  WITH CHECK (is_digiobs_admin());

-- Client-scoped team members can read meetings for their assigned clients.
-- Both tldv_meetings.client_id and user_client_ids() are text, so no cast
-- is needed.
DROP POLICY IF EXISTS client_read_own ON public.tldv_meetings;
CREATE POLICY client_read_own ON public.tldv_meetings
  FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT user_client_ids()));
