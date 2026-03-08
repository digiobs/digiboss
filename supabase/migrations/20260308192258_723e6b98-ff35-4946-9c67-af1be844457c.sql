
-- Table principale des contenus
CREATE TABLE public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL,
  title text NOT NULL,
  body text,
  published_at timestamptz NOT NULL,
  source_url text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Métriques de performance
CREATE TABLE public.content_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE NOT NULL,
  measured_at timestamptz DEFAULT now(),
  impressions integer DEFAULT 0,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  avg_time_on_page integer,
  bounce_rate numeric(5,2),
  top_traffic_source text,
  avg_watch_duration integer,
  retention_rate numeric(5,2),
  sends integer DEFAULT 0,
  open_rate numeric(5,2),
  click_rate numeric(5,2),
  unsubscribes integer DEFAULT 0
);

-- Indexes
CREATE INDEX idx_contents_client_channel ON public.contents(client_id, channel);
CREATE INDEX idx_contents_published_at ON public.contents(published_at DESC);
CREATE INDEX idx_content_metrics_content ON public.content_metrics(content_id);
CREATE INDEX idx_content_metrics_measured ON public.content_metrics(measured_at DESC);

-- RLS
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;

-- Public read policies (matching existing app pattern)
CREATE POLICY "Allow public read access to contents" ON public.contents FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to contents" ON public.contents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to contents" ON public.contents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to contents" ON public.contents FOR DELETE USING (true);

CREATE POLICY "Allow public read access to content_metrics" ON public.content_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to content_metrics" ON public.content_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to content_metrics" ON public.content_metrics FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to content_metrics" ON public.content_metrics FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contents;
