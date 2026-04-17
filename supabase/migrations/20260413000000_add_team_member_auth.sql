-- Phase 1: Team member auth foundation

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'team_member'
    CHECK (role IN ('team_member', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_service" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_service" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'team_member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add assignee_id to plan_tasks
ALTER TABLE public.plan_tasks
  ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS plan_tasks_assignee_id_idx
  ON public.plan_tasks (assignee_id);

-- 3. Create user_clients table (was referenced in earlier migration but never applied)
CREATE TABLE IF NOT EXISTS public.user_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, client_id)
);

CREATE INDEX IF NOT EXISTS user_clients_user_idx ON public.user_clients (user_id);
CREATE INDEX IF NOT EXISTS user_clients_client_idx ON public.user_clients (client_id);

ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_clients_select" ON public.user_clients;
CREATE POLICY "user_clients_select" ON public.user_clients
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_clients_insert" ON public.user_clients;
CREATE POLICY "user_clients_insert" ON public.user_clients
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "user_clients_delete" ON public.user_clients;
CREATE POLICY "user_clients_delete" ON public.user_clients
  FOR DELETE USING (true);

-- 4. Helper view: "my tasks" for authenticated team members
CREATE OR REPLACE VIEW public.v_my_tasks AS
SELECT
  pt.*,
  p.full_name AS assignee_name,
  p.avatar_url AS assignee_avatar
FROM public.plan_tasks pt
LEFT JOIN public.profiles p ON p.id = pt.assignee_id;
