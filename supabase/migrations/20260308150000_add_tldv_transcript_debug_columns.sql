-- Debug fields for tl;dv transcript sync diagnostics
ALTER TABLE IF EXISTS public.tldv_meetings
  ADD COLUMN IF NOT EXISTS transcript_error TEXT,
  ADD COLUMN IF NOT EXISTS transcript_source TEXT;
