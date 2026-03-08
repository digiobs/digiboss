-- Client/source mapping registry for production data linking
CREATE TABLE IF NOT EXISTS public.client_data_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  connector TEXT NOT NULL,
  external_account_id TEXT,
  external_account_name TEXT,
  status TEXT NOT NULL DEFAULT 'missing',
  notes TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, provider, connector)
);

CREATE INDEX IF NOT EXISTS client_data_mappings_client_idx
  ON public.client_data_mappings (client_id);
CREATE INDEX IF NOT EXISTS client_data_mappings_provider_idx
  ON public.client_data_mappings (provider, connector);
CREATE INDEX IF NOT EXISTS client_data_mappings_status_idx
  ON public.client_data_mappings (status);

ALTER TABLE public.client_data_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to client_data_mappings" ON public.client_data_mappings;
DROP POLICY IF EXISTS "Allow public insert access to client_data_mappings" ON public.client_data_mappings;
DROP POLICY IF EXISTS "Allow public update access to client_data_mappings" ON public.client_data_mappings;
DROP POLICY IF EXISTS "Allow public delete access to client_data_mappings" ON public.client_data_mappings;

CREATE POLICY "Allow public read access to client_data_mappings"
ON public.client_data_mappings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to client_data_mappings"
ON public.client_data_mappings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to client_data_mappings"
ON public.client_data_mappings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to client_data_mappings"
ON public.client_data_mappings FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_client_data_mappings_updated_at ON public.client_data_mappings;
CREATE TRIGGER update_client_data_mappings_updated_at
BEFORE UPDATE ON public.client_data_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

