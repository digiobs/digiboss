-- plan_tasks had only a service_role policy in production, blocking anon +
-- authenticated INSERT/UPDATE/DELETE and breaking the Create Task flow from
-- Plan / Content Creator / Proposals pages. Restore the scoped policies that
-- mirror the pattern used on creative_proposals.

-- Admin has full CRUD
DROP POLICY IF EXISTS admin_full_access ON public.plan_tasks;
CREATE POLICY admin_full_access ON public.plan_tasks
  FOR ALL
  USING (is_digiobs_admin())
  WITH CHECK (is_digiobs_admin());

-- Client-scoped users can SELECT their own tasks
DROP POLICY IF EXISTS client_read_own ON public.plan_tasks;
CREATE POLICY client_read_own ON public.plan_tasks
  FOR SELECT
  USING (client_id IN (SELECT user_client_ids()));

-- Client-scoped users can INSERT tasks for their clients
DROP POLICY IF EXISTS client_insert_own ON public.plan_tasks;
CREATE POLICY client_insert_own ON public.plan_tasks
  FOR INSERT
  WITH CHECK (client_id IN (SELECT user_client_ids()));

-- Client-scoped users can UPDATE tasks for their clients
DROP POLICY IF EXISTS client_update_own ON public.plan_tasks;
CREATE POLICY client_update_own ON public.plan_tasks
  FOR UPDATE
  USING (client_id IN (SELECT user_client_ids()))
  WITH CHECK (client_id IN (SELECT user_client_ids()));

-- Client-scoped users can DELETE tasks for their clients
DROP POLICY IF EXISTS client_delete_own ON public.plan_tasks;
CREATE POLICY client_delete_own ON public.plan_tasks
  FOR DELETE
  USING (client_id IN (SELECT user_client_ids()));

-- Anonymous read (matches creative_proposals pattern for public-facing pages)
DROP POLICY IF EXISTS anon_read ON public.plan_tasks;
CREATE POLICY anon_read ON public.plan_tasks
  FOR SELECT
  USING (true);
