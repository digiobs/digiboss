
-- Plan Tasks table for tracking urgent tasks from Wrike
CREATE TABLE public.plan_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  wrike_task_id text,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('backlog', 'in_progress', 'review', 'done', 'cancelled')),
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  due_date date,
  wrike_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Home KPIs table (aggregated metrics)
CREATE TABLE public.home_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_tasks_active integer DEFAULT 0,
  tasks_due_this_week integer DEFAULT 0,
  high_priority_count integer DEFAULT 0,
  completed_this_month integer DEFAULT 0,
  measured_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_plan_tasks_client ON public.plan_tasks(client_id);
CREATE INDEX idx_plan_tasks_status ON public.plan_tasks(status);
CREATE INDEX idx_plan_tasks_priority ON public.plan_tasks(priority);
CREATE INDEX idx_plan_tasks_due_date ON public.plan_tasks(due_date);

-- RLS
ALTER TABLE public.plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_kpis ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to plan_tasks" ON public.plan_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to plan_tasks" ON public.plan_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to plan_tasks" ON public.plan_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to plan_tasks" ON public.plan_tasks FOR DELETE USING (true);

CREATE POLICY "Allow public read access to home_kpis" ON public.home_kpis FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to home_kpis" ON public.home_kpis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to home_kpis" ON public.home_kpis FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to home_kpis" ON public.home_kpis FOR DELETE USING (true);
