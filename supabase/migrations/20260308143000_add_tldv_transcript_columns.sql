-- Persist tl;dv transcripts and summaries for frontend performance
ALTER TABLE IF EXISTS public.tldv_meetings
  ADD COLUMN IF NOT EXISTS transcript_text TEXT,
  ADD COLUMN IF NOT EXISTS transcript_segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS transcript_status TEXT NOT NULL DEFAULT 'processing',
  ADD COLUMN IF NOT EXISTS highlights_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS transcript_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tldv_meetings_client_transcript_status_idx
  ON public.tldv_meetings (client_id, transcript_status);
