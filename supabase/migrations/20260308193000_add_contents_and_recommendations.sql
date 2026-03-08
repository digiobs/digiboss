-- Content performance domain tables

CREATE TABLE IF NOT EXISTS public.contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'blog', 'youtube', 'newsletter')),
  title TEXT NOT NULL,
  body TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  source_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  impressions INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(7,2) NOT NULL DEFAULT 0,
  avg_time_on_page INTEGER,
  bounce_rate NUMERIC(7,2),
  top_traffic_source TEXT,
  avg_watch_duration INTEGER,
  retention_rate NUMERIC(7,2),
  sends INTEGER NOT NULL DEFAULT 0,
  open_rate NUMERIC(7,2),
  click_rate NUMERIC(7,2),
  unsubscribes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'blog', 'youtube', 'newsletter')),
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  brief JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority_score INTEGER NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  context_tags TEXT[] NOT NULL DEFAULT '{}',
  supporting_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'postponed', 'converted')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contents_client_channel ON public.contents (client_id, channel);
CREATE INDEX IF NOT EXISTS idx_contents_published_at ON public.contents (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_metrics_content ON public.content_metrics (content_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_measured ON public.content_metrics (measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_client ON public.content_recommendations (client_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON public.content_recommendations (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_generated ON public.content_recommendations (generated_at DESC);

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to contents" ON public.contents;
DROP POLICY IF EXISTS "Allow public insert access to contents" ON public.contents;
DROP POLICY IF EXISTS "Allow public update access to contents" ON public.contents;
CREATE POLICY "Allow public read access to contents"
ON public.contents FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to contents"
ON public.contents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to contents"
ON public.contents FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access to content_metrics" ON public.content_metrics;
DROP POLICY IF EXISTS "Allow public insert access to content_metrics" ON public.content_metrics;
DROP POLICY IF EXISTS "Allow public update access to content_metrics" ON public.content_metrics;
CREATE POLICY "Allow public read access to content_metrics"
ON public.content_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to content_metrics"
ON public.content_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to content_metrics"
ON public.content_metrics FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access to content_recommendations" ON public.content_recommendations;
DROP POLICY IF EXISTS "Allow public insert access to content_recommendations" ON public.content_recommendations;
DROP POLICY IF EXISTS "Allow public update access to content_recommendations" ON public.content_recommendations;
CREATE POLICY "Allow public read access to content_recommendations"
ON public.content_recommendations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to content_recommendations"
ON public.content_recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to content_recommendations"
ON public.content_recommendations FOR UPDATE USING (true);

DROP TRIGGER IF EXISTS update_contents_updated_at ON public.contents;
DROP TRIGGER IF EXISTS update_content_metrics_updated_at ON public.content_metrics;
DROP TRIGGER IF EXISTS update_content_recommendations_updated_at ON public.content_recommendations;
CREATE TRIGGER update_contents_updated_at
BEFORE UPDATE ON public.contents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_metrics_updated_at
BEFORE UPDATE ON public.content_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_recommendations_updated_at
BEFORE UPDATE ON public.content_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

