
-- Alertes système
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  source text,
  is_dismissed boolean DEFAULT false,
  dismissed_by uuid,
  dismissed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Score de santé client
CREATE TABLE public.client_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  overall_score integer NOT NULL,
  score_breakdown jsonb NOT NULL DEFAULT '{}',
  trend text,
  measured_at timestamptz DEFAULT now()
);

-- Next Best Actions (Home)
CREATE TABLE public.next_best_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  channel text,
  title text NOT NULL,
  rationale text NOT NULL,
  brief jsonb,
  priority_score integer NOT NULL,
  score_breakdown jsonb,
  context_tags text[] DEFAULT '{}',
  supporting_metrics jsonb,
  status text DEFAULT 'active',
  navigate_to text,
  generated_at timestamptz DEFAULT now(),
  actioned_at timestamptz,
  dismissed_at timestamptz,
  assigned_to uuid,
  created_at timestamptz DEFAULT now()
);

-- Calendrier éditorial & événements
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  channel text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer,
  meeting_url text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  assigned_to uuid,
  created_at timestamptz DEFAULT now()
);

-- Feed d'activité
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb,
  link_url text,
  actor_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Association user ↔ clients
CREATE TABLE IF NOT EXISTS public.user_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Index
CREATE INDEX idx_alerts_client ON public.alerts(client_id, is_dismissed);
CREATE INDEX idx_alerts_created ON public.alerts(created_at DESC);
CREATE INDEX idx_health_client ON public.client_health_scores(client_id, measured_at DESC);
CREATE INDEX idx_nba_client ON public.next_best_actions(client_id, status);
CREATE INDEX idx_nba_score ON public.next_best_actions(priority_score DESC);
CREATE INDEX idx_calendar_scheduled ON public.calendar_events(scheduled_at);
CREATE INDEX idx_calendar_client ON public.calendar_events(client_id, scheduled_at);
CREATE INDEX idx_activity_client ON public.activity_feed(client_id, created_at DESC);
CREATE INDEX idx_activity_created ON public.activity_feed(created_at DESC);
CREATE INDEX idx_user_clients ON public.user_clients(user_id, client_id);

-- RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_best_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;

-- Open RLS policies (matching existing pattern - no auth enforcement yet)
CREATE POLICY "Allow public read access to alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow public update access to alerts" ON public.alerts FOR UPDATE USING (true);
CREATE POLICY "Allow public insert access to alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to alerts" ON public.alerts FOR DELETE USING (true);

CREATE POLICY "Allow public read access to client_health_scores" ON public.client_health_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to client_health_scores" ON public.client_health_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to client_health_scores" ON public.client_health_scores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to client_health_scores" ON public.client_health_scores FOR DELETE USING (true);

CREATE POLICY "Allow public read access to next_best_actions" ON public.next_best_actions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to next_best_actions" ON public.next_best_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to next_best_actions" ON public.next_best_actions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to next_best_actions" ON public.next_best_actions FOR DELETE USING (true);

CREATE POLICY "Allow public read access to calendar_events" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to calendar_events" ON public.calendar_events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to calendar_events" ON public.calendar_events FOR DELETE USING (true);

CREATE POLICY "Allow public read access to activity_feed" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to activity_feed" ON public.activity_feed FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to activity_feed" ON public.activity_feed FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to activity_feed" ON public.activity_feed FOR DELETE USING (true);

CREATE POLICY "Allow public read access to user_clients" ON public.user_clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to user_clients" ON public.user_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to user_clients" ON public.user_clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to user_clients" ON public.user_clients FOR DELETE USING (true);
