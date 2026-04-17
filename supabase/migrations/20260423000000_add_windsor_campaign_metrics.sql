-- Windsor.ai pushes data directly to this table via PostgreSQL destination.
-- Columns match the connector URL fields: account_name, campaign, datasource,
-- date, post_id, sessions, source.

CREATE TABLE IF NOT EXISTS public.windsor_campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT,
  account_name TEXT,
  campaign TEXT,
  datasource TEXT NOT NULL,
  date DATE NOT NULL,
  post_id TEXT,
  sessions NUMERIC NOT NULL DEFAULT 0,
  source TEXT,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, datasource, campaign, account_name, source)
);

ALTER TABLE public.windsor_campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read windsor_campaign_metrics"
ON public.windsor_campaign_metrics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role write windsor_campaign_metrics"
ON public.windsor_campaign_metrics FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_windsor_campaign_metrics_updated_at
BEFORE UPDATE ON public.windsor_campaign_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
