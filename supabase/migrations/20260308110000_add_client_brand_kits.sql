-- Store imported Figma brand kit tokens per client
CREATE TABLE IF NOT EXISTS public.client_brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'figma',
  figma_file_key TEXT NOT NULL,
  figma_node_id TEXT,
  token_type TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_value TEXT,
  preview_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, figma_file_key, token_type, token_name, figma_node_id)
);

CREATE INDEX IF NOT EXISTS client_brand_kits_client_idx
  ON public.client_brand_kits (client_id);
CREATE INDEX IF NOT EXISTS client_brand_kits_source_idx
  ON public.client_brand_kits (source, figma_file_key);
CREATE INDEX IF NOT EXISTS client_brand_kits_type_idx
  ON public.client_brand_kits (token_type);

ALTER TABLE public.client_brand_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to client_brand_kits" ON public.client_brand_kits;
DROP POLICY IF EXISTS "Allow public insert access to client_brand_kits" ON public.client_brand_kits;
DROP POLICY IF EXISTS "Allow public update access to client_brand_kits" ON public.client_brand_kits;
DROP POLICY IF EXISTS "Allow public delete access to client_brand_kits" ON public.client_brand_kits;

CREATE POLICY "Allow public read access to client_brand_kits"
ON public.client_brand_kits FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to client_brand_kits"
ON public.client_brand_kits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to client_brand_kits"
ON public.client_brand_kits FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to client_brand_kits"
ON public.client_brand_kits FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_client_brand_kits_updated_at ON public.client_brand_kits;
CREATE TRIGGER update_client_brand_kits_updated_at
BEFORE UPDATE ON public.client_brand_kits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
