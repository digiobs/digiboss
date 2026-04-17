-- Fix RLS on client_data_mappings so authenticated admins can write from
-- the frontend (campaign picker connect/disconnect). The original migration
-- created fully open policies, but they were later replaced in production
-- with stricter rules that block the anon/authenticated role.
--
-- New policy set:
--   - authenticated users can SELECT
--   - admins (is_digiobs_admin()) have full CRUD
--   - service_role (edge functions) bypasses RLS automatically

-- Drop all existing policies to start clean.
DROP POLICY IF EXISTS "Allow public read access to client_data_mappings"   ON public.client_data_mappings;
DROP POLICY IF EXISTS "Allow public insert access to client_data_mappings" ON public.client_data_mappings;
DROP POLICY IF EXISTS "Allow public update access to client_data_mappings" ON public.client_data_mappings;
DROP POLICY IF EXISTS "Allow public delete access to client_data_mappings" ON public.client_data_mappings;
DROP POLICY IF EXISTS "admin_full_access"   ON public.client_data_mappings;
DROP POLICY IF EXISTS "authenticated_read"  ON public.client_data_mappings;

-- Authenticated users can read all mappings (needed by prospects picker).
CREATE POLICY authenticated_read ON public.client_data_mappings
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins get full CRUD (insert, update, delete).
CREATE POLICY admin_full_access ON public.client_data_mappings
  FOR ALL
  TO authenticated
  USING (is_digiobs_admin())
  WITH CHECK (is_digiobs_admin());
