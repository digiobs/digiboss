CREATE TABLE IF NOT EXISTS public.integration_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  connector TEXT NOT NULL,
  client_id TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  started_by TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_payload JSONB,
  sample_payload JSONB,
  error_message TEXT,
  error_details JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS integration_sync_runs_provider_idx
  ON public.integration_sync_runs (provider, connector);
CREATE INDEX IF NOT EXISTS integration_sync_runs_client_idx
  ON public.integration_sync_runs (client_id);
CREATE INDEX IF NOT EXISTS integration_sync_runs_status_idx
  ON public.integration_sync_runs (status);
CREATE INDEX IF NOT EXISTS integration_sync_runs_started_at_idx
  ON public.integration_sync_runs (started_at DESC);

ALTER TABLE public.integration_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to integration_sync_runs" ON public.integration_sync_runs;
DROP POLICY IF EXISTS "Allow service role insert integration_sync_runs" ON public.integration_sync_runs;
DROP POLICY IF EXISTS "Allow service role update integration_sync_runs" ON public.integration_sync_runs;

CREATE POLICY "Allow public read access to integration_sync_runs"
ON public.integration_sync_runs FOR SELECT USING (true);

CREATE POLICY "Allow service role insert integration_sync_runs"
ON public.integration_sync_runs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role update integration_sync_runs"
ON public.integration_sync_runs FOR UPDATE
USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS update_integration_sync_runs_updated_at ON public.integration_sync_runs;
CREATE TRIGGER update_integration_sync_runs_updated_at
BEFORE UPDATE ON public.integration_sync_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
