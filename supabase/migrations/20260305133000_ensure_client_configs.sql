-- Ensure client_configs exists and is compatible with text client IDs
CREATE TABLE IF NOT EXISTS public.client_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  competitors TEXT[] DEFAULT '{}',
  website_url TEXT,
  linkedin_organization_id TEXT,
  hubspot_portal_id TEXT,
  google_analytics_property_id TEXT,
  industry TEXT DEFAULT 'technology',
  market_news_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS client_configs_client_id_idx ON public.client_configs (client_id);

ALTER TABLE public.client_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to client_configs" ON public.client_configs;
DROP POLICY IF EXISTS "Allow public insert access to client_configs" ON public.client_configs;
DROP POLICY IF EXISTS "Allow public update access to client_configs" ON public.client_configs;
DROP POLICY IF EXISTS "Allow public delete access to client_configs" ON public.client_configs;

CREATE POLICY "Allow public read access to client_configs"
ON public.client_configs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to client_configs"
ON public.client_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to client_configs"
ON public.client_configs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to client_configs"
ON public.client_configs FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_client_configs_updated_at ON public.client_configs;
CREATE TRIGGER update_client_configs_updated_at
BEFORE UPDATE ON public.client_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

