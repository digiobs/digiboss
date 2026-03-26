CREATE TABLE IF NOT EXISTS public.lemlist_contacts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  external_contact_id TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  company TEXT,
  status TEXT,
  source TEXT,
  contacted_at TIMESTAMPTZ,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, external_contact_id)
);

CREATE TABLE IF NOT EXISTS public.semrush_domain_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  keyword TEXT NOT NULL,
  position NUMERIC,
  search_volume NUMERIC,
  traffic_percent NUMERIC,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS semrush_domain_metrics_client_date_idx
  ON public.semrush_domain_metrics (client_id, report_date DESC);

CREATE TABLE IF NOT EXISTS public.supermetrics_channel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  channel TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, provider, channel, metric_key, period_start, period_end)
);

ALTER TABLE public.lemlist_contacts_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semrush_domain_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supermetrics_channel_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to lemlist_contacts_cache" ON public.lemlist_contacts_cache;
DROP POLICY IF EXISTS "Allow public read access to semrush_domain_metrics" ON public.semrush_domain_metrics;
DROP POLICY IF EXISTS "Allow public read access to supermetrics_channel_metrics" ON public.supermetrics_channel_metrics;
CREATE POLICY "Allow public read access to lemlist_contacts_cache"
ON public.lemlist_contacts_cache FOR SELECT USING (true);
CREATE POLICY "Allow public read access to semrush_domain_metrics"
ON public.semrush_domain_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read access to supermetrics_channel_metrics"
ON public.supermetrics_channel_metrics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role write lemlist_contacts_cache" ON public.lemlist_contacts_cache;
DROP POLICY IF EXISTS "Allow service role write semrush_domain_metrics" ON public.semrush_domain_metrics;
DROP POLICY IF EXISTS "Allow service role write supermetrics_channel_metrics" ON public.supermetrics_channel_metrics;
CREATE POLICY "Allow service role write lemlist_contacts_cache"
ON public.lemlist_contacts_cache FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow service role write semrush_domain_metrics"
ON public.semrush_domain_metrics FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow service role write supermetrics_channel_metrics"
ON public.supermetrics_channel_metrics FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS update_lemlist_contacts_cache_updated_at ON public.lemlist_contacts_cache;
DROP TRIGGER IF EXISTS update_semrush_domain_metrics_updated_at ON public.semrush_domain_metrics;
DROP TRIGGER IF EXISTS update_supermetrics_channel_metrics_updated_at ON public.supermetrics_channel_metrics;
CREATE TRIGGER update_lemlist_contacts_cache_updated_at
BEFORE UPDATE ON public.lemlist_contacts_cache
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_semrush_domain_metrics_updated_at
BEFORE UPDATE ON public.semrush_domain_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supermetrics_channel_metrics_updated_at
BEFORE UPDATE ON public.supermetrics_channel_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
