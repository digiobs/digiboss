
-- Table des recommandations de contenus
CREATE TABLE public.content_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL CHECK (channel IN ('linkedin', 'blog', 'youtube', 'newsletter')),
  title text NOT NULL,
  rationale text NOT NULL,
  brief jsonb,
  priority_score integer NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  score_breakdown jsonb,
  context_tags text[] DEFAULT '{}',
  supporting_metrics jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'postponed', 'converted')),
  generated_at timestamptz DEFAULT now(),
  dismissed_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX idx_recommendations_client ON public.content_recommendations(client_id, status);
CREATE INDEX idx_recommendations_score ON public.content_recommendations(priority_score DESC);
CREATE INDEX idx_recommendations_generated ON public.content_recommendations(generated_at DESC);

-- RLS
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to content_recommendations"
  ON public.content_recommendations FOR SELECT
  USING (true);

CREATE POLICY "Allow public update access to content_recommendations"
  ON public.content_recommendations FOR UPDATE
  USING (true);

CREATE POLICY "Allow public insert access to content_recommendations"
  ON public.content_recommendations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to content_recommendations"
  ON public.content_recommendations FOR DELETE
  USING (true);
