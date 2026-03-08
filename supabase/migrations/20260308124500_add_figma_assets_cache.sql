-- Cache Figma folder metadata per client to reduce UI latency
CREATE TABLE IF NOT EXISTS public.client_figma_sync_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  folder_count INTEGER NOT NULL DEFAULT 0,
  file_count INTEGER NOT NULL DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_figma_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  project_name TEXT,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  folder_type TEXT NOT NULL DEFAULT 'PAGE',
  thumbnail_url TEXT,
  page_index INTEGER,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, file_key, folder_id)
);

CREATE INDEX IF NOT EXISTS client_figma_folders_client_idx
  ON public.client_figma_folders (client_id);
CREATE INDEX IF NOT EXISTS client_figma_folders_file_idx
  ON public.client_figma_folders (file_key);
CREATE INDEX IF NOT EXISTS client_figma_sync_state_status_idx
  ON public.client_figma_sync_state (status);

-- Seed one sync-state row for each client
INSERT INTO public.client_figma_sync_state (client_id, status, folder_count, file_count, message)
SELECT c.id, 'pending', 0, 0, 'Waiting for Figma mapping'
FROM public.clients c
ON CONFLICT (client_id) DO NOTHING;

ALTER TABLE public.client_figma_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_figma_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to client_figma_sync_state" ON public.client_figma_sync_state;
DROP POLICY IF EXISTS "Allow public insert access to client_figma_sync_state" ON public.client_figma_sync_state;
DROP POLICY IF EXISTS "Allow public update access to client_figma_sync_state" ON public.client_figma_sync_state;
DROP POLICY IF EXISTS "Allow public delete access to client_figma_sync_state" ON public.client_figma_sync_state;
DROP POLICY IF EXISTS "Allow public read access to client_figma_folders" ON public.client_figma_folders;
DROP POLICY IF EXISTS "Allow public insert access to client_figma_folders" ON public.client_figma_folders;
DROP POLICY IF EXISTS "Allow public update access to client_figma_folders" ON public.client_figma_folders;
DROP POLICY IF EXISTS "Allow public delete access to client_figma_folders" ON public.client_figma_folders;

CREATE POLICY "Allow public read access to client_figma_sync_state"
ON public.client_figma_sync_state FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to client_figma_sync_state"
ON public.client_figma_sync_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to client_figma_sync_state"
ON public.client_figma_sync_state FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to client_figma_sync_state"
ON public.client_figma_sync_state FOR DELETE USING (true);

CREATE POLICY "Allow public read access to client_figma_folders"
ON public.client_figma_folders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to client_figma_folders"
ON public.client_figma_folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to client_figma_folders"
ON public.client_figma_folders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to client_figma_folders"
ON public.client_figma_folders FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_client_figma_sync_state_updated_at ON public.client_figma_sync_state;
CREATE TRIGGER update_client_figma_sync_state_updated_at
BEFORE UPDATE ON public.client_figma_sync_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_figma_folders_updated_at ON public.client_figma_folders;
CREATE TRIGGER update_client_figma_folders_updated_at
BEFORE UPDATE ON public.client_figma_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
