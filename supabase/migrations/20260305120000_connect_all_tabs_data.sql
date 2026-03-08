-- Tab-level data tables for Supabase-backed dashboard pages

-- Prospects
CREATE TABLE IF NOT EXISTS public.prospect_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'new',
  source TEXT,
  last_activity TEXT,
  fit_score INTEGER NOT NULL DEFAULT 0,
  intent_score INTEGER NOT NULL DEFAULT 0,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  suggested_action TEXT,
  suggested_channel TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prospect_leads_client_idx ON public.prospect_leads (client_id);
ALTER TABLE public.prospect_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to prospect_leads" ON public.prospect_leads;
DROP POLICY IF EXISTS "Allow public insert access to prospect_leads" ON public.prospect_leads;
DROP POLICY IF EXISTS "Allow public update access to prospect_leads" ON public.prospect_leads;
DROP POLICY IF EXISTS "Allow public delete access to prospect_leads" ON public.prospect_leads;
CREATE POLICY "Allow public read access to prospect_leads" ON public.prospect_leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to prospect_leads" ON public.prospect_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to prospect_leads" ON public.prospect_leads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to prospect_leads" ON public.prospect_leads FOR DELETE USING (true);
DROP TRIGGER IF EXISTS update_prospect_leads_updated_at ON public.prospect_leads;
CREATE TRIGGER update_prospect_leads_updated_at
BEFORE UPDATE ON public.prospect_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Plan
CREATE TABLE IF NOT EXISTS public.plan_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee TEXT,
  due_date DATE,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_campaign TEXT,
  estimated_hours INTEGER,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  linked_content_id TEXT,
  linked_content_type TEXT,
  source_module TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plan_tasks_client_idx ON public.plan_tasks (client_id);
CREATE INDEX IF NOT EXISTS plan_tasks_client_status_idx ON public.plan_tasks (client_id, status);
ALTER TABLE public.plan_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to plan_tasks" ON public.plan_tasks;
DROP POLICY IF EXISTS "Allow public insert access to plan_tasks" ON public.plan_tasks;
DROP POLICY IF EXISTS "Allow public update access to plan_tasks" ON public.plan_tasks;
DROP POLICY IF EXISTS "Allow public delete access to plan_tasks" ON public.plan_tasks;
CREATE POLICY "Allow public read access to plan_tasks" ON public.plan_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to plan_tasks" ON public.plan_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to plan_tasks" ON public.plan_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to plan_tasks" ON public.plan_tasks FOR DELETE USING (true);
DROP TRIGGER IF EXISTS update_plan_tasks_updated_at ON public.plan_tasks;
CREATE TRIGGER update_plan_tasks_updated_at
BEFORE UPDATE ON public.plan_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Assets
CREATE TABLE IF NOT EXISTS public.asset_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  version TEXT NOT NULL DEFAULT '1.0',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS asset_library_client_idx ON public.asset_library (client_id);
ALTER TABLE public.asset_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to asset_library" ON public.asset_library;
DROP POLICY IF EXISTS "Allow public insert access to asset_library" ON public.asset_library;
DROP POLICY IF EXISTS "Allow public update access to asset_library" ON public.asset_library;
DROP POLICY IF EXISTS "Allow public delete access to asset_library" ON public.asset_library;
CREATE POLICY "Allow public read access to asset_library" ON public.asset_library FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to asset_library" ON public.asset_library FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to asset_library" ON public.asset_library FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to asset_library" ON public.asset_library FOR DELETE USING (true);
DROP TRIGGER IF EXISTS update_asset_library_updated_at ON public.asset_library;
CREATE TRIGGER update_asset_library_updated_at
BEFORE UPDATE ON public.asset_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Home
CREATE TABLE IF NOT EXISTS public.home_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  delta NUMERIC,
  trend TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, key)
);
CREATE INDEX IF NOT EXISTS home_kpis_client_idx ON public.home_kpis (client_id);
ALTER TABLE public.home_kpis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to home_kpis" ON public.home_kpis;
DROP POLICY IF EXISTS "Allow public insert access to home_kpis" ON public.home_kpis;
DROP POLICY IF EXISTS "Allow public update access to home_kpis" ON public.home_kpis;
DROP POLICY IF EXISTS "Allow public delete access to home_kpis" ON public.home_kpis;
CREATE POLICY "Allow public read access to home_kpis" ON public.home_kpis FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to home_kpis" ON public.home_kpis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to home_kpis" ON public.home_kpis FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to home_kpis" ON public.home_kpis FOR DELETE USING (true);
DROP TRIGGER IF EXISTS update_home_kpis_updated_at ON public.home_kpis;
CREATE TRIGGER update_home_kpis_updated_at
BEFORE UPDATE ON public.home_kpis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insights
CREATE TABLE IF NOT EXISTS public.insights_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  impact TEXT,
  status TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS insights_items_client_idx ON public.insights_items (client_id);
ALTER TABLE public.insights_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to insights_items" ON public.insights_items;
DROP POLICY IF EXISTS "Allow public insert access to insights_items" ON public.insights_items;
DROP POLICY IF EXISTS "Allow public update access to insights_items" ON public.insights_items;
DROP POLICY IF EXISTS "Allow public delete access to insights_items" ON public.insights_items;
CREATE POLICY "Allow public read access to insights_items" ON public.insights_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to insights_items" ON public.insights_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to insights_items" ON public.insights_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to insights_items" ON public.insights_items FOR DELETE USING (true);
DROP TRIGGER IF EXISTS update_insights_items_updated_at ON public.insights_items;
CREATE TRIGGER update_insights_items_updated_at
BEFORE UPDATE ON public.insights_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Content Creator
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT,
  status TEXT NOT NULL DEFAULT 'idea',
  funnel_stage TEXT,
  opportunity_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_items_client_idx ON public.content_items (client_id);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to content_items" ON public.content_items;
DROP POLICY IF EXISTS "Allow public insert access to content_items" ON public.content_items;
DROP POLICY IF EXISTS "Allow public update access to content_items" ON public.content_items;
DROP POLICY IF EXISTS "Allow public delete access to content_items" ON public.content_items;
CREATE POLICY "Allow public read access to content_items" ON public.content_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to content_items" ON public.content_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to content_items" ON public.content_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to content_items" ON public.content_items FOR DELETE USING (true);
DROP TRIGGER IF EXISTS update_content_items_updated_at ON public.content_items;
CREATE TRIGGER update_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Reporting
CREATE TABLE IF NOT EXISTS public.reporting_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  section TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  label TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, section, metric_key, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS reporting_kpis_client_idx ON public.reporting_kpis (client_id);
CREATE INDEX IF NOT EXISTS reporting_kpis_client_section_idx ON public.reporting_kpis (client_id, section);
ALTER TABLE public.reporting_kpis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to reporting_kpis" ON public.reporting_kpis;
DROP POLICY IF EXISTS "Allow public insert access to reporting_kpis" ON public.reporting_kpis;
DROP POLICY IF EXISTS "Allow public update access to reporting_kpis" ON public.reporting_kpis;
DROP POLICY IF EXISTS "Allow public delete access to reporting_kpis" ON public.reporting_kpis;
CREATE POLICY "Allow public read access to reporting_kpis" ON public.reporting_kpis FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to reporting_kpis" ON public.reporting_kpis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to reporting_kpis" ON public.reporting_kpis FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to reporting_kpis" ON public.reporting_kpis FOR DELETE USING (true);
DROP TRIGGER IF EXISTS update_reporting_kpis_updated_at ON public.reporting_kpis;
CREATE TRIGGER update_reporting_kpis_updated_at
BEFORE UPDATE ON public.reporting_kpis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_client_idx ON public.chat_messages (client_id);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow public insert access to chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow public update access to chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow public delete access to chat_messages" ON public.chat_messages;
CREATE POLICY "Allow public read access to chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to chat_messages" ON public.chat_messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to chat_messages" ON public.chat_messages FOR DELETE USING (true);
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

