ALTER TABLE public.client_data_mappings
  ADD COLUMN IF NOT EXISTS external_workspace_id TEXT,
  ADD COLUMN IF NOT EXISTS external_project_id TEXT,
  ADD COLUMN IF NOT EXISTS mapping_strategy TEXT NOT NULL DEFAULT 'strict_id',
  ADD COLUMN IF NOT EXISTS alias_external_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS client_data_mappings_priority_idx
  ON public.client_data_mappings (client_id, provider, connector, priority);
CREATE INDEX IF NOT EXISTS client_data_mappings_active_idx
  ON public.client_data_mappings (is_active);
CREATE INDEX IF NOT EXISTS client_data_mappings_strategy_idx
  ON public.client_data_mappings (mapping_strategy);

ALTER TABLE public.client_data_mappings
  DROP CONSTRAINT IF EXISTS client_data_mappings_mapping_strategy_check;
ALTER TABLE public.client_data_mappings
  ADD CONSTRAINT client_data_mappings_mapping_strategy_check
  CHECK (mapping_strategy IN ('strict_id', 'alias_fallback', 'name_fallback', 'manual_override'));
