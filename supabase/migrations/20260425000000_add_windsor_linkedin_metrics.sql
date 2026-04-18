-- Windsor.ai LinkedIn organic follower metrics, pushed directly via PostgreSQL.
-- Fields: date, organization_follower_count, followers_gain_organic, followers_gain_paid.

CREATE TABLE IF NOT EXISTS public.windsor_linkedin_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT,
  date DATE NOT NULL,
  organization_follower_count NUMERIC NOT NULL DEFAULT 0,
  followers_gain_organic NUMERIC NOT NULL DEFAULT 0,
  followers_gain_paid NUMERIC NOT NULL DEFAULT 0,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date)
);

ALTER TABLE public.windsor_linkedin_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read windsor_linkedin_metrics"
ON public.windsor_linkedin_metrics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role write windsor_linkedin_metrics"
ON public.windsor_linkedin_metrics FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_windsor_linkedin_metrics_updated_at
BEFORE UPDATE ON public.windsor_linkedin_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
