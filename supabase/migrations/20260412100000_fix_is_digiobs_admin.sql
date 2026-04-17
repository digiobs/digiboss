-- Fix is_digiobs_admin() to check profiles table instead of JWT metadata.
-- JWT metadata is stale (set at login time), profiles table is the source of truth.
CREATE OR REPLACE FUNCTION public.is_digiobs_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
